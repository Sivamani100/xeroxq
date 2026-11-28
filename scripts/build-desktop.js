const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const downloadsDir = path.join(rootDir, "public", "downloads");
const stashRoot = path.join(rootDir, ".desktop-export-stash");

// Build electron artifacts OUTSIDE OneDrive to avoid EPERM from OneDrive locking
// newly-created DLLs (dxcompiler.dll, libEGL.dll, etc.) mid-packaging.
// LOCALAPPDATA is never synced by OneDrive.
const buildTmpDir = path.join(
  process.env.LOCALAPPDATA || path.join(require("os").homedir(), ".cache"),
  "XeroxQ-Build"
);
// Final installer landing zone inside the project (small .exe files only, not the full unpacked dir).
const releaseDir = path.join(rootDir, "release_build");

const ARTIFACTS = [
  "XeroxQ-Setup-x64.exe",
  "XeroxQ-Portable-x64.exe",
];

// Dynamic Next.js Route Handlers cannot run in Electron's static `output: "export"` bundle.
// Temporarily stash them outside `src/app/` during `BUILD_DESKTOP=true` so web builds keep full dynamic routes.
const SERVER_ONLY_ROUTES = [
  { src: path.join(rootDir, "src", "app", "api"), stash: path.join(stashRoot, "api") },
  { src: path.join(rootDir, "src", "app", "auth", "callback"), stash: path.join(stashRoot, "auth-callback") },
];

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function removeDirSafe(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      if (process.platform === "win32") {
        execSync(`cmd /c "if exist "${targetPath}" rd /s /q "${targetPath}""`, { stdio: "ignore" });
      }
      if (!fs.existsSync(targetPath)) return;
      fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
      if (!fs.existsSync(targetPath)) return;
    } catch (_) {
      sleepSync(250 * attempt);
    }
  }
}

function moveDirSafe(from, to) {
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      lastErr = err;
      if (err && (err.code === "EPERM" || err.code === "EBUSY" || err.code === "EACCES")) {
        try {
          fs.cpSync(from, to, { recursive: true, force: true });
          fs.rmSync(from, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
          return;
        } catch (copyErr) {
          lastErr = copyErr;
          sleepSync(250 * attempt);
          continue;
        }
      }
      throw err;
    }
  }
  throw lastErr;
}

function restoreServerRoutes() {
  for (const item of SERVER_ONLY_ROUTES) {
    if (fs.existsSync(item.stash) && !fs.existsSync(item.src)) {
      fs.mkdirSync(path.dirname(item.src), { recursive: true });
      moveDirSafe(item.stash, item.src);
    }
  }
  if (fs.existsSync(stashRoot)) {
    fs.rmSync(stashRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
  }
}

function stashServerRoutes() {
  restoreServerRoutes();
  fs.mkdirSync(stashRoot, { recursive: true });
  for (const item of SERVER_ONLY_ROUTES) {
    if (fs.existsSync(item.src)) {
      fs.mkdirSync(path.dirname(item.stash), { recursive: true });
      moveDirSafe(item.src, item.stash);
    }
  }
}

function run(cmd, env = process.env) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: rootDir, stdio: "inherit", env });
}

function assertValidPeExecutable(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing installer artifact: ${filePath}`);
  }
  const stat = fs.statSync(filePath);
  if (stat.size < 10 * 1024 * 1024) {
    throw new Error(
      `Artifact ${path.basename(filePath)} is unexpectedly small (${stat.size} bytes). Expected a full Windows installer binary.`
    );
  }
  const fd = fs.openSync(filePath, "r");
  try {
    const header = Buffer.alloc(2);
    fs.readSync(fd, header, 0, 2, 0);
    if (header[0] !== 0x4d || header[1] !== 0x5a) {
      throw new Error(
        `Artifact ${path.basename(filePath)} does not have a valid Windows PE (MZ) header.`
      );
    }
  } finally {
    fs.closeSync(fd);
  }
}

function main() {
  // Recover from any previously interrupted run first
  restoreServerRoutes();

  try {
    stashServerRoutes();
    // 1. Clear only isolated desktop build cache (.next-desktop) and static export dir (out)
    //    NEVER delete `.next` so an active `next dev` server isn't corrupted mid-session.
    removeDirSafe(path.join(rootDir, ".next-desktop"));
    removeDirSafe(path.join(rootDir, "out"));
    // 2. Export static frontend for Electron (`out/`)
    run("npx next build", { ...process.env, BUILD_DESKTOP: "true" });

    // Remove Next-copied public/downloads installers from out/ so we never pack
    // previous installers recursively inside the new desktop app bundle.
    const outDownloadsDir = path.join(rootDir, "out", "downloads");
    if (fs.existsSync(outDownloadsDir)) {
      fs.rmSync(outDownloadsDir, { recursive: true, force: true });
    }
  } finally {
    restoreServerRoutes();
  }

  // 3. Build NSIS (x64) and Portable (x64) Windows executables.
  //    Output goes to buildTmpDir (outside OneDrive) to avoid EPERM from
  //    OneDrive locking newly-created Electron DLLs during packaging.
  try {
    if (process.platform === "win32") {
      execSync(`rd /s /q "${buildTmpDir}"`, { stdio: "ignore" });
    } else {
      fs.rmSync(buildTmpDir, { recursive: true, force: true });
    }
  } catch (_) { /* already gone – fine */ }
  fs.mkdirSync(buildTmpDir, { recursive: true });

  // Build NSIS and Portable sequentially so both targets never race on `win-unpacked`.
  run(`npx electron-builder --win nsis --x64 --config.directories.output="${buildTmpDir}"`);
  run(`npx electron-builder --win portable --x64 --config.directories.output="${buildTmpDir}"`);

  // 4. Copy only the final installer/portable .exe files back into release_build/
  //    (not the multi-hundred-MB win-unpacked/ directory)
  //    then publish them into public/downloads/ for the web download page.
  fs.mkdirSync(releaseDir, { recursive: true });
  fs.mkdirSync(downloadsDir, { recursive: true });
  for (const name of ARTIFACTS) {
    const tmpSrc  = path.join(buildTmpDir, name);
    const relDest = path.join(releaseDir, name);
    const webDest = path.join(downloadsDir, name);
    assertValidPeExecutable(tmpSrc);
    fs.copyFileSync(tmpSrc, relDest);
    fs.copyFileSync(relDest, webDest);
    assertValidPeExecutable(webDest);
    const sizeMb = (fs.statSync(webDest).size / (1024 * 1024)).toFixed(1);
    console.log(`Verified & published ${name} (${sizeMb} MB)`);
  }
}

main();

const fs = require('fs');
const path = require('path');

function walk(d, list = []) {
  fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, list);
    else if (f === 'route.ts' || f === 'route.js') list.push(p);
  });
  return list;
}

const appDir = path.join(__dirname, '../src/app');
const routes = walk(appDir);

routes.forEach(r => {
  let content = fs.readFileSync(r, 'utf8');
  if (!content.includes('export const dynamic')) {
    content = 'export const dynamic = "force-static";\n' + content;
    fs.writeFileSync(r, content, 'utf8');
    console.log('Added force-static to:', path.relative(appDir, r));
  }
});

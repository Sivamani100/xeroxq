const fs = require('fs');
const path = require('path');

// Clean, high-contrast brand printer logo for Dark System Mode (Bright white container with XeroxQ Red accent)
const whiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#FB432C"/>
  <path d="M140 180 C140 155 160 135 185 135 L327 135 C352 135 372 155 372 180 L372 200 L140 200 Z" fill="#FFFFFF" opacity="0.95"/>
  <rect x="110" y="200" width="292" height="160" rx="28" fill="#FFFFFF"/>
  <circle cx="360" cy="240" r="14" fill="#FB432C"/>
  <rect x="145" y="290" width="222" height="120" rx="16" fill="#F8FAFC"/>
  <rect x="175" y="325" width="162" height="14" rx="7" fill="#94A3B8"/>
  <rect x="175" y="355" width="110" height="14" rx="7" fill="#94A3B8"/>
</svg>`;

// Clean, high-contrast brand printer logo for Light System Mode (Dark container with XeroxQ Red accent)
const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#FB432C"/>
  <path d="M140 180 C140 155 160 135 185 135 L327 135 C352 135 372 155 372 180 L372 200 L140 200 Z" fill="#FFFFFF" opacity="0.95"/>
  <rect x="110" y="200" width="292" height="160" rx="28" fill="#18181B"/>
  <circle cx="360" cy="240" r="14" fill="#FB432C"/>
  <rect x="145" y="290" width="222" height="120" rx="16" fill="#FFFFFF"/>
  <rect x="175" y="325" width="162" height="14" rx="7" fill="#E2E8F0"/>
  <rect x="175" y="355" width="110" height="14" rx="7" fill="#E2E8F0"/>
</svg>`;

const publicDir = path.join(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'xeroxq_logo_white.svg'), whiteSvg);
fs.writeFileSync(path.join(publicDir, 'xeroxq_logo_dark.svg'), darkSvg);

console.log('Theme SVGs written successfully.');

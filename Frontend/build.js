const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      if (item === 'node_modules' || item === 'build') continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else if (stat.isFile()) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const frontendRoot = path.resolve(__dirname);
const out = path.join(frontendRoot, 'build');
if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}
copyRecursive(frontendRoot, out);
console.log('Frontend build complete:', out);

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'lib', 'recursive-delete.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  const buggyCode = 'const isSymlink = part.isSymbolicLink();\n        if (isSymlink) {\n            const linkPath = await _fs.promises.readlink(absolutePath);';
  const fixedCode = `let isSymlink = part.isSymbolicLink();
        if (isSymlink) {
            try {
                const linkPath = await _fs.promises.readlink(absolutePath);
                try {
                    const stats = await _fs.promises.stat((0, _path.isAbsolute)(linkPath) ? linkPath : (0, _path.join)((0, _path.dirname)(absolutePath), linkPath));
                    isDirectory = stats.isDirectory();
                } catch {}
            } catch (err) {
                if (err && (err.code === "EINVAL" || err.code === "UNKNOWN")) {
                    isSymlink = false;
                } else {
                    throw err;
                }
            }
        }`;

  if (content.includes('const isSymlink = part.isSymbolicLink();') && content.includes('const linkPath = await _fs.promises.readlink(absolutePath);')) {
    content = content.replace(
      /const isSymlink = part\.isSymbolicLink\(\);\s*if \(isSymlink\) \{\s*const linkPath = await _fs\.promises\.readlink\(absolutePath\);[\s\S]*?isDirectory = stats\.isDirectory\(\);\s*\} catch\s*\{\}\s*\}/,
      fixedCode
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('✓ Successfully patched Next.js recursive-delete for OneDrive compatibility.');
  }
}

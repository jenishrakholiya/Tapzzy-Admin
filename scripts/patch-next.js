const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'lib', 'recursive-delete.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Fix 1: Symlink handling
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
  }

  // Fix 2: Windows ENOTEMPTY / EBUSY retry fix
  if (content.includes('code === "ENOTEMPTY"') && content.includes('t < 3')) {
    content = content.replace(
      'if ((code === "EBUSY" || code === "ENOTEMPTY" || code === "EPERM" || code === "EMFILE") && t < 3) {\n            await (0, _wait.wait)(t * 100);\n            return unlinkPath(p, isDir, t++);\n        }',
      'if ((code === "EBUSY" || code === "ENOTEMPTY" || code === "EPERM" || code === "EMFILE") && t < 10) {\n            await (0, _wait.wait)(++t * 150);\n            return unlinkPath(p, isDir, t);\n        }'
    );
  }

  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✓ Successfully patched Next.js recursive-delete for OneDrive/Windows compatibility.');
}

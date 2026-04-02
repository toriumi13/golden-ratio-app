const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    console.log(`Copying files from ${srcDir} to ${distDir}...`);
    if (fs.existsSync(srcDir)) {
        fs.readdirSync(srcDir).forEach((item) => {
            copyRecursiveSync(path.join(srcDir, item), path.join(distDir, item));
        });
        console.log('Successfully copied public files to dist.');
    } else {
        console.warn('Public directory not found, skipping copy.');
    }
} catch (err) {
    console.error('Error during file copy:', err);
    process.exit(1);
}

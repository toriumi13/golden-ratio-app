const sharp = require('sharp');
const fs = require('fs');

const images = {
    nikujaga: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d34b7966-fd56-4568-b05c-088251219e3c\\nikujaga_1773847739874.png',
    shogayaki: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d34b7966-fd56-4568-b05c-088251219e3c\\shogayaki_1773847878270.png',
    oyakodon: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d34b7966-fd56-4568-b05c-088251219e3c\\oyakodon_1773847961236.png',
    teriyaki_chicken: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d34b7966-fd56-4568-b05c-088251219e3c\\teriyaki_chicken_1773848178842.png',
    gomaae: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\d34b7966-fd56-4568-b05c-088251219e3c\\gomaae_1773848252122.png'
};

async function run() {
    let tsContent = 'export const officialImages: Record<string, string> = {\n';
    for (const [key, path] of Object.entries(images)) {
        if (fs.existsSync(path)) {
            const buffer = await sharp(path).resize(500, 500, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();
            const b64 = buffer.toString('base64');
            tsContent += `  ${key}: 'data:image/jpeg;base64,${b64}',\n`;
        } else {
            console.error('File not found:', path);
        }
    }
    tsContent += '};\n';
    fs.writeFileSync('src\\data\\officialImages.ts', tsContent);
    console.log("Images converted and saved.");
}
run();

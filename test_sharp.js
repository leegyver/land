import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function testSharp() {
    const filename = "test_sharp_image.png";
    const filePath = path.join(process.cwd(), filename);

    // Create dummy file (using simple write, sharp needs input)
    // We will create a buffer and write it
    const width = 1000;
    const height = 1000;

    console.log("1. Creating dummy image with Sharp...");
    await sharp({
        create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
    })
        .png()
        .toFile(filePath);

    console.log("2. Verifying original...");
    const meta = await sharp(filePath).metadata();
    console.log(`Original: ${meta.width}x${meta.height}`);

    console.log("3. Resizing to 400px...");
    const tempPath = filePath + "_resized.png";

    await sharp(filePath)
        .resize(400)
        .toFile(tempPath);

    console.log("4. Verifying resized...");
    const resizedMeta = await sharp(tempPath).metadata();
    console.log(`Resized: ${resizedMeta.width}x${resizedMeta.height}`);

    if (resizedMeta.width === 400) {
        console.log(">>> SUCCESS: Sharp works.");
    } else {
        console.error(">>> FAILURE: Sharp did not resize.");
    }

    // Cleanup
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
}

testSharp().catch(err => console.error(err));

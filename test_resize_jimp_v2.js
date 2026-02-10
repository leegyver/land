import { Jimp } from "jimp";
import fs from "fs";
import path from "path";

async function testResize() {
    const filename = "test_large_image.jpg";
    const filePath = path.join(process.cwd(), filename);

    console.log("1. Creating dummy large image (1200x1200)...");
    // Create a new image
    const image = new Jimp({ width: 1200, height: 1200, color: 0xFF0000FF });

    console.log("Methods on image:", Object.keys(image));
    console.log("Reflect keys:", Reflect.ownKeys(image));
    console.log("Prototype keys:", Reflect.ownKeys(Object.getPrototypeOf(image)));

    // Try write instead of writeAsync
    await new Promise((resolve, reject) => {
        image.write(filePath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    console.log("Image created successfully using .write() callback.");

    console.log("2. Verifying original size...");
    const original = await Jimp.read(filePath);
    console.log(`- Original Width: ${original.bitmap.width}px`);

    console.log("3. Running Resize Logic (Target: 400px)...");

    try {
        const imgToResize = await Jimp.read(filePath);
        const currentWidth = imgToResize.bitmap.width;

        if (currentWidth > 400) {
            console.log(`- Resizing from ${currentWidth}px to 400px...`);

            const resized = imgToResize.resize(400, -1);

            // Use write with callback (wrapped)
            await new Promise((resolve, reject) => {
                resized.write(filePath, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log("- Resize command executed.");
        } else {
            console.log("- No resize needed.");
        }

        console.log("4. Verifying final size...");
        const finalImg = await Jimp.read(filePath);
        console.log(`- Final Width: ${finalImg.bitmap.width}px`);

        if (finalImg.bitmap.width === 400) {
            console.log(">>> SUCCESS: Image is 400px.");
        } else {
            console.error(">>> FAILURE: Image is NOT 400px.");
        }

    } catch (err) {
        console.error(">>> ERROR:", err);
    } finally {
        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

testResize();

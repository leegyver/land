import { Jimp } from "jimp";
import fs from "fs";
import path from "path";

async function debugReal() {
    const file = "public/uploads/1769765473113-328213451.jpg";
    const filePath = path.join(process.cwd(), file);
    const outPath = filePath + "_debug_resized.jpg";

    console.log(`Debug Target: ${filePath}`);

    try {
        if (!fs.existsSync(filePath)) {
            console.error("File not found!");
            return;
        }

        console.log("1. Reading file...");
        const image = await Jimp.read(filePath);
        console.log(`Original Width: ${image.bitmap.width}`);

        console.log("2. Resizing in memory...");
        // Fix: Use object syntax for Jimp v1.x
        image.resize({ w: 400 });
        console.log("Resize called.");

        console.log("3. Getting buffer (Promise mode)...");
        // Try direct await (modern Jimp)
        const buffer = await image.getBuffer("image/jpeg");
        // If this works, buffer is assigned.
        // If it throws, catch block handles it.
        /*
           const buffer = await new Promise((resolve, reject) => {
               image.getBuffer("image/jpeg", (err, buf) => {
                   if (err) {
                       console.error("GetBuffer Error:", err);
                       reject(err);
                   } else {
                       console.log(`Buffer callback received. Size: ${buf.length}`);
                       resolve(buf);
                   }
               });
           });
        */
        console.log(`Buffer size: ${buffer.length} bytes`);

        console.log("4. Writing to file...");
        fs.writeFileSync(outPath, buffer);

        console.log("5. Verifying output...");
        const finalImg = await Jimp.read(outPath);
        console.log(`Final Width: ${finalImg.bitmap.width}`);

        if (finalImg.bitmap.width === 400) {
            console.log("SUCCESS: Logic works.");
        } else {
            console.log("FAILURE: Logic produced wrong size.");
        }

    } catch (e) {
        console.error("CRASH:", e);
    }
}
debugReal();

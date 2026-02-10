import { Jimp } from "jimp";
import path from "path";

async function check() {
    const file = "public/uploads/1769765473113-328213451.jpg";
    const filePath = path.join(process.cwd(), file);

    try {
        console.log(`Checking file: ${filePath}`);
        const image = await Jimp.read(filePath);
        console.log(`WIDTH: ${image.bitmap.width}`);
        console.log(`HEIGHT: ${image.bitmap.height}`);
    } catch (e) {
        console.error(e);
    }
}
check();

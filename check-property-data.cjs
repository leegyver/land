
// ESM issue - renaming to .cjs to use require
const { storage } = require("./server/storage");

async function checkData() {
    try {
        const properties = await storage.getAllProperties();
        console.log(`Total properties: ${properties.length}`);

        const types = new Set();
        const districts = new Set();

        properties.forEach(p => {
            types.add(p.type);
            districts.add(p.district);
        });

        console.log("Types in database:", Array.from(types));
        console.log("Districts in database:", Array.from(districts));

        const danggwaeubDanDok = properties.filter(p =>
            p.district.includes("강화읍") &&
            (p.type.includes("단독") || p.title.includes("단독") || p.description.includes("단독"))
        );

        console.log(`\nProperties matching "강화읍" and "단독": ${danggwaeubDanDok.length}`);
        danggwaeubDanDok.slice(0, 3).forEach(p => {
            console.log(`- ID: ${p.id}, Title: ${p.title}, Type: ${p.type}, District: ${p.district}`);
        });

    } catch (err) {
        console.error("Error:", err);
    }
}

checkData();

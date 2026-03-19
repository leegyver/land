import { sqlite } from "./server/db";

async function checkSchema() {
  try {
    console.log("Checking columns for 'properties' table...");
    const columns = sqlite.prepare("PRAGMA table_info(properties)").all();
    console.log("Columns found:");
    console.table(columns);
    
    const columnNames = columns.map((c: any) => c.name);
    const requiredColumns = ['urgentOrder', 'negotiableOrder', 'longTermOrder', 'displayOrder'];
    
    for (const col of requiredColumns) {
      if (columnNames.includes(col)) {
        console.log(`✅ Column '${col}' exists.`);
      } else {
        console.log(`❌ Column '${col}' IS MISSING!`);
      }
    }
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    process.exit(0);
  }
}

checkSchema();

import fs from 'fs';

async function checkKeyFile() {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`Checking key file at: ${keyPath}`);

    if (!keyPath || !fs.existsSync(keyPath)) {
        console.error("❌ Key file does not exist at path.");
        return;
    }

    try {
        const fileContent = fs.readFileSync(keyPath, 'utf8');
        const json = JSON.parse(fileContent);

        console.log(`✅ JSON Parsing success.`);
        console.log(`Project ID: ${json.project_id}`);
        console.log(`Client Email: ${json.client_email}`);
        console.log(`Type: ${json.type}`);

        if (!json.project_id) {
            console.error("❌ 'project_id' field is missing in the JSON file!");
        }
    } catch (error) {
        console.error("❌ Failed to parse JSON file:", error);
    }
}

checkKeyFile();

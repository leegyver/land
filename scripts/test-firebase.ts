import 'dotenv/config';
import { db } from '../server/db';

async function testConnection() {
    console.log("🔥 Testing Firestore Connection...");
    try {
        const collections = await db.listCollections();
        console.log(`📚 Found ${collections.length} collections.`);

        const testDoc = db.collection('test').doc('connectivity_check');
        await testDoc.set({
            connectedAt: new Date(),
            status: 'ok',
            message: 'Hello from local dev environment!'
        });
        console.log("✅ Write successful! Firestore is connected.");

        const doc = await testDoc.get();
        console.log("✅ Read successful! Data:", doc.data());

        // Clean up
        await testDoc.delete();
        console.log("✅ Delete successful! Test complete.");

    } catch (error: any) {
        console.error("❌ Connection failed!");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        if (error.details) console.error("Error Details:", error.details);

        if (error.code === 7 || error.code === 'PERMISSION_DENIED') {
            console.error("Tip: This often means PERMISSION DENIED. Check your Google Service Account key entitlements or if Firestore Security Rules block requests (though Admin SDK implies bypass).");
        }
        if (error.code === 5 || error.code === 'NOT_FOUND') {
            console.error("Tip: Database NOT FOUND. Did you create the '(default)' database in Firebase Console?");
        }
        process.exit(1);
    }
}

testConnection();

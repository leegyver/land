
import 'dotenv/config';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    try {
        let credential;
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            credential = admin.credential.cert(serviceAccount);
        } else {
            credential = admin.credential.applicationDefault();
        }

        admin.initializeApp({
            credential: credential
        });
    } catch (e) {
        console.error("Firebase Init Error:", e);
        process.exit(1);
    }
}

const firestore = getFirestore();

async function inspect() {
    console.log("🔍 Inspecting Firestore Property Data...");
    const snapshot = await firestore.collection('properties').limit(1).get();
    if (snapshot.empty) {
        console.log("No properties found.");
        return;
    }
    const doc = snapshot.docs[0];
    console.log("Property ID:", doc.id);
    console.log("Data Keys:", Object.keys(doc.data()));
    console.log("Data:", JSON.stringify(doc.data(), null, 2));
}

inspect();

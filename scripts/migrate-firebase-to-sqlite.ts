
import 'dotenv/config';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import Database from 'better-sqlite3';
import path from 'path';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// 1. Initialize Firebase (Source)
if (!admin.apps.length) {
    try {
        let credential;
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            credential = admin.credential.cert(serviceAccount);
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Let admin SDK handle it via file path
            credential = admin.credential.applicationDefault();
        }

        if (!credential && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.error("No credentials found. Please set GOOGLE_APPLICATION_CREDENTIALS in .env");
            process.exit(1);
        }

        admin.initializeApp({
            credential: credential || admin.credential.applicationDefault()
        });
        console.log("🔥 Firebase Admin Initialized");
    } catch (e) {
        console.error("Firebase Init Error:", e);
        process.exit(1);
    }
}

const firestore = getFirestore();

// 2. Initialize SQLite (Destination)
const dbPath = path.join(process.cwd(), 'database.sqlite');
const sqlite = new Database(dbPath, { verbose: console.log });
console.log("💾 SQLite Connected");

// Helper: Convert Firestore Timestamp to ISO String
function toISO(val: any): string | null {
    if (!val) return null;
    if (val.toDate) return val.toDate().toISOString(); // Firestore Timestamp
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'string') return val; // Already string
    return null;
}

// Helper: Boolean to 0/1
function toInt(val: any): number {
    return val === true ? 1 : 0;
}

async function migrate() {
    console.log("🚀 Starting Migration...");

    // --- CLEAR EXISTING DATA ---
    console.log("🧹 Clearing SQLite tables...");
    sqlite.prepare('DELETE FROM users').run();
    sqlite.prepare('DELETE FROM properties').run();
    sqlite.prepare('DELETE FROM agents').run();
    sqlite.prepare('DELETE FROM inquiries').run();
    sqlite.prepare('DELETE FROM news').run();
    sqlite.prepare('DELETE FROM propertyInquiries').run();
    sqlite.prepare('DELETE FROM favorites').run();

    // Reset sequences
    sqlite.prepare("DELETE FROM sqlite_sequence").run(); // Reset IDs

    // --- USERS ---
    console.log("👤 Migrating Users...");
    const usersSnap = await firestore.collection('users').get();
    const insertUser = sqlite.prepare(`
        INSERT INTO users (id, username, password, email, phone, role, provider, providerId)
        VALUES (@id, @username, @password, @email, @phone, @role, @provider, @providerId)
    `);

    let userCount = 0;
    for (const doc of usersSnap.docs) {
        const d = doc.data();
        try {
            insertUser.run({
                id: parseInt(doc.id) || d.id, // Preserve ID
                username: d.username,
                password: d.password,
                email: d.email || null,
                phone: d.phone || null,
                role: d.role || 'user',
                provider: d.provider || null,
                providerId: d.providerId || null
            });
            userCount++;
        } catch (e) {
            console.error(`Failed to insert user ${doc.id}:`, e);
        }
    }
    console.log(`✅ Migrated ${userCount} Users`);

    // --- PROPERTIES ---
    console.log("🏠 Migrating Properties...");
    const propsSnap = await firestore.collection('properties').get();
    const insertProp = sqlite.prepare(`
        INSERT INTO properties (
            id, title, description, type, price, address, district, size, bedrooms, bathrooms,
            imageUrl, imageUrls, agentId, featured, displayOrder, isUrgent, urgentOrder,
            isNegotiable, negotiableOrder, isVisible, createdAt, updatedAt,
            buildingName, unitNumber, supplyArea, privateArea, areaSize, floor, totalFloors,
            direction, elevator, parking, heatingSystem, approvalDate, landType, zoneType,
            dealType, deposit, depositAmount, monthlyRent, maintenanceFee, ownerName,
            ownerPhone, tenantName, tenantPhone, clientName, clientPhone, specialNote,
            coListing, agentName, propertyDescription, privateNote, youtubeUrl, isSold, viewCount
        ) VALUES (
            @id, @title, @description, @type, @price, @address, @district, @size, @bedrooms, @bathrooms,
            @imageUrl, @imageUrls, @agentId, @featured, @displayOrder, @isUrgent, @urgentOrder,
            @isNegotiable, @negotiableOrder, @isVisible, @createdAt, @updatedAt,
            @buildingName, @unitNumber, @supplyArea, @privateArea, @areaSize, @floor, @totalFloors,
            @direction, @elevator, @parking, @heatingSystem, @approvalDate, @landType, @zoneType,
            @dealType, @deposit, @depositAmount, @monthlyRent, @maintenanceFee, @ownerName,
            @ownerPhone, @tenantName, @tenantPhone, @clientName, @clientPhone, @specialNote,
            @coListing, @agentName, @propertyDescription, @privateNote, @youtubeUrl, @isSold, @viewCount
        )
    `);

    let propCount = 0;
    for (const doc of propsSnap.docs) {
        const d = doc.data();
        try {
            insertProp.run({
                id: parseInt(doc.id) || d.id,
                title: d.title,
                description: d.description || null,
                type: d.type,
                price: d.price || null,
                address: d.address || null,
                district: d.district || null,
                size: d.size || null,
                bedrooms: d.bedrooms || 0,
                bathrooms: d.bathrooms || 0,
                imageUrl: d.imageUrl || null,
                imageUrls: JSON.stringify(d.imageUrls || []),
                agentId: d.agentId || 1,
                featured: toInt(d.featured),
                displayOrder: d.displayOrder || 0,
                isUrgent: toInt(d.isUrgent),
                urgentOrder: d.urgentOrder || 0,
                isNegotiable: toInt(d.isNegotiable),
                negotiableOrder: d.negotiableOrder || 0,
                isVisible: toInt(d.isVisible !== false), // default true
                createdAt: toISO(d.createdAt) || new Date().toISOString(),
                updatedAt: toISO(d.updatedAt) || new Date().toISOString(),
                buildingName: d.buildingName || null,
                unitNumber: d.unitNumber || null,
                supplyArea: d.supplyArea || null,
                privateArea: d.privateArea || null,
                areaSize: d.areaSize || null,
                floor: d.floor || null,
                totalFloors: d.totalFloors || null,
                direction: d.direction || null,
                elevator: toInt(d.elevator),
                parking: d.parking || null,
                heatingSystem: d.heatingSystem || null,
                approvalDate: d.approvalDate || null,
                landType: d.landType || null,
                zoneType: d.zoneType || null,
                dealType: JSON.stringify(d.dealType || []),
                deposit: d.deposit || null,
                depositAmount: d.depositAmount || null,
                monthlyRent: d.monthlyRent || null,
                maintenanceFee: d.maintenanceFee || null,

                // Contacts
                ownerName: d.ownerName || null,
                ownerPhone: d.ownerPhone || null,
                tenantName: d.tenantName || null,
                tenantPhone: d.tenantPhone || null,
                clientName: d.clientName || null,
                clientPhone: d.clientPhone || null,

                // Notes - Fix: Move old propertyDescription to privateNote and clear public description
                specialNote: d.specialNote || null,
                coListing: toInt(d.coListing),
                agentName: d.agentName || null,
                propertyDescription: null, // Clear this field as requested (old data deleted from public view)
                privateNote: [
                    d.privateNote,
                    d.propertyDescription ? `[이전 매물설명]\n${d.propertyDescription}` : null
                ].filter(Boolean).join('\n\n') || null,
                youtubeUrl: d.youtubeUrl || null,
                isSold: toInt(d.isSold),
                viewCount: d.viewCount || 0
            });
            propCount++;
        } catch (e) {
            console.error(`Failed to insert property ${doc.id}:`, e);
        }
    }
    console.log(`✅ Migrated ${propCount} Properties`);

    // --- NEWS ---
    console.log("📰 Migrating News...");
    const newsSnap = await firestore.collection('news').get();
    const insertNews = sqlite.prepare(`
        INSERT INTO news (id, title, summary, description, content, source, sourceUrl, url, imageUrl, category, isPinned, createdAt)
        VALUES (@id, @title, @summary, @description, @content, @source, @sourceUrl, @url, @imageUrl, @category, @isPinned, @createdAt)
    `);

    let newsCount = 0;
    for (const doc of newsSnap.docs) {
        const d = doc.data();
        try {
            insertNews.run({
                id: parseInt(doc.id) || d.id,
                title: d.title,
                summary: d.summary || null,
                description: d.description || null,
                content: d.content || null,
                source: d.source || null,
                sourceUrl: d.sourceUrl || null,
                url: d.url || null,
                imageUrl: d.imageUrl || null,
                category: d.category || '일반',
                isPinned: toInt(d.isPinned),
                createdAt: toISO(d.createdAt) || new Date().toISOString()
            });
            newsCount++;
        } catch (e) {
            console.error(`Failed to insert news ${doc.id}:`, e);
        }
    }
    console.log(`✅ Migrated ${newsCount} News items`);

    // --- AGENTS ---
    console.log("🤵 Migrating Agents...");
    const agentSnap = await firestore.collection('agents').get();
    const insertAgent = sqlite.prepare(`
        INSERT INTO agents (id, name, email, phone, position, photo, bio, isActive, createdAt)
        VALUES (@id, @name, @email, @phone, @position, @photo, @bio, @isActive, @createdAt)
    `);

    let agentCount = 0;
    for (const doc of agentSnap.docs) {
        const d = doc.data();
        try {
            insertAgent.run({
                id: parseInt(doc.id) || d.id,
                name: d.name,
                email: d.email || null,
                phone: d.phone || null,
                position: d.position || null,
                photo: d.photo || null,
                bio: d.bio || null,
                isActive: toInt(d.isActive !== false),
                createdAt: toISO(d.createdAt) || new Date().toISOString()
            });
            agentCount++;
        } catch (e) { console.error(`Failed to insert agent ${doc.id}:`, e); }
    }
    console.log(`✅ Migrated ${agentCount} Agents`);

    // --- PROPERTY INQUIRIES ---
    console.log("❓ Migrating Property Inquiries...");
    const pinqSnap = await firestore.collection('propertyInquiries').get();
    const insertPinq = sqlite.prepare(`
        INSERT INTO propertyInquiries (id, propertyId, userId, title, content, isReply, parentId, isReadByAdmin, createdAt)
        VALUES (@id, @propertyId, @userId, @title, @content, @isReply, @parentId, @isReadByAdmin, @createdAt)
    `);

    let pinqCount = 0;
    for (const doc of pinqSnap.docs) {
        const d = doc.data();
        try {
            insertPinq.run({
                id: parseInt(doc.id) || d.id,
                propertyId: d.propertyId,
                userId: d.userId,
                title: d.title || null,
                content: d.content || null,
                isReply: toInt(d.isReply),
                parentId: d.parentId || null,
                isReadByAdmin: toInt(d.isReadByAdmin),
                createdAt: toISO(d.createdAt) || new Date().toISOString()
            });
            pinqCount++;
        } catch (e) { console.error(`Failed to insert pinq ${doc.id}:`, e); }
    }
    console.log(`✅ Migrated ${pinqCount} Property Inquiries`);

    console.log("✨ Migration Complete!");
    sqlite.close();
    process.exit(0);
}

migrate().catch(e => {
    console.error("Migration Fatal Error:", e);
    process.exit(1);
});

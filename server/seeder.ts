import { storage } from "./storage";
import { InsertProperty, InsertUser } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

const sampleProperties: InsertProperty[] = [
    {
        title: "강화도 전망 좋은 전원주택",
        description: "남향으로 햇살이 잘 들고 바다가 보이는 멋진 전원주택입니다. 넓은 마당과 텃밭이 있어 전원생활하기 딱 좋습니다.",
        type: "전원주택",
        price: "450000000",
        address: "인천광역시 강화군 화도면",
        district: "화도면",
        size: "150",
        bedrooms: 3,
        bathrooms: 2,
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        imageUrls: [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600596542815-2a4d9fdd4070?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ],
        agentId: 1,
        featured: true,
        displayOrder: 1,
        isVisible: true,
        dealType: ["매매"],
        supplyArea: "180",
        privateArea: "150",
        totalFloors: 2,
        floor: 1,
        heatingSystem: "LPG",
        parking: "2대",
        buildingName: "해오름마을",
        approvalDate: "2023-05-20",
        landType: "대지",
        zoneType: "계획관리지역"
    },
    {
        title: "길상면 조용한 촌집 급매",
        description: "리모델링이 조금 필요하지만 뼈대가 튼튼한 구옥입니다. 마을 입구에 위치하여 접근성이 좋고 가격이 저렴합니다.",
        type: "구옥/농가주택",
        price: "180000000",
        address: "인천광역시 강화군 길상면",
        district: "길상면",
        size: "85",
        bedrooms: 2,
        bathrooms: 1,
        imageUrl: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        imageUrls: ["https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        agentId: 1,
        featured: false,
        displayOrder: 2,
        isVisible: true,
        dealType: ["매매"],
        supplyArea: "90",
        privateArea: "85",
        totalFloors: 1,
        floor: 1,
        heatingSystem: "기름보일러",
        parking: "1대",
        landType: "대지",
        zoneType: "생산관리지역"
    },
    {
        title: "양도면 넓은 토지 매매",
        description: "4차선 도로에 인접한 넓은 토지입니다. 카페나 펜션 부지로 아주 적합합니다.",
        type: "토지/임야",
        price: "850000000",
        address: "인천광역시 강화군 양도면",
        district: "양도면",
        size: "3300",
        bedrooms: 0,
        bathrooms: 0,
        imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        imageUrls: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        agentId: 1,
        featured: true,
        displayOrder: 3,
        isVisible: true,
        dealType: ["매매"],
        landType: "전",
        zoneType: "보전관리지역"
    }
];

export async function seedInitialData() {
    try {
        console.log("Starting DB seeding check...");

        // 1. Check if admin exists
        const adminUser = await storage.getUserByUsername("admin");
        if (!adminUser) {
            console.log("Creating default admin user...");
            const hashedPassword = await hashPassword("admin123"); // Default password
            await storage.createUser({
                username: "admin",
                password: hashedPassword,
                email: "admin@example.com",
                role: "admin",
                phone: "010-1234-5678"
            });
            console.log("Default admin created: admin / admin123");
        } else {
            console.log("Admin user already exists.");
        }

        // 2. Check properties
        const properties = await storage.getProperties();
        if (properties.length === 0) {
            console.log("No properties found. Seeding sample properties...");
            for (const prop of sampleProperties) {
                await storage.createProperty(prop);
            }
            console.log(`Seeded ${sampleProperties.length} sample properties.`);
        } else {
            console.log(`Database already has ${properties.length} properties.`);
        }

        console.log("DB seeding check completed.");
    } catch (error) {
        console.error("Failed to seed database:", error);
    }
}

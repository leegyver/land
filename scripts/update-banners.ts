
import { db } from "../server/db";
// We don't import storage here to avoid auto-migration confusion, just manual fix
import { InsertBanner } from "../shared/schema";

async function updateBanners() {
    console.log("Starting banner update...");

    // Debug table info
    try {
        const info = db.prepare("PRAGMA table_info(banners)").all();
        console.log("Current banners table columns:", info);
    } catch (e) {
        console.error("Error reading table info:", e);
    }

    // Manual migration if needed
    try {
        console.log("Attempting to add title column...");
        db.prepare("ALTER TABLE banners ADD COLUMN title TEXT").run();
        console.log("Added title column.");
    } catch (error: any) {
        // console.log("Title add error:", error.message);
        if (error.message.includes("duplicate column name")) {
            console.log("title column already exists.");
        } else {
            console.warn("Could not add title column (might exist):", error.message);
        }
    }

    try {
        console.log("Attempting to add description column...");
        db.prepare("ALTER TABLE banners ADD COLUMN description TEXT").run();
        console.log("Added description column.");
    } catch (error: any) {
        if (error.message.includes("duplicate column name")) {
            console.log("description column already exists.");
        } else {
            console.warn("Could not add description column (might exist):", error.message);
        }
    }

    // 1. Delete existing banners
    try {
        db.prepare("DELETE FROM banners").run();
        console.log("Cleared existing banners.");
    } catch (error) {
        console.warn("Could not clear banners:", error);
    }

    // 2. Define new banners
    const banners: InsertBanner[] = [
        // --- Left Slider ---
        {
            location: "left",
            title: "매물 접수",
            description: "빠르고 정확한 중개 서비스를 약속드립니다.",
            imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            linkUrl: "/contact",
            openNewWindow: false,
            displayOrder: 1
        },
        {
            location: "left",
            title: "부동산 뉴스",
            description: "매일 업데이트되는 최신 부동산 정보를 확인하세요.",
            imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            linkUrl: "/news",
            openNewWindow: false,
            displayOrder: 2
        },
        {
            location: "left",
            title: "계약 후기",
            description: "고객님들의 솔직한 계약 후기를 만나보세요.",
            imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            linkUrl: "/reviews", // Assuming reviews page exists or anchor
            openNewWindow: false,
            displayOrder: 3
        },

        // --- Right Slider ---
        {
            location: "right",
            title: "유튜브 채널",
            description: "생생한 현장 영상! 이가이버 TV 바로가기",
            imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // YouTube generic or branding
            linkUrl: "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA",
            openNewWindow: true,
            displayOrder: 1
        },
        {
            location: "right",
            title: "오시는 길",
            description: "이가이버 부동산 사무실 위치 안내",
            imageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Office or Map styled image
            linkUrl: "/contact",
            openNewWindow: false,
            displayOrder: 2
        },
        {
            location: "right",
            title: "상담 문의",
            description: "친절한 상담! 032-934-3120",
            imageUrl: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Phone/Consultation
            linkUrl: "tel:032-934-3120",
            openNewWindow: true,
            displayOrder: 3
        }
    ];

    // 3. Insert new banners
    const insertStmt = db.prepare(`
    INSERT INTO banners (location, title, description, imageUrl, linkUrl, openNewWindow, displayOrder, createdAt)
    VALUES (@location, @title, @description, @imageUrl, @linkUrl, @openNewWindow, @displayOrder, CURRENT_TIMESTAMP)
  `);

    for (const banner of banners) {
        try {
            insertStmt.run({
                location: banner.location,
                title: banner.title || null,
                description: banner.description || null,
                imageUrl: banner.imageUrl,
                linkUrl: banner.linkUrl || null,
                openNewWindow: banner.openNewWindow ? 1 : 0,
                displayOrder: banner.displayOrder
            });
            console.log(`Inserted banner: ${banner.title} (${banner.location})`);
        } catch (err) {
            console.error(`Error inserting banner ${banner.title}:`, err);
        }
    }

    console.log("Banner update completed successfully.");
}

updateBanners().catch(console.error);

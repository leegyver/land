import 'dotenv/config';
import { storage } from '../server/storage';
import { db } from '../server/db';

async function importFromApi() {
  const REMOTE_URL = 'https://real-estate-hub-mino312044.replit.app';
  console.log(`📡 Fetching properties from ${REMOTE_URL}...`);

  try {
    const res = await fetch(`${REMOTE_URL}/api/properties`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

    const properties = await res.json();
    console.log(`📦 Found ${properties.length} properties.`);

    let successCount = 0;
    let failCount = 0;

    for (const prop of properties) {
      try {
        // 이미 존재하는지 확인 (Optional: 제목으로 중복 체크 등)
        // 여기서는 단순히 추가만 합니다.

        // InsertProperty 스키마에 맞게 데이터 정제
        const { id, createdAt, updatedAt, ...insertData } = prop;

        // 이미지 URL 처리 (Replit 호스팅 이미지를 절대 경로로 변환 고려)
        // 현재는 URL 그대로 사용

        await storage.createProperty({
          ...insertData,
          price: String(insertData.price || "0"), // 타입 안전성 확보
          size: String(insertData.size || "0"),
          // 필요한 경우 추가 타입 변환
        });

        console.log(`✅ Imported: ${prop.title}`);
        successCount++;

        // Firestore 쓰기 제한 고려하여 약간의 딜레이
        await new Promise(r => setTimeout(r, 100));

      } catch (err) {
        console.error(`❌ Failed to import "${prop.title}":`, err);
        failCount++;
      }
    }

    console.log(`\n🎉 Migration Completed!`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);

  } catch (error) {
    console.error("Fatal Error during migration:", error);
  } finally {
    // 프로세스 종료 필요 (Firestore 연결 때문에)
    process.exit(0);
  }
}

importFromApi();

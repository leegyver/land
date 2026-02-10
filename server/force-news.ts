import 'dotenv/config';
import { fetchAndSaveNews } from "./news-fetcher";
import { db } from './db';

async function runManualFetch() {
    console.log("=== 뉴스 수집기 강제 실행 (진단용) ===");
    try {
        // DB 연결 확인
        const newsCount = (await db.collection('news').count().get()).data().count;
        console.log(`현재 저장된 뉴스 개수: ${newsCount}`);

        console.log("뉴스 수집 시작...");
        const result = await fetchAndSaveNews();

        console.log("=== 실행 결과 ===");
        console.log(`반환된 뉴스 아이템 수: ${result ? result.length : 0} (최대 3개 반환하도록 설정됨)`);
        console.log("수집 프로세스가 정상적으로 완료되었습니다.");
        console.log("참고: 네이버 API에서 새로운 뉴스가 없거나 모두 이미 저장된 경우, '저장됨' 로그가 뜨지 않을 수 있습니다.");
    } catch (error) {
        console.error("❌ 실행 중 오류 발생:", error);
    }
}

runManualFetch();

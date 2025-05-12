import fetch from 'node-fetch';
import { storage } from './storage';
import { db } from './db';
import { news } from '@shared/schema';
import { log } from './vite';
import { eq } from 'drizzle-orm';

const SEARCH_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";

// 검색 키워드 목록
const SEARCH_KEYWORDS = [
  '강화군',
  '강화군 부동산',
  '강화도 부동산',
  '인천 부동산',
  '강화군 개발',
  '강화도 투자',
  '인천 재개발',
  '강화도 아파트',
  '인천 아파트',
  '강화군 부동산 정책'
];

// 네이버 API 호출 함수
async function fetchNaverNews(keyword: string) {
  try {
    const response = await fetch(`${SEARCH_ENDPOINT}?query=${encodeURIComponent(keyword)}&display=5&sort=date`, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!
      }
    });

    if (!response.ok) {
      throw new Error(`네이버 API 응답 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      items: {
        title: string;
        description: string;
        link: string;
        originallink: string;
        pubDate: string;
      }[]
    };

    return data.items;
  } catch (error) {
    log(`네이버 뉴스 API 호출 오류: ${error}`, 'error');
    return [];
  }
}

// HTML 태그 제거 함수
function stripHtmlTags(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

// 중복 체크 함수
async function isNewsAlreadyExists(title: string): Promise<boolean> {
  const existingNews = await db.select().from(news).where(eq(news.title, title));
  return existingNews.length > 0;
}

// 뉴스 저장 함수
async function saveNewsToDatabase(newsItems: any[]) {
  for (const item of newsItems) {
    try {
      const cleanTitle = stripHtmlTags(item.title);
      const cleanDesc = stripHtmlTags(item.description);
      
      // 중복 체크
      const exists = await isNewsAlreadyExists(cleanTitle);
      if (exists) {
        continue;
      }

      // 뉴스 저장
      await storage.createNews({
        title: cleanTitle,
        summary: cleanDesc,
        description: cleanDesc,
        content: `${cleanDesc}\n\n원본 기사: ${item.link}`,
        source: new URL(item.originallink || item.link).hostname,
        sourceUrl: item.originallink || item.link,
        url: item.link,
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500',
        category: '인천 부동산',
        isPinned: false
      });
      
      log(`새로운 뉴스 저장됨: ${cleanTitle}`, 'info');
    } catch (error) {
      log(`뉴스 저장 오류: ${error}`, 'error');
    }
  }
}

// 메인 실행 함수
export async function fetchAndSaveNews() {
  let allNewsItems: any[] = [];

  // 각 키워드별로 검색 실행
  for (const keyword of SEARCH_KEYWORDS) {
    const newsItems = await fetchNaverNews(keyword);
    allNewsItems = [...allNewsItems, ...newsItems];
    
    // API 호출 사이에 약간의 딜레이 추가 (네이버 API 정책 준수)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 중복 제거
  const uniqueNewsItems = allNewsItems.filter((item, index, self) =>
    index === self.findIndex(t => stripHtmlTags(t.title) === stripHtmlTags(item.title))
  );

  // 최신순으로 정렬
  uniqueNewsItems.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // 상위 3개만 저장
  await saveNewsToDatabase(uniqueNewsItems.slice(0, 3));
  
  return uniqueNewsItems.slice(0, 3);
}

// 스케줄러 설정
let morningJobScheduled = false;
let eveningJobScheduled = false;

export function setupNewsScheduler() {
  function scheduleNextRun() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 오전 6시 작업 스케줄링
    if (currentHour < 6 && !morningJobScheduled) {
      const morningTime = new Date(now);
      morningTime.setHours(6, 0, 0, 0);
      const morningDelay = morningTime.getTime() - now.getTime();
      
      setTimeout(() => {
        fetchAndSaveNews().then(() => {
          morningJobScheduled = false;
          scheduleNextRun();
        });
      }, morningDelay);
      
      morningJobScheduled = true;
      log(`다음 뉴스 업데이트가 오전 6시에 예정되어 있습니다`, 'info');
    }
    
    // 오후 6시 작업 스케줄링
    if (currentHour < 18 && !eveningJobScheduled) {
      const eveningTime = new Date(now);
      eveningTime.setHours(18, 0, 0, 0);
      const eveningDelay = eveningTime.getTime() - now.getTime();
      
      setTimeout(() => {
        fetchAndSaveNews().then(() => {
          eveningJobScheduled = false;
          scheduleNextRun();
        });
      }, eveningDelay);
      
      eveningJobScheduled = true;
      log(`다음 뉴스 업데이트가 오후 6시에 예정되어 있습니다`, 'info');
    }
    
    // 하루가 끝나면 다음날 스케줄링을 위해 재설정
    if (currentHour >= 18 && !morningJobScheduled) {
      const tomorrowMorning = new Date(now);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(6, 0, 0, 0);
      const morningDelay = tomorrowMorning.getTime() - now.getTime();
      
      setTimeout(() => {
        fetchAndSaveNews().then(() => {
          morningJobScheduled = false;
          scheduleNextRun();
        });
      }, morningDelay);
      
      morningJobScheduled = true;
      log(`다음 뉴스 업데이트가 내일 오전 6시에 예정되어 있습니다`, 'info');
    }
  }
  
  // 초기 스케줄링 시작
  scheduleNextRun();
  
  // 서버 시작 시 즉시 한 번 실행
  fetchAndSaveNews();
}
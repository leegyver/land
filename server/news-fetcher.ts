import fetch from 'node-fetch';
import { storage } from './storage';
import { db } from './db';
import { news } from '@shared/schema';
import { log } from './vite';
import { eq } from 'drizzle-orm';

const SEARCH_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";

// 검색 키워드 목록 - 요구사항에 맞게 변경
const SEARCH_KEYWORDS = [
  '인천 부동산',
  '강화도 부동산',
  '국토교통부',
  '강화도 개발'
];

// 네이버 API 호출 함수
async function fetchNaverNews(keyword: string) {
  try {
    // 각 키워드마다 5개씩 뉴스를 가져오도록 설정
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

    // 각 뉴스 항목에 검색 키워드 정보 추가
    return data.items.map(item => ({
      ...item,
      searchKeyword: keyword  // 어떤 키워드로 검색되었는지 저장
    }));
  } catch (error) {
    log(`네이버 뉴스 API 호출 오류: ${error}`, 'error');
    return [];
  }
}

// HTML 태그 제거 함수
function stripHtmlTags(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

// 중복 체크 함수 (제목으로 DB에 같은 뉴스가 있는지 확인)
async function isNewsAlreadyExists(title: string): Promise<boolean> {
  const existingNews = await db.select().from(news).where(eq(news.title, title));
  return existingNews.length > 0;
}

// 단어 중복 체크 함수 (3개 이상 같은 단어가 있는지 확인)
function hasDuplicateWords(text1: string, text2: string, minDuplicates: number = 3): boolean {
  if (!text1 || !text2) return false;
  
  // 특수문자 및 불필요한 기호 제거
  const cleanText1 = text1.replace(/[^\w\s가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanText2 = text2.replace(/[^\w\s가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 단어 배열로 분리
  const words1 = cleanText1.split(' ').filter(word => word.length >= 2); // 2글자 이상만 확인
  const words2 = cleanText2.split(' ').filter(word => word.length >= 2);
  
  // 중복 단어 개수 세기
  let duplicateCount = 0;
  
  for (const word of words1) {
    if (words2.includes(word)) {
      duplicateCount++;
      if (duplicateCount >= minDuplicates) {
        return true;
      }
    }
  }
  
  return false;
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

      // 검색 키워드 기반 카테고리 설정
      let category = '부동산 뉴스';
      if (item.searchKeyword) {
        if (item.searchKeyword === '인천 부동산') {
          category = '인천 부동산';
        } else if (item.searchKeyword === '강화도 부동산') {
          category = '강화도 부동산';
        } else if (item.searchKeyword === '국토교통부') {
          category = '국토교통부';
        } else if (item.searchKeyword === '강화도 개발') {
          category = '강화도 개발';
        }
      }

      // 각 검색어에 적합한 이미지 선택
      let imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500';
      
      if (category === '인천 부동산') {
        imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500';
      } else if (category === '강화도 부동산' || category === '강화도 개발') {
        imageUrl = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500';
      } else if (category === '국토교통부') {
        imageUrl = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500';
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
        imageUrl: imageUrl,
        category: category,
        isPinned: false
      });
      
      log(`새로운 뉴스 저장됨: [${category}] ${cleanTitle}`, 'info');
    } catch (error) {
      log(`뉴스 저장 오류: ${error}`, 'error');
    }
  }
}

// 메인 실행 함수
export async function fetchAndSaveNews() {
  let allNewsItems: any[] = [];

  // 각 키워드별로 검색 실행 (각각 5개씩 가져옴)
  for (const keyword of SEARCH_KEYWORDS) {
    const newsItems = await fetchNaverNews(keyword);
    allNewsItems = [...allNewsItems, ...newsItems];
    
    // API 호출 사이에 약간의 딜레이 추가 (네이버 API 정책 준수)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 1단계: 동일한 제목 제거 (기본 중복 제거)
  let filteredNewsItems = allNewsItems.filter((item, index, self) =>
    index === self.findIndex(t => stripHtmlTags(t.title) === stripHtmlTags(item.title))
  );

  // 2단계: 유사 내용 기사 필터링 (3개 이상 단어가 중복되는 경우)
  const contentFilteredItems: any[] = [];
  
  for (const item of filteredNewsItems) {
    const cleanTitle = stripHtmlTags(item.title);
    const cleanDesc = stripHtmlTags(item.description);
    const combinedText = `${cleanTitle} ${cleanDesc}`;
    
    // 이미 필터링된 아이템과 비교하여 유사성 체크
    const isDuplicate = contentFilteredItems.some(existingItem => {
      const existingTitle = stripHtmlTags(existingItem.title);
      const existingDesc = stripHtmlTags(existingItem.description);
      const existingCombined = `${existingTitle} ${existingDesc}`;
      
      return hasDuplicateWords(combinedText, existingCombined, 3);
    });
    
    // 유사하지 않은 경우에만 추가
    if (!isDuplicate) {
      contentFilteredItems.push(item);
    } else {
      log(`중복 단어가 3개 이상 포함된 뉴스 필터링: ${cleanTitle}`, 'info');
    }
  }

  // 최신순으로 정렬
  contentFilteredItems.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // 모든 키워드에서 상위 항목 저장 (최대 20개 - 각 키워드당 5개씩)
  await saveNewsToDatabase(contentFilteredItems);
  
  log(`총 ${contentFilteredItems.length}개의 뉴스가 업데이트 대상으로 필터링됨`, 'info');
  return contentFilteredItems;
}

// 스케줄러 설정
let morningJobScheduled = false;
let eveningJobScheduled = false;
let morningTimerId: NodeJS.Timeout | null = null;
let eveningTimerId: NodeJS.Timeout | null = null;

export function setupNewsScheduler() {
  // 기존 타이머 정리
  if (morningTimerId) {
    clearTimeout(morningTimerId);
    morningTimerId = null;
  }
  
  if (eveningTimerId) {
    clearTimeout(eveningTimerId);
    eveningTimerId = null;
  }
  
  function scheduleNextRun() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 오전 6시 작업 스케줄링
    if ((currentHour < 6 || (currentHour === 6 && currentMinute === 0)) && !morningJobScheduled) {
      const morningTime = new Date(now);
      morningTime.setHours(6, 0, 0, 0);
      
      // 현재 시간이 이미 지났으면 다음날로 설정
      if (morningTime.getTime() <= now.getTime()) {
        morningTime.setDate(morningTime.getDate() + 1);
      }
      
      const morningDelay = morningTime.getTime() - now.getTime();
      
      morningTimerId = setTimeout(() => {
        log(`오전 6시 정기 뉴스 수집 시작`, 'info');
        fetchAndSaveNews().then((newsItems) => {
          log(`오전 뉴스 수집 완료: ${newsItems.length}개 항목 처리됨`, 'info');
          morningJobScheduled = false;
          scheduleNextRun();
        }).catch(error => {
          log(`오전 뉴스 수집 오류: ${error}`, 'error');
          morningJobScheduled = false;
          scheduleNextRun();
        });
      }, morningDelay);
      
      morningJobScheduled = true;
      const nextRunDate = new Date(now.getTime() + morningDelay);
      log(`다음 뉴스 업데이트가 ${nextRunDate.toLocaleString()}에 예정되어 있습니다`, 'info');
    }
    
    // 오후 6시 작업 스케줄링
    if ((currentHour < 18 || (currentHour === 18 && currentMinute === 0)) && !eveningJobScheduled) {
      const eveningTime = new Date(now);
      eveningTime.setHours(18, 0, 0, 0);
      
      // 현재 시간이 이미 지났으면 다음날로 설정
      if (eveningTime.getTime() <= now.getTime()) {
        eveningTime.setDate(eveningTime.getDate() + 1);
      }
      
      const eveningDelay = eveningTime.getTime() - now.getTime();
      
      eveningTimerId = setTimeout(() => {
        log(`오후 6시 정기 뉴스 수집 시작`, 'info');
        fetchAndSaveNews().then((newsItems) => {
          log(`오후 뉴스 수집 완료: ${newsItems.length}개 항목 처리됨`, 'info');
          eveningJobScheduled = false;
          scheduleNextRun();
        }).catch(error => {
          log(`오후 뉴스 수집 오류: ${error}`, 'error');
          eveningJobScheduled = false;
          scheduleNextRun();
        });
      }, eveningDelay);
      
      eveningJobScheduled = true;
      const nextRunDate = new Date(now.getTime() + eveningDelay);
      log(`다음 뉴스 업데이트가 ${nextRunDate.toLocaleString()}에 예정되어 있습니다`, 'info');
    }
  }
  
  // 초기 스케줄링 시작
  scheduleNextRun();
  
  // 서버 시작 시 즉시 한 번 실행 (1초 후에 실행하여 서버 초기화가 완료된 후 실행되도록 함)
  setTimeout(() => {
    log(`서버 시작 시 초기 뉴스 수집 시작`, 'info');
    fetchAndSaveNews().then((newsItems) => {
      log(`초기 뉴스 수집 완료: ${newsItems.length}개 항목 처리됨`, 'info');
    }).catch(error => {
      log(`초기 뉴스 수집 오류: ${error}`, 'error');
    });
  }, 1000);
  
  // 수동 실행을 위한 함수 반환
  return {
    runManually: async () => {
      log(`뉴스 수집 수동 실행 시작`, 'info');
      try {
        const newsItems = await fetchAndSaveNews();
        log(`수동 뉴스 수집 완료: ${newsItems.length}개 항목 처리됨`, 'info');
        return { success: true, count: newsItems.length };
      } catch (error) {
        log(`수동 뉴스 수집 오류: ${error}`, 'error');
        return { success: false, error };
      }
    }
  };
}
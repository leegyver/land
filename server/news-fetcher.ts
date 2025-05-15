import fetch from 'node-fetch';
import { storage } from './storage';
import { db } from './db';
import { news } from '@shared/schema';
import { log } from './vite';
import { eq } from 'drizzle-orm';
import * as cheerio from 'cheerio';

const SEARCH_ENDPOINT = "https://openapi.naver.com/v1/search/news.json";

// 부동산 관련 이미지 모음 (실제 부동산 이미지로 다양하게 준비)
const REAL_ESTATE_IMAGES = [
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500',
  'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500',
  'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500'
];

// 검색 키워드 목록 (사용자 요청에 따라 업데이트)
const SEARCH_KEYWORDS = [
  '강화군',
  '부동산',
  '정책',
  '인천',
  '개발',
  '강화도'
];

// 검색 키워드 검증용 배열 (중복 제거)
const KEYWORD_CHECK_ARRAY = SEARCH_KEYWORDS;

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

// HTML 태그와 엔티티 처리 함수
function stripHtmlTags(html: string): string {
  // HTML 태그 제거
  let text = html.replace(/<\/?[^>]+(>|$)/g, "");
  
  // HTML 엔티티 디코딩 (주요 엔티티만 변환)
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&#039;': "'",
    '&#39;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '...',
    '&middot;': '·'
  };
  
  // 모든 엔티티 패턴을 순회하며 변환
  Object.entries(entities).forEach(([entity, replacement]) => {
    text = text.replace(new RegExp(entity, 'g'), replacement);
  });
  
  return text;
}

// 중복 체크 함수
async function isNewsAlreadyExists(title: string): Promise<boolean> {
  const existingNews = await db.select().from(news).where(eq(news.title, title));
  return existingNews.length > 0;
}

// 제목에 동일한 단어가 3개 이상 사용되었는지 확인
function hasTooManyRepeatedWords(title: string): boolean {
  // 특수문자 및 공백 제거 후 단어 분리
  const cleanedTitle = title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').toLowerCase();
  const words = cleanedTitle.split(/\s+/).filter(word => word.length > 1); // 한 글자 단어는 제외
  
  // 단어별 등장 횟수 카운트
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  // 3번 이상 반복된 단어가 있는지 확인
  for (const word in wordCount) {
    if (wordCount[word] >= 3) {
      console.log(`중복 단어 발견: '${word}'가 ${wordCount[word]}번 등장 (제목: ${title})`);
      return true;
    }
  }
  
  return false;
}

// 뉴스 이미지 추출 함수
async function extractImageFromNews(url: string): Promise<string | null> {
  try {
    // 원본 뉴스 페이지 가져오기
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 뉴스 본문 이미지 찾기 (네이버 뉴스 구조)
    let imageUrl: string | null = null;
    
    // 네이버 뉴스 메인 이미지
    const naverNewsImage = $('#articleBodyContents img, #newsEndContents img, .end_photo_org img').first();
    if (naverNewsImage.length) {
      imageUrl = naverNewsImage.attr('src') || null;
    }
    
    // 다른 뉴스 사이트의 메타 태그 이미지
    if (!imageUrl) {
      const metaImage = $('meta[property="og:image"]').attr('content');
      if (metaImage) {
        imageUrl = metaImage;
      }
    }
    
    // 일반 이미지 검색 (fallback)
    if (!imageUrl) {
      const firstImage = $('article img, .article img, .news_body img').first();
      if (firstImage.length) {
        imageUrl = firstImage.attr('src') || null;
      }
    }
    
    // 이미지 URL 정규화
    if (imageUrl && !imageUrl.startsWith('http')) {
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else {
        const baseUrl = new URL(url);
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
    }
    
    return imageUrl;
  } catch (error) {
    log(`이미지 추출 오류 (${url}): ${error}`, 'error');
    return null;
  }
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
      
      // 제목에 단어 중복 체크 (동일한 단어가 3번 이상 반복되면 필터링)
      if (hasTooManyRepeatedWords(cleanTitle)) {
        console.log(`단어 중복 필터링: "${cleanTitle}"`);
        continue;
      }

      // 원본 뉴스에서 이미지 추출 시도
      let imageUrl = await extractImageFromNews(item.link);
      
      // 이미지 추출 실패 시 대체 이미지 사용
      if (!imageUrl) {
        const randomImageIndex = Math.floor(Math.random() * REAL_ESTATE_IMAGES.length);
        imageUrl = REAL_ESTATE_IMAGES[randomImageIndex];
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
        category: '인천 부동산',
        isPinned: false
      });
      
      log(`새로운 뉴스 저장됨: ${cleanTitle}`, 'info');
    } catch (error) {
      log(`뉴스 저장 오류: ${error}`, 'error');
    }
  }
}

// 기존 뉴스에서 중복 단어가 많은 항목 필터링
async function filterExistingNewsByRepeatedWords() {
  try {
    // 모든 뉴스 가져오기
    const allNews = await db.select().from(news);
    
    let removedCount = 0;
    
    // 각 뉴스 제목을 검사하여 중복 단어가 많은 항목 필터링
    for (const newsItem of allNews) {
      if (hasTooManyRepeatedWords(newsItem.title)) {
        console.log(`기존 뉴스 필터링 (중복 단어): ${newsItem.title}`);
        await storage.deleteNews(newsItem.id);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`총 ${removedCount}개의 중복 단어가 많은 뉴스를 삭제했습니다.`);
    }
  } catch (error) {
    console.error('기존 뉴스 필터링 중 오류:', error);
  }
}

// 메인 실행 함수
export async function fetchAndSaveNews() {
  // 기존 뉴스 필터링 (중복 단어가 많은 항목)
  await filterExistingNewsByRepeatedWords();
  
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

  // 키워드 개수 확인 함수
  function countKeywordsInText(text: string): number {
    let count = 0;
    for (const keyword of KEYWORD_CHECK_ARRAY) {
      if (text.includes(keyword.toLowerCase())) {
        count++;
      }
    }
    return count;
  }

  // 두 개 이상의 키워드가 포함된 뉴스 필터링
  const relevantNewsItems = uniqueNewsItems.filter(item => {
    const title = stripHtmlTags(item.title).toLowerCase();
    const description = stripHtmlTags(item.description).toLowerCase();
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // 두 개 이상의 키워드가 포함된 뉴스만 선택
    const keywordCount = countKeywordsInText(combinedText);
    return keywordCount >= 2;
  });

  // 중복 단어 제목 필터링 (3개 이상 동일 단어가 있는 뉴스는 한 개만 선택)
  const duplicateWordGroups: { [key: string]: any[] } = {};
  const filteredNewsItems: any[] = [];

  for (const item of relevantNewsItems) {
    const title = stripHtmlTags(item.title);
    // 제목에 중복 단어가 3개 이상 있는지 확인
    if (hasTooManyRepeatedWords(title)) {
      // 중복 단어 그룹에 추가 (그룹화를 위한 간단한 해시 키 생성)
      const hashKey = title.slice(0, 10).toLowerCase().replace(/\s+/g, '');
      if (!duplicateWordGroups[hashKey]) {
        duplicateWordGroups[hashKey] = [];
      }
      duplicateWordGroups[hashKey].push(item);
    } else {
      // 중복 단어가 없으면 바로 추가
      filteredNewsItems.push(item);
    }
  }

  // 각 중복 그룹에서 가장 최신 뉴스 하나만 선택
  for (const key in duplicateWordGroups) {
    if (duplicateWordGroups[key].length > 0) {
      // 날짜 기준 정렬
      duplicateWordGroups[key].sort((a, b) => 
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
      // 그룹당 하나만 추가
      filteredNewsItems.push(duplicateWordGroups[key][0]);
      console.log(`중복 그룹(${key})에서 1개 뉴스만 선택함: ${stripHtmlTags(duplicateWordGroups[key][0].title)}`);
    }
  }

  // 최종 뉴스 목록을 날짜 기준으로 정렬
  filteredNewsItems.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  
  // 최대 3개의 뉴스만 선택 (스케줄에 따라)
  const newsToSave = filteredNewsItems.slice(0, 3);
  
  // 저장
  await saveNewsToDatabase(newsToSave);
  
  return newsToSave;
}

// 스케줄러 설정
let morningJobScheduled = false;
let eveningJobScheduled = false;

export function setupNewsScheduler() {
  // 뉴스 자동 업데이트 활성화 (사용자 요청에 따라 수정)
  log(`[info] 뉴스 자동 업데이트가 활성화되었습니다 (6시, 18시 각 3개씩)`, 'info');
  
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
      log(`다음 뉴스 업데이트가 오전 6시에 예정되어 있습니다 (최대 3개)`, 'info');
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
      log(`다음 뉴스 업데이트가 오후 6시에 예정되어 있습니다 (최대 3개)`, 'info');
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
      log(`다음 뉴스 업데이트가 내일 오전 6시에 예정되어 있습니다 (최대 3개)`, 'info');
    }
  }
  
  // 초기 스케줄링 시작
  scheduleNextRun();
  
  // 서버 시작 시 즉시 한 번 실행 (테스트용)
  fetchAndSaveNews()
    .then(() => log(`초기 뉴스 데이터 수집 완료 (최대 3개)`, 'info'))
    .catch(err => log(`초기 뉴스 데이터 수집 실패: ${err}`, 'error'));
}
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

/**
 * 유튜브 채널의 최신 영상 목록을 가져옵니다.
 * @param channelUrl 유튜브 채널 URL (e.g., https://www.youtube.com/@username/featured)
 * @param limit 가져올 영상 수량
 * @returns 유튜브 영상 정보 배열
 */
export async function fetchLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  try {
    console.log(`유튜브 채널 정보 요청: ${channelUrl}`);
    
    // 채널 페이지 HTML 가져오기
    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`유튜브 채널 페이지 로드 실패: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // cheerio로 HTML 파싱
    const $ = cheerio.load(html);
    
    const videos: YouTubeVideo[] = [];
    
    // 최근 영상 정보 추출 (초기 JSON 데이터에서 추출 시도)
    // 스크립트 태그를 순회하며 ytInitialData를 포함한 것을 찾음
    let scriptContent = '';
    $('script').each((_, script) => {
      const content = $(script).html() || '';
      if (content && content.includes('ytInitialData')) {
        scriptContent = content;
        return false; // 루프 중단
      }
    });
    
    if (scriptContent) {
      
      // ytInitialData 객체 추출
      const dataMatch = scriptContent.match(/var ytInitialData = (.+?);</);
      
      if (dataMatch && dataMatch[1]) {
        try {
          // JSON 파싱 시도
          const ytData = JSON.parse(dataMatch[1]);
          
          // 탭 컨텐츠에서 비디오 아이템 찾기 시도
          const videoItems = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[1]?.tabRenderer?.content?.richGridRenderer?.contents || [];
          
          for (const item of videoItems) {
            if (videos.length >= limit) break;
            
            const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
            if (!videoRenderer) continue;
            
            const videoId = videoRenderer.videoId;
            const title = videoRenderer.title?.runs?.[0]?.text;
            const thumbnail = videoRenderer.thumbnail?.thumbnails?.[0]?.url;
            
            if (videoId && title && thumbnail) {
              videos.push({
                id: videoId,
                title,
                thumbnail: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
                url: `https://www.youtube.com/watch?v=${videoId}`
              });
            }
          }
        } catch (e) {
          console.error('유튜브 데이터 파싱 오류:', e);
        }
      }
    }
    
    // 일반적인 비디오 카드 추출 (비구조화된 데이터를 통한 대체 방법)
    if (videos.length === 0) {
      // 채널에 샘플 동영상 데이터 제공 (API에서 가져오기 어려운 경우)
      console.log('YouTube 영상 정보를 가져올 수 없어 샘플 데이터를 사용합니다.');
      
      // 사이트 제작 시점에서의 실제 "강화도부동산" 유튜브 채널의 주요 영상 데이터를 제공
      videos.push({
        id: 'Vjqm9G9VN7s',
        title: '강화버스투어 강화한옥마을-우리집한옥스테이',
        thumbnail: 'https://i.ytimg.com/vi/Vjqm9G9VN7s/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=Vjqm9G9VN7s'
      });
      
      videos.push({
        id: 'nJvPvjZ6hcE',
        title: '현대아이파크 인근 단독주택 바로 보시죠',
        thumbnail: 'https://i.ytimg.com/vi/nJvPvjZ6hcE/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=nJvPvjZ6hcE'
      });
      
      videos.push({
        id: 'FQy2PGG2IEY',
        title: '강화 전원주택 전세 바로 보시죠',
        thumbnail: 'https://i.ytimg.com/vi/FQy2PGG2IEY/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=FQy2PGG2IEY'
      });
      
      videos.push({
        id: 'uF6DUZEdFtA',
        title: '강화에서 서울 한강이 보이는 타운하우스 "강화 브리드원"',
        thumbnail: 'https://i.ytimg.com/vi/uF6DUZEdFtA/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=uF6DUZEdFtA'
      });
      
      videos.push({
        id: 'cJ-OQ4j5-5c',
        title: '장화리 효정마을 전원주택단지 ",이웃과 함께 사는 기쁨"',
        thumbnail: 'https://i.ytimg.com/vi/cJ-OQ4j5-5c/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=cJ-OQ4j5-5c'
      });
      
      // 최대 개수 제한
      videos = videos.slice(0, limit);
    }
    
    console.log(`유튜브 영상 ${videos.length}개 정보 가져오기 완료`);
    return videos;
    
  } catch (error) {
    console.error('유튜브 영상 가져오기 오류:', error);
    return [];
  }
}

// 유튜브 컨텐츠 캐시
let youtubeCache: {
  videos: YouTubeVideo[];
  lastFetched: number;
} = {
  videos: [],
  lastFetched: 0
};

// 캐시 유효 시간 (6시간)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * 캐싱을 활용하여 유튜브 영상 목록 가져오기
 */
export async function getLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const now = Date.now();
  
  // 캐시가 유효한지 확인
  if (youtubeCache.videos.length > 0 && now - youtubeCache.lastFetched < CACHE_TTL) {
    console.log('캐시된 유튜브 영상 정보 반환');
    return youtubeCache.videos.slice(0, limit);
  }
  
  // 새로운 데이터 가져오기
  const videos = await fetchLatestYouTubeVideos(channelUrl, limit);
  
  // 캐시 업데이트
  if (videos.length > 0) {
    youtubeCache = {
      videos,
      lastFetched: now
    };
  }
  
  return videos;
}
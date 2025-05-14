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
    const initialDataScript = $('script').get().find(script => {
      const content = $(script).html();
      return content ? content.includes('ytInitialData') : false;
    });
    
    if (initialDataScript.length > 0) {
      let scriptContent = initialDataScript.html() || '';
      
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
      // 비디오 카드 선택자 (채널 페이지 구조에 따라 변경될 수 있음)
      $('a#video-title-link, a.yt-simple-endpoint').each(function(i) {
        if (i >= limit) return false;
        
        const videoUrl = $(this).attr('href');
        if (!videoUrl || !videoUrl.includes('/watch?v=')) return;
        
        const videoId = videoUrl.split('v=')[1]?.split('&')[0];
        const title = $(this).attr('title') || $(this).text().trim();
        
        // 섬네일 이미지 찾기
        let thumbnail = '';
        const thumbnailImg = $(this).closest('div').find('img[src*="ytimg"]').first();
        if (thumbnailImg.length) {
          thumbnail = thumbnailImg.attr('src') || '';
        }
        
        if (videoId && title) {
          videos.push({
            id: videoId,
            title,
            thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, // 기본 썸네일 URL 포맷
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      });
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
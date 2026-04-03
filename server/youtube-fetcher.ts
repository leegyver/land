import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

/**
 * YouTube 비디오 정보 인터페이스
 */
export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

/**
 * 유튜브 채널 URL에서 채널 ID를 추출합니다.
 */
export function extractChannelId(channelUrl: string): string {
  if (!channelUrl) return 'UCCG3_JlKhgalqhict7tKkbA';
  
  if (channelUrl.includes('channel/')) {
    return channelUrl.split('channel/')[1].split(/[?#/]/)[0];
  }
  
  if (channelUrl.includes('@')) {
    const handle = channelUrl.split('@')[1].split(/[?#/]/)[0];
    if (handle === '강화도부동산') return 'UCCG3_JlKhgalqhict7tKkbA';
    if (handle === '강화도부동산이야기') return 'UChvA8_nrczWDBYdHUum7Amw';
    return handle;
  }
  
  return channelUrl;
}

/**
 * 1순위: YouTube RSS 피드 파싱 (API 키 불필요)
 */
async function fetchFromYouTubeRSS(channelId: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!res.ok) {
    throw new Error(`RSS Error: ${res.status}`);
  }
  
  const xmlData = await res.text();
  const parser = new XMLParser();
  const xmlObj = parser.parse(xmlData);
  
  let entries = xmlObj?.feed?.entry || [];
  if (!Array.isArray(entries)) {
    entries = [entries];
  }
  
  return entries.slice(0, limit).map((item: any) => ({
    id: item['yt:videoId'],
    title: item.title,
    thumbnail: `https://i.ytimg.com/vi/${item['yt:videoId']}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${item['yt:videoId']}`,
    publishedAt: item.published
  }));
}

/**
 * 2순위: YouTube Data API v3 (API 키 필요)
 */
async function fetchFromYouTubeAPI(channelId: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('API Key missing');

  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const channelData = await channelRes.json() as any;
  
  if (!channelData.items?.[0]) throw new Error('Channel not found');
  const playlistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${playlistId}&key=${apiKey}`
  );
  const playlistData = await playlistRes.json() as any;

  return (playlistData.items || []).map((item: any) => ({
    id: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high?.url || `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
    publishedAt: item.snippet.publishedAt
  }));
}

/**
 * 3순위: YouTube 채널 페이지 HTML에서 동적으로 영상 데이터 추출 (API 키 불필요)
 * 채널 페이지의 ytInitialData JSON에서 videoId와 title을 파싱합니다.
 */
async function fetchFromYouTubeHTML(channelId: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const res = await fetch(`https://www.youtube.com/channel/${channelId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });

  if (!res.ok) throw new Error(`HTML fetch error: ${res.status}`);
  const html = await res.text();

  // ytInitialData JSON 블록 추출
  const dataMatch = html.match(/var\s+ytInitialData\s*=\s*({.+?});\s*<\/script>/s);
  let jsonData: any = null;
  if (dataMatch) {
    try { jsonData = JSON.parse(dataMatch[1]); } catch {}
  }

  const videos: YouTubeVideo[] = [];
  const seenIds = new Set<string>();

  // ytInitialData에서 videoRenderer 항목 추출
  if (jsonData) {
    const jsonStr = JSON.stringify(jsonData);
    // videoRenderer 패턴으로 videoId와 title 추출
    const videoRendererRegex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})","thumbnail".+?"title":\{"runs":\[\{"text":"(.+?)"\}/g;
    let match;
    while ((match = videoRendererRegex.exec(jsonStr)) !== null && videos.length < limit) {
      const videoId = match[1];
      if (!seenIds.has(videoId)) {
        seenIds.add(videoId);
        videos.push({
          id: videoId,
          title: match[2],
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`
        });
      }
    }
  }

  // ytInitialData 파싱 실패 시, HTML 전체에서 videoId만이라도 추출
  if (videos.length === 0) {
    const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let match;
    while ((match = videoIdRegex.exec(html)) !== null && videos.length < limit) {
      const videoId = match[1];
      if (!seenIds.has(videoId)) {
        seenIds.add(videoId);
        // title도 함께 추출 시도
        const titleRegex = new RegExp(`"videoId":"${videoId}"[^}]*?"title":\\{"runs":\\[\\{"text":"(.+?)"`, 's');
        const titleMatch = html.match(titleRegex);
        videos.push({
          id: videoId,
          title: titleMatch ? titleMatch[1] : `영상 ${videos.length + 1}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`
        });
      }
    }
  }

  if (videos.length === 0) throw new Error('No videos found in HTML');
  return videos;
}

/**
 * 메인 내보내기 함수 - 3단 우선순위로 영상 fetch
 * 1순위: RSS → 2순위: YouTube Data API → 3순위: 채널 HTML 스크래핑
 */
export async function fetchLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const channelId = extractChannelId(channelUrl);
  
  // 1순위: RSS
  try {
    const videos = await fetchFromYouTubeRSS(channelId, limit);
    if (videos.length > 0) {
      console.log(`[YouTube] RSS 성공 (${channelId}): ${videos.length}개`);
      return videos;
    }
  } catch (e) {
    console.warn(`[YouTube] RSS 실패 (${channelId}): ${(e as Error).message}`);
  }

  // 2순위: YouTube Data API
  try {
    const videos = await fetchFromYouTubeAPI(channelId, limit);
    if (videos.length > 0) {
      console.log(`[YouTube] API 성공 (${channelId}): ${videos.length}개`);
      return videos;
    }
  } catch (e) {
    console.warn(`[YouTube] API 실패 (${channelId}): ${(e as Error).message}`);
  }

  // 3순위: 채널 HTML 스크래핑
  try {
    const videos = await fetchFromYouTubeHTML(channelId, limit);
    console.log(`[YouTube] HTML 스크래핑 성공 (${channelId}): ${videos.length}개`);
    return videos;
  } catch (e) {
    console.error(`[YouTube] 모든 방법 실패 (${channelId}): ${(e as Error).message}`);
    return [];
  }
}

export async function getLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  return fetchLatestYouTubeVideos(channelUrl, limit);
}

export async function getChannelIdByHandle(handle: string): Promise<string | null> {
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
  if (cleanHandle === '강화도부동산') return 'UCCG3_JlKhgalqhict7tKkbA';
  if (cleanHandle === '강화도부동산이야기') return 'UChvA8_nrczWDBYdHUum7Amw';
  return null;
}

export async function fetchYouTubeShorts(channelId: string, limit: number = 10): Promise<YouTubeVideo[]> {
  try {
    const videos = await fetchLatestYouTubeVideos(channelId, limit);
    return videos.map(v => ({ ...v, url: v.url.replace('watch?v=', 'shorts/') }));
  } catch (error) {
    return [];
  }
}
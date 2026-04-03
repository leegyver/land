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
    // 핸들의 경우 ID로 변환이 필요할 수 있지만, 클라이언트에서 이미 ID를 보내므로 보조용으로만 사용
    if (handle === '강화도부동산') return 'UCCG3_JlKhgalqhict7tKkbA';
    if (handle === '강화도부동산이야기') return 'UChvA8_nrczWDBYdHUum7Amw';
    return handle;
  }
  
  return channelUrl;
}

/**
 * YouTube RSS 피드를 파싱하여 최신 영상을 가져옵니다 (API 키 필요 없음).
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
 * YouTube API를 사용하여 특정 채널의 최신 영상을 가져옵니다.
 */
async function fetchFromYouTubeAPI(channelId: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('API Key missing');

  // 1. 채널의 업로드 재생목록 ID 조회
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const channelData = await channelRes.json() as any;
  
  if (!channelData.items?.[0]) throw new Error('Channel not found');
  const playlistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // 2. 재생목록 아이템 조회
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
 * API 호출 실패 시 사용할 최소한의 대체 데이터
 */
function getFallbackVideos(channelId: string, limit: number): YouTubeVideo[] {
  const isLeeGyver = channelId === 'UCCG3_JlKhgalqhict7tKkbA';
  
  if (isLeeGyver) {
    return [
      {
        id: 'El6SpdIvHi8',
        title: '2024타경536036 장화리 임야 경매파악해보기 [강화도부동산]',
        thumbnail: 'https://i.ytimg.com/vi/El6SpdIvHi8/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=El6SpdIvHi8'
      },
      {
        id: 'k8zaWNHshl4',
        title: '바다뷰 대박위치!! 고속도로예정지. 상가임대. 시설권리금 무!!',
        thumbnail: 'https://i.ytimg.com/vi/k8zaWNHshl4/hqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=k8zaWNHshl4'
      }
    ].slice(0, limit);
  }

  // 강화도 부동산이야기 또는 기타
  return [
    {
      id: 'phcN7-Yw134',
      title: '이지도어 주택 - 강화도부동산이야기',
      thumbnail: 'https://i.ytimg.com/vi/phcN7-Yw134/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=phcN7-Yw134'
    },
    {
      id: 'nDHVk4jd87E',
      title: '강화도 신축 전원주택',
      thumbnail: 'https://i.ytimg.com/vi/nDHVk4jd87E/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=nDHVk4jd87E'
    },
    {
      id: '5Nxko8-JQx4',
      title: '소형 전원주택 급매물',
      thumbnail: 'https://i.ytimg.com/vi/5Nxko8-JQx4/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=5Nxko8-JQx4'
    },
    {
      id: 'ixpOMQleMtM',
      title: '바다조망 강화도 펜션 매매',
      thumbnail: 'https://i.ytimg.com/vi/ixpOMQleMtM/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=ixpOMQleMtM'
    },
    {
      id: '_zftsee11t0',
      title: '주말농장용 토지 급매',
      thumbnail: 'https://i.ytimg.com/vi/_zftsee11t0/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=_zftsee11t0'
    }
  ].slice(0, limit);
}

/**
 * 메인 내보내기 함수
 */
export async function fetchLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  const channelId = extractChannelId(channelUrl);
  
  try {
    // 1. 최우선적으로 RSS 피드를 파싱 (API 키가 불필요하며 할당량 문제 없음)
    return await fetchFromYouTubeRSS(channelId, limit);
  } catch (error) {
    console.warn(`YouTube RSS 파싱 실패 (${channelId}), API로 전환합니다.`);
    try {
      // 2. RSS 실패 시 기존 YouTube API 사용 시도
      return await fetchFromYouTubeAPI(channelId, limit);
    } catch (apiError) {
      console.warn(`YouTube API실패 (${channelId}), 대체 데이터를 반환합니다.`);
      return getFallbackVideos(channelId, limit);
    }
  }
}

export async function getLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  return fetchLatestYouTubeVideos(channelUrl, limit);
}

// 기존 코드와의 호환성을 위해 유지
export async function getChannelIdByHandle(handle: string): Promise<string | null> {
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
  if (cleanHandle === '강화도부동산') return 'UCCG3_JlKhgalqhict7tKkbA';
  if (cleanHandle === '강화도부동산이야기') return 'UChvA8_nrczWDBYdHUum7Amw';
  return null;
}

export async function fetchYouTubeShorts(channelId: string, limit: number = 10): Promise<YouTubeVideo[]> {
  try {
    // 쇼츠 정보도 동일하게 RSS 피드에서 최우선으로 가져옵니다 (일반 영상과 쇼츠가 같이 나옵니다).
    // RSS 채널 피드에서 가져온 아이템들의 url을 shorts로 변경해 줍니다.
    const videos = await fetchFromYouTubeRSS(channelId, limit);
    return videos.map(v => ({ ...v, url: v.url.replace('watch?v=', 'shorts/') }));
  } catch (error) {
    return getFallbackVideos(channelId, limit).map(v => ({ ...v, url: v.url.replace('watch?v=', 'shorts/') }));
  }
}
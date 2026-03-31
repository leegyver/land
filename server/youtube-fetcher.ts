import fetch from 'node-fetch';

/**
 * YouTube 비디오 정보 인터페이스
 */
export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;  // 썸네일 URL (항상 문자열, 없는 경우 기본 이미지 URL 사용)
  url: string;
  publishedAt?: string;
}

/**
 * YouTube 채널 응답 인터페이스
 */
interface YouTubeChannelResponse {
  items: {
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }[];
}

/**
 * YouTube 재생목록 응답 인터페이스
 */
interface YouTubePlaylistResponse {
  items: {
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      thumbnails: {
        high?: { url: string; };
        default?: { url: string; };
      };
      publishedAt: string;
    };
  }[];
}

/**
 * YouTube 검색 응답 인터페이스
 */
interface YouTubeSearchResponse {
  items: {
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        high?: { url: string; };
        default?: { url: string; };
      };
      publishedAt: string;
    };
  }[];
}

/**
 * 유튜브 채널 핸들(@username)에서 채널 ID를 가져옵니다.
 * @param handle 유튜브 채널 핸들 (예: @강화도부동산이야기)
 * @returns 채널 ID
 */
export async function getChannelIdByHandle(handle: string): Promise<string | null> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다');
    }

    // @ 기호 제거
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
    
    console.log(`YouTube 핸들로 채널 ID 조회: @${cleanHandle}`);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`채널 조회 실패: ${response.status}`);
    }
    
    const data = await response.json() as { items?: { id: string }[] };
    
    if (data.items && data.items.length > 0) {
      console.log(`채널 ID 찾음: ${data.items[0].id}`);
      return data.items[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('채널 ID 조회 오류:', error);
    return null;
  }
}

/**
 * 유튜브 채널 URL에서 채널 ID를 추출합니다.
 * @param channelUrl 유튜브 채널 URL
 * @returns 채널 ID
 */
function extractChannelId(channelUrl: string): string {
  // 채널 URL에서 ID 추출 (예: https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA)
  const match = channelUrl.match(/channel\/([^/?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // 기본값 반환
  return 'UCCG3_JlKhgalqhict7tKkbA'; // 이가이버 유튜브 채널 ID
}

/**
 * YouTube API를 사용하여 특정 채널의 쇼츠 영상을 가져옵니다.
 * @param channelId 유튜브 채널 ID
 * @param limit 가져올 영상 수량
 * @returns 유튜브 쇼츠 정보 배열
 */
export async function fetchYouTubeShorts(channelId: string, limit: number = 10): Promise<YouTubeVideo[]> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다');
    }

    console.log(`YouTube 쇼츠 검색: 채널 ${channelId}`);
    
    // 채널에서 쇼츠 검색 (짧은 영상 필터링)
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&videoDuration=short&maxResults=${limit}&order=date&key=${apiKey}`
    );
    
    if (!searchResponse.ok) {
      throw new Error(`쇼츠 검색 실패: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json() as YouTubeSearchResponse;
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log('쇼츠를 찾을 수 없습니다.');
      return [];
    }
    
    console.log(`${searchData.items.length}개의 쇼츠를 찾았습니다.`);
    
    const shorts = searchData.items.map(item => {
      const thumbnailUrl = item.snippet.thumbnails.high?.url || 
                           item.snippet.thumbnails.default?.url || 
                           `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`;
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/shorts/${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt
      };
    });
    
    return shorts;
  } catch (error) {
    console.error('YouTube 쇼츠 검색 오류:', error);
    return [];
  }
}

/**
 * YouTube API를 사용하여 특정 채널의 최신 영상을 가져옵니다.
 * @param channelId 유튜브 채널 ID (e.g., "UCCG3_JlKhgalqhict7tKkbA")
 * @param limit 가져올 영상 수량
 * @returns 유튜브 영상 정보 배열
 */
export async function fetchLatestYouTubeVideosWithAPI(channelId: string, limit: number = 5): Promise<YouTubeVideo[]> {
  try {
    // YouTube API 키 확인
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다');
    }

    console.log(`YouTube API를 사용하여 채널 정보 요청: ${channelId}`);
    
    // 채널의 업로드 재생목록 ID 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );
    
    if (!channelResponse.ok) {
      throw new Error(`채널 정보 요청 실패: ${channelResponse.status} ${channelResponse.statusText}`);
    }
    
    const channelData = await channelResponse.json() as YouTubeChannelResponse;
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('채널 정보를 찾을 수 없습니다');
    }
    
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log(`채널 업로드 재생목록 ID: ${uploadsPlaylistId}`);
    
    // 재생목록에서 최신 동영상 가져오기
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${uploadsPlaylistId}&key=${apiKey}`
    );
    
    if (!playlistResponse.ok) {
      throw new Error(`재생목록 요청 실패: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }
    
    const playlistData = await playlistResponse.json() as YouTubePlaylistResponse;
    
    if (!playlistData.items) {
      console.log('재생목록에서 영상을 찾을 수 없습니다.');
      return [];
    }
    
    console.log(`재생목록에서 ${playlistData.items.length}개의 영상 정보를 가져왔습니다.`);
    
    // 동영상 정보 매핑
    const videos = playlistData.items.map(item => {
      // 썸네일 URL 기본값 설정 (API에서 반환하지 않는 경우 대체 이미지 사용)
      const thumbnailUrl = item.snippet.thumbnails.high?.url || 
                           item.snippet.thumbnails.default?.url || 
                           `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`;
                           
      return {
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        publishedAt: item.snippet.publishedAt
      };
    });
    
    console.log('YouTube API에서 영상 정보 가져오기 성공');
    return videos;
    
  } catch (error) {
    console.error('YouTube API 요청 오류:', error);
    throw error;
  }
}

/**
 * 유튜브 채널의 최신 영상 목록을 가져옵니다.
 * API 키가 없거나 오류 발생 시 대체 데이터를 반환합니다.
 * @param channelUrl 유튜브 채널 URL (e.g., https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA)
 * @param limit 가져올 영상 수량
 * @returns 유튜브 영상 정보 배열
 */
export async function fetchLatestYouTubeVideos(channelUrl: string, limit: number = 5): Promise<YouTubeVideo[]> {
  try {
    console.log(`유튜브 채널 정보 요청: ${channelUrl}`);
    
    // 채널 ID 추출
    const channelId = extractChannelId(channelUrl);
    console.log(`추출된 채널 ID: ${channelId}`);
    
    // YouTube API로 데이터 가져오기 시도
    try {
      return await fetchLatestYouTubeVideosWithAPI(channelId, limit);
    } catch (apiError) {
      console.error('YouTube API 요청 실패, 대체 데이터 사용:', apiError);
      
      // API 실패 시 대체 데이터 제공
      if (channelId === 'UCCG3_JlKhgalqhict7tKkbA' || channelId === 'default' || !channelId) {
        // 이가이버 유튜브 채널의 최신 동영상 데이터 (실제 최신 영상 ID 반영)
        console.log('API 키 누락/오류로 인해 이가이버 유튜브 채널의 최신 10개 영상을 대체 데이터로 제공합니다.');
        
        const videos: YouTubeVideo[] = [
          {
            id: 'El6SpdIvHi8',
            title: '2024타경536036 장화리 임야 경매파악해보기 [강화도부동산 문의 01047873120]',
            thumbnail: 'https://i.ytimg.com/vi/El6SpdIvHi8/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=El6SpdIvHi8'
          },
          {
            id: 'eIdVj1dG7rw',
            title: 'Shade Beneath the Rainbow. AI tunes.',
            thumbnail: 'https://i.ytimg.com/vi/eIdVj1dG7rw/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=eIdVj1dG7rw'
          },
          {
            id: 'YqbBCfzRJ2Y',
            title: '올란도 주행중 시동꺼짐;; 연료차단밸브 셀프수리하기[강화도 이가이버 부동산] 문의 01047873120',
            thumbnail: 'https://i.ytimg.com/vi/YqbBCfzRJ2Y/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=YqbBCfzRJ2Y'
          },
          {
            id: 'k8zaWNHshl4',
            title: '바다뷰 대박위치!! 고속도로예정지. 상가임대. 시설권리금 무!! 강화읍 5분거리 장어마을 대도로변. 장사선수 강추합니다!!',
            thumbnail: 'https://i.ytimg.com/vi/k8zaWNHshl4/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=k8zaWNHshl4'
          },
          {
            id: 'VvTgTqUrZAY',
            title: '주변 최저가!! 개발행위득한 교통편리한 조용한동네 임야. 저수지 낚시 및 고려산 등산등 힐링 최고의 자리.',
            thumbnail: 'https://i.ytimg.com/vi/VvTgTqUrZAY/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=VvTgTqUrZAY'
          },
          {
            id: 'EW2NJr5-5qA',
            title: '황청리 정남향! 멋진바다뷰 별장지! 올대지![강화도 이가이버 부동산] 문의 01047873120',
            thumbnail: 'https://i.ytimg.com/vi/EW2NJr5-5qA/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=EW2NJr5-5qA'
          },
          {
            id: 'wKmGpQHJZP4',
            title: '강화도와 체류형쉼터, 주택의 선택 과연 그 마지막은?[강화도 이가이버TV] 문의 01047873120',
            thumbnail: 'https://i.ytimg.com/vi/wKmGpQHJZP4/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=wKmGpQHJZP4'
          },
          {
            id: 'ZYV7wPOhX9M',
            title: '강화도에 체류형쉼터와 농막, 주택의 선택. 전문가와 상담해야합니다02[강화도 이가이버TV] 문의 01047873120',
            thumbnail: 'https://i.ytimg.com/vi/ZYV7wPOhX9M/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=ZYV7wPOhX9M'
          },
          {
            id: 'w-MaSCGvDnI',
            title: '강화도에 체류형쉼터와 농막, 주택의 선택. 전문가와 상담해야합니다01[강화도 이가이버TV] 문의 01047873120',
            thumbnail: 'https://i.ytimg.com/vi/w-MaSCGvDnI/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=w-MaSCGvDnI'
          },
          {
            id: 'jr6mFluKmjo',
            title: '강화도와 맞는 체류형 쉼터는 과연 무엇일까? 시리즈01[강화도 이가이버TV] 문의 01047873120',
            thumbnail: 'https://i.ytimg.com/vi/jr6mFluKmjo/hqdefault.jpg',
            url: 'https://www.youtube.com/watch?v=jr6mFluKmjo'
          }
        ];
        
        // Return up to 15 items if requested, otherwise fallback default
        return videos.slice(0, Math.max(limit, 10));
      }

      // 기타 채널의 대체 데이터
      const videos: YouTubeVideo[] = [
        {
          id: 'Vjqm9G9VN7s',
          title: '강화버스투어 강화한옥마을-우리집한옥스테이',
          thumbnail: 'https://i.ytimg.com/vi/Vjqm9G9VN7s/hqdefault.jpg',
          url: 'https://www.youtube.com/watch?v=Vjqm9G9VN7s'
        },
        {
          id: 'nJvPvjZ6hcE',
          title: '현대아이파크 인근 단독주택 바로 보시죠',
          thumbnail: 'https://i.ytimg.com/vi/nJvPvjZ6hcE/hqdefault.jpg',
          url: 'https://www.youtube.com/watch?v=nJvPvjZ6hcE'
        },
        {
          id: 'FQy2PGG2IEY',
          title: '강화 전원주택 전세 바로 보시죠',
          thumbnail: 'https://i.ytimg.com/vi/FQy2PGG2IEY/hqdefault.jpg',
          url: 'https://www.youtube.com/watch?v=FQy2PGG2IEY'
        },
        {
          id: 'uF6DUZEdFtA',
          title: '강화에서 서울 한강이 보이는 타운하우스 "강화 브리드원"',
          thumbnail: 'https://i.ytimg.com/vi/uF6DUZEdFtA/hqdefault.jpg',
          url: 'https://www.youtube.com/watch?v=uF6DUZEdFtA'
        },
        {
          id: 'cJ-OQ4j5-5c',
          title: '장화리 효정마을 전원주택단지 "이웃과 함께 사는 기쁨"',
          thumbnail: 'https://i.ytimg.com/vi/cJ-OQ4j5-5c/hqdefault.jpg',
          url: 'https://www.youtube.com/watch?v=cJ-OQ4j5-5c'
        }
      ];
      
      return videos.slice(0, limit);
    }
    
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
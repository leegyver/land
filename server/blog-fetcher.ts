import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * 네이버 블로그 포스트 정보 인터페이스
 */
export interface BlogPost {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  publishedAt: string;
  category: string;
  summary?: string;
}

/**
 * 네이버 블로그 카테고리 ID 매핑
 */
interface CategoryMapping {
  [key: string]: string;
}

// 카테고리 ID를 사람이 읽을 수 있는 이름으로 매핑
const CATEGORY_NAMES: CategoryMapping = {
  '21': '부동산 소식',
  '35': '매물 정보',
  '36': '인테리어/시공'
};

/**
 * 네이버 블로그에서 특정 카테고리의 최신 글을 가져옵니다.
 * @param blogId 네이버 블로그 ID
 * @param categoryNo 카테고리 번호
 * @param limit 가져올 포스트 수
 * @returns 블로그 포스트 배열
 */
export async function fetchBlogPostsByCategory(
  blogId: string,
  categoryNo: string,
  limit: number = 5
): Promise<BlogPost[]> {
  try {
    console.log(`네이버 블로그 포스트 요청: blogId=${blogId}, categoryNo=${categoryNo}`);
    
    // 블로그 카테고리 URL
    const url = `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`블로그 데이터 요청 실패: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const posts: BlogPost[] = [];
    
    // 포스트 목록 추출
    $('.post_item').each((i, element) => {
      if (i >= limit) return;
      
      const postElement = $(element);
      
      // 포스트 ID 추출
      const postIdMatch = postElement.find('.post_link').attr('href')?.match(/logNo=(\d+)/);
      const postId = postIdMatch ? postIdMatch[1] : `post-${i}`;
      
      // 썸네일 추출 - 없으면 기본 이미지 사용
      let thumbnail = postElement.find('.post-thumbnail img').attr('src') || '';
      if (!thumbnail) {
        thumbnail = 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
      }
      
      // 제목 추출
      const title = postElement.find('.title_text').text().trim();
      
      // 링크 생성
      const link = `https://blog.naver.com/${blogId}/${postId}`;
      
      // 발행일 추출
      const publishedAt = postElement.find('.date').text().trim() || new Date().toISOString().split('T')[0];
      
      // 요약 추출
      const summary = postElement.find('.post_content').text().trim();
      
      posts.push({
        id: postId,
        title,
        link,
        thumbnail,
        publishedAt,
        category: CATEGORY_NAMES[categoryNo] || `카테고리 ${categoryNo}`,
        summary: summary.length > 100 ? summary.substring(0, 100) + '...' : summary
      });
    });
    
    // 포스트 추출 실패 시 대체 방법 (더보기 뷰)
    if (posts.length === 0) {
      $('.list_wrap .list_item').each((i, element) => {
        if (i >= limit) return;
        
        const postElement = $(element);
        
        // 포스트 ID 추출
        const postIdMatch = postElement.find('a.link').attr('href')?.match(/logNo=(\d+)/);
        const postId = postIdMatch ? postIdMatch[1] : `post-${i}`;
        
        // 썸네일 추출 - 없으면 기본 이미지 사용
        let thumbnail = postElement.find('.thumb img').attr('src') || '';
        if (!thumbnail) {
          thumbnail = 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
        }
        
        // 제목 추출
        const title = postElement.find('.title').text().trim();
        
        // 링크 생성
        const link = `https://blog.naver.com/${blogId}/${postId}`;
        
        // 발행일 추출
        const publishedAt = postElement.find('.date').text().trim() || new Date().toISOString().split('T')[0];
        
        posts.push({
          id: postId,
          title,
          link,
          thumbnail,
          publishedAt,
          category: CATEGORY_NAMES[categoryNo] || `카테고리 ${categoryNo}`,
          summary: ''
        });
      });
    }
    
    console.log(`네이버 블로그 포스트 ${posts.length}개 추출 성공, 카테고리: ${CATEGORY_NAMES[categoryNo] || categoryNo}`);
    
    return posts;
  } catch (error) {
    console.error('네이버 블로그 포스트 가져오기 오류:', error);
    return [];
  }
}

/**
 * 여러 카테고리에서 네이버 블로그 포스트를 가져와 합칩니다.
 * @param blogId 네이버 블로그 ID
 * @param categoryNos 카테고리 번호 배열
 * @param limit 카테고리별 최대 포스트 수
 * @returns 블로그 포스트 배열
 */
export async function fetchBlogPosts(
  blogId: string = '9551304',
  categoryNos: string[] = ['21', '35', '36'],
  limit: number = 5
): Promise<BlogPost[]> {
  try {
    // 각 카테고리별로 병렬 요청
    const postsPromises = categoryNos.map(categoryNo => 
      fetchBlogPostsByCategory(blogId, categoryNo, limit)
    );
    
    const postsArrays = await Promise.all(postsPromises);
    
    // 모든 포스트를 하나의 배열로 합치기
    const allPosts = postsArrays.flat();
    
    // 날짜 기준으로 최신순 정렬 (날짜 포맷이 YYYY.MM.DD 형식인 경우)
    allPosts.sort((a, b) => {
      // 날짜 문자열을 비교하여 정렬 (내림차순)
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    
    // 최대 포스트 수 제한
    return allPosts.slice(0, limit);
  } catch (error) {
    console.error('네이버 블로그 포스트 통합 오류:', error);
    return [];
  }
}

// 블로그 컨텐츠 캐시
let blogCache: {
  posts: BlogPost[];
  lastFetched: number;
} = {
  posts: [],
  lastFetched: 0
};

// 캐시 유효 시간 (1시간)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * 캐싱을 활용하여 네이버 블로그 포스트 목록 가져오기
 */
export async function getLatestBlogPosts(
  blogId: string = '9551304',
  categoryNos: string[] = ['21', '35', '36'],
  limit: number = 5
): Promise<BlogPost[]> {
  const now = Date.now();
  
  // 캐시가 유효한지 확인
  if (blogCache.posts.length > 0 && now - blogCache.lastFetched < CACHE_TTL) {
    console.log('캐시된 블로그 포스트 정보 반환');
    return blogCache.posts.slice(0, limit);
  }
  
  // 새로운 데이터 가져오기
  const posts = await fetchBlogPosts(blogId, categoryNos, limit);
  
  // 캐시 업데이트
  if (posts.length > 0) {
    blogCache = {
      posts,
      lastFetched: now
    };
  }
  
  return posts;
}
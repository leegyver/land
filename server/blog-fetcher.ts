import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * 네이버 블로그에서 게시물 목록을 가져오는 함수
 * @param blogId 네이버 블로그 ID
 * @param categoryNo 카테고리 번호
 * @param count 가져올 게시물 수
 * @returns 블로그 게시물 배열
 */
export async function fetchNaverBlogPosts(blogId: string, categoryNo: string, count: number = 5) {
  try {
    const url = `https://blog.naver.com/PostList.naver?blogId=${blogId}&from=postList&categoryNo=${categoryNo}`;
    const response = await fetch(url);
    const html = await response.text();
    
    // cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(html);
    const posts: BlogPost[] = [];
    
    // 블로그 포스트 목록 선택
    const postItems = $('.post_item');
    
    // 각 포스트 정보 추출
    postItems.each((i, element) => {
      if (i >= count) return false; // 요청한 개수만큼만 추출
      
      const $post = $(element);
      const title = $post.find('.title_text').text().trim();
      const link = $post.find('.title_link').attr('href');
      const date = $post.find('.date').text().trim();
      
      // 썸네일 이미지 추출
      let thumbnail = '';
      const imgElement = $post.find('.thumb_area img');
      if (imgElement.length > 0) {
        thumbnail = imgElement.attr('src') || '';
      }
      
      // 요약 내용 추출
      let summary = $post.find('.text_passage').text().trim();
      
      // 네이버 블로그의 경우 실제 URL 형식 수정
      let fullLink = link;
      if (link && !link.startsWith('http')) {
        fullLink = `https://blog.naver.com${link}`;
      }
      
      posts.push({
        title,
        link: fullLink || '',
        date,
        thumbnail,
        summary,
      });
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching Naver blog posts:', error);
    return [];
  }
}

// 블로그 게시물 타입 정의
export interface BlogPost {
  title: string;
  link: string;
  date: string;
  thumbnail: string;
  summary: string;
}
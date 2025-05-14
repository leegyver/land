import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * 네이버 블로그 특정 카테고리에서 직접 게시물 목록을 가져오는 함수 (웹 스크래핑 사용)
 * @param blogId 네이버 블로그 ID
 * @param categoryNo 카테고리 번호
 * @returns 블로그 게시물 배열
 */
export async function fetchNaverBlogPosts(blogId: string, categoryNo: string = '', count: number = 5) {
  try {
    if (!categoryNo) {
      console.error('카테고리 번호가 필요합니다');
      return [];
    }
    
    // 카테고리 페이지 URL
    const url = `https://blog.naver.com/PostList.naver?blogId=${blogId}&from=postList&categoryNo=${categoryNo}`;
    console.log(`카테고리 ${categoryNo} 페이지에서 포스트 가져오는 중: ${url}`);
    
    // 페이지 콘텐츠 가져오기
    const response = await fetch(url);
    const html = await response.text();
    
    // Cheerio로 HTML 파싱
    const $ = cheerio.load(html);
    const posts: BlogPost[] = [];
    
    // 블로그 포스트 항목 추출
    $('.blog2_post, .se-post-card, .post_card').each((index, element) => {
      try {
        // 포스트 제목
        let title = $(element).find('.se-title, .title, .post-item .title').text().trim();
        if (!title) {
          title = $(element).find('a:contains("post_title")').text().trim();
        }
        
        // 포스트 링크
        let link = $(element).find('a').attr('href');
        if (!link) {
          // 다른 방법으로 링크 추출 시도
          const linkElement = $(element).find('.se-module-text a, .post_title');
          link = linkElement.attr('href') || '';
        }
        
        // logNo 추출 (URL에서)
        const logNoPattern = /logNo=([0-9]+)/;
        let logNo = '';
        
        if (link) {
          const match = link.match(logNoPattern);
          if (match && match[1]) {
            logNo = match[1];
          }
        }
        
        // 완전한 링크 구성
        if (logNo) {
          link = `https://blog.naver.com/${blogId}/${logNo}`;
        } else if (!link || !link.startsWith('http')) {
          link = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
        }
        
        // 날짜 추출
        let date = $(element).find('.se-date, .date, .post-item .date').text().trim();
        if (!date) {
          const now = new Date();
          date = now.toLocaleDateString('ko-KR');
        }
        
        // 요약 추출
        let summary = $(element).find('.se-text-paragraph, .post_sub, .post-item .text').text().trim();
        if (summary.length > 150) {
          summary = summary.substring(0, 147) + '...';
        }
        
        // 썸네일 이미지 추출
        let thumbnail = $(element).find('img').attr('src') || '';
        if (!thumbnail) {
          thumbnail = 'https://logoproject.naver.com/img/img_story_naver.png';
        }
        
        // 제목이 존재하는 경우만 포스트로 간주
        if (title) {
          posts.push({
            title,
            link,
            date,
            thumbnail,
            summary,
            categoryNo
          });
        }
      } catch (error) {
        console.error('포스트 파싱 중 오류:', error);
      }
    });
    
    // 추출된 포스트가 없으면 다른 방법 시도 (네이버 블로그는 구조가 자주 변경됨)
    if (posts.length === 0) {
      // 다른 선택자로 재시도
      $('.post_item, .blog2_post, .post').each((index, element) => {
        try {
          const title = $(element).find('.title_area .title, .title').text().trim();
          let link = $(element).find('a.url').attr('href') || '';
          
          // link가 상대 경로인 경우 처리
          if (link && !link.startsWith('http')) {
            link = `https://blog.naver.com${link.startsWith('/') ? link : '/' + link}`;
          }
          
          const date = $(element).find('.date, .writeDate').text().trim() || new Date().toLocaleDateString('ko-KR');
          const summary = $(element).find('.blog2_summary, .text').text().trim() || '';
          const thumbnail = $(element).find('img.thum, img.representative').attr('src') || '';
          
          if (title) {
            posts.push({
              title,
              link: link || `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`,
              date,
              thumbnail: thumbnail || 'https://logoproject.naver.com/img/img_story_naver.png',
              summary: summary.substring(0, 150) + (summary.length > 150 ? '...' : ''),
              categoryNo
            });
          }
        } catch (error) {
          console.error('대체 포스트 파싱 중 오류:', error);
        }
      });
    }
    
    console.log(`카테고리 ${categoryNo}에서 ${posts.length}개 포스트 스크래핑 완료`);
    return posts.slice(0, count);
  } catch (error) {
    console.error(`카테고리 ${categoryNo} 포스트 가져오기 실패:`, error);
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
  categoryNo?: string;
}
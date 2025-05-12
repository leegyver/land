import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { xml2js } from 'xml-js';

/**
 * 네이버 블로그에서 게시물 목록을 가져오는 함수 (RSS 피드 사용)
 * @param blogId 네이버 블로그 ID
 * @param count 가져올 게시물 수
 * @returns 블로그 게시물 배열
 */
export async function fetchNaverBlogPosts(blogId: string, categoryNo: string = '', count: number = 5) {
  try {
    // RSS 피드 URL (카테고리가 있으면 해당 카테고리만, 없으면 전체 포스트)
    const url = `https://rss.blog.naver.com/${blogId}${categoryNo ? '/category/' + categoryNo : ''}`;
    
    console.log(`Fetching Naver blog RSS from: ${url}`);
    const response = await fetch(url);
    const xml = await response.text();
    
    // XML을 JavaScript 객체로 변환
    const result: any = xml2js(xml, { compact: true, spaces: 2 });
    
    if (!result || !result.rss || !result.rss.channel || !result.rss.channel.item) {
      console.error('RSS 피드 형식이 예상과 다릅니다:', result);
      return [];
    }
    
    // RSS 아이템을 배열로 변환 (단일 항목이면 배열로 감싸기)
    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];
    
    // 요청한 수만큼만 처리
    const limitedItems = items.slice(0, count);
    
    // 블로그 포스트 데이터 추출
    const posts: BlogPost[] = await Promise.all(
      limitedItems.map(async (item: any) => {
        const title = item.title._text || item.title._cdata || '';
        const link = item.link._text || '';
        const pubDateStr = item.pubDate._text || '';
        const pubDate = new Date(pubDateStr);
        const date = pubDate.toLocaleDateString('ko-KR');
        
        // 기본 요약 정보 추출
        let summary = '';
        if (item.description) {
          summary = item.description._text || item.description._cdata || '';
          // HTML 태그 제거
          summary = summary.replace(/<\/?[^>]+(>|$)/g, '');
        }
        
        // 썸네일 이미지 추출 (포스트 내용에서 첫 번째 이미지 추출 시도)
        let thumbnail = '';
        
        try {
          // 포스트 내용에서 첫 번째 이미지를 찾기 위해 포스트 페이지 요청
          const postResponse = await fetch(link);
          const postHtml = await postResponse.text();
          const $ = cheerio.load(postHtml);
          
          // 오픈그래프 이미지 태그 찾기 (더 신뢰성 있는 썸네일 소스)
          const ogImage = $('meta[property="og:image"]').attr('content');
          if (ogImage) {
            thumbnail = ogImage;
          } else {
            // 첫 번째 이미지 찾기
            const firstImage = $('img').first();
            if (firstImage.length > 0) {
              thumbnail = firstImage.attr('src') || '';
            }
          }
        } catch (err) {
          console.error('블로그 포스트 썸네일 추출 실패:', err);
        }
        
        return {
          title,
          link,
          date,
          thumbnail,
          summary: summary.substring(0, 150) + (summary.length > 150 ? '...' : ''),
        };
      })
    );
    
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
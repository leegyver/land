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
    const url = categoryNo 
      ? `https://rss.blog.naver.com/${blogId}?categoryNo=${categoryNo}`
      : `https://rss.blog.naver.com/${blogId}`;
    
    console.log(`Fetching Naver blog RSS from: ${url}`);
    const response = await fetch(url);
    const xml = await response.text();
    
    // XML을 JavaScript 객체로 변환 (타입 오류 방지를 위해 any로 타입 지정)
    const result: any = xml2js(xml, { compact: true } as any);
    
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
        
        // item에서 guid 또는 link를 사용하여 URL 구성
        // 많은 경우 guid는 blog.naver.com/PostView.naver?blogId=XXX&logNo=XXX 형식의 URL을 포함함
        let link = '';
        if (item.guid && item.guid._text) {
          link = item.guid._text;
        } else if (item.link && item.link._text) {
          link = item.link._text;
        }
        
        // link가 비어있는 경우 (RSS 피드에서 URL을 제공하지 않는 경우), 
        // 카테고리 페이지로 이동하도록 설정
        if (!link) {
          if (categoryNo) {
            // 특정 카테고리 페이지로 이동
            link = `https://blog.naver.com/PostList.naver?blogId=${blogId}&from=postList&categoryNo=${categoryNo}`;
          } else {
            // 기본 블로그 홈으로 이동
            link = `https://blog.naver.com/${blogId}`;
          }
        }
        
        // GUID나 item의 다른 속성에서 글 번호(logNo)를 추출해보기
        const logNoPattern = /logNo=([0-9]+)/;
        let logNo = '';
        
        // guid나 link에서 logNo 추출 시도
        if (item.guid && item.guid._text) {
          const match = item.guid._text.match(logNoPattern);
          if (match && match[1]) logNo = match[1];
        }
        
        if (!logNo && link) {
          const match = link.match(logNoPattern);
          if (match && match[1]) logNo = match[1];
        }
        
        // logNo가 추출되었다면 직접 포스트 URL 구성
        if (logNo) {
          link = `https://blog.naver.com/${blogId}/${logNo}`;
        }
        
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
        
        // 썸네일 이미지 추출
        let thumbnail = '';
        
        // 기본 썸네일 이미지 설정 (네이버 블로그 로고 등)
        thumbnail = 'https://logoproject.naver.com/img/img_story_naver.png';
        
        // RSS 피드에 enclosure 태그가 있는지 확인 (일부 RSS 피드는 여기에 이미지 URL을 포함)
        if (item.enclosure && item.enclosure._attributes && item.enclosure._attributes.url) {
          thumbnail = item.enclosure._attributes.url;
        }
        
        // description에서 이미지 태그를 찾을 수도 있음
        if (!thumbnail && item.description) {
          const desc = item.description._text || item.description._cdata || '';
          const imgMatch = desc.match(/<img[^>]+src="([^">]+)"/i);
          if (imgMatch && imgMatch[1]) {
            thumbnail = imgMatch[1];
          }
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
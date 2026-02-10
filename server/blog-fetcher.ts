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
// 지정된 카테고리: 11(블로그 최신글)
const CATEGORY_NAMES: CategoryMapping = {
  '35': '나의 취미생활',
  '36': '세상이야기',
  '37': '부동산정보'
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

    // 블로그 카테고리 URL - PC버전과 모바일 버전 모두 시도 (상위 카테고리 포함)
    // 하위 카테고리를 포함하는 방식으로 URL 구성
    // 1. categoryNo=0&parentCategoryNo=카테고리 - 특정 상위 카테고리의 모든 하위 카테고리 포함
    // 2. categoryNo=카테고리 - 특정 카테고리만 조회
    const pcUrl = categoryNo === "0"
      ? `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=0&parentCategoryNo=11`
      : `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`;

    const mobileUrl = categoryNo === "0"
      ? `https://m.blog.naver.com/${blogId}?categoryNo=0&parentCategoryNo=11`
      : `https://m.blog.naver.com/${blogId}?categoryNo=${categoryNo}`;

    // 먼저 PC버전 시도
    let response = await fetch(pcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`블로그 데이터 요청 실패: ${response.status} ${response.statusText}`);
    }

    let html = await response.text();
    let $ = cheerio.load(html);
    let posts: BlogPost[] = [];

    // PC 버전 파싱 시도 - 다양한 클래스 선택자 시도
    const postElements = $('.post_item, .lst_item, .se-post-item, .se_post_item, .blog2_post, .blog2_series, .post, .link-post, .list_item');

    if (postElements.length > 0) {
      console.log(`PC 버전 파싱: ${postElements.length}개 요소 찾음`);

      postElements.each((i, element) => {
        if (i >= limit) return;

        try {
          const $el = $(element);

          // 다양한 선택자로 ID 추출 시도
          let postId = '';
          const href = $el.find('a').attr('href') || '';
          const logNoMatch = href.match(/logNo=(\d+)/) || href.match(/(\d{10,})$/);
          if (logNoMatch && logNoMatch[1]) {
            postId = logNoMatch[1];
          } else {
            postId = $el.attr('data-post-no') || $el.attr('data-entry-id') || `post-${Date.now()}-${i}`;
          }

          // 다양한 선택자로 제목 추출 시도
          let title = '';
          const titleSelectors = [
            '.title_text', '.se-title-text', '.se_title_text',
            '.title', '.tit', '.se-module-text', '.se_module_text',
            '.link_title', '.pcol1', '.ell'
          ];

          for (const selector of titleSelectors) {
            const titleEl = $el.find(selector);
            if (titleEl.length > 0) {
              title = titleEl.first().text().trim();
              if (title) break;
            }
          }

          if (!title) {
            // 제목을 찾을 수 없으면 다음 항목으로
            return;
          }

          // 제목 정리: 여러 가지 구분자로 정리
          // 1. 첫 번째 줄만 사용
          if (title.includes('\n')) {
            title = title.split('\n')[0].trim();
          }

          // 2. 물음표 연속 구분
          if (title.includes('??')) {
            title = title.split('??')[0].trim() + '?';
          } else if (title.includes('? ')) {
            title = title.split('? ')[0].trim() + '?';
          }

          // 3. 점 두 개 이상 구분
          if (title.includes('..')) {
            title = title.split('..')[0].trim();
          }

          // 4. 특수 패턴 제거 (강화도 부동산 관련 반복 패턴)
          const patterns = [
            '강화도 부동산', '부동산', '공인중개사', '중개사', '매물'
          ];

          for (const pattern of patterns) {
            const index = title.indexOf(pattern);
            if (index > 10) { // 첫 단어가 아닌 경우에만
              title = title.substring(0, index).trim();
              break;
            }
          }

          // 5. 제목이 너무 길면 적절한 길이로 자르기 (약 30자)
          if (title.length > 30) {
            title = title.substring(0, 30) + '...';
          }

          // 링크 생성
          const link = `https://blog.naver.com/${blogId}/${postId}`;

          // 썸네일 추출 시도
          let thumbnail = '';
          const imgSelectors = [
            '.post_thumb img', '.se-thumbnail img', '.se_thumbnail img',
            '.img_thumb img', '.blog2_thumb img', '.photo_wrap img',
            '.se-image-resource', '.img img', '.thumb img', 'img.img'
          ];

          for (const selector of imgSelectors) {
            const imgEl = $el.find(selector);
            if (imgEl.length > 0) {
              thumbnail = imgEl.first().attr('src') || imgEl.first().attr('data-lazy-src') || '';
              if (thumbnail) break;
            }
          }

          if (!thumbnail) {
            thumbnail = 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
          }

          // 발행일 추출 시도
          let publishedAt = '';
          const dateSelectors = [
            '.date', '.se-date', '.se_date', '.blog2_date',
            '.time', '.date_post', '.date_time', '.post_date'
          ];

          for (const selector of dateSelectors) {
            const dateEl = $el.find(selector);
            if (dateEl.length > 0) {
              publishedAt = dateEl.first().text().trim();
              if (publishedAt) break;
            }
          }

          // 날짜 포맷 표준화
          if (!publishedAt) {
            const today = new Date();
            publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
          } else {
            // 날짜 표준화 (YYYY.MM.DD 형식으로)
            publishedAt = publishedAt.replace(/(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]?/g, '$1.$2.$3');

            // 만약 날짜가 형식에 맞지 않으면, 현재 날짜로 대체
            if (!/^\d{4}\.\d{1,2}\.\d{1,2}/.test(publishedAt)) {
              const today = new Date();
              publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
            }
          }

          // 요약 추출 시도
          let summary = '';
          const summarySelectors = [
            '.post_content', '.se-text', '.se_text', '.post_text',
            '.text', '.se-module-text', '.text_passage', '.se-text-paragraph'
          ];

          for (const selector of summarySelectors) {
            const summaryEl = $el.find(selector);
            if (summaryEl.length > 0) {
              summary = summaryEl.first().text().trim();
              if (summary) {
                summary = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
                break;
              }
            }
          }

          posts.push({
            id: postId,
            title,
            link,
            thumbnail,
            publishedAt,
            category: CATEGORY_NAMES[categoryNo] || `카테고리 ${categoryNo}`,
            summary
          });
        } catch (err) {
          console.error(`포스트 파싱 오류 (인덱스 ${i}):`, err);
        }
      });
    }

    // PC 버전으로 파싱 실패시 모바일 버전 시도
    if (posts.length === 0) {
      console.log('PC 버전 파싱 실패, 모바일 버전 시도');

      // 모바일 버전 요청
      try {
        response = await fetch(mobileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
          }
        });

        html = await response.text();
        $ = cheerio.load(html);

        // 모바일 버전 파싱 - 다양한 선택자 시도
        const mobilePostElements = $('._itemSection, .list_item, .se_post, .post_item, .se_card, .post, .postlist');

        console.log(`모바일 버전 파싱: ${mobilePostElements.length}개 요소 찾음`);

        mobilePostElements.each((i, element) => {
          if (i >= limit) return;

          try {
            const $el = $(element);

            // 포스트 ID 추출
            let postId = '';
            const href = $el.find('a').attr('href') || '';
            const logNoMatch = href.match(/logNo=(\d+)/) || href.match(/(\d{10,})$/);

            if (logNoMatch && logNoMatch[1]) {
              postId = logNoMatch[1];
            } else {
              postId = `mobile-post-${Date.now()}-${i}`;
            }

            // 제목 추출
            let title = '';
            const mobileTitleSelectors = [
              '.se_title', '.tit_feed', '._itemTitleContainer',
              '._feedTitle', '.se-title-text', '.title_link',
              '.title', '.link_title', '.ell'
            ];

            for (const selector of mobileTitleSelectors) {
              const titleEl = $el.find(selector);
              if (titleEl.length > 0) {
                title = titleEl.first().text().trim();
                if (title) break;
              }
            }

            if (!title) return; // 제목이 없으면 건너뜀

            // 제목 정리: 첫 번째 줄이나 첫 번째 문장만 사용
            if (title.includes('\n')) {
              title = title.split('\n')[0].trim();
            } else if (title.includes('..')) {
              // 점 두 개 이상을 기준으로 분리하기
              title = title.split('..')[0].trim();
            }

            // 제목이 너무 길면 적절한 길이로 자르기 (약 50자)
            if (title.length > 50) {
              title = title.substring(0, 50) + '...';
            }

            // 링크 생성
            const link = `https://blog.naver.com/${blogId}/${postId}`;

            // 썸네일 추출
            let thumbnail = '';
            const mobileImgSelectors = [
              '._thumbnail img', '.img_thumb img', '.img img',
              '.multi_img', '.se-thumbnail-image', '.img_area img'
            ];

            for (const selector of mobileImgSelectors) {
              const imgEl = $el.find(selector);
              if (imgEl.length > 0) {
                thumbnail = imgEl.first().attr('src') || imgEl.first().attr('data-src') || '';
                if (thumbnail) break;
              }
            }

            if (!thumbnail) {
              thumbnail = 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
            }

            // 발행일 추출
            let publishedAt = '';
            const mobileDateSelectors = [
              '.date_post', '.date_time', '.info_post time',
              '.date', '.date_info', '.pub_time'
            ];

            for (const selector of mobileDateSelectors) {
              const dateEl = $el.find(selector);
              if (dateEl.length > 0) {
                publishedAt = dateEl.first().text().trim();
                if (publishedAt) break;
              }
            }

            // 날짜 포맷 표준화
            if (!publishedAt) {
              const today = new Date();
              publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
            } else {
              // 날짜 표준화 (YYYY.MM.DD 형식으로)
              publishedAt = publishedAt.replace(/(\d{4})[년\-\/](\d{1,2})[월\-\/](\d{1,2})[일]?/g, '$1.$2.$3');

              // 만약 날짜가 형식에 맞지 않으면, 현재 날짜로 대체
              if (!/^\d{4}\.\d{1,2}\.\d{1,2}/.test(publishedAt)) {
                const today = new Date();
                publishedAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
              }
            }

            // 요약 추출
            let summary = '';
            const mobileSummarySelectors = [
              '.se_textarea', '.text_passage', '.post_text',
              '.se-text-paragraph', '.text', '.post_ct'
            ];

            for (const selector of mobileSummarySelectors) {
              const summaryEl = $el.find(selector);
              if (summaryEl.length > 0) {
                summary = summaryEl.first().text().trim();
                if (summary) {
                  summary = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
                  break;
                }
              }
            }

            posts.push({
              id: postId,
              title,
              link,
              thumbnail,
              publishedAt,
              category: CATEGORY_NAMES[categoryNo] || `카테고리 ${categoryNo}`,
              summary
            });
          } catch (err) {
            console.error(`모바일 포스트 파싱 오류 (인덱스 ${i}):`, err);
          }
        });
      } catch (err) {
        console.error('모바일 버전 요청 오류:', err);
      }
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
  // 여러 카테고리를 지정하여 더 많은 포스트를 가져오도록 함:
  // - 0: 모든 글 (하위 카테고리 포함)
  // - 11: 블로그 최신글 (하위 카테고리 포함)
  // - 21: 일상다반사
  // - 36: 세상이야기
  categoryNos: string[] = ['0', '35', '36', '37'],
  limit: number = 5 // 각 카테고리별 포스트 제한 수
): Promise<BlogPost[]> {
  try {
    // 각 카테고리별로 병렬 요청
    const postsPromises = categoryNos.map(categoryNo =>
      fetchBlogPostsByCategory(blogId, categoryNo, limit)
    );

    const postsArrays = await Promise.all(postsPromises);

    // 모든 포스트를 하나의 배열로 합치기
    const allPosts = postsArrays.flat();

    // 더미 데이터 필터링 및 중복 제거
    const uniquePostIds = new Set<string>();
    const filteredPosts = allPosts.filter(post => {
      // 필터링 조건 - 더미 데이터 제거
      const isValid = post.title !== "아직 작성된 글이 없습니다." &&
        !post.id.startsWith("post-") &&
        post.title.trim() !== "";

      // 중복 제거
      if (isValid) {
        if (uniquePostIds.has(post.id)) {
          return false; // 이미 있는 ID는 제외
        }
        uniquePostIds.add(post.id);
        return true;
      }
      return false;
    });

    // 날짜 기준으로 최신순 정렬 (날짜 포맷이 YYYY.MM.DD 형식인 경우)
    filteredPosts.sort((a, b) => {
      // 날짜 문자열을 비교하여 정렬 (내림차순)
      return b.publishedAt.localeCompare(a.publishedAt);
    });

    // 실제 데이터 추출에 실패한 경우, 대표적인 테스트 데이터를 제공
    if (filteredPosts.length === 0) {
      console.log('블로그 데이터 추출 실패, 테스트 데이터 사용');

      // 테스트 데이터 (개발용)
      return [
        {
          id: "223869409800",
          title: "내가 이제 ai에 입문을 한것인가?",
          link: "https://blog.naver.com/9551304/223869409800",
          thumbnail: "https://blogthumb.pstatic.net/MjAyNTA1MThfMjA4/MDAxNzQ3NTM5MjIwOTkx.lt3Zk9kp5c-9NjDHAkg6fRixgyAn3PXizR1B9E9PbbAg.bRkW0jYC2bSuLuF5hYWBat0dId9T90SJTTMkdUflQg4g.PNG/%3F%8A%A4%3F%81%AC%EB%A6%B0%EC%83%B7_2025-05-17_163709.png",
          publishedAt: "2025.05.19",
          category: "블로그 최신글",
          summary: "ai에 대한 나의 생각과 경험"
        },
        {
          id: "223809018523",
          title: "조심 또 조심",
          link: "https://blog.naver.com/9551304/223809018523",
          thumbnail: "https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png",
          publishedAt: "2025.05.19",
          category: "세상이야기",
          summary: "일상에서의 안전과 주의사항"
        },
        {
          id: "222502515110",
          title: "볼음도리 개발용 낮은임야 18500평",
          link: "https://blog.naver.com/9551304/222502515110",
          thumbnail: "https://blogthumb.pstatic.net/MjAyMTA5MTFfMjk3/MDAxNjMxMzQ2MjIxNjcy.P0bbr5dpaMbgjTxhAhcf69a983bg0oAffyx5Ly6ODzcg.FkEWdogH6Hz8zavcOQmyo-bYVXbQVBzSL9ANkMQ8JdUg.JPEG.9551304/Untitled-1.jpg",
          publishedAt: "2021.09.11",
          category: "일상다반사",
          summary: "강화도 부동산 매물 소개"
        }
      ];
    }

    return filteredPosts.slice(0, limit);
  } catch (error) {
    console.error('블로그 포스트 가져오기 오류:', error);
    return [];
  }
}

/**
 * 포스트의 대표 이미지 URL을 여러 방법으로 추출합니다.
 * 1. 직접 포스트 페이지 액세스 (모바일 및 PC 버전)
 * 2. 포스트 모바일 버전 iframe 내용 분석
 * 3. OpenGraph 태그 활용
 * 
 * @param blogId 네이버 블로그 ID
 * @param postId 포스트 ID
 * @returns 이미지 URL 문자열
 */
async function extractPostImage(blogId: string, postId: string): Promise<string> {
  try {
    // 모바일 버전 시도 (일반적으로 더 빠름)
    const mobileUrl = `https://m.blog.naver.com/${blogId}/${postId}`;
    console.log(`포스트 이미지 추출 시도 (모바일): ${mobileUrl}`);

    const mobileResponse = await fetch(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
      }
    });

    const mobileHtml = await mobileResponse.text();
    const $ = cheerio.load(mobileHtml);

    // 1. 모바일 버전 OpenGraph 이미지 찾기 (가장 신뢰할 수 있는 방법)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      console.log(`모바일 버전 OpenGraph 이미지 발견: ${ogImage}`);
      return ogImage;
    }

    // 2. 모바일 페이지에서 iframe URL 찾기 - 실제 콘텐츠는 iframe 내부에 있을 수 있음
    const iframeUrl = $('#mainFrame').attr('src');
    if (iframeUrl) {
      const iframeImage = await extractImageFromIframe(iframeUrl);
      if (iframeImage) {
        console.log(`iframe에서 이미지 발견: ${iframeImage}`);
        return iframeImage;
      }
    }

    // 3. 대표 이미지 요소 찾기
    const thumbSelectors = [
      '.se-thumbnail-image', '.se-image-resource', '.se_thumbnail', '.se_image',
      '.img_box img', '.post-thumbnail', '.post_image'
    ];

    for (const selector of thumbSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr('src') || imgEl.attr('data-src');
        if (src) {
          console.log(`모바일 버전 이미지 요소 발견: ${src}`);
          return src;
        }
      }
    }

    console.log('모바일 버전에서 이미지를 찾지 못함, PC 버전 시도');

    // PC 버전 시도
    return await extractPostImageFromFullUrl(`https://blog.naver.com/${blogId}/${postId}`);
  } catch (error) {
    console.error(`포스트 이미지 추출 오류 (${blogId}/${postId}):`, error);
    return 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
  }
}

/**
 * iframe에서 이미지 URL을 추출합니다.
 * @param iframeSrc iframe 소스 URL
 * @returns 이미지 URL 또는 빈 문자열
 */
async function extractImageFromIframe(iframeSrc: string): Promise<string> {
  try {
    // iframe URL이 상대 경로면 전체 URL로 변환
    const fullIframeUrl = iframeSrc.startsWith('http')
      ? iframeSrc
      : `https://blog.naver.com${iframeSrc}`;

    const response = await fetch(fullIframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // iframe 내부에서 이미지 찾기
    const imgSelectors = [
      '.se-thumbnail-image', '.se-image-resource', '.se_thumbnail', '.se_image',
      '.img_box img', '.post-thumbnail', '.post_image', '.se-main-container img'
    ];

    for (const selector of imgSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr('src') || imgEl.attr('data-src');
        if (src) return src;
      }
    }

    return '';
  } catch (error) {
    console.error('iframe 이미지 추출 오류:', error);
    return '';
  }
}

/**
 * 전체 URL에서 포스트 이미지를 추출하는 백업 함수
 * @param fullUrl 블로그 전체 URL
 * @returns 이미지 URL 문자열
 */
async function extractPostImageFromFullUrl(fullUrl: string): Promise<string> {
  try {
    console.log(`전체 URL로 이미지 추출 시도: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // OpenGraph 이미지 찾기
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      console.log(`PC 버전 OpenGraph 이미지 발견: ${ogImage}`);
      return ogImage;
    }

    // 대표 이미지 요소 찾기
    const imgSelectors = [
      '.se-thumbnail-image', '.se-image-resource', '.se_thumbnail', '.se_image',
      '.img_box img', '.post-thumbnail', '.post_image', '.se-main-container img',
      '.thumb img', '.representative-thumbnail img'
    ];

    for (const selector of imgSelectors) {
      const imgEl = $(selector);
      if (imgEl.length > 0) {
        const src = imgEl.attr('src') || imgEl.attr('data-src');
        if (src) {
          console.log(`PC 버전 이미지 요소 발견: ${src}`);
          return src;
        }
      }
    }

    console.log('이미지를 찾지 못했습니다. 기본 이미지 반환');
    return 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
  } catch (error) {
    console.error('PC 버전 이미지 추출 오류:', error);
    return 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
  }
}

/**
 * 카테고리에 따라 대체 이미지를 반환합니다.
 */
function getFallbackImageByCategory(category: string): string {
  // 카테고리별 기본 이미지 매핑
  const categoryImages: Record<string, string> = {
    '일상다반사': 'https://postfiles.pstatic.net/MjAyNTA1MTVfMjE4/MDAxNzQ3Mjc1ODY1MTQy.ycdYfrR63FHN9GS7EzNgMu2Kiy_CldX6Zk5szOrYuVUg.yx_nZEPj7PKpEVhwuW8UuTHKQw9d8Xou7rIu0zOVEeAg.PNG/daily-life.png?type=w580',
    '세상이야기': 'https://postfiles.pstatic.net/MjAyNTA1MTVfNTYg/MDAxNzQ3Mjc1ODY1MTQz.1lTZM1oxLQlxw3nNcyeHvV3CpxrVwZQMg_cN2GlWBJMg.-Bi6JK8-rEdQYK07Y9aE5Y9Zrjra9ZDu8KlUbTsAWJEg.PNG/world-stories.png?type=w580',
    '블로그 최신글': 'https://postfiles.pstatic.net/MjAyNTA1MTVfNDUg/MDAxNzQ3Mjc1ODY1MTQ0.UeOGoBn6MVN_OMFGlUCqbqI6Hkbli5oeNv5Kza2Fmrcg.3uFFdpI2JVQGBVnYNjGvcFGc1TmOqTtlHqGC5h54O7gg.PNG/latest-posts.png?type=w580',
    '모든 글': 'https://postfiles.pstatic.net/MjAyNTA1MTVfMTAz/MDAxNzQ3Mjc1ODY1MTQ1._yBnSpkXK6yEVDkgOhJxdrvfL_tqlOjCCDYxUiJVGrAg.DmWJzgF54RkjPkfuS1QsELMdLQwT9gAZ_aMX6fU-HCMg.PNG/all-posts.png?type=w580'
  };

  // 매핑된 카테고리 이미지가 있으면 반환, 없으면 기본 이미지 반환
  console.log(`카테고리 기반 대체 이미지 사용: ${category} -> ${categoryImages[category] || 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png'}`);
  return categoryImages[category] || 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
}

/**
 * 모든 포스트에 대해 상세 이미지를 가져옵니다.
 * @param posts 블로그 포스트 배열
 * @returns 이미지가 업데이트된 포스트 배열
 */
async function enrichPostsWithImages(posts: BlogPost[]): Promise<BlogPost[]> {
  const enrichedPosts = [...posts];

  for (let i = 0; i < enrichedPosts.length; i++) {
    const post = enrichedPosts[i];

    // 썸네일이 기본 이미지거나 없으면 상세 이미지 추출
    if (!post.thumbnail ||
      post.thumbnail === 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png' ||
      post.thumbnail.includes('blog_profile_thumbnail')) {

      try {
        // URL에서 블로그 ID와 포스트 ID 추출
        const urlParts = post.link.split('/');
        const blogId = urlParts[urlParts.length - 2];
        const postId = urlParts[urlParts.length - 1];

        // 이미지 추출 시도
        const extractedImage = await extractPostImage(blogId, postId);

        if (extractedImage && extractedImage !== 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png') {
          enrichedPosts[i].thumbnail = extractedImage;
        } else {
          // 이미지 추출 실패 시 카테고리별 기본 이미지 사용
          enrichedPosts[i].thumbnail = getFallbackImageByCategory(post.category);
        }
      } catch (error) {
        console.error(`포스트 이미지 강화 실패 (${post.id}):`, error);
        // 오류 발생 시 카테고리별 기본 이미지 사용
        enrichedPosts[i].thumbnail = getFallbackImageByCategory(post.category);
      }
    }
  }

  return enrichedPosts;
}

// 블로그 포스트 캐시
export let blogCache: {
  [key: string]: {
    posts: BlogPost[];
    expires: number;
  }
} = {};

// 캐시 유효 시간 (1분으로 단축하여 즉시성 강화)
const CACHE_TTL = 1 * 60 * 1000;

/**
 * 캐싱을 활용하여 네이버 블로그 포스트 목록 가져오기
 * 각 카테고리 조합별로 별도 캐싱 적용
 */
export async function getLatestBlogPosts(
  blogId: string = '9551304',
  categoryNos: string[] = ['35', '36', '37'],
  limit: number = 3
): Promise<BlogPost[]> {
  // 캐시키 생성 (블로그ID, 카테고리, 제한 수 기준)
  const cacheKey = `${blogId}_${categoryNos.sort().join('_')}_${limit}`;
  const now = Date.now();

  // 캐시가 유효한지 확인
  if (blogCache[cacheKey] && blogCache[cacheKey].expires > now) {
    console.log(`캐시된 블로그 포스트 정보 반환 (키: ${cacheKey})`);
    return blogCache[cacheKey].posts;
  }

  console.log(`블로그 데이터 새로 요청 (키: ${cacheKey})`);

  // 모든 카테고리에서 포스트 수집
  const allPosts: BlogPost[] = [];

  // 각 카테고리별로 포스트 가져오기 (요청한 카테고리만 처리)
  for (const categoryNo of categoryNos) {
    try {
      // 각 카테고리에서 충분한 수의 포스트를 가져옴 (카테고리별 제한 없음)
      const categoryPosts = await fetchBlogPostsByCategory(blogId, categoryNo, limit * 5);
      if (categoryPosts && categoryPosts.length > 0) {
        console.log(`카테고리 ${categoryNo}에서 ${categoryPosts.length}개 포스트 가져옴`);
        allPosts.push(...categoryPosts);
      }
    } catch (e) {
      console.error(`카테고리 ${categoryNo} 포스트 가져오기 실패:`, e);
    }
  }

  console.log(`총 ${allPosts.length}개 포스트 수집됨 (중복/필터링 전)`);

  // 유효한 포스트만 필터링
  const validPosts = allPosts.filter(post =>
    post && post.title && post.title.trim() !== '' &&
    post.title !== '아직 작성된 글이 없습니다.' &&
    !post.id.startsWith('post-')
  );

  // 각 포스트의 날짜 정보를 JavaScript Date 객체로 변환
  // publishedAt은 'YYYY.MM.DD' 형식
  const postsWithDates = validPosts.map(post => {
    let date: Date;

    // 날짜 파싱 시도
    try {
      // 날짜 파싱 (YYYY.MM.DD 형식)
      const [year, month, day] = post.publishedAt.split('.');
      if (year && month && day) {
        // 숫자로 변환하여 유효성 검사
        const y = parseInt(year, 10);
        const m = parseInt(month, 10) - 1; // JavaScript의 월은 0부터 시작
        const d = parseInt(day, 10);

        if (!isNaN(y) && !isNaN(m) && !isNaN(d) &&
          y >= 2000 && y <= 2025 && // 현실적인 연도 범위 체크
          m >= 0 && m < 12 &&
          d >= 1 && d <= 31) {
          date = new Date(y, m, d);
        } else {
          // 날짜가 범위를 벗어나면 현재 날짜 사용
          date = new Date();
          console.log(`날짜 범위 오류: ${post.publishedAt}, ID: ${post.id}`);
        }
      } else {
        // 형식이 맞지 않으면 현재 날짜 사용
        date = new Date();
        console.log(`날짜 형식 오류: ${post.publishedAt}, ID: ${post.id}`);
      }
    } catch (e) {
      // 파싱 실패 시 현재 날짜 사용
      date = new Date();
      console.log(`날짜 파싱 실패: ${post.publishedAt}, ID: ${post.id}`);
    }

    // 일부 오래된 포스트는 ID를 기준으로 날짜 추정 (네이버 블로그 ID는 대략 시간순)
    // 작은 ID (2억 미만)는 2021년 이전의 게시물로 추정
    const postIdNum = parseInt(post.id, 10);
    if (!isNaN(postIdNum) && postIdNum < 200000000) {
      // 2021년 이전 게시물로 표시하여 최신 정렬에서 제외
      date = new Date(2020, 0, 1);
      console.log(`오래된 포스트 감지: ID ${post.id}는 2021년 이전 게시물로 추정`);
    }

    return {
      ...post,
      parsedDate: date
    };
  });

  // ID 기준 중복 제거
  const uniqueIdMap = new Map<string, typeof postsWithDates[0]>();
  for (const post of postsWithDates) {
    // 이미 있는 ID라면 더 최신 날짜를 가진 포스트를 선택
    if (uniqueIdMap.has(post.id)) {
      const existing = uniqueIdMap.get(post.id)!;
      if (post.parsedDate > existing.parsedDate) {
        uniqueIdMap.set(post.id, post);
      }
    } else {
      uniqueIdMap.set(post.id, post);
    }
  }

  // 최근 날짜순으로 정렬 (parsedDate 기준 내림차순)
  let sortedPosts = Array.from(uniqueIdMap.values())
    .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  console.log(`중복 제거 후 ${sortedPosts.length}개의 유효한 포스트 찾음`);

  // 개수 제한
  sortedPosts = sortedPosts.slice(0, limit);

  // 로그에 최종 반환될 글 목록 출력
  sortedPosts.forEach((post, index) => {
    const dateStr = post.parsedDate.toISOString().split('T')[0];
    console.log(`[${index + 1}] 날짜: ${dateStr}, ID: ${post.id}, 제목: ${post.title.substring(0, 30)}${post.title.length > 30 ? '...' : ''}`);
  });

  // 이미지 정보 강화
  console.log(`블로그 포스트 이미지 정보 강화 중... (${sortedPosts.length}개)`);

  // parsedDate 필드 제거 후 반환
  const finalPosts = sortedPosts.map(({ parsedDate, ...post }) => post);
  const enrichedPosts = await enrichPostsWithImages(finalPosts);

  // 캐시 업데이트
  if (enrichedPosts.length > 0) {
    blogCache[cacheKey] = {
      posts: enrichedPosts,
      expires: now + CACHE_TTL
    };

    console.log(`${enrichedPosts.length}개의 블로그 포스트를 캐시에 저장 (${CACHE_TTL / (60 * 1000)}분)`);
  }

  return enrichedPosts;
}
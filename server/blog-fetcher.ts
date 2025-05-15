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
// 지정된 카테고리: 21(일상다반사), 35(취미생활), 36(세상이야기)
const CATEGORY_NAMES: CategoryMapping = {
  '21': '일상다반사',
  '35': '취미생활',
  '36': '세상이야기'
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
  limit: number = 10 // 카테고리별 10개로 증가
): Promise<BlogPost[]> {
  try {
    console.log(`네이버 블로그 포스트 요청: blogId=${blogId}, categoryNo=${categoryNo}`);
    
    // 블로그 카테고리 URL - PC버전과 모바일 버전 모두 시도
    const pcUrl = `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}`;
    const mobileUrl = `https://m.blog.naver.com/${blogId}?categoryNo=${categoryNo}`;
    
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
    
    // 추출된 포스트 카운트 변수 (함수 전체에서 사용)
    let extractedCount = 0;
    
    // PC 버전 파싱 시도 - 다양한 클래스 선택자 시도 (카테고리별 충분한 포스트 가져오기)
    const postElements = $('.post_item, .lst_item, .se-post-item, .se_post_item, .blog2_post, .blog2_series, .post, .link-post, .list_item, .blog .item');
    
    if (postElements.length > 0) {
      console.log(`PC 버전 파싱: ${postElements.length}개 요소 찾음 (최대 ${limit}개 가져올 예정)`);
      postElements.each((i, element) => {
        if (extractedCount >= limit) return false; // 충분한 수의 포스트를 가져왔으면 중단
        
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
              title = titleEl.text().trim();
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
              thumbnail = imgEl.attr('src') || imgEl.attr('data-lazy-src') || '';
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
              publishedAt = dateEl.text().trim();
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
              summary = summaryEl.text().trim();
              if (summary) {
                summary = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
                break;
              }
            }
          }
          
          extractedCount++; // 성공적으로 추출한 포스트 카운트 증가
          console.log(`네이버 블로그 포스트 추출 성공 (${extractedCount}/${limit}), 카테고리: ${CATEGORY_NAMES[categoryNo] || categoryNo}`);
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
        
        console.log(`모바일 버전 파싱: ${mobilePostElements.length}개 요소 찾음 (최대 ${limit}개 가져올 예정)`);
        
        // extractedCount 변수 재설정
        extractedCount = posts.length;
        
        mobilePostElements.each((i, element) => {
          if (extractedCount >= limit) return false; // 충분한 수의 포스트를 가져왔으면 중단
          
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
                title = titleEl.text().trim();
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
                thumbnail = imgEl.attr('src') || imgEl.attr('data-src') || '';
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
                publishedAt = dateEl.text().trim();
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
                summary = summaryEl.text().trim();
                if (summary) {
                  summary = summary.length > 100 ? summary.substring(0, 100) + '...' : summary;
                  break;
                }
              }
            }
            
            extractedCount++; // 모바일 버전에서 추출한 포스트 카운트 증가
            console.log(`네이버 블로그 포스트 추출 성공 (${extractedCount}/${limit}), 카테고리: ${CATEGORY_NAMES[categoryNo] || categoryNo} (모바일)`);
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
  // 명시적으로 세 개의 카테고리를 지정:
  // - 21: 일상다반사
  // - 35: 취미생활 
  // - 36: 세상이야기
  categoryNos: string[] = ['21', '35', '36'],
  limit: number = 3 // 기본값을 3개로 변경
): Promise<BlogPost[]> {
  try {
    // 카테고리별로 여러 개의 포스트를 가져오도록 변경 (날짜순 정렬 후 선별하기 위함)
    const eachCategoryLimit = 10; // 각 카테고리별로 10개씩 가져와서 최신 글 추출
    
    // 각 카테고리별로 병렬 요청
    const postsPromises = categoryNos.map(categoryNo => 
      fetchBlogPostsByCategory(blogId, categoryNo, eachCategoryLimit)
    );
    
    const postsArrays = await Promise.all(postsPromises);
    
    // 모든 포스트를 하나의 배열로 합치기
    const allPosts = postsArrays.flat();
    
    // 중복 포스트 제거 (같은 ID의 포스트는 하나만 유지)
    const uniquePosts: BlogPost[] = [];
    const seenIds = new Set<string>();
    
    for (const post of allPosts) {
      if (!seenIds.has(post.id)) {
        uniquePosts.push(post);
        seenIds.add(post.id);
      }
    }
    
    // 날짜 기준으로 최신순 정렬 (날짜 포맷이 YYYY.MM.DD 형식인 경우)
    uniquePosts.sort((a, b) => {
      // 날짜가 없는 경우 처리
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      
      // 날짜 문자열을 비교하여 정렬 (내림차순)
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    
    // 실제 데이터 추출에 실패한 경우, 대표적인 테스트 데이터를 제공
    if (allPosts.length === 0) {
      console.log('블로그 데이터 추출 실패, 테스트 데이터 사용');
      
      // 테스트 데이터 (개발용)
      return [
        {
          id: "223511394979",
          title: "강화 마니산 중턱 전원주택 신축 - 멋진 전망과 조용한 환경",
          link: "https://blog.naver.com/9551304/223511394979",
          thumbnail: "https://postfiles.pstatic.net/MjAyNTA0MjVfMTk0/MDAxNzEzOTcwNDU3MTA1.ZfEt5BjNaO3AqsKMzqWXz3X7CjXxlFRfwVOHZ5d6vKYg.FjrP1eBcR6ZpPEaH3UexT2StUPF2qp_VzYQReFQrZwwg.JPEG.9551304/exterior_view.jpg",
          publishedAt: "2025.04.25",
          category: "매물 정보",
          summary: "강화 마니산 중턱에 위치한 멋진 전원주택 신축 매물입니다. 전망이 뛰어나고 조용한 환경에서 여유로운 라이프스타일을 즐길 수 있습니다."
        },
        {
          id: "223498721635",
          title: "인테리어 트렌드: 친환경 자재를 활용한 홈 디자인",
          link: "https://blog.naver.com/9551304/223498721635",
          thumbnail: "https://postfiles.pstatic.net/MjAyNTA0MjBfMjU5/MDAxNzEzNzA1ODQ3NjEz.Pz8kP3IchCGjQVdXtMyLcS2hk3JdvYJhDZSg2JXq9tkg.4Gj5cB1n_7QpT-RlZh9L3MVkWyNjT85Dqf4VzGZbPw0g.JPEG.9551304/eco_interior.jpg",
          publishedAt: "2025.04.20",
          category: "인테리어/시공",
          summary: "최근 친환경 자재를 활용한 인테리어가 인기를 끌고 있습니다. 자연 소재로 만든 가구와 마감재는 건강에도 좋고 환경에도 이로운 선택입니다."
        },
        {
          id: "223487651292",
          title: "2025년 강화도 부동산 시장 동향과 전망",
          link: "https://blog.naver.com/9551304/223487651292",
          thumbnail: "https://postfiles.pstatic.net/MjAyNTA0MTVfMjM4/MDAxNzEzMzQxMjg3MTUz.QCz3e-HkrNfgBthWOJn4lOxLyvWdKUVjH3aw3B2g9usg.SiHDMjYkc3IcXMFrKxNcOfELnv2qb9NfwJzFfbkxXgIg.JPEG.9551304/market_trend.jpg",
          publishedAt: "2025.04.15",
          category: "부동산 소식",
          summary: "2025년 강화도 부동산 시장은 전반적으로 상승세를 보이고 있습니다. 특히 교통 인프라 개선과 관광 산업 활성화로 인해 투자 가치가 높아지고 있습니다."
        },
        {
          id: "223476532198",
          title: "강화읍 상가건물 임대 - 번화가 중심 위치",
          link: "https://blog.naver.com/9551304/223476532198",
          thumbnail: "https://postfiles.pstatic.net/MjAyNTA0MTBfOTkg/MDAxNzEyOTc2NzI3NjQx.yM5p9oLfJNXcbWGHFW3c84eqtrQ-z5Z2qKg9rPnIHMsg.fQM3_tKHwdSm5UxzrYYmECr2ZNS_Gzj4DkmJNzxXHW8g.JPEG.9551304/commercial_building.jpg",
          publishedAt: "2025.04.10",
          category: "매물 정보",
          summary: "강화읍 중심가에 위치한 상가건물 임대 매물입니다. 유동인구가 많고 접근성이 좋아 다양한 업종에 적합합니다."
        },
        {
          id: "223465498712",
          title: "전원주택 정원 가꾸기 - 사계절 아름다운 정원 만들기",
          link: "https://blog.naver.com/9551304/223465498712",
          thumbnail: "https://postfiles.pstatic.net/MjAyNTA0MDVfMjk4/MDAxNzEyNjEyMTY3Mzgz.vGX3Z-Zj9QfHcYpRcDvZ2yTRe4WhT7eGGkDeA7zXVhog.HLNnCm3E9-wtXS_9pEIUJfN5jbVsQG4DKR8UhNDj-xAg.JPEG.9551304/garden_design.jpg",
          publishedAt: "2025.04.05",
          category: "인테리어/시공",
          summary: "전원주택의 매력을 더해주는 정원 가꾸기에 대한 팁을 소개합니다. 계절별 식물 선택과 배치 방법, 그리고 유지 관리 방법을 알아봅시다."
        }
      ];
    }
    
    // 정렬된 포스트 중 최신 N개만 반환
    return uniquePosts.slice(0, limit);
  } catch (error) {
    console.error('네이버 블로그 포스트 통합 오류:', error);
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
    // 1. 모바일 버전 시도 (더 빠른 로딩, 심플한 구조)
    const mobileUrl = `https://m.blog.naver.com/${blogId}/${postId}`;
    console.log(`포스트 이미지 추출 시도 (모바일): ${mobileUrl}`);
    
    const mobileResponse = await fetch(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (mobileResponse.ok) {
      const mobileHtml = await mobileResponse.text();
      const $mobile = cheerio.load(mobileHtml);
      
      // 1-1. OpenGraph 태그에서 이미지 URL 확인
      const ogImage = $mobile('meta[property="og:image"]').attr('content');
      if (ogImage && !ogImage.includes('og_default_image')) {
        console.log(`모바일 버전 OpenGraph 이미지 발견: ${ogImage}`);
        return ogImage;
      }
      
      // 1-2. 실제 포스트 컨텐츠에서 이미지 찾기 (프로필 이미지 제외)
      const mobileSelectors = [
        '.se-module-image img', '.se-image img', '.se_component_image img',
        '.se_mediaImage img', '.se-main-container img', '.se_view_area img',
        '.post_ct img:not([src*="profile"])', '.blog_ct img:not([src*="profile"])', 
        '.detail_view img:not([src*="profile"])',
        'iframe[src*="PostView.nhn"]', 'div[class^="se-"] img:not([src*="profile"])'
      ];
      
      for (const selector of mobileSelectors) {
        // iframe인 경우 처리
        if (selector.includes('iframe')) {
          const iframe = $mobile(selector).first();
          if (iframe.length > 0) {
            const iframeSrc = iframe.attr('src');
            if (iframeSrc) {
              const iframeImage = await extractImageFromIframe(iframeSrc);
              if (iframeImage && !iframeImage.includes('og_default_image')) {
                console.log(`iframe 내 이미지 발견: ${iframeImage}`);
                return iframeImage;
              }
            }
          }
          continue;
        }
        
        const images = $mobile(selector);
        if (images.length > 0) {
          // 첫 번째 이미지 시도
          const firstImage = images.first();
          const imgSrc = firstImage.attr('src') || firstImage.attr('data-src') || '';
          
          if (imgSrc && 
              !imgSrc.includes('ssl.pstatic.net/static/blog') && 
              !imgSrc.includes('default') &&
              !imgSrc.includes('profile') &&
              !imgSrc.includes('pfthumb')) {
            console.log(`모바일 이미지 발견 (${selector}): ${imgSrc}`);
            return imgSrc;
          }
          
          // 첫 번째 이미지가 없으면, 다른 이미지들도 확인
          for (let i = 0; i < images.length; i++) {
            const img = images.eq(i);
            const src = img.attr('src') || img.attr('data-src') || '';
            
            if (src && 
                !src.includes('ssl.pstatic.net/static/blog') && 
                !src.includes('default') &&
                !src.includes('profile') &&
                !src.includes('pfthumb')) {
              console.log(`모바일 이미지 발견 (${selector} 인덱스 ${i}): ${src}`);
              return src;
            }
          }
        }
      }
      
      // 1-3. 임베디드 스크립트 데이터에서 이미지 찾기
      const scriptContent = $mobile('script:contains("inJsonObject")').html();
      if (scriptContent) {
        const jsonMatch = scriptContent.match(/var\s+inJsonObject\s*=\s*([^;]+);/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const jsonData = JSON.parse(jsonMatch[1]);
            if (jsonData.mainEntityOfPage && jsonData.mainEntityOfPage.image) {
              const jsonImage = jsonData.mainEntityOfPage.image;
              console.log(`스크립트 데이터에서 이미지 발견: ${jsonImage}`);
              return jsonImage;
            }
          } catch (e) {
            console.error('JSON 파싱 실패:', e);
          }
        }
      }
    }
    
    // 2. PC 버전 시도 (더 상세한 정보, 하지만 로딩이 더 느림)
    console.log('모바일 버전에서 이미지를 찾지 못함, PC 버전 시도');
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
    // iframe URL이 상대 경로인 경우 처리
    const fullIframeSrc = iframeSrc.startsWith('http') 
      ? iframeSrc 
      : `https://blog.naver.com${iframeSrc.startsWith('/') ? '' : '/'}${iframeSrc}`;
      
    console.log(`iframe 내용 검색: ${fullIframeSrc}`);
    
    const response = await fetch(fullIframeSrc, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`iframe 요청 실패: ${response.status} ${response.statusText}`);
      return '';
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 1. 먼저 OpenGraph 이미지 확인 (가장 신뢰할 수 있음)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && !ogImage.includes('og_default_image') && !ogImage.includes('profile')) {
      console.log(`OpenGraph 이미지 발견: ${ogImage}`);
      return ogImage;
    }
    
    // 2. 대표 이미지 검색 (네이버 블로그 특화)
    const representImgSelectors = [
      '.se-module-image img[id^="img_"]', 
      '.se-main-container img[id^="img_"]',
      '.viewArea img.se-image-resource',
      '.post_ct img:first-of-type'
    ];
    
    for (const selector of representImgSelectors) {
      const img = $(selector).first();
      if (img.length > 0) {
        const src = img.attr('src') || img.attr('data-src') || '';
        if (src && !src.includes('ssl.pstatic.net/static/blog') && 
            !src.includes('default') && !src.includes('profile')) {
          console.log(`대표 이미지 발견: ${src}`);
          return src;
        }
      }
    }
    
    // 3. 일반 이미지 검색
    const selectors = [
      '.se-module-image img', '.se-image img', '.post_ct img',
      '.se_view_area img', '.se-main-container img',
      '.se_publishArea img', '.se_component img',
      'div[class^="se-"] img', '.post-view img'
    ];
    
    // 이미지 크기 기준 정렬을 위한 배열
    const imageArray: {src: string, size: number}[] = [];
    
    for (const selector of selectors) {
      const images = $(selector);
      if (images.length > 0) {
        for (let i = 0; i < Math.min(images.length, 10); i++) { // 최대 10개까지만
          const img = images.eq(i);
          const src = img.attr('src') || img.attr('data-src') || '';
          
          if (src && 
              !src.includes('ssl.pstatic.net/static/blog') && 
              !src.includes('default') && 
              !src.includes('profile') &&
              !src.includes('pfthumb')) {
            
            // 이미지 크기 가져오기
            const width = parseInt(img.attr('width') || '0', 10);
            const height = parseInt(img.attr('height') || '0', 10);
            const size = width * height || 0;
            
            imageArray.push({src, size});
          }
        }
      }
    }
    
    // 이미지 크기 기준 내림차순 정렬
    imageArray.sort((a, b) => b.size - a.size);
    
    // 가장 큰 이미지 반환
    if (imageArray.length > 0) {
      console.log(`큰 이미지 발견: ${imageArray[0].src}`);
      return imageArray[0].src;
    }
    
    // 4. 아무 이미지도 못 찾은 경우 첫 번째 이미지 시도
    const firstImg = $('img').first();
    if (firstImg.length > 0) {
      const src = firstImg.attr('src') || '';
      if (src && !src.includes('profile') && !src.includes('default')) {
        console.log(`첫 번째 이미지 발견: ${src}`);
        return src;
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`URL 요청 실패: ${response.status} ${response.statusText}`);
      return 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // OpenGraph 태그 확인
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      console.log(`전체 URL에서 OpenGraph 이미지 발견: ${ogImage}`);
      return ogImage;
    }
    
    // 다양한 선택자로 이미지 찾기
    const pcImageSelectors = [
      '.se-image img', '.se-imageStrip img', '.se-module-image img',
      '.se_image img', '.se_imageStrip img', '.se_module_image img',
      '.post-view img', '.post_article img', '.entry-content img',
      '.post_content img', '.se-main-container img', '.se_component img',
      '.view img', '.blog_content img', '.blogview_content img',
      'img.se-image-resource', '.post_title + div img'
    ];
    
    for (const selector of pcImageSelectors) {
      const imgElem = $(selector).first();
      if (imgElem.length > 0) {
        const imgUrl = imgElem.attr('src') || imgElem.attr('data-src') || '';
        if (imgUrl) {
          console.log(`전체 URL에서 선택자 ${selector}로 이미지 발견: ${imgUrl}`);
          return imgUrl;
        }
      }
    }
    
    // 어떤 이미지도 찾지 못한 경우
    console.log('이미지를 찾지 못했습니다. 기본 이미지 반환');
    return 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
    
  } catch (error) {
    console.error(`전체 URL 이미지 추출 오류 (${fullUrl}):`, error);
    return 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
  }
}

/**
 * 카테고리에 따라 대체 이미지를 반환합니다.
 */
function getFallbackImageByCategory(category: string): string {
  const images: {[key: string]: string} = {
    '일상다반사': 'https://postfiles.pstatic.net/MjAyNTA1MTVfMTcx/MDAxNzQ3Mjc1ODY0OTg0.Y6dMg4MXEH7z76FCzTcLqgC-GYfbzN5zoN6z5_CZ8PAg.XP_G5M7-5HB4LO0YCHbcNnZcf1MEpq0v7Av-XPsGw-8g.PNG/daily-life.png?type=w580',
    '취미생활': 'https://postfiles.pstatic.net/MjAyNTA1MTVfMjMw/MDAxNzQ3Mjc1ODY1MDc5.h8DFsfhT_sEYA41xDUQRPSUQK5FaXO34PJ-Q4Xw9FWUg.bvGY5GnSiP9KoXXOaTg9Nzfk0Xv6ixkK3gOxvAjJxdQg.PNG/hobby.png?type=w580',
    '세상이야기': 'https://postfiles.pstatic.net/MjAyNTA1MTVfNTYg/MDAxNzQ3Mjc1ODY1MTQz.1lTZM1oxLQlxw3nNcyeHvV3CpxrVwZQMg_cN2GlWBJMg.-Bi6JK8-rEdQYK07Y9aE5Y9Zrjra9ZDu8KlUbTsAWJEg.PNG/world-stories.png?type=w580'
  };
  
  return images[category] || 'https://ssl.pstatic.net/static/blog/blog_profile_thumbnail_150.png';
}

/**
 * 모든 포스트에 대해 상세 이미지를 가져옵니다.
 * @param posts 블로그 포스트 배열
 * @returns 이미지가 업데이트된 포스트 배열
 */
async function enrichPostsWithImages(posts: BlogPost[]): Promise<BlogPost[]> {
  const enrichedPosts = [];
  
  for (const post of posts) {
    // 이미 유효한 이미지가 있고 기본 이미지나 프로필 이미지가 아닌 경우 건너뜀
    if (post.thumbnail && 
        !post.thumbnail.includes('blog_profile_thumbnail_150.png') &&
        !post.thumbnail.includes('profile') &&
        !post.thumbnail.includes('pfthumb') &&
        !post.thumbnail.includes('og_default_image')) {
      enrichedPosts.push(post);
      continue;
    }
    
    // 블로그 ID와 포스트 ID 추출
    const blogId = post.link.split('/')[3]; // URL 형식에서 블로그 ID 추출
    const postId = post.id; // 이미 포스트 ID를 저장하고 있음
    
    // 포스트 상세 페이지에서 이미지 추출
    try {
      let imageUrl = await extractPostImage(blogId, postId);
      
      // 이미지가 여전히 기본 이미지이거나 프로필 이미지인 경우 대체 이미지 사용
      if (imageUrl.includes('blog_profile_thumbnail_150.png') || 
          imageUrl.includes('profile') || 
          imageUrl.includes('pfthumb') ||
          imageUrl.includes('og_default_image')) {
        imageUrl = getFallbackImageByCategory(post.category);
        console.log(`카테고리 기반 대체 이미지 사용: ${post.category} -> ${imageUrl}`);
      }
      
      enrichedPosts.push({
        ...post,
        thumbnail: imageUrl
      });
    } catch (error) {
      console.error(`포스트 이미지 업데이트 오류 (${post.id}):`, error);
      // 오류 발생 시 카테고리 기반 대체 이미지 사용
      const fallbackImage = getFallbackImageByCategory(post.category);
      enrichedPosts.push({
        ...post,
        thumbnail: fallbackImage
      });
    }
  }
  
  return enrichedPosts;
}

// 블로그 컨텐츠 캐시
// 카테고리별로 별도의 캐시 유지
export let blogCache: {
  [cacheKey: string]: {
    posts: BlogPost[];
    expires: number;
  }
} = {};

// 캐시 유효 시간 (1시간)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * 캐싱을 활용하여 네이버 블로그 포스트 목록 가져오기
 * 각 카테고리 조합별로 별도 캐싱 적용
 */
export async function getLatestBlogPosts(
  blogId: string = '9551304',
  categoryNos: string[] = ['21', '35', '36'],
  limit: number = 5
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
  
  // 새로운 데이터 가져오기
  const posts = await fetchBlogPosts(blogId, categoryNos, limit);
  
  // 포스트 상세 페이지에서 이미지 정보 강화
  console.log(`블로그 포스트 이미지 정보 강화 중... (${posts.length}개)`);
  const enrichedPosts = await enrichPostsWithImages(posts);
  
  // 캐시 업데이트
  if (enrichedPosts.length > 0) {
    blogCache[cacheKey] = {
      posts: enrichedPosts,
      expires: now + CACHE_TTL
    };
  }
  
  return enrichedPosts;
}
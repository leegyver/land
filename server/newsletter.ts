import cron from 'node-cron';
import { storage } from './storage';
import { sendEmail } from './mailer';
import { log } from './vite';

const APP_URL = process.env.APP_URL || 'https://leegyver.com';

const formatKoreanPrice = (price: string | number | null | undefined): string => {
    if (price === null || price === undefined || price === '') return '';
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice === 0) return '';
    const billion = 100000000;
    const tenThousand = 10000;
    if (numPrice >= billion) {
        const uk = Math.floor(numPrice / billion);
        const rest = numPrice % billion;
        if (rest === 0) return `${uk}억원`;
        const man = Math.floor(rest / tenThousand);
        if (man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
        return `${uk}억원`;
    } else if (numPrice >= tenThousand) {
        const man = Math.floor(numPrice / tenThousand);
        return `${man.toLocaleString()}만원`;
    }
    return numPrice.toLocaleString() + '원';
};

function buildHtmlTemplate(title: string, properties: any[], posts: any[], news: any[]) {
  const propertyRows = properties.map(p => {
    const imgUrl = p.imageUrl?.startsWith('/') ? `${APP_URL}${p.imageUrl}` : p.imageUrl;
    return `
    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; gap: 15px; align-items: center;">
      ${imgUrl ? `<img src="${imgUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" alt="매물 이미지" />` : ''}
      <div>
        <h3 style="margin: 0; font-size: 16px; color: #3b82f6;">
          <a href="${APP_URL}/properties/${p.id}" style="text-decoration: none; color: #3b82f6;">${p.title}</a>
        </h3>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">가격: <strong style="color: #ef4444;">${formatKoreanPrice(p.price) || '상담'}</strong></p>
      </div>
    </div>
    `;
  }).join('');

  const postRows = posts.map(p => {
    const images = typeof p.imageUrls === 'string' ? JSON.parse(p.imageUrls) : p.imageUrls;
    let firstImage = images && images.length > 0 ? images[0] : null;
    if (firstImage && firstImage.startsWith('/')) firstImage = `${APP_URL}${firstImage}`;
    
    return `
    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; gap: 15px; align-items: center;">
      ${firstImage ? `<img src="${firstImage}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" alt="소식 이미지" />` : ''}
      <div>
        <h3 style="margin: 0; font-size: 16px; color: #10b981;">
          <a href="${APP_URL}/community/${p.id}" style="text-decoration: none; color: #10b981;">${p.title}</a>
        </h3>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">작성자: ${p.authorName}</p>
      </div>
    </div>
    `;
  }).join('');

  const newsRows = news.map(n => {
    const imgUrl = n.imageUrl?.startsWith('/') ? `${APP_URL}${n.imageUrl}` : n.imageUrl;
    return `
    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; gap: 15px; align-items: center;">
      ${imgUrl ? `<img src="${imgUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" alt="뉴스 이미지" />` : ''}
      <div>
        <h3 style="margin: 0; font-size: 16px; color: #ef4444;">
          <a href="${APP_URL}/news/${n.id}" style="text-decoration: none; color: #ef4444;">${n.title}</a>
        </h3>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">출처: ${n.source} | 조회수: ${n.viewCount}</p>
      </div>
    </div>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
      <h2 style="text-align: center; color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        ${title}
      </h2>
      
      <div style="margin-top: 20px;">
        <h3 style="background-color: #f3f4f6; padding: 10px; border-radius: 4px;">🏡 최신/인기 매물</h3>
        ${propertyRows || '<p>새로운 매물이 없습니다.</p>'}
      </div>

      <div style="margin-top: 20px;">
        <h3 style="background-color: #f3f4f6; padding: 10px; border-radius: 4px;">💬 커뮤니티 소식</h3>
        ${postRows || '<p>새로운 소식이 없습니다.</p>'}
      </div>

      <div style="margin-top: 20px;">
        <h3 style="background-color: #f3f4f6; padding: 10px; border-radius: 4px;">📰 강화도 부동산 주요 뉴스</h3>
        ${newsRows || '<p>새로운 뉴스가 없습니다.</p>'}
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #999;">
        <p>본 메일은 이가이버부동산 뉴스레터 구독자에게 발송되는 정기 메일입니다.</p>
        <p><a href="${APP_URL}">홈페이지 바로가기</a></p>
      </div>
    </div>
  `;
}

export async function sendWeeklyNewsletter(testEmail?: string) {
  log('[Newsletter] Starting weekly newsletter job...');
  try {
    let emails = testEmail;
    if (!emails) {
      const subs = await storage.getActiveNewsletterSubscribers();
      if (subs.length === 0) {
        log('[Newsletter] No active subscribers found.');
        return;
      }
      emails = subs.map(s => s.email).join(',');
    }

    const { properties, posts, news } = await storage.getWeeklyNewsletterData();
    const html = buildHtmlTemplate('이가이버부동산 주간 부동산 소식', properties, posts, news);
    
    await sendEmail(emails, '[이가이버부동산] 주간 부동산 매물 및 소식 안내', html);
    log(`[Newsletter] Weekly newsletter sent to ${emails.includes(',') ? 'subscribers' : emails}.`);
  } catch (error) {
    log(`[Newsletter Error] Weekly job failed: ${error}`);
  }
}

export async function sendMonthlyNewsletter(testEmail?: string) {
  log('[Newsletter] Starting monthly newsletter job...');
  try {
    let emails = testEmail;
    if (!emails) {
      const subs = await storage.getActiveNewsletterSubscribers();
      if (subs.length === 0) {
        log('[Newsletter] No active subscribers found.');
        return;
      }
      emails = subs.map(s => s.email).join(',');
    }

    const { properties, posts, news } = await storage.getMonthlyNewsletterData();
    const html = buildHtmlTemplate('이가이버부동산 월간 인기 부동산 리포트', properties, posts, news);
    
    await sendEmail(emails, '[이가이버부동산] 이번 달 가장 뜨거웠던 인기 매물 및 소식', html);
    log(`[Newsletter] Monthly newsletter sent to ${emails.includes(',') ? 'subscribers' : emails}.`);
  } catch (error) {
    log(`[Newsletter Error] Monthly job failed: ${error}`);
  }
}

export function setupNewsletterScheduler() {
  // Weekly on Friday at 08:00
  cron.schedule('0 8 * * 5', () => {
    sendWeeklyNewsletter();
  });

  // Monthly on the 1st at 08:00
  cron.schedule('0 8 1 * *', () => {
    sendMonthlyNewsletter();
  });

  log('[Newsletter] Scheduler initialized (Weekly: Fri 08:00, Monthly: 1st 08:00)');
}

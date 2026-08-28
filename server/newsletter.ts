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

function renderPropertyCards(properties: any[]) {
  if (!properties || properties.length === 0) {
    return '<p style="color: #888; font-size: 14px; margin: 10px 0;">해당 매물이 없습니다.</p>';
  }
  return properties.map(p => {
    const imgUrl = p.imageUrl?.startsWith('/') ? `${APP_URL}${p.imageUrl}` : p.imageUrl;
    const locationInfo = [p.district, p.type].filter(Boolean).join(' · ');
    return `
    <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: flex; gap: 14px; align-items: center;">
      ${imgUrl ? `<a href="${APP_URL}/properties/${p.id}"><img src="${imgUrl}" style="width: 84px; height: 84px; object-fit: cover; border-radius: 8px; border: 1px solid #eaeaea;" alt="매물 이미지" /></a>` : ''}
      <div style="flex: 1; min-width: 0;">
        ${locationInfo ? `<div style="font-size: 12px; color: #888; margin-bottom: 3px;">${locationInfo}</div>` : ''}
        <h4 style="margin: 0 0 5px 0; font-size: 15px; font-weight: 600; line-height: 1.4;">
          <a href="${APP_URL}/properties/${p.id}" style="text-decoration: none; color: #2563eb;">${p.title}</a>
        </h4>
        <div style="font-size: 14px; color: #333;">
          가격: <strong style="color: #ef4444; font-size: 15px;">${formatKoreanPrice(p.price) || '상담'}</strong>
        </div>
      </div>
    </div>
    `;
  }).join('');
}

function buildHtmlTemplate(
  title: string,
  data: { latestProperties: any[]; popularProperties: any[]; posts: any[]; news: any[] }
) {
  const { latestProperties, popularProperties, posts, news } = data;

  const latestPropertyRows = renderPropertyCards(latestProperties);
  const popularPropertyRows = renderPropertyCards(popularProperties);

  const postRows = posts.map(p => {
    const images = typeof p.imageUrls === 'string' ? (() => { try { return JSON.parse(p.imageUrls); } catch { return []; } })() : p.imageUrls;
    let firstImage = images && images.length > 0 ? images[0] : null;
    if (firstImage && firstImage.startsWith('/')) firstImage = `${APP_URL}${firstImage}`;
    
    return `
    <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: flex; gap: 14px; align-items: center;">
      ${firstImage ? `<a href="${APP_URL}/community/${p.id}"><img src="${firstImage}" style="width: 76px; height: 76px; object-fit: cover; border-radius: 8px; border: 1px solid #eaeaea;" alt="소식 이미지" /></a>` : ''}
      <div style="flex: 1; min-width: 0;">
        <h4 style="margin: 0 0 5px 0; font-size: 15px; font-weight: 600; line-height: 1.4;">
          <a href="${APP_URL}/community/${p.id}" style="text-decoration: none; color: #059669;">${p.title}</a>
        </h4>
        <p style="margin: 0; font-size: 13px; color: #777;">작성자: ${p.authorName || '관리자'}</p>
      </div>
    </div>
    `;
  }).join('');

  const newsRows = news.map(n => {
    const imgUrl = n.imageUrl?.startsWith('/') ? `${APP_URL}${n.imageUrl}` : n.imageUrl;
    return `
    <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: flex; gap: 14px; align-items: center;">
      ${imgUrl ? `<a href="${APP_URL}/news/${n.id}"><img src="${imgUrl}" style="width: 76px; height: 76px; object-fit: cover; border-radius: 8px; border: 1px solid #eaeaea;" alt="뉴스 이미지" /></a>` : ''}
      <div style="flex: 1; min-width: 0;">
        <h4 style="margin: 0 0 5px 0; font-size: 15px; font-weight: 600; line-height: 1.4;">
          <a href="${APP_URL}/news/${n.id}" style="text-decoration: none; color: #dc2626;">${n.title}</a>
        </h4>
        <p style="margin: 0; font-size: 13px; color: #777;">출처: ${n.source || '강화 부동산 뉴스'}</p>
      </div>
    </div>
    `;
  }).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">이가이버부동산이 전해드리는 엄선된 부동산 소식</p>
      </div>
      
      <div style="padding: 20px;">
        <!-- 1. 최신 등록 매물 -->
        <div style="margin-bottom: 24px;">
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-bottom: 14px;">
            <h3 style="margin: 0; font-size: 15px; color: #1e40af; font-weight: 700;">🆕 이번 주 신규 등록 매물</h3>
          </div>
          ${latestPropertyRows}
        </div>

        <!-- 2. 인기 & 추천 매물 -->
        <div style="margin-bottom: 24px;">
          <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-bottom: 14px;">
            <h3 style="margin: 0; font-size: 15px; color: #c2410c; font-weight: 700;">🔥 인기 & 추천 매물</h3>
          </div>
          ${popularPropertyRows}
        </div>

        <!-- 3. 커뮤니티 소식 -->
        <div style="margin-bottom: 24px;">
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-bottom: 14px;">
            <h3 style="margin: 0; font-size: 15px; color: #065f46; font-weight: 700;">💬 커뮤니티 인기 소식</h3>
          </div>
          ${postRows || '<p style="color: #888; font-size: 14px; margin: 10px 0;">새로운 소식이 없습니다.</p>'}
        </div>

        <!-- 4. 부동산 주요 뉴스 -->
        <div style="margin-bottom: 24px;">
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-bottom: 14px;">
            <h3 style="margin: 0; font-size: 15px; color: #991b1b; font-weight: 700;">📰 강화도 부동산 주요 뉴스</h3>
          </div>
          ${newsRows || '<p style="color: #888; font-size: 14px; margin: 10px 0;">새로운 뉴스가 없습니다.</p>'}
        </div>
      </div>

      <div style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">본 메일은 이가이버부동산 뉴스레터 구독자에게 발송되는 정기 소식지입니다.</p>
        <p style="margin: 0;"><a href="${APP_URL}" style="color: #3b82f6; text-decoration: underline; font-weight: 600;">이가이버부동산 홈페이지 바로가기</a></p>
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

    const data = await storage.getWeeklyNewsletterData();
    const html = buildHtmlTemplate('이가이버부동산 주간 부동산 소식', data);
    
    const subject = '[이가이버부동산] 주간 부동산 매물 및 소식 안내';
    const success = await sendEmail(emails, subject, html);
    
    // Log the result
    const recipientCount = emails.split(',').filter(e => e.trim()).length;
    await storage.insertNewsletterLog({
      subject,
      type: 'weekly',
      target: testEmail ? 'test' : 'all',
      recipientCount,
      success,
      htmlContent: html
    });
    
    log(`[Newsletter] Weekly newsletter sent to ${emails.includes(',') ? 'subscribers' : emails}. Success: ${success}`);
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

    const data = await storage.getMonthlyNewsletterData();
    const html = buildHtmlTemplate('이가이버부동산 월간 인기 부동산 리포트', data);
    
    const subject = '[이가이버부동산] 이번 달 가장 뜨거웠던 인기 매물 및 소식';
    const success = await sendEmail(emails, subject, html);
    
    // Log the result
    const recipientCount = emails.split(',').filter(e => e.trim()).length;
    await storage.insertNewsletterLog({
      subject,
      type: 'monthly',
      target: testEmail ? 'test' : 'all',
      recipientCount,
      success,
      htmlContent: html
    });
    
    log(`[Newsletter] Monthly newsletter sent to ${emails.includes(',') ? 'subscribers' : emails}. Success: ${success}`);
  } catch (error) {
    log(`[Newsletter Error] Monthly job failed: ${error}`);
  }
}

export function setupNewsletterScheduler() {
  const options = { timezone: 'Asia/Seoul' };

  // Weekly on Friday at 08:00
  cron.schedule('0 8 * * 5', () => {
    sendWeeklyNewsletter();
  }, options);

  // Monthly on the 1st at 08:00
  cron.schedule('0 8 1 * *', () => {
    sendMonthlyNewsletter();
  }, options);
  
  // Special one-time mailing on August 15th at 08:00 AM
  cron.schedule('0 8 15 8 *', () => {
    log('[Newsletter] Running special one-time newsletter for Aug 15th');
    sendWeeklyNewsletter();
  }, options);

  log('[Newsletter] Scheduler initialized (Weekly: Fri 08:00, Monthly: 1st 08:00, Special: Aug 15 08:00) with Asia/Seoul timezone');
}

import cron from 'node-cron';
import { storage } from './storage';
import { sendEmail } from './mailer';
import { log } from './vite';

const APP_URL = process.env.APP_URL || 'https://leegyver.com';

function buildHtmlTemplate(title: string, properties: any[], posts: any[]) {
  const propertyRows = properties.map(p => `
    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
      <h3 style="margin: 0; font-size: 16px; color: #3b82f6;">
        <a href="${APP_URL}/properties/${p.id}" style="text-decoration: none; color: #3b82f6;">${p.title}</a>
      </h3>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">가격: ${p.price || '상담'} | 위치: ${p.location}</p>
    </div>
  `).join('');

  const postRows = posts.map(p => `
    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
      <h3 style="margin: 0; font-size: 16px; color: #10b981;">
        <a href="${APP_URL}/community/${p.id}" style="text-decoration: none; color: #10b981;">${p.title}</a>
      </h3>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">작성자: ${p.authorName} | 조회수: ${p.viewCount}</p>
    </div>
  `).join('');

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

    const { properties, posts } = await storage.getWeeklyNewsletterData();
    const html = buildHtmlTemplate('이가이버부동산 주간 부동산 소식', properties, posts);
    
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

    const { properties, posts } = await storage.getMonthlyNewsletterData();
    const html = buildHtmlTemplate('이가이버부동산 월간 인기 부동산 리포트', properties, posts);
    
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

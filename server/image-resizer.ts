import * as fs from 'fs';
import * as path from 'path';
import { log } from './vite';

/**
 * Google Drive URL을 직접 다운로드 가능한 형식으로 변환
 */
function convertGoogleDriveUrl(url: string): string {
  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/,
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)/,
    /https:\/\/drive\.google\.com\/open\?id=([^&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1].split('?')[0];
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      log(`Google Drive URL 변환: ${url.substring(0, 60)}... -> ${directUrl}`, 'info');
      return directUrl;
    }
  }
  return url;
}

export async function resizeImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl || imageUrl.trim() === '') {
      return null;
    }

    // Google Drive URL 변환
    let downloadUrl = imageUrl;
    if (imageUrl.includes('drive.google.com')) {
      downloadUrl = convertGoogleDriveUrl(imageUrl);
    }

    log(`이미지 다운로드 시작: ${downloadUrl}`, 'info');

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      log(`이미지 다운로드 실패: ${imageUrl}, 상태: ${response.status}`, 'warn');
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      log(`이미지가 아닌 콘텐츠: ${imageUrl}, 타입: ${contentType}`, 'warn');
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, imageBuffer);

    const savedUrl = `/uploads/${filename}`;
    log(`이미지 저장 완료: ${imageUrl} -> ${savedUrl}`, 'info');

    return savedUrl;
  } catch (error) {
    log(`이미지 처리 오류: ${imageUrl}, 에러: ${error}`, 'error');
    return null;
  }
}

export async function resizeImages(imageUrls: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const url of imageUrls) {
    if (!url || url.trim() === '') {
      continue;
    }
    const savedUrl = await resizeImageFromUrl(url);
    if (savedUrl) {
      results.push(savedUrl);
    }
  }
  return results;
}

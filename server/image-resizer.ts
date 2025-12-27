import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './vite';

const TARGET_WIDTH = 1027;
const TARGET_HEIGHT = 768;

/**
 * Google Drive URL을 직접 다운로드 가능한 형식으로 변환
 * 예: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  -> https://drive.google.com/uc?export=view&id=FILE_ID
 */
function convertGoogleDriveUrl(url: string): string {
  // Google Drive 파일 URL 패턴들
  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/,
    /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)/,
    /https:\/\/drive\.google\.com\/open\?id=([^&]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1].split('?')[0]; // 쿼리 파라미터 제거
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

    log(`이미지 리사이징 시작: ${downloadUrl}`, 'info');

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      log(`이미지 다운로드 실패: ${imageUrl}, 상태: ${response.status}`, 'warn');
      return imageUrl;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      log(`이미지가 아닌 콘텐츠: ${imageUrl}, 타입: ${contentType}`, 'warn');
      return imageUrl;
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const resizedBuffer = await sharp(imageBuffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `resized_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, resizedBuffer);

    const resizedUrl = `/uploads/${filename}`;
    log(`이미지 리사이징 완료: ${imageUrl} -> ${resizedUrl}`, 'info');

    return resizedUrl;
  } catch (error) {
    log(`이미지 리사이징 오류: ${imageUrl}, 에러: ${error}`, 'error');
    return imageUrl;
  }
}

export async function resizeImages(imageUrls: string[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const url of imageUrls) {
    if (!url || url.trim() === '') {
      continue;
    }
    
    const resizedUrl = await resizeImageFromUrl(url);
    if (resizedUrl) {
      results.push(resizedUrl);
    }
  }
  
  return results;
}

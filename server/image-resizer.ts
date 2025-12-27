import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './vite';

const TARGET_WIDTH = 1027;
const TARGET_HEIGHT = 768;

export async function resizeImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl || imageUrl.trim() === '') {
      return null;
    }

    log(`이미지 리사이징 시작: ${imageUrl}`, 'info');

    const response = await fetch(imageUrl);
    
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

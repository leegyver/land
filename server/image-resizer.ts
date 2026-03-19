// import sharp from 'sharp'; // Sharp 제거 (VPS 호환성 문제)
import * as fs from 'fs';
import * as path from 'path';
import { log } from './vite';

// const TARGET_WIDTH = 1027;
// const TARGET_HEIGHT = 768;

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

    log(`이미지 다운로드 및 저장 시작 (Resizing SKIPPED): ${downloadUrl}`, 'info');

    console.log(`[이미지 다운로드] 시도: ${downloadUrl}`);

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      redirect: 'follow'
    });

    console.log(`[이미지 다운로드] 응답 상태: ${response.status}, 타입: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      log(`이미지 다운로드 실패: ${imageUrl}, 상태: ${response.status}`, 'warn');
      return null; // 실패 시 null 반환하여 기본 이미지 사용하도록
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      log(`이미지가 아닌 콘텐츠: ${imageUrl}, 타입: ${contentType}`, 'warn');
      return null; // 이미지가 아니면 null 반환
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Sharp 제거: 리사이징 없이 원본 저장
    // const resizedBuffer = await sharp(imageBuffer)
    //   .resize(TARGET_WIDTH, TARGET_HEIGHT, {
    //     fit: 'cover',
    //     position: 'center'
    //   })
    //   .jpeg({ quality: 85 })
    //   .toBuffer();
    const saveBuffer = imageBuffer;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 확장자는 원본 타입을 따라가야 하지만, 편의상 jpg로 저장하거나 
    // 파일명 랜덤 생성. (content-type기반 추론은 생략하고 일단 jpg/png 호환 저장)
    const filename = `saved_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, saveBuffer);

    const savedUrl = `/uploads/${filename}`;
    log(`이미지 저장 완료 (원본): ${imageUrl} -> ${savedUrl}`, 'info');

    return savedUrl;
  } catch (error) {
    log(`이미지 처리 오류: ${imageUrl}, 에러: ${error}`, 'error');
    console.log(`[이미지 오류] ${imageUrl}: ${error}`);
    return null; // 오류 시 null 반환
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

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 날짜 문자열을 포맷팅하는 함수
 * @param dateString 날짜 문자열 (예: '2023. 5. 9.')
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(dateString: string) {
  // 이미 잘 포맷팅된 날짜라면 그대로 반환
  if (/^\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\.?$/.test(dateString)) {
    return dateString.trim();
  }
  
  try {
    // 날짜 객체로 변환
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // 한국 날짜 형식으로 변환 (YYYY. MM. DD.)
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  } catch (e) {
    console.error("날짜 포맷팅 오류:", e);
    return dateString;
  }
}

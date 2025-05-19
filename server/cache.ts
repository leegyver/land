/**
 * 간단한 메모리 캐시 구현
 * 자주 조회되고 변경이 적은 데이터를 캐싱하여 DB 쿼리 횟수를 줄이는 목적
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
  timestamp: number; // 캐시 생성 시간 추가
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분 기본 캐시 시간

  /**
   * 캐시에서 값을 가져옴
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined (만료 또는 없음)
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // 캐시 항목이 없거나 만료된 경우
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key); // 만료된 항목 제거
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * 캐시에 값을 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl 캐시 유효 시간(ms), 기본값 5분
   */
  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    const expiry = now + ttl;
    this.cache.set(key, { value, expiry, timestamp: now });
  }
  
  /**
   * 캐시 항목이 생성된 시간을 반환
   * @param key 캐시 키
   * @returns 캐시 생성 시간(타임스탬프) 또는 undefined (캐시 없음)
   */
  getTimestamp(key: string): number | undefined {
    const item = this.cache.get(key);
    return item ? item.timestamp : undefined;
  }

  /**
   * 특정 키의 캐시 삭제
   * @param key 삭제할 캐시 키
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 특정 프리픽스로 시작하는 모든 캐시 삭제
   * @param prefix 캐시 키 프리픽스
   */
  deleteByPrefix(prefix: string): void {
    // Array.from으로 변환하여 이터레이터 이슈 해결
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 모든 캐시 항목 삭제 (정리)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스 생성
export const memoryCache = new MemoryCache();

// 주기적으로 만료된 캐시 항목 정리 (5분마다)
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1000);
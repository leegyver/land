import { memoryCache } from './cache';
import { 
  RealEstateTransaction,
  sampleApartmentTransactions,
  sampleHouseTransactions,
  sampleLandTransactions
} from './sample-data';

// 아파트 매매 실거래가 조회
export async function getApartmentTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}): Promise<RealEstateTransaction[]> {
  // 캐시 키 생성
  const cacheKey = `apartment-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  
  // 캐시에 데이터가 있는지 확인
  const cachedData = memoryCache.get<RealEstateTransaction[]>(cacheKey);
  if (cachedData) {
    console.log(`캐시된 아파트 실거래 데이터 반환: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  
  // 데이터를 가져오는 대신 샘플 데이터 사용
  console.log(`아파트 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
  
  try {
    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, sampleApartmentTransactions, 2 * 60 * 60 * 1000);
    
    return sampleApartmentTransactions;
  } catch (error) {
    console.error('아파트 실거래 데이터 조회 오류:', error);
    return [];
  }
}

// 단독다가구 매매 실거래가 조회
export async function getHouseTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}): Promise<RealEstateTransaction[]> {
  // 캐시 키 생성
  const cacheKey = `house-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  
  // 캐시에 데이터가 있는지 확인
  const cachedData = memoryCache.get<RealEstateTransaction[]>(cacheKey);
  if (cachedData) {
    console.log(`캐시된 단독다가구 실거래 데이터 반환: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  
  // 데이터를 가져오는 대신 샘플 데이터 사용
  console.log(`단독다가구 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
  
  try {
    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, sampleHouseTransactions, 2 * 60 * 60 * 1000);
    
    return sampleHouseTransactions;
  } catch (error) {
    console.error('단독다가구 실거래 데이터 조회 오류:', error);
    return [];
  }
}

// 토지 매매 실거래가 조회
export async function getLandTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}): Promise<RealEstateTransaction[]> {
  // 캐시 키 생성
  const cacheKey = `land-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  
  // 캐시에 데이터가 있는지 확인
  const cachedData = memoryCache.get<RealEstateTransaction[]>(cacheKey);
  if (cachedData) {
    console.log(`캐시된 토지 실거래 데이터 반환: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }
  
  // 데이터를 가져오는 대신 샘플 데이터 사용
  console.log(`토지 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
  
  try {
    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, sampleLandTransactions, 2 * 60 * 60 * 1000);
    
    return sampleLandTransactions;
  } catch (error) {
    console.error('토지 실거래 데이터 조회 오류:', error);
    return [];
  }
}

// 최근 3개월간의 실거래 데이터 조회
export async function getRecentTransactions(regionCode: string = '28710'): Promise<RealEstateTransaction[]> {
  try {
    // 현재 날짜 기준으로 최근 3개월간의 데이터 조회
    const today = new Date();
    const months = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}${month}`);
    }
    
    console.log(`최근 3개월 데이터 조회: ${months.join(', ')}`);

    // 모든 샘플 데이터를 바로 합침
    const allTransactions = [
      ...sampleApartmentTransactions,
      ...sampleHouseTransactions,
      ...sampleLandTransactions
    ];
    
    console.log(`총 ${allTransactions.length}개의 실거래 데이터 조회 완료`);
    return allTransactions;
  } catch (error) {
    console.error('실거래 데이터 조회 오류:', error);
    return [];
  }
}
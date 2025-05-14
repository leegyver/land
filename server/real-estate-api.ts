import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import { memoryCache } from './cache';

// 추가 디버깅 옵션 (API 호출 문제 진단용)
const DEBUG_API_CALLS = true;

// 부동산 실거래가 데이터 타입 정의
export interface RealEstateTransaction {
  거래금액: string;
  건축년도?: string;
  년: string;
  월: string;
  일: string;
  아파트?: string;
  주택유형?: string;
  토지거래구분?: string;
  전용면적?: string;
  법정동?: string;
  지번?: string;
  지역코드?: string;
  층?: string;
  type: string;
  address?: string;
  lat?: number;  // 위도 (주소 변환 후)
  lng?: number;  // 경도 (주소 변환 후)
}

// 아파트 매매 실거래가 조회
export async function getApartmentTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}): Promise<RealEstateTransaction[]> {
  const baseUrl = 'https://apis.data.go.kr/1613000/AptTradeSvc/getAptTrade';
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    throw new Error('DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다');
  }

  // 캐시 키 생성
  const cacheKey = `apartment-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  
  // 캐시에 데이터가 있는지 확인
  const cachedData = memoryCache.get<RealEstateTransaction[]>(cacheKey);
  if (cachedData) {
    console.log(`캐시된 아파트 실거래 데이터 반환: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }

  // URL 구성 - URL 인코딩 없이 직접 사용
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  
  try {
    console.log(`아파트 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log('요청 URL:', url);
    
    // 요청 헤더 및 User-Agent 추가 (CORS 방지)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Content-Type': 'application/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP 오류: ${response.status}`);
    }
    
    const xmlData = await response.text();
    
    // 디버깅: XML 응답 전체 출력 (문제 진단용)
    if(DEBUG_API_CALLS) {
      console.log('API 응답 전체:', xmlData);
    } else {
      console.log('API 응답 일부:', xmlData.substring(0, 300));
    }
    
    // XML 파서 설정
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
    
    // XML을 JSON으로 변환
    const result = parser.parse(xmlData);
    
    // 디버깅: 파싱된 결과 구조 출력
    console.log('파싱된 결과 구조:', JSON.stringify(result).substring(0, 300));
    
    // 응답 에러 확인
    if (!result.response) {
      console.error('API 응답 형식 오류: response 객체 없음');
      return [];
    }
    
    // 결과코드 확인 (API별로 다를 수 있음)
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== '00') {
      const errorMsg = result.response.header?.resultMsg || '알 수 없는 오류';
      console.error(`API 오류: ${errorMsg}`);
      return [];
    }
    
    // 데이터가 없는 경우
    if (!result.response.body?.items?.item) {
      console.log('API 응답: 데이터 없음');
      return [];
    }
    
    // 데이터 추출 및 변환
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    
    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map((item: any) => {
      // 주소 생성
      const legalDong = item.법정동 || '';
      const jibun = item.지번 || '';
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      // 거래금액은 문자열이며, 쉼표와 공백 제거
      let dealAmount = item.거래금액 || '';
      if (typeof dealAmount === 'string') {
        dealAmount = dealAmount.trim().replace(/,/g, '');
      }
      
      return {
        거래금액: dealAmount,
        건축년도: item.건축년도,
        년: item.년,
        월: item.월,
        일: item.일,
        아파트: item.아파트,
        전용면적: item.전용면적,
        법정동: legalDong,
        지번: jibun,
        지역코드: item.지역코드,
        층: item.층,
        type: '아파트',
        address
      };
    });

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1000);
    
    console.log(`${transactions.length}개의 아파트 실거래 데이터 조회 완료`);
    return transactions;
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
  const baseUrl = 'https://apis.data.go.kr/1613000/TradeService/getSHTrade';
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    throw new Error('DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다');
  }

  // 캐시 키 생성
  const cacheKey = `house-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  
  // 캐시에 데이터가 있는지 확인
  const cachedData = memoryCache.get<RealEstateTransaction[]>(cacheKey);
  if (cachedData) {
    console.log(`캐시된 단독다가구 실거래 데이터 반환: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }

  // URL 구성 - URL 인코딩 없이 직접 사용
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  
  try {
    console.log(`단독다가구 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log('요청 URL:', url);
    
    // 요청 헤더 및 User-Agent 추가 (CORS 방지)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Content-Type': 'application/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP 오류: ${response.status}`);
    }
    
    const xmlData = await response.text();
    
    // XML 파서 설정
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
    
    // XML을 JSON으로 변환
    const result = parser.parse(xmlData);
    
    // 응답 에러 확인
    if (!result.response) {
      console.error('API 응답 형식 오류: response 객체 없음');
      return [];
    }
    
    // 결과코드 확인
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== '00') {
      const errorMsg = result.response.header?.resultMsg || '알 수 없는 오류';
      console.error(`API 오류: ${errorMsg}`);
      return [];
    }
    
    // 데이터가 없는 경우
    if (!result.response.body?.items?.item) {
      console.log('API 응답: 데이터 없음');
      return [];
    }
    
    // 데이터 추출 및 변환
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    
    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map((item: any) => {
      // 주소 생성
      const legalDong = item.법정동 || '';
      const jibun = item.지번 || '';
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      // 거래금액은 문자열이며, 쉼표와 공백 제거
      let dealAmount = item.거래금액 || '';
      if (typeof dealAmount === 'string') {
        dealAmount = dealAmount.trim().replace(/,/g, '');
      }
      
      return {
        거래금액: dealAmount,
        건축년도: item.건축년도,
        년: item.년,
        월: item.월,
        일: item.일,
        주택유형: item.주택유형,
        전용면적: item.연면적, // 단독주택은 연면적을 사용함
        법정동: legalDong,
        지번: jibun,
        type: '단독다가구',
        address
      };
    });

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1000);
    
    console.log(`${transactions.length}개의 단독다가구 실거래 데이터 조회 완료`);
    return transactions;
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
  const baseUrl = 'https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getLandTrade';
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    throw new Error('DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다');
  }

  // 캐시 키 생성
  const cacheKey = `land-transactions-${params.LAWD_CD}-${params.DEAL_YMD}`;
  
  // 캐시에 데이터가 있는지 확인
  const cachedData = memoryCache.get<RealEstateTransaction[]>(cacheKey);
  if (cachedData) {
    console.log(`캐시된 토지 실거래 데이터 반환: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    return cachedData;
  }

  // URL 구성 - URL 인코딩 없이 직접 사용
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  
  try {
    console.log(`토지 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    console.log('요청 URL:', url);
    
    // 요청 헤더 및 User-Agent 추가 (CORS 방지)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Content-Type': 'application/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP 오류: ${response.status}`);
    }
    
    const xmlData = await response.text();
    
    // XML 파서 설정
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
    
    // XML을 JSON으로 변환
    const result = parser.parse(xmlData);
    
    // 응답 에러 확인
    if (!result.response) {
      console.error('API 응답 형식 오류: response 객체 없음');
      return [];
    }
    
    // 결과코드 확인
    const resultCode = result.response.header?.resultCode;
    if (resultCode && resultCode !== '00') {
      const errorMsg = result.response.header?.resultMsg || '알 수 없는 오류';
      console.error(`API 오류: ${errorMsg}`);
      return [];
    }
    
    // 데이터가 없는 경우
    if (!result.response.body?.items?.item) {
      console.log('API 응답: 데이터 없음');
      return [];
    }
    
    // 데이터 추출 및 변환
    let items = [];
    if (Array.isArray(result.response.body.items.item)) {
      items = result.response.body.items.item;
    } else {
      items = [result.response.body.items.item];
    }
    
    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map((item: any) => {
      // 주소 생성
      const legalDong = item.법정동 || '';
      const jibun = item.지번 || '';
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      // 거래금액은 문자열이며, 쉼표와 공백 제거
      let dealAmount = item.거래금액 || '';
      if (typeof dealAmount === 'string') {
        dealAmount = dealAmount.trim().replace(/,/g, '');
      }
      
      return {
        거래금액: dealAmount,
        년: item.년,
        월: item.월,
        일: item.일,
        토지거래구분: item.토지거래구분,
        법정동: legalDong,
        지번: jibun,
        type: '토지',
        address
      };
    });

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1000);
    
    console.log(`${transactions.length}개의 토지 실거래 데이터 조회 완료`);
    return transactions;
  } catch (error) {
    console.error('토지 실거래 데이터 조회 오류:', error);
    return [];
  }
}

// 최근 3개월간의 실거래 데이터 조회
export async function getRecentTransactions(regionCode: string = '28710'): Promise<RealEstateTransaction[]> {
  try {
    console.log(`실거래가 데이터 요청: 지역코드=${regionCode}`);
    
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

    // 모든 타입의 실거래 데이터를 병렬로 조회
    const allTransactionsPromises = months.flatMap(month => [
      getApartmentTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getHouseTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getLandTransactions({ LAWD_CD: regionCode, DEAL_YMD: month })
    ]);
    
    const allTransactions = await Promise.all(allTransactionsPromises);

    // 모든 데이터 합치기
    const transactions = allTransactions.flat();
    
    console.log(`총 ${transactions.length}개의 실거래 데이터 조회 완료`);
    return transactions;
  } catch (error) {
    console.error('실거래 데이터 조회 오류:', error);
    return [];
  }
}
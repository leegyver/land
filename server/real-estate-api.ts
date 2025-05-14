import fetch from 'node-fetch';
import { xml2json } from 'xml-js';
import { memoryCache } from './cache';

// 부동산 실거래가 데이터 타입 정의
export interface RealEstateTransaction {
  거래금액: string;
  건축년도: string;
  년: string;
  월: string;
  일: string;
  아파트: string;
  전용면적: string;
  지번: string;
  지역코드: string;
  층: string;
  도로명: string;
  도로명건물본번호코드: string;
  도로명건물부번호코드: string;
  법정동: string;
  lat?: number;  // 위도 (Kakao Map API로 주소 변환 후)
  lng?: number;  // 경도 (Kakao Map API로 주소 변환 후)
  type?: string; // 거래 유형 (아파트, 단독/다가구, 토지 등)
}

// 응답 형식에 맞는 타입 정의
interface APIResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: RealEstateTransaction[] | RealEstateTransaction;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 아파트 매매 실거래가 조회
export async function getApartmentTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}) {
  const baseUrl = 'http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade';
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

  const queryParams = new URLSearchParams({
    serviceKey: decodeURIComponent(serviceKey),
    LAWD_CD: params.LAWD_CD,
    DEAL_YMD: params.DEAL_YMD,
  });

  const url = `${baseUrl}?${queryParams}`;
  
  try {
    console.log(`아파트 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    const response = await fetch(url);
    const xmlData = await response.text();
    
    // XML을 JSON으로 변환
    const parser = new XMLParser({ compact: true, ignoreDeclaration: true });
    const parsedData = parser.parse(xmlData) as APIResponse;
    
    // 응답 에러 확인
    if (parsedData.response.header.resultCode !== '00') {
      throw new Error(`API 에러: ${parsedData.response.header.resultMsg}`);
    }

    // 데이터가 없는 경우
    if (!parsedData.response.body.items || !parsedData.response.body.items.item) {
      return [];
    }

    // 단일 항목인 경우 배열로 변환
    let items: RealEstateTransaction[] = [];
    if (Array.isArray(parsedData.response.body.items.item)) {
      items = parsedData.response.body.items.item.map(item => ({
        ...item,
        type: '아파트'
      }));
    } else {
      items = [{ ...parsedData.response.body.items.item, type: '아파트' }];
    }

    // 거래금액의 공백 제거 및 숫자 포맷 정리
    items = items.map(item => ({
      ...item,
      거래금액: item.거래금액.trim().replace(/,/g, '')
    }));

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, items, 2 * 60 * 60 * 1000);
    
    return items;
  } catch (error) {
    console.error('아파트 실거래 데이터 조회 오류:', error);
    throw error;
  }
}

// 단독다가구 매매 실거래가 조회
export async function getHouseTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}) {
  const baseUrl = 'http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcSHTrade';
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

  const queryParams = new URLSearchParams({
    serviceKey: decodeURIComponent(serviceKey),
    LAWD_CD: params.LAWD_CD,
    DEAL_YMD: params.DEAL_YMD,
  });

  const url = `${baseUrl}?${queryParams}`;
  
  try {
    console.log(`단독다가구 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    const response = await fetch(url);
    const xmlData = await response.text();
    
    // XML을 JSON으로 변환
    const parser = new XMLParser({ compact: true, ignoreDeclaration: true });
    const parsedData = parser.parse(xmlData) as APIResponse;
    
    // 응답 에러 확인
    if (parsedData.response.header.resultCode !== '00') {
      throw new Error(`API 에러: ${parsedData.response.header.resultMsg}`);
    }

    // 데이터가 없는 경우
    if (!parsedData.response.body.items || !parsedData.response.body.items.item) {
      return [];
    }

    // 단일 항목인 경우 배열로 변환
    let items: RealEstateTransaction[] = [];
    if (Array.isArray(parsedData.response.body.items.item)) {
      items = parsedData.response.body.items.item.map(item => ({
        ...item,
        type: '단독다가구'
      }));
    } else {
      items = [{ ...parsedData.response.body.items.item, type: '단독다가구' }];
    }

    // 거래금액의 공백 제거 및 숫자 포맷 정리
    items = items.map(item => ({
      ...item,
      거래금액: item.거래금액.trim().replace(/,/g, '')
    }));

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, items, 2 * 60 * 60 * 1000);
    
    return items;
  } catch (error) {
    console.error('단독다가구 실거래 데이터 조회 오류:', error);
    throw error;
  }
}

// 토지 매매 실거래가 조회
export async function getLandTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}) {
  const baseUrl = 'http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcLandTrade';
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

  const queryParams = new URLSearchParams({
    serviceKey: decodeURIComponent(serviceKey),
    LAWD_CD: params.LAWD_CD,
    DEAL_YMD: params.DEAL_YMD,
  });

  const url = `${baseUrl}?${queryParams}`;
  
  try {
    console.log(`토지 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    const response = await fetch(url);
    const xmlData = await response.text();
    
    // XML을 JSON으로 변환
    const parser = new XMLParser({ compact: true, ignoreDeclaration: true });
    const parsedData = parser.parse(xmlData) as APIResponse;
    
    // 응답 에러 확인
    if (parsedData.response.header.resultCode !== '00') {
      throw new Error(`API 에러: ${parsedData.response.header.resultMsg}`);
    }

    // 데이터가 없는 경우
    if (!parsedData.response.body.items || !parsedData.response.body.items.item) {
      return [];
    }

    // 단일 항목인 경우 배열로 변환
    let items: RealEstateTransaction[] = [];
    if (Array.isArray(parsedData.response.body.items.item)) {
      items = parsedData.response.body.items.item.map(item => ({
        ...item,
        type: '토지'
      }));
    } else {
      items = [{ ...parsedData.response.body.items.item, type: '토지' }];
    }

    // 거래금액의 공백 제거 및 숫자 포맷 정리
    items = items.map(item => ({
      ...item,
      거래금액: item.거래금액?.trim().replace(/,/g, '') || '0'
    }));

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, items, 2 * 60 * 60 * 1000);
    
    return items;
  } catch (error) {
    console.error('토지 실거래 데이터 조회 오류:', error);
    throw error;
  }
}

// 최근 3개월간의 실거래 데이터 조회
export async function getRecentTransactions(regionCode: string = '28710') {
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

  try {
    // 모든 타입의 실거래 데이터를 병렬로 조회
    const allTransactions = await Promise.all(
      months.flatMap(month => [
        getApartmentTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
        getHouseTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
        getLandTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      ])
    );

    // 모든 데이터 합치기
    const transactions = allTransactions.flat();
    
    console.log(`총 ${transactions.length}개의 실거래 데이터 조회 완료`);
    return transactions;
  } catch (error) {
    console.error('실거래 데이터 조회 오류:', error);
    throw error;
  }
}
import fetch from 'node-fetch';
import * as convert from 'xml-js';
import { memoryCache } from './cache';

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
  지번?: string;
  지역코드?: string;
  층?: string;
  법정동?: string;
  도로명?: string;
  lat?: number;  // 위도 (주소 변환 후)
  lng?: number;  // 경도 (주소 변환 후)
  type: string; // 거래 유형 (아파트, 단독다가구, 토지 등)
  address?: string; // 전체 주소
}

// 아파트 매매 실거래가 조회
export async function getApartmentTransactions(params: {
  LAWD_CD: string; // 지역코드 (강화군: 28710)
  DEAL_YMD: string; // 계약년월(YYYYMM)
}): Promise<RealEstateTransaction[]> {
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
    const jsonStr = convert.xml2json(xmlData, { compact: true, spaces: 4 });
    const parsed = JSON.parse(jsonStr);
    
    // 응답 에러 확인
    if (!parsed.response || parsed.response.header.resultCode._text !== '00') {
      const errorMsg = parsed.response?.header?.resultMsg?._text || '알 수 없는 오류';
      throw new Error(`API 에러: ${errorMsg}`);
    }

    // 데이터가 없는 경우
    if (!parsed.response.body.items || !parsed.response.body.items.item) {
      return [];
    }

    // 단일 항목인 경우 배열로 변환
    let items = [];
    if (Array.isArray(parsed.response.body.items.item)) {
      items = parsed.response.body.items.item;
    } else {
      items = [parsed.response.body.items.item];
    }

    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map(item => {
      // _text 속성에서 값 추출
      const extractValue = (obj: any): string => obj?._text || '';
      
      // 주소 생성
      const legalDong = extractValue(item.법정동);
      const jibun = extractValue(item.지번);
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      return {
        거래금액: extractValue(item.거래금액).trim().replace(/,/g, ''),
        건축년도: extractValue(item.건축년도),
        년: extractValue(item.년),
        월: extractValue(item.월),
        일: extractValue(item.일),
        아파트: extractValue(item.아파트),
        전용면적: extractValue(item.전용면적),
        법정동: legalDong,
        지번: jibun,
        지역코드: extractValue(item.지역코드),
        층: extractValue(item.층),
        type: '아파트',
        address
      };
    });

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1000);
    
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
    const jsonStr = convert.xml2json(xmlData, { compact: true, spaces: 4 });
    const parsed = JSON.parse(jsonStr);
    
    // 응답 에러 확인
    if (!parsed.response || parsed.response.header.resultCode._text !== '00') {
      const errorMsg = parsed.response?.header?.resultMsg?._text || '알 수 없는 오류';
      throw new Error(`API 에러: ${errorMsg}`);
    }

    // 데이터가 없는 경우
    if (!parsed.response.body.items || !parsed.response.body.items.item) {
      return [];
    }

    // 단일 항목인 경우 배열로 변환
    let items = [];
    if (Array.isArray(parsed.response.body.items.item)) {
      items = parsed.response.body.items.item;
    } else {
      items = [parsed.response.body.items.item];
    }

    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map(item => {
      // _text 속성에서 값 추출
      const extractValue = (obj: any): string => obj?._text || '';
      
      // 주소 생성
      const legalDong = extractValue(item.법정동);
      const jibun = extractValue(item.지번);
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      return {
        거래금액: extractValue(item.거래금액).trim().replace(/,/g, ''),
        건축년도: extractValue(item.건축년도),
        년: extractValue(item.년),
        월: extractValue(item.월),
        일: extractValue(item.일),
        주택유형: extractValue(item.주택유형),
        전용면적: extractValue(item.연면적),
        법정동: legalDong,
        지번: jibun,
        type: '단독다가구',
        address
      };
    });

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1000);
    
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
    const jsonStr = convert.xml2json(xmlData, { compact: true, spaces: 4 });
    const parsed = JSON.parse(jsonStr);
    
    // 응답 에러 확인
    if (!parsed.response || parsed.response.header.resultCode._text !== '00') {
      const errorMsg = parsed.response?.header?.resultMsg?._text || '알 수 없는 오류';
      throw new Error(`API 에러: ${errorMsg}`);
    }

    // 데이터가 없는 경우
    if (!parsed.response.body.items || !parsed.response.body.items.item) {
      return [];
    }

    // 단일 항목인 경우 배열로 변환
    let items = [];
    if (Array.isArray(parsed.response.body.items.item)) {
      items = parsed.response.body.items.item;
    } else {
      items = [parsed.response.body.items.item];
    }

    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map(item => {
      // _text 속성에서 값 추출
      const extractValue = (obj: any): string => obj?._text || '';
      
      // 주소 생성
      const legalDong = extractValue(item.법정동);
      const jibun = extractValue(item.지번);
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      return {
        거래금액: extractValue(item.거래금액).trim().replace(/,/g, ''),
        년: extractValue(item.년),
        월: extractValue(item.월),
        일: extractValue(item.일),
        토지거래구분: extractValue(item.토지거래구분),
        법정동: legalDong,
        지번: jibun,
        type: '토지',
        address
      };
    });

    // 캐시에 데이터 저장 (2시간 동안)
    memoryCache.set(cacheKey, transactions, 2 * 60 * 60 * 1000);
    
    return transactions;
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

    // 모든 타입의 실거래 데이터를 병렬로 조회
    const allTransactionsPromises = months.flatMap(month => [
      getApartmentTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getHouseTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
      getLandTransactions({ LAWD_CD: regionCode, DEAL_YMD: month }),
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
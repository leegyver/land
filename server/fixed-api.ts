import fetch from 'node-fetch';
import { parse as parseXML } from 'fast-xml-parser';
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
  const baseUrl = 'http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade';
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

  // 키는 그대로 사용 (인코딩/디코딩 없이)
  // URL은 템플릿 문자열로 직접 구성
  const url = `${baseUrl}?serviceKey=${serviceKey}&LAWD_CD=${params.LAWD_CD}&DEAL_YMD=${params.DEAL_YMD}`;
  
  try {
    console.log(`아파트 실거래 데이터 요청: ${params.LAWD_CD}, ${params.DEAL_YMD}`);
    
    // 요청 헤더 추가
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Content-Type': 'application/xml',
      }
    });
    
    // 응답 확인
    if (!response.ok) {
      console.error(`HTTP 오류: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP 오류: ${response.status}`);
    }
    
    const xmlData = await response.text();
    
    // 디버깅: XML 응답 로깅
    console.log('API 응답 일부:', xmlData.substring(0, 300));
    
    // XML을 JSON으로 변환 (fast-xml-parser 사용)
    const options = {
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreAttributes: false,
      parseAttributeValue: true,
      trimValues: true,
    };
    
    const parsed = parseXML(xmlData, options);
    
    // 디버깅: 파싱된 데이터 확인
    console.log('파싱된 데이터 구조:', JSON.stringify(parsed).substring(0, 300));
    
    // 응답 구조 확인 및 에러 처리
    if (!parsed.response) {
      console.error('API 응답 형식 오류: response 객체 없음');
      return [];
    }
    
    // 공공데이터 포털 API 응답 구조에 맞게 파싱
    // 이 부분은 실제 응답 구조에 맞게 조정 필요
    if (!parsed.response.body || !parsed.response.body.items) {
      console.log('API 응답: 데이터 없음');
      return [];
    }
    
    // 데이터 추출 및 변환
    let items = [];
    if (Array.isArray(parsed.response.body.items.item)) {
      items = parsed.response.body.items.item;
    } else if (parsed.response.body.items.item) {
      items = [parsed.response.body.items.item];
    } else {
      return [];
    }
    
    // 데이터 정제 및 변환
    const transactions: RealEstateTransaction[] = items.map((item: any) => {
      // 주소 생성
      const legalDong = item.법정동 || '';
      const jibun = item.지번 || '';
      const address = `인천 강화군 ${legalDong} ${jibun}`;
      
      return {
        거래금액: (item.거래금액 || '').trim().replace(/,/g, ''),
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

// 실거래 API의 경우 CORS 이슈가 있을 수 있어 서버에서 프록시하는 방식이 필요할 수도 있음
// 이 부분은 실제 API 응답에 따라 추가 구현 필요
import axios from 'axios';
import { memoryCache } from '../cache';

export interface TransactionItem {
  category: '아파트' | '연립다세대' | '단독다가구' | '토지';
  name: string;
  dealAmount: number; // 거래금액 (만원)
  dealAmountFormatted: string; // 거래금액 (억/만원)
  dealDate: string; // YYYY-MM-DD
  areaM2: number;
  areaPyeong: number;
  areaTypeLabel?: string; // 면적 종류 (토지면적 / 전용면적 / 대지면적)
  floor?: number;
  dong?: string;
  jibun?: string;
  pyeongPriceFormatted: string; // 평당 가격
  isDirectMatch: boolean; // 해당 선택 지번 직접 거래 여부
}

export interface IntegratedPropertyReport {
  success: boolean;
  message?: string;
  query: string;
  searchedAt: string;
  basicInfo: {
    addressName: string;
    roadAddressName: string;
    pnu: string;
    sigunguCd: string;
    bjdongCd: string;
    bun: string;
    ji: string;
    isMountain: boolean;
    lat: number;
    lng: number;
  };
  landLedger: {
    hasData: boolean;
    landCategoryNm: string; // 지목명 (예: 대, 답, 전, 임야)
    areaM2: number; // 면적 (m2)
    areaPyeong: number; // 면적 (평)
    officialPricePerM2: number; // 공시지가 (원/m2)
    officialPriceTotal: number; // 토지 총 공시지가 (원)
    standardYear: string; // 공시지가 기준년도
    useArea1Nm: string; // 용도지역 1 (예: 제2종일반주거지역, 자연녹지지역)
    useArea2Nm: string; // 용도지역 2
    roadSideNm: string; // 도로조건 (예: 세로한면, 광대로)
    terrainHeightNm: string; // 지형고저 (예: 평지, 완경사)
    terrainShapeNm: string; // 지형형상 (예: 사다리형, 정방형)
    regulations: string[]; // 토지이용규제 목록
    legalBcRatLimit: number; // 법정 건폐율 상한 (%)
    legalVlRatLimit: number; // 법정 용적률 상한 (%)
    legalZoningDesc: string; // 용도지역 및 법정 기준 설명
  };
  ownership: {
    hasData: boolean;
    ownerTypeNm: string; // 소유구분 (개인, 법인, 종중, 국유지 등)
    residenceTypeNm: string; // 거주지구분 (관내, 시군구내, 관외)
    coOwnerCount: number; // 공유인 수
    isCoOwned: boolean; // 공동소유 여부
    changeCauseNm: string; // 소유권 변동원인 (매매, 증여, 상속 등)
    changeDate: string; // 소유권 변동일자 (YYYY-MM-DD)
    note: string;
  };
  buildingLedger: {
    hasData: boolean;
    hasError?: boolean;
    buildingCount: number;
    buildings: Array<{
      bldNm: string; // 건물명
      dongNm: string; // 동명
      mainPurpsNm: string; // 주용도명 (예: 단독주택, 제1종근린생활시설)
      etcPurps: string; // 기타용도
      strctNm: string; // 구조 (예: 철근콘크리트, 조적조)
      roofNm: string; // 지붕
      platAreaM2: number; // 대지면적 (m2)
      archAreaM2: number; // 건축면적 (m2)
      totAreaM2: number; // 연면적 (m2)
      totAreaPyeong: number; // 연면적 (평)
      bcRat: number; // 건폐율 (%)
      vlRat: number; // 용적률 (%)
      legalBcRatLimit: number; // 법정 건폐율 상한 (%)
      legalVlRatLimit: number; // 법정 용적률 상한 (%)
      grndFlrCnt: number; // 지상 층수
      ugrndFlrCnt: number; // 지하 층수
      parkingCount: number; // 주차 대수
      elvtCount: number; // 승강기 대수
      useAprDay: string; // 사용승인일 (YYYY-MM-DD)
      buildingAgeYears: number; // 경과 연수
      isViolated: boolean; // 위반건축물 여부
    }>;
  };
  transactions: {
    hasData: boolean;
    count: number;
    hasDirectTrades: boolean;
    directTrades: TransactionItem[];
    nearbyTrades: TransactionItem[];
    items: TransactionItem[];
  };
  aiSummary: {
    headline: string;
    points: string[];
    riskAnalysis: string[];
  };
}

// 금액을 한글(억원/만원) 형식으로 변환
function formatMoney(tenThousandWon: number): string {
  if (!tenThousandWon || isNaN(tenThousandWon)) return '0원';
  const eok = Math.floor(tenThousandWon / 10000);
  const remainder = tenThousandWon % 10000;
  if (eok > 0) {
    return remainder > 0 ? `${eok}억 ${remainder.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${remainder.toLocaleString()}만원`;
}

// 날짜 문자열 포맷팅 (YYYYMMDD -> YYYY-MM-DD)
function formatDate(dateStr: string | number | undefined): string {
  if (!dateStr) return '-';
  const s = String(dateStr).trim();
  if (s.length === 8) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
  }
  return s;
}

export interface ZoningLimit {
  bcRatLimit: number; // 법정 건폐율 상한 (%)
  vlRatLimit: number; // 법정 용적률 상한 (%)
  desc: string;
}

export function getZoningLimits(useAreaNm: string, regulations: string[] = []): ZoningLimit {
  const name = (useAreaNm || '').trim();

  // 1. 용도지구 특례 완화 여부 확인 (자연취락지구 등)
  const isSettlementDistrict = regulations.some(r => r.includes('자연취락지구'));
  const isGrowthPlanDistrict = regulations.some(r => r.includes('성장관리계획구역') || r.includes('성장관리방안'));

  // 자연취락지구 특례: 녹지·관리·농림지역 내 자연취락지구는 건폐율 50% 이하(조례 기준), 용적률 100% 이하로 대폭 완화
  if (isSettlementDistrict) {
    return {
      bcRatLimit: 50,
      vlRatLimit: 100,
      desc: `${name || '해당지역'} (자연취락지구 특례 적용: 건폐율 50% 이하, 용적률 100% 이하)`
    };
  }

  // 계획관리지역 내 성장관리계획구역 특례: 건폐율 50% 이하, 용적률 125% 이하
  if (isGrowthPlanDistrict && name.includes('계획관리')) {
    return {
      bcRatLimit: 50,
      vlRatLimit: 125,
      desc: '계획관리지역 (성장관리계획구역 완화: 건폐율 50% 이하, 용적률 125% 이하)'
    };
  }

  // 주거지역
  if (name.includes('제1종전용주거')) return { bcRatLimit: 50, vlRatLimit: 100, desc: '제1종전용주거지역 (건폐율 50%↓, 용적률 100%↓)' };
  if (name.includes('제2종전용주거')) return { bcRatLimit: 50, vlRatLimit: 150, desc: '제2종전용주거지역 (건폐율 50%↓, 용적률 150%↓)' };
  if (name.includes('제1종일반주거')) return { bcRatLimit: 60, vlRatLimit: 200, desc: '제1종일반주거지역 (건폐율 60%↓, 용적률 200%↓)' };
  if (name.includes('제2종일반주거')) return { bcRatLimit: 60, vlRatLimit: 250, desc: '제2종일반주거지역 (건폐율 60%↓, 용적률 250%↓)' };
  if (name.includes('제3종일반주거')) return { bcRatLimit: 50, vlRatLimit: 300, desc: '제3종일반주거지역 (건폐율 50%↓, 용적률 300%↓)' };
  if (name.includes('준주거')) return { bcRatLimit: 70, vlRatLimit: 500, desc: '준주거지역 (건폐율 70%↓, 용적률 500%↓)' };

  // 상업지역
  if (name.includes('중심상업')) return { bcRatLimit: 90, vlRatLimit: 1500, desc: '중심상업지역 (건폐율 90%↓, 용적률 1,500%↓)' };
  if (name.includes('일반상업')) return { bcRatLimit: 80, vlRatLimit: 1300, desc: '일반상업지역 (건폐율 80%↓, 용적률 1,300%↓)' };
  if (name.includes('근린상업')) return { bcRatLimit: 70, vlRatLimit: 900, desc: '근린상업지역 (건폐율 70%↓, 용적률 900%↓)' };
  if (name.includes('유통상업')) return { bcRatLimit: 80, vlRatLimit: 1100, desc: '유통상업지역 (건폐율 80%↓, 용적률 1,100%↓)' };

  // 공업지역
  if (name.includes('전용공업')) return { bcRatLimit: 70, vlRatLimit: 300, desc: '전용공업지역 (건폐율 70%↓, 용적률 300%↓)' };
  if (name.includes('일반공업')) return { bcRatLimit: 70, vlRatLimit: 350, desc: '일반공업지역 (건폐율 70%↓, 용적률 350%↓)' };
  if (name.includes('준공업')) return { bcRatLimit: 70, vlRatLimit: 400, desc: '준공업지역 (건폐율 70%↓, 용적률 400%↓)' };

  // 녹지지역
  if (name.includes('보전녹지')) return { bcRatLimit: 20, vlRatLimit: 80, desc: '보전녹지지역 (건폐율 20%↓, 용적률 80%↓)' };
  if (name.includes('생산녹지')) return { bcRatLimit: 20, vlRatLimit: 100, desc: '생산녹지지역 (건폐율 20%↓, 용적률 100%↓)' };
  if (name.includes('자연녹지')) return { bcRatLimit: 20, vlRatLimit: 100, desc: '자연녹지지역 (건폐율 20%↓, 용적률 100%↓)' };

  // 관리지역
  if (name.includes('계획관리')) return { bcRatLimit: 40, vlRatLimit: 100, desc: '계획관리지역 (건폐율 40%↓, 용적률 100%↓)' };
  if (name.includes('생산관리')) return { bcRatLimit: 20, vlRatLimit: 80, desc: '생산관리지역 (건폐율 20%↓, 용적률 80%↓)' };
  if (name.includes('보전관리')) return { bcRatLimit: 20, vlRatLimit: 80, desc: '보전관리지역 (건폐율 20%↓, 용적률 80%↓)' };

  // 농림 및 자연환경보전
  if (name.includes('농림')) return { bcRatLimit: 20, vlRatLimit: 80, desc: '농림지역 (건폐율 20%↓, 용적률 80%↓)' };
  if (name.includes('자연환경보전')) return { bcRatLimit: 20, vlRatLimit: 80, desc: '자연환경보전지역 (건폐율 20%↓, 용적률 80%↓)' };

  return { bcRatLimit: 60, vlRatLimit: 200, desc: `${name || '일반지역'} (지자체 조례 기준 확인 요망)` };
}

/**
 * 국토교통부 건축물대장 (건축HUB 표제부) API 안전 호출 (자동 재시도 및 타임아웃 방어)
 */
async function fetchBuildingInfoWithRetry(
  serviceKey: string,
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string,
  isMountain: boolean,
  maxRetries = 3
): Promise<{ items: any[]; hasError: boolean }> {
  if (!serviceKey || !sigunguCd || !bjdongCd || !bun) return { items: [], hasError: false };

  const baseParams: any = {
    serviceKey,
    sigunguCd,
    bjdongCd,
    bun,
    ji,
    numOfRows: 30,
    pageNo: 1,
    _type: 'json'
  };

  // 산인 경우에만 platGbCd: '1' 전달. 일반 대지일 때는 platGbCd를 생략해야 data.go.kr 게이트웨이 타임아웃(503)을 방지할 수 있음
  if (isMountain) {
    baseParams.platGbCd = '1';
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get('https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo', {
        params: baseParams,
        timeout: 9000 // 충분한 응답 대기 시간 확보
      });

      const items = res.data?.response?.body?.items?.item;
      if (!items) {
        // 만약 ji가 '0000'이고 결과가 없으면, ji 파라미터 없이 재조회 시도
        if (ji === '0000') {
          const paramsWithoutJi = { ...baseParams };
          delete paramsWithoutJi.ji;
          try {
            const fallbackRes = await axios.get('https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo', {
              params: paramsWithoutJi,
              timeout: 7000
            });
            const fallbackItems = fallbackRes.data?.response?.body?.items?.item;
            if (fallbackItems) {
              return { items: Array.isArray(fallbackItems) ? fallbackItems : [fallbackItems], hasError: false };
            }
          } catch (e) {
            // ignore fallback error
          }
        }
        return { items: [], hasError: false };
      }
      return { items: Array.isArray(items) ? items : [items], hasError: false };
    } catch (err: any) {
      lastError = err;
      console.warn(`건축물대장 조회 [시도 ${attempt}/${maxRetries}] 오류:`, err.response?.status || err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 + attempt * 500));
      }
    }
  }

  // getBrTitleInfo가 지속적으로 타임아웃 또는 실패할 경우 getBrBasisOulnInfo 등으로 추가 시도
  try {
    const basisRes = await axios.get('https://apis.data.go.kr/1613000/BldRgstHubService/getBrBasisOulnInfo', {
      params: baseParams,
      timeout: 7000
    });
    const basisItems = basisRes.data?.response?.body?.items?.item;
    if (basisItems) {
      return { items: Array.isArray(basisItems) ? basisItems : [basisItems], hasError: false };
    }
  } catch (e) {
    // ignore
  }

  return { items: [], hasError: true };
}

export async function getIntegratedPropertyReport(queryAddress: string): Promise<IntegratedPropertyReport> {
  const trimmedAddress = queryAddress.trim();
  if (!trimmedAddress) {
    throw new Error('주소를 입력해 주세요.');
  }

  // 1. 캐시 확인 (v6: 대지면적 누락 시 토지대장 면적 fallback 적용 및 합산 건폐/용적률 계산)
  const cacheKey = `property_integrated_v6_${trimmedAddress}`;
  const cached = memoryCache.get<IntegratedPropertyReport>(cacheKey);
  if (cached) {
    return cached;
  }

  const KAKAO_KEY = process.env.KAKAO_REST_API_KEY || process.env.KAKAO_API_KEY;
  const VWORLD_KEY = process.env.VWORLD_API_KEY;
  const DATA_GO_KEY = process.env.DATA_GO_KR_API_KEY 
    ? decodeURIComponent(process.env.DATA_GO_KR_API_KEY) 
    : '';

  if (!KAKAO_KEY) {
    throw new Error('KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  // 2. 카카오 로컬 주소 검색
  const kakaoRes = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
    params: { query: trimmedAddress },
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    timeout: 5000
  });

  if (!kakaoRes.data?.documents || kakaoRes.data.documents.length === 0) {
    throw new Error(`'${trimmedAddress}' 주소를 찾을 수 없습니다. 정확한 지번이나 도로명 주소를 입력해 주세요.`);
  }

  const doc = kakaoRes.data.documents[0];
  const addr = doc.address || doc.road_address;
  const roadAddr = doc.road_address;

  const bCode = addr?.b_code || '';
  const isMountain = addr?.mountain_yn === 'Y';
  const mountainCode = isMountain ? '2' : '1';
  const mainBun = (addr?.main_address_no || '0').padStart(4, '0');
  const subBun = (addr?.sub_address_no || '0').padStart(4, '0');
  const pnu = `${bCode}${mountainCode}${mainBun}${subBun}`;
  const sigunguCd = bCode.substring(0, 5);
  const bjdongCd = bCode.substring(5, 10);
  const lat = parseFloat(addr?.y || '0');
  const lng = parseFloat(addr?.x || '0');

  const basicInfo = {
    addressName: addr?.address_name || trimmedAddress,
    roadAddressName: roadAddr?.address_name || '',
    pnu,
    sigunguCd,
    bjdongCd,
    bun: mainBun,
    ji: subBun,
    isMountain,
    lat,
    lng
  };

  // 3. 브이월드 토지특성 및 토지이용계획 비동기 호출
  const landCharacteristicPromise = VWORLD_KEY
    ? axios.get('https://api.vworld.kr/ned/data/getLandCharacteristics', {
        params: {
          key: VWORLD_KEY,
          pnu,
          format: 'json',
          numOfRows: 30,
          pageNo: 1,
          domain: 'leegyver.com'
        },
        timeout: 6000
      }).then(r => {
        const raw = r.data?.landCharacteristicss?.field;
        if (!raw) return null;
        const list = Array.isArray(raw) ? raw : [raw];
        // 최신 기준연도(stdrYear) 내림차순 정렬하여 가장 최근 공시지가 및 토지특성을 픽!
        list.sort((a: any, b: any) => parseInt(b.stdrYear || '0', 10) - parseInt(a.stdrYear || '0', 10));
        return list[0] || null;
      }).catch(err => {
        console.error('VWorld 토지특성 오류:', err.message);
        return null;
      })
    : Promise.resolve(null);

  const landUsePromise = VWORLD_KEY
    ? axios.get('https://api.vworld.kr/ned/data/getLandUseAttr', {
        params: {
          key: VWORLD_KEY,
          pnu,
          format: 'json',
          numOfRows: 30,
          pageNo: 1,
          domain: 'leegyver.com'
        },
        timeout: 6000
      }).then(r => {
        const fields = r.data?.landUses?.field;
        if (!fields) return [];
        return Array.isArray(fields) ? fields : [fields];
      }).catch(err => {
        console.error('VWorld 토지이용계획 오류:', err.message);
        return [];
      })
    : Promise.resolve([]);

  // 토지 소유정보 조회 (소유구분, 공유인수, 거주구분, 변동일자/원인)
  const possessionPromise = VWORLD_KEY
    ? axios.get('https://api.vworld.kr/ned/data/getPossessionAttr', {
        params: {
          key: VWORLD_KEY,
          pnu,
          format: 'json',
          numOfRows: 10,
          pageNo: 1,
          domain: 'leegyver.com'
        },
        timeout: 6000
      }).then(r => r.data?.possessions?.field?.[0] || null).catch(err => {
        console.error('VWorld 토지소유정보 오류:', err.message);
        return null;
      })
    : Promise.resolve(null);

  // 4. 건축물대장 (건축HUB 표제부) 호출 - 503 방어 및 재시도 포함
  const buildingPromise = DATA_GO_KEY
    ? fetchBuildingInfoWithRetry(DATA_GO_KEY, sigunguCd, bjdongCd, mainBun, subBun, isMountain)
    : Promise.resolve({ items: [], hasError: false });

  // 5. 최근 실거래가 조회 (최근 2개 월 기준)
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const recentYmds: string[] = [];
  for (let i = 0; i < 2; i++) {
    const d = new Date(year, currentMonth - 1 - i, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    recentYmds.push(ym);
  }

  // 아파트 매매 + 단독다가구 매매 + 토지 매매 최근 거래내역 수집
  const transactionPromises: Promise<any[]>[] = [];
  if (DATA_GO_KEY && sigunguCd) {
    for (const dealYmd of recentYmds) {
      // 1. 아파트 매매
      transactionPromises.push(
        axios.get('https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev', {
          params: { serviceKey: DATA_GO_KEY, LAWD_CD: sigunguCd, DEAL_YMD: dealYmd, numOfRows: 40, pageNo: 1, _type: 'json' },
          timeout: 4000
        }).then(r => (r.data?.response?.body?.items?.item || []))
          .then(items => (Array.isArray(items) ? items : [items]).map((it: any) => ({ ...it, __tradeType: '아파트' })))
          .catch(() => [])
      );

      // 2. 단독다가구 매매
      transactionPromises.push(
        axios.get('https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade', {
          params: { serviceKey: DATA_GO_KEY, LAWD_CD: sigunguCd, DEAL_YMD: dealYmd, numOfRows: 40, pageNo: 1, _type: 'json' },
          timeout: 4000
        }).then(r => (r.data?.response?.body?.items?.item || []))
          .then(items => (Array.isArray(items) ? items : [items]).map((it: any) => ({ ...it, __tradeType: '단독다가구' })))
          .catch(() => [])
      );

      // 3. 토지 매매
      transactionPromises.push(
        axios.get('https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade', {
          params: { serviceKey: DATA_GO_KEY, LAWD_CD: sigunguCd, DEAL_YMD: dealYmd, numOfRows: 40, pageNo: 1, _type: 'json' },
          timeout: 4000
        }).then(r => (r.data?.response?.body?.items?.item || []))
          .then(items => (Array.isArray(items) ? items : [items]).map((it: any) => ({ ...it, __tradeType: '토지' })))
          .catch(() => [])
      );
    }
  }

  // 6. 비동기 단계별 실행 (공공데이터포털 동시 요청수 분리로 건축물대장 503 타임아웃 방지)
  // 1단계: 토지대장 및 건축물대장 우선 호출
  const [landData, landUseList, possessionData, buildingResult] = await Promise.all([
    landCharacteristicPromise,
    landUsePromise,
    possessionPromise,
    buildingPromise
  ]);

  const buildingItems = buildingResult?.items || [];

  // 2단계: 실거래가 비동기 호출
  const tradeResults = await Promise.all(transactionPromises);

  // 6. 데이터 가공 및 정제
  // (1) 토지대장 데이터
  const landAreaM2 = parseFloat(landData?.lndpclAr || '0');
  const landAreaPyeong = Math.round(landAreaM2 * 0.3025 * 10) / 10;
  const officialPrice = parseInt(landData?.pblntfPclnd || '0', 10);
  const totalOfficialPrice = Math.round(landAreaM2 * officialPrice);

  const regulationSet = new Set<string>();
  if (Array.isArray(landUseList)) {
    landUseList.forEach((u: any) => {
      if (u.prposAreaDstrcCodeNm) {
        regulationSet.add(u.prposAreaDstrcCodeNm);
      }
    });
  }
  if (landData?.prposArea2Nm && landData.prposArea2Nm !== '지정되지않음') {
    regulationSet.add(landData.prposArea2Nm);
  }

  const regList = Array.from(regulationSet);
  const zoningLimits = getZoningLimits(landData?.prposArea1Nm || '', regList);

  const landLedger = {
    hasData: !!landData,
    landCategoryNm: landData?.lndcgrCodeNm || '-',
    areaM2: landAreaM2,
    areaPyeong: landAreaPyeong,
    officialPricePerM2: officialPrice,
    officialPriceTotal: totalOfficialPrice,
    standardYear: landData?.stdrYear || '-',
    useArea1Nm: landData?.prposArea1Nm || '-',
    useArea2Nm: landData?.prposArea2Nm !== '지정되지않음' ? landData?.prposArea2Nm : '',
    roadSideNm: landData?.roadSideCodeNm || '-',
    terrainHeightNm: landData?.tpgrphHgCodeNm || '-',
    terrainShapeNm: landData?.tpgrphFrmCodeNm || '-',
    regulations: Array.from(regulationSet),
    legalBcRatLimit: zoningLimits.bcRatLimit,
    legalVlRatLimit: zoningLimits.vlRatLimit,
    legalZoningDesc: zoningLimits.desc
  };

  // (2) 소유 및 공유인 정보
  const coOwnerCount = parseInt(possessionData?.cnrsPsnCo || '0', 10);
  const isCoOwned = coOwnerCount > 0;
  const ownership = {
    hasData: !!possessionData,
    ownerTypeNm: possessionData?.posesnSeCodeNm || (landData ? '개인' : '미확인'),
    residenceTypeNm: possessionData?.resdncSeCodeNm || '-',
    coOwnerCount,
    isCoOwned,
    changeCauseNm: possessionData?.ownshipChgCauseCodeNm || '소유권변동',
    changeDate: formatDate(possessionData?.ownshipChgDe),
    note: '공공 오픈API 특성상 소유자 실명, 주민번호, 전체 주소는 개인정보보호법에 따라 비공개 처리됩니다. 소유자 성명 및 공유인별 상세 지분 명부는 대법원 인터넷등기소(등기부등본) 열람으로 확인하실 수 있습니다.'
  };

  // (3) 건축물대장 데이터
  const currentYear = new Date().getFullYear();
  const buildings = buildingItems.map((b: any) => {
    const totArea = parseFloat(b.totArea || '0');
    const totPyeong = Math.round(totArea * 0.3025 * 10) / 10;
    const approvalDay = b.useAprDay ? String(b.useAprDay).trim() : '';
    const buildYear = approvalDay.length >= 4 ? parseInt(approvalDay.substring(0, 4), 10) : 0;
    const age = buildYear > 0 ? Math.max(0, currentYear - buildYear) : 0;

    // 위반건축물 여부 (비고나 명칭, 기타필드에 위반 표기 여부 확인)
    const isViolated = String(b.etcPurps || '').includes('위반') ||
                       String(b.regstrKindCdNm || '').includes('위반') ||
                       String(b.bldNm || '').includes('위반');

    const rawPlatArea = parseFloat(b.platArea || '0');
    // 건축물대장에 대지면적이 0 또는 누락된 경우 토지대장의 대지면적(landAreaM2) 대체 적용
    const platArea = rawPlatArea > 0 ? rawPlatArea : (landAreaM2 > 0 ? landAreaM2 : 0);
    const archArea = parseFloat(b.archArea || '0');
    let bcRat = parseFloat(b.bcRat || '0');
    let vlRat = parseFloat(b.vlRat || '0');

    // 대장상 비율이 0이거나 누락된 경우 대지·건축면적으로부터 자동 산출
    if (bcRat <= 0 && platArea > 0 && archArea > 0) {
      bcRat = Math.round((archArea / platArea) * 10000) / 100;
    }
    if (vlRat <= 0 && platArea > 0 && totArea > 0) {
      vlRat = Math.round((totArea / platArea) * 10000) / 100;
    }

    const rawBldNm = b.bldNm ? String(b.bldNm).trim() : '';
    const rawDongNm = b.dongNm ? String(b.dongNm).trim() : '';
    let displayBldNm = rawBldNm;
    if (!displayBldNm) {
      if (rawDongNm) {
        displayBldNm = rawDongNm.endsWith('동') ? rawDongNm : `${rawDongNm}동`;
      } else {
        displayBldNm = b.mainPurpsCdNm?.trim() || b.etcPurps?.trim() || '건축물';
      }
    } else if (rawDongNm && !displayBldNm.includes(rawDongNm)) {
      displayBldNm = `${displayBldNm} (${rawDongNm})`;
    }

    return {
      bldNm: displayBldNm,
      dongNm: rawDongNm,
      mainPurpsNm: b.mainPurpsCdNm?.trim() || b.etcPurps?.trim() || '일반건축물',
      etcPurps: b.etcPurps?.trim() || '',
      strctNm: b.strctCdNm?.trim() || b.etcStrct?.trim() || '-',
      roofNm: b.roofCdNm?.trim() || b.etcRoof?.trim() || '-',
      platAreaM2: platArea,
      archAreaM2: archArea,
      totAreaM2: totArea,
      totAreaPyeong: totPyeong,
      bcRat,
      vlRat,
      legalBcRatLimit: zoningLimits.bcRatLimit,
      legalVlRatLimit: zoningLimits.vlRatLimit,
      grndFlrCnt: parseInt(b.grndFlrCnt || '0', 10),
      ugrndFlrCnt: parseInt(b.ugrndFlrCnt || '0', 10),
      parkingCount: (parseInt(b.indrAutoUtcnt || '0', 10) + parseInt(b.oudrAutoUtcnt || '0', 10) + parseInt(b.indrMechUtcnt || '0', 10) + parseInt(b.oudrMechUtcnt || '0', 10)),
      elvtCount: parseInt(b.rideUseElvtCnt || '0', 10) + parseInt(b.emgenUseElvtCnt || '0', 10),
      useAprDay: formatDate(approvalDay),
      buildingAgeYears: age,
      isViolated
    };
  });

  const buildingLedger = {
    hasData: buildings.length > 0,
    hasError: !!buildingResult?.hasError,
    buildingCount: buildings.length,
    buildings
  };

  // (3) 실거래가 목록 데이터 정제
  const rawTrades = tradeResults.flat();
  const parsedTrades = rawTrades.map((t: any) => {
    let rawAmount = String(t.dealAmount || t.거래금액 || '0').trim().replace(/,/g, '');
    const amountVal = parseInt(rawAmount, 10) || 0;

    // 면적 필드 추출 (토지: dealArea, 아파트/오피스텔: excluUseAr, 주택: plottageAr/totalFloorAr)
    const rawArea = t.dealArea || t.excluUseAr || t.plottageAr || t.totalFloorAr || t.전용면적 || t.연면적 || t.대지면적 || '0';
    const excluAr = parseFloat(String(rawArea).trim().replace(/,/g, '')) || 0;
    const pyeong = Math.round(excluAr * 0.3025 * 10) / 10;
    const pyeongPrice = pyeong > 0 ? Math.round(amountVal / pyeong) : 0;

    // 면적 구분 라벨
    const areaTypeLabel = t.__tradeType === '토지' ? '토지면적' : (t.__tradeType === '단독다가구' ? '대지/연면적' : '전용면적');

    const dealYear = t.dealYear || t.년 || '';
    const dealMonth = String(t.dealMonth || t.월 || '').padStart(2, '0');
    const dealDay = String(t.dealDay || t.일 || '').padStart(2, '0');
    const dealDate = dealYear && dealMonth && dealDay ? `${dealYear}-${dealMonth}-${dealDay}` : '';

    // 해당 선택 지번 직접 매칭 판별
    const targetBunNum = parseInt(mainBun, 10);
    const targetJiNum = parseInt(subBun, 10);
    const targetJibunClean = targetJiNum > 0 ? `${targetBunNum}-${targetJiNum}` : `${targetBunNum}`;

    let isDirectMatch = false;

    // 1. 아파트 bonbun / bubun 확인
    if (t.bonbun !== undefined && t.bonbun !== null && String(t.bonbun).trim() !== '') {
      const itBon = parseInt(String(t.bonbun), 10);
      const itBu = parseInt(String(t.bubun || '0'), 10);
      if (!isNaN(itBon) && itBon === targetBunNum && (targetJiNum === 0 ? (itBu === 0 || isNaN(itBu)) : itBu === targetJiNum)) {
        isDirectMatch = true;
      }
    }

    // 2. jibun 문자열 매칭 (단독주택/토지 등)
    const itemJibun = String(t.jibun || t.지번 || '').trim();
    if (!isDirectMatch && itemJibun) {
      if (itemJibun === targetJibunClean || itemJibun === String(targetBunNum)) {
        isDirectMatch = true;
      }
    }

    // 3. 법정동 일치 여부 확인 (동일 읍면동인지 검증)
    if (isDirectMatch) {
      const itemDong = String(t.umdNm || t.법정동 || '').trim();
      const addrFull = basicInfo.addressName;
      if (itemDong && !addrFull.includes(itemDong) && !itemDong.includes(addr?.region_3depth_name || '')) {
        isDirectMatch = false;
      }
    }

    // 물건 명칭 정제
    let tradeName = t.aptNm || t.아파트 || t.주택유형 || '';
    if (!tradeName) {
      if (t.__tradeType === '토지' || t.jimok) {
        tradeName = `토지 (${t.jimok || '필지'}${t.landUse ? `, ${t.landUse}` : ''})`;
      } else if (t.houseType) {
        tradeName = `${t.houseType}주택`;
      } else {
        tradeName = '부동산 매매';
      }
    }

    return {
      category: (t.__tradeType || '아파트') as '아파트' | '연립다세대' | '단독다가구' | '토지',
      name: tradeName,
      dealAmount: amountVal,
      dealAmountFormatted: formatMoney(amountVal),
      dealDate,
      areaM2: excluAr,
      areaPyeong: pyeong,
      areaTypeLabel,
      floor: parseInt(t.floor || t.층 || '0', 10) || undefined,
      dong: t.umdNm || t.법정동 || '',
      jibun: String(t.jibun || t.지번 || (t.bonbun ? `${parseInt(t.bonbun, 10)}${parseInt(t.bubun, 10) > 0 ? `-${parseInt(t.bubun, 10)}` : ''}` : '')),
      pyeongPriceFormatted: pyeongPrice > 0 ? `${pyeongPrice.toLocaleString()}만원/평` : '-',
      isDirectMatch
    };
  }).filter((t: any) => t.dealAmount > 0);

  // 해당 주소지 직접 거래와 주변 거래 분리
  const directTrades = parsedTrades.filter((t: any) => t.isDirectMatch);
  const nearbyTrades = parsedTrades.filter((t: any) => !t.isDirectMatch);

  // 최신 거래일자 순 정렬
  directTrades.sort((a: any, b: any) => (b.dealDate > a.dealDate ? 1 : -1));
  nearbyTrades.sort((a: any, b: any) => (b.dealDate > a.dealDate ? 1 : -1));

  // 직접 거래를 최우선으로 배치하고, 주변 거래를 뒤에 연결
  const combinedItems = [...directTrades, ...nearbyTrades.slice(0, 20)];

  const transactions = {
    hasData: parsedTrades.length > 0,
    count: parsedTrades.length,
    hasDirectTrades: directTrades.length > 0,
    directTrades,
    nearbyTrades: nearbyTrades.slice(0, 20),
    items: combinedItems
  };

  // (4) AI 자동 종합 브리핑 생성
  const points: string[] = [];
  const riskAnalysis: string[] = [];

  // 토지 평가
  if (landLedger.hasData) {
    points.push(`[토지] 지목은 '${landLedger.landCategoryNm}', 대지면적은 ${landLedger.areaM2.toLocaleString()}㎡(약 ${landLedger.areaPyeong}평)입니다.`);
    if (landLedger.legalZoningDesc && landLedger.legalZoningDesc.includes('특례')) {
      points.push(`[용도 및 규제] 국토계획법상 '${landLedger.useArea1Nm}'이며, ${landLedger.legalZoningDesc}이 적용되어 법정 기준은 건폐율 ${landLedger.legalBcRatLimit}% 이하, 용적률 ${landLedger.legalVlRatLimit}% 이하입니다.`);
    } else {
      points.push(`[용도 및 규제] 국토계획법상 '${landLedger.useArea1Nm}'이며, 법정 기준은 건폐율 ${landLedger.legalBcRatLimit}% 이하, 용적률 ${landLedger.legalVlRatLimit}% 이하입니다.`);
    }
    if (landLedger.officialPricePerM2 > 0) {
      points.push(`[최신 공시지가] ${landLedger.standardYear}년 공시 기준 ㎡당 ${landLedger.officialPricePerM2.toLocaleString()}원 (토지 총 공시지가 기준 약 ${formatMoney(Math.round(landLedger.officialPriceTotal / 10000))})입니다.`);
    }
    if (ownership.hasData) {
      points.push(`[소유관계] ${ownership.ownerTypeNm} (${ownership.isCoOwned ? `공유인 ${ownership.coOwnerCount}명 공동소유` : '단독소유'}), 거주구분: ${ownership.residenceTypeNm}, 최근 변동일: ${ownership.changeDate} (${ownership.changeCauseNm})`);
    }
  }

  // 건물 평가
  if (buildingLedger.hasData) {
    const isMulti = buildingLedger.buildings.length > 1;
    const mainBld = buildingLedger.buildings[0];
    const totalArchArea = buildingLedger.buildings.reduce((sum: number, b: any) => sum + (b.archAreaM2 || 0), 0);
    const totalTotArea = buildingLedger.buildings.reduce((sum: number, b: any) => sum + (b.totAreaM2 || 0), 0);
    const refPlatArea = landAreaM2 > 0 ? landAreaM2 : (mainBld.platAreaM2 || 0);

    let overallBcRat = 0;
    let overallVlRat = 0;
    if (refPlatArea > 0 && totalArchArea > 0) {
      overallBcRat = Math.round((totalArchArea / refPlatArea) * 10000) / 100;
    }
    if (refPlatArea > 0 && totalTotArea > 0) {
      overallVlRat = Math.round((totalTotArea / refPlatArea) * 10000) / 100;
    }

    if (isMulti) {
      points.push(`[건물] 총 ${buildingLedger.buildingCount}개동(주동: '${mainBld.bldNm}' 등), 필지 전체 연면적 ${totalTotArea.toLocaleString()}㎡(약 ${Math.round(totalTotArea * 0.3025 * 10) / 10}평) 규모입니다.`);
      if (overallBcRat > 0 && overallVlRat > 0) {
        points.push(`[건폐/용적] 필지 전체 합산 건폐율 ${overallBcRat}%, 용적률 ${overallVlRat}% (법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      } else if (overallBcRat > 0) {
        points.push(`[건폐/용적] 필지 전체 합산 건폐율 ${overallBcRat}% (법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      } else if (overallVlRat > 0) {
        points.push(`[건폐/용적] 필지 전체 합산 용적률 ${overallVlRat}% (법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      } else {
        points.push(`[건폐/용적] 건축물대장상 건폐율·용적률 미기재 (해당 용도지역 법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      }
    } else {
      points.push(`[건물] 주용도 '${mainBld.mainPurpsNm}', ${mainBld.strctNm}으로 지상 ${mainBld.grndFlrCnt}층 연면적 ${mainBld.totAreaM2.toLocaleString()}㎡(약 ${mainBld.totAreaPyeong}평) 규모입니다.`);
      if (mainBld.bcRat > 0 && mainBld.vlRat > 0) {
        points.push(`[건폐/용적] 실제 건폐율 ${mainBld.bcRat}%, 실제 용적률 ${mainBld.vlRat}% (법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      } else if (mainBld.bcRat > 0) {
        points.push(`[건폐/용적] 실제 건폐율 ${mainBld.bcRat}% (법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      } else if (mainBld.vlRat > 0) {
        points.push(`[건폐/용적] 실제 용적률 ${mainBld.vlRat}% (법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      } else {
        points.push(`[건폐/용적] 건축물대장상 건폐율·용적률 미기재 (해당 용도지역 법정 상한: 건폐율 ${mainBld.legalBcRatLimit}%↓, 용적률 ${mainBld.legalVlRatLimit}%↓)입니다.`);
      }
    }

    if (mainBld.useAprDay && mainBld.useAprDay !== '-') {
      points.push(`[준공] ${mainBld.useAprDay} 사용승인 (준공 후 약 ${mainBld.buildingAgeYears}년 경과)된 건물입니다.`);
    }

    if (mainBld.isViolated) {
      riskAnalysis.push('⚠️ 건축물대장상 위반건축물 표기 또는 위반 소지가 있으므로 상세 확인이 필수적입니다.');
    } else {
      riskAnalysis.push(' 건축물대장상 별도의 위반건축물 등재 내역이 없는 정상 건물입니다.');
    }
  } else {
    points.push('[건물] 현재 공부상 등재된 건축물이 없는 나대지 상태이거나 가설건축물일 수 있습니다.');
  }

  // 규제 사항
  if (landLedger.regulations.length > 0) {
    const keyRegs = landLedger.regulations.slice(0, 5).join(', ');
    riskAnalysis.push(`📋 주요 지정 및 규제사항: ${keyRegs} 등이 지정되어 개발 및 건축 시 조례 확인이 필요합니다.`);
  }

  // 실거래 분석
  if (transactions.hasDirectTrades) {
    const direct = transactions.directTrades[0];
    points.push(`[해당 지번 실거래] 선택하신 주소지(${basicInfo.addressName})의 직접 실거래 신고 내역이 있습니다: ${direct.dealDate} ${direct.name} (${direct.dealAmountFormatted}, ${direct.pyeongPriceFormatted})`);
  } else if (transactions.nearbyTrades.length > 0) {
    const nearby = transactions.nearbyTrades[0];
    points.push(`[인근 실거래] 해당 지번의 최근 직접 거래는 없으며, 인근 실거래 사례: ${nearby.name} (${nearby.dealDate}) - ${nearby.dealAmountFormatted} (${nearby.pyeongPriceFormatted})`);
  }

  const headline = `${basicInfo.addressName} 부동산 통합 분석 리포트`;

  const report: IntegratedPropertyReport = {
    success: true,
    query: trimmedAddress,
    searchedAt: new Date().toISOString(),
    basicInfo,
    landLedger,
    ownership,
    buildingLedger,
    transactions,
    aiSummary: {
      headline,
      points,
      riskAnalysis
    }
  };

  // 건축물대장 조회가 503 등으로 실패한 상태가 아닐 때만 1시간 동안 메모리 캐시 보관
  if (!buildingResult?.hasError) {
    memoryCache.set(cacheKey, report, 60 * 60 * 1000);
  }

  return report;
}

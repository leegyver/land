import axios from 'axios';
import { memoryCache } from '../cache';

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
    items: Array<{
      category: '아파트' | '연립다세대' | '단독다가구' | '토지';
      name: string;
      dealAmount: number; // 거래금액 (만원)
      dealAmountFormatted: string; // 거래금액 (억/만원)
      dealDate: string; // YYYY-MM-DD
      areaM2: number;
      areaPyeong: number;
      floor?: number;
      dong?: string;
      jibun?: string;
      pyeongPriceFormatted: string; // 평당 가격
    }>;
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

export async function getIntegratedPropertyReport(queryAddress: string): Promise<IntegratedPropertyReport> {
  const trimmedAddress = queryAddress.trim();
  if (!trimmedAddress) {
    throw new Error('주소를 입력해 주세요.');
  }

  // 1. 캐시 확인
  const cacheKey = `property_integrated_v1_${trimmedAddress}`;
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
          numOfRows: 5,
          pageNo: 1,
          domain: 'leegyver.com'
        },
        timeout: 6000
      }).then(r => r.data?.landCharacteristicss?.field?.[0] || null).catch(err => {
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

  // 4. 건축물대장 (건축HUB 표제부) 호출
  const buildingPromise = DATA_GO_KEY
    ? axios.get('https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo', {
        params: {
          serviceKey: DATA_GO_KEY,
          sigunguCd,
          bjdongCd,
          platGbCd: isMountain ? '1' : '0',
          bun: mainBun,
          ji: subBun,
          numOfRows: 10,
          pageNo: 1,
          _type: 'json'
        },
        timeout: 6000
      }).then(r => {
        const items = r.data?.response?.body?.items?.item;
        if (!items) return [];
        return Array.isArray(items) ? items : [items];
      }).catch(err => {
        console.error('건축물대장 조회 오류:', err.message);
        return [];
      })
    : Promise.resolve([]);

  // 5. 최근 실거래가 조회 (최근 1~2개 분기)
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const recentYmds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(year, currentMonth - 1 - i, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    recentYmds.push(ym);
  }

  // 아파트 매매 + 단독다가구 매매 + 토지 매매 최근 거래내역 수집
  const transactionPromises: Promise<any[]>[] = [];
  if (DATA_GO_KEY && sigunguCd) {
    // 가장 최근 2개 월의 아파트 및 단독다가구 조회
    for (const dealYmd of recentYmds.slice(0, 2)) {
      transactionPromises.push(
        axios.get('https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev', {
          params: { serviceKey: DATA_GO_KEY, LAWD_CD: sigunguCd, DEAL_YMD: dealYmd, numOfRows: 20, pageNo: 1, _type: 'json' },
          timeout: 4000
        }).then(r => (r.data?.response?.body?.items?.item || []))
          .then(items => (Array.isArray(items) ? items : [items]).map((it: any) => ({ ...it, __tradeType: '아파트' })))
          .catch(() => [])
      );

      transactionPromises.push(
        axios.get('https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade', {
          params: { serviceKey: DATA_GO_KEY, LAWD_CD: sigunguCd, DEAL_YMD: dealYmd, numOfRows: 20, pageNo: 1, _type: 'json' },
          timeout: 4000
        }).then(r => (r.data?.response?.body?.items?.item || []))
          .then(items => (Array.isArray(items) ? items : [items]).map((it: any) => ({ ...it, __tradeType: '단독다가구' })))
          .catch(() => [])
      );
    }
  }

  // 비동기 병렬 실행
  const [landData, landUseList, possessionData, buildingItems, ...tradeResults] = await Promise.all([
    landCharacteristicPromise,
    landUsePromise,
    possessionPromise,
    buildingPromise,
    ...transactionPromises
  ]);

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
    regulations: Array.from(regulationSet)
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

    return {
      bldNm: b.bldNm?.trim() || (b.dongNm?.trim() ? `${b.dongNm}동` : '건축물'),
      dongNm: b.dongNm?.trim() || '',
      mainPurpsNm: b.mainPurpsCdNm?.trim() || '기타',
      etcPurps: b.etcPurps?.trim() || '',
      strctNm: b.strctCdNm?.trim() || b.etcStrct?.trim() || '-',
      roofNm: b.roofCdNm?.trim() || b.etcRoof?.trim() || '-',
      platAreaM2: parseFloat(b.platArea || '0'),
      archAreaM2: parseFloat(b.archArea || '0'),
      totAreaM2: totArea,
      totAreaPyeong: totPyeong,
      bcRat: parseFloat(b.bcRat || '0'),
      vlRat: parseFloat(b.vlRat || '0'),
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
    buildingCount: buildings.length,
    buildings
  };

  // (3) 실거래가 목록 데이터 정제
  const rawTrades = tradeResults.flat();
  const parsedTrades = rawTrades.map((t: any) => {
    let rawAmount = String(t.dealAmount || t.거래금액 || '0').trim().replace(/,/g, '');
    const amountVal = parseInt(rawAmount, 10) || 0;
    const excluAr = parseFloat(t.excluUseAr || t.전용면적 || t.연면적 || '0');
    const pyeong = Math.round(excluAr * 0.3025 * 10) / 10;
    const pyeongPrice = pyeong > 0 ? Math.round(amountVal / pyeong) : 0;

    const dealYear = t.dealYear || t.년 || '';
    const dealMonth = String(t.dealMonth || t.월 || '').padStart(2, '0');
    const dealDay = String(t.dealDay || t.일 || '').padStart(2, '0');
    const dealDate = dealYear && dealMonth && dealDay ? `${dealYear}-${dealMonth}-${dealDay}` : '';

    return {
      category: (t.__tradeType || '아파트') as '아파트' | '연립다세대' | '단독다가구' | '토지',
      name: t.aptNm || t.아파트 || t.주택유형 || '부동산 거래',
      dealAmount: amountVal,
      dealAmountFormatted: formatMoney(amountVal),
      dealDate,
      areaM2: excluAr,
      areaPyeong: pyeong,
      floor: parseInt(t.floor || t.층 || '0', 10) || undefined,
      dong: t.umdNm || t.법정동 || '',
      jibun: String(t.jibun || t.지번 || ''),
      pyeongPriceFormatted: pyeongPrice > 0 ? `${pyeongPrice.toLocaleString()}만원/평` : '-'
    };
  }).filter((t: any) => t.dealAmount > 0);

  // 최신 거래일자 순 정렬
  parsedTrades.sort((a: any, b: any) => (b.dealDate > a.dealDate ? 1 : -1));

  const transactions = {
    hasData: parsedTrades.length > 0,
    count: parsedTrades.length,
    items: parsedTrades.slice(0, 15) // 최대 15건 반환
  };

  // (4) AI 자동 종합 브리핑 생성
  const points: string[] = [];
  const riskAnalysis: string[] = [];

  // 토지 평가
  if (landLedger.hasData) {
    points.push(`[토지] 지목은 '${landLedger.landCategoryNm}', 대지면적은 ${landLedger.areaM2.toLocaleString()}㎡(약 ${landLedger.areaPyeong}평)입니다.`);
    points.push(`[용도] 국토계획법상 '${landLedger.useArea1Nm}'에 위치하며, 도로조건은 '${landLedger.roadSideNm}'입니다.`);
    if (landLedger.officialPricePerM2 > 0) {
      points.push(`[공시지가] ㎡당 ${landLedger.officialPricePerM2.toLocaleString()}원 (토지 총 공시지가 기준 약 ${formatMoney(Math.round(landLedger.officialPriceTotal / 10000))})입니다.`);
    }
    if (ownership.hasData) {
      points.push(`[소유관계] ${ownership.ownerTypeNm} (${ownership.isCoOwned ? `공유인 ${ownership.coOwnerCount}명 공동소유` : '단독소유'}), 거주구분: ${ownership.residenceTypeNm}, 최근 변동일: ${ownership.changeDate} (${ownership.changeCauseNm})`);
    }
  }

  // 건물 평가
  if (buildingLedger.hasData) {
    const mainBld = buildingLedger.buildings[0];
    points.push(`[건물] 주용도 '${mainBld.mainPurpsNm}', ${mainBld.strctNm}으로 지상 ${mainBld.grndFlrCnt}층 연면적 ${mainBld.totAreaM2.toLocaleString()}㎡(약 ${mainBld.totAreaPyeong}평) 규모입니다.`);
    points.push(`[건폐/용적] 건폐율 ${mainBld.bcRat}%, 용적률 ${mainBld.vlRat}%가 적용되어 있습니다.`);
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
  if (transactions.hasData) {
    const latest = transactions.items[0];
    points.push(`[실거래] 최근 인근 실거래 사례: ${latest.name} (${latest.dealDate}) - 거래금액 ${latest.dealAmountFormatted} (${latest.pyeongPriceFormatted})`);
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

  // 1시간 동안 메모리 캐시 보관
  memoryCache.set(cacheKey, report, 60 * 60 * 1000);

  return report;
}

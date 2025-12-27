import { google } from 'googleapis';
import { storage } from './storage';
import { InsertProperty } from '@shared/schema';
import { log } from './vite';

// 열 인덱스 매핑 (A=0, B=1, ... Z=25, AA=26, AB=27, ...)
const COL = {
  A: 0,   // 날짜
  B: 1,   // 지역 (district)
  C: 2,   // 주소 (address)
  D: 3,   // 지목 (landType)
  E: 4,   // 용도지역 (zoneType)
  G: 6,   // 건물명 (buildingName)
  H: 7,   // 동호수 (unitNumber)
  J: 9,   // 면적/공급면적 (size/supplyArea)
  M: 12,  // 전용면적 (privateArea)
  O: 14,  // 평형 (areaSize)
  P: 15,  // 방개수 (bedrooms)
  Q: 16,  // 욕실개수 (bathrooms)
  S: 18,  // 층수 (floor)
  T: 19,  // 총층 (totalFloors)
  U: 20,  // 방향 (direction)
  V: 21,  // 난방방식 (heatingSystem)
  X: 23,  // 사용승인일 (approvalDate)
  Y: 24,  // 유형 (type)
  AB: 27, // 승강기유무 (elevator)
  AC: 28, // 주차 (parking)
  AD: 29, // 거래종류 (dealType)
  AE: 30, // 가격 (price)
  AF: 31, // 전세금 (deposit)
  AG: 32, // 보증금 (depositAmount)
  AH: 33, // 월세 (monthlyRent)
  AI: 34, // 관리비 (maintenanceFee)
  AJ: 35, // 소유자 (ownerName)
  AK: 36, // 소유자전화 (ownerPhone)
  AL: 37, // 임차인 (tenantName)
  AM: 38, // 임차인전화 (tenantPhone)
  AN: 39, // 의뢰인 (clientName)
  AO: 40, // 의뢰인전화 (clientPhone)
  AP: 41, // 특이사항 (specialNote)
  AQ: 42, // 공동중개 (coListing)
  AR: 43, // 매물설명 (propertyDescription)
  AS: 44, // 비공개메모 (privateNote)
  AT: 45, // 제목 (title)
  AU: 46, // 설명 (description)
  BA: 52, // 유튜브URL (youtubeUrl)
};

// 구글 시트 데이터를 부동산 매물 데이터로 변환하는 함수
export async function importPropertiesFromSheet(
  spreadsheetId: string,
  apiKey: string,
  range: string = 'Sheet1!A2:BA',
  filterDate?: string // 필터링할 날짜 (YYYY-MM-DD 형식)
): Promise<{
  success: boolean;
  count?: number;
  importedIds?: number[];
  error?: string;
}> {
  try {
    // 구글 시트 API 클라이언트 생성
    const sheets = google.sheets({ version: 'v4', auth: apiKey });

    // 시트 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return { success: false, error: '시트에 데이터가 없습니다.' };
    }

    log(`구글 시트에서 ${rows.length}개의 행을 찾았습니다.`, 'info');

    // 필터 날짜가 있으면 Date 객체로 변환
    let filterDateTime: Date | null = null;
    if (filterDate) {
      filterDateTime = new Date(filterDate);
      filterDateTime.setHours(0, 0, 0, 0);
      log(`날짜 필터 적용: ${filterDate} 이후의 데이터만 가져옵니다.`, 'info');
    }

    // 가져온 프로퍼티 ID 목록
    const importedIds: number[] = [];
    
    // 에러 기록
    const errors: string[] = [];

    // 각 행을 처리하여 매물 데이터로 변환
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        // 행 데이터가 충분히 있는지 확인
        if (row.length < 3) {
          errors.push(`행 ${i+2}: 데이터가 부족합니다.`);
          continue;
        }

        // A열(인덱스 0)의 날짜 확인 및 필터링
        if (filterDateTime && row[COL.A]) {
          const rowDateStr = row[COL.A];
          let rowDate: Date;
          
          // 다양한 날짜 형식 처리
          if (rowDateStr.includes('/')) {
            // MM/DD/YYYY 또는 YYYY/MM/DD 형식
            const parts = rowDateStr.split('/');
            if (parts[0].length === 4) {
              rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
          } else if (rowDateStr.includes('-')) {
            // YYYY-MM-DD 형식
            rowDate = new Date(rowDateStr);
          } else {
            rowDate = new Date(rowDateStr);
          }
          
          rowDate.setHours(0, 0, 0, 0);
          
          if (isNaN(rowDate.getTime())) {
            log(`행 ${i+2}: 날짜 형식이 올바르지 않습니다 (${rowDateStr})`, 'warn');
          } else if (rowDate < filterDateTime) {
            log(`행 ${i+2}: 날짜 필터로 제외됨 (${rowDateStr} < ${filterDate})`, 'info');
            continue;
          }
        }

        // 안전하게 값 가져오기
        const getValue = (idx: number): string => row[idx]?.toString().trim() || '';
        const getNumericValue = (idx: number): string | null => {
          const val = getValue(idx);
          if (!val || val === '') return null;
          // 숫자만 추출
          const numStr = val.replace(/[^0-9.-]/g, '');
          return numStr || null;
        };
        const getBooleanValue = (idx: number): boolean => {
          const val = getValue(idx).toLowerCase();
          return val === 'true' || val === '1' || val === 'yes' || val === '예' || val === 'o';
        };

        // 거래유형 파싱 (쉼표로 구분된 다중 값 지원)
        const dealTypeStr = getValue(COL.AD);
        let dealTypeArray: string[] = ['매매'];
        if (dealTypeStr) {
          dealTypeArray = dealTypeStr.split(',').map(s => s.trim()).filter(s => s);
          if (dealTypeArray.length === 0) dealTypeArray = ['매매'];
        }

        // 시트 열 매핑
        const propertyData: Partial<InsertProperty> = {
          title: getValue(COL.AT) || getValue(COL.C) || '제목 없음',
          description: getValue(COL.AU) || getValue(COL.AR) || '',
          type: mapPropertyType(getValue(COL.Y)),
          price: getNumericValue(COL.AE) || '0',
          address: getValue(COL.C),
          district: getValue(COL.B),
          size: getNumericValue(COL.J) || '0',
          bedrooms: parseInt(getValue(COL.P)) || 0,
          bathrooms: parseInt(getValue(COL.Q)) || 0,
          
          // 위치 정보
          buildingName: getValue(COL.G) || null,
          unitNumber: getValue(COL.H) || null,
          
          // 면적 정보
          supplyArea: getNumericValue(COL.J),
          privateArea: getNumericValue(COL.M),
          areaSize: getValue(COL.O) || null,
          
          // 건물 정보
          floor: parseInt(getValue(COL.S)) || null,
          totalFloors: parseInt(getValue(COL.T)) || null,
          direction: getValue(COL.U) || null,
          elevator: getBooleanValue(COL.AB),
          parking: getValue(COL.AC) || null,
          heatingSystem: getValue(COL.V) || null,
          approvalDate: getValue(COL.X) || null,
          
          // 토지 정보
          landType: getValue(COL.D) || null,
          zoneType: getValue(COL.E) || null,
          
          // 금액 정보
          dealType: dealTypeArray,
          deposit: getNumericValue(COL.AF),
          depositAmount: getNumericValue(COL.AG),
          monthlyRent: getNumericValue(COL.AH),
          maintenanceFee: getNumericValue(COL.AI),
          
          // 연락처 정보
          ownerName: getValue(COL.AJ) || null,
          ownerPhone: getValue(COL.AK) || null,
          tenantName: getValue(COL.AL) || null,
          tenantPhone: getValue(COL.AM) || null,
          clientName: getValue(COL.AN) || null,
          clientPhone: getValue(COL.AO) || null,
          
          // 추가 정보
          specialNote: getValue(COL.AP) || null,
          coListing: getBooleanValue(COL.AQ),
          propertyDescription: getValue(COL.AR) || null,
          privateNote: getValue(COL.AS) || null,
          youtubeUrl: getValue(COL.BA) || null,
          
          // 기본값
          imageUrl: getDefaultImageForPropertyType(mapPropertyType(getValue(COL.Y))),
          imageUrls: [],
          featured: false,
          displayOrder: 0,
          isVisible: true,
          agentId: 4 // 기본 중개사 ID
        };

        // 필수 필드 검증
        if (!propertyData.title || !propertyData.address) {
          errors.push(`행 ${i+2}: 필수 필드(제목, 주소)가 누락되었습니다.`);
          continue;
        }

        // 데이터베이스에 저장
        const savedProperty = await storage.createProperty(propertyData as InsertProperty);
        importedIds.push(savedProperty.id);
        
        log(`행 ${i+2} 임포트 성공: ${savedProperty.title} (ID: ${savedProperty.id})`, 'info');
      } catch (rowError) {
        errors.push(`행 ${i+2} 처리 오류: ${rowError}`);
        log(`행 ${i+2} 처리 오류: ${rowError}`, 'error');
      }
    }

    // 오류가 있으면 로그에 기록
    if (errors.length > 0) {
      log(`${errors.length}개의 행에서 오류가 발생했습니다: ${errors.slice(0, 5).join('; ')}`, 'error');
    }

    return {
      success: true,
      count: importedIds.length,
      importedIds,
      error: errors.length > 0 ? `${errors.length}개의 행에서 오류가 발생했습니다` : undefined
    };
  } catch (error) {
    log(`구글 시트 데이터 가져오기 실패: ${error}`, 'error');
    return { success: false, error: `구글 시트 데이터 가져오기 실패: ${error}` };
  }
}

// 속성 유형 매핑 함수
function mapPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    '토지': '토지',
    '주택': '주택',
    '아파트': '아파트연립다세대',
    '연립': '아파트연립다세대',
    '다세대': '아파트연립다세대',
    '아파트연립다세대': '아파트연립다세대',
    '원룸': '원투룸',
    '투룸': '원투룸',
    '원투룸': '원투룸',
    '상가': '상가공장창고펜션',
    '공장': '상가공장창고펜션',
    '창고': '상가공장창고펜션',
    '펜션': '상가공장창고펜션',
    '상가공장창고펜션': '상가공장창고펜션'
  };

  const normalizedType = type.trim();
  
  // 정확한 매칭 시도
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType];
  }

  // 부분 매칭 시도
  for (const key in typeMap) {
    if (normalizedType.includes(key)) {
      return typeMap[key];
    }
  }

  // 기본값
  return '주택';
}

// 속성 유형에 따른 기본 이미지 URL 반환 함수
function getDefaultImageForPropertyType(type: string): string {
  const imageMap: Record<string, string> = {
    '토지': '/attached_assets/토지-001.png',
    '주택': '/attached_assets/주택-001.png',
    '아파트연립다세대': '/attached_assets/아파트-001.png',
    '원투룸': '/attached_assets/원룸-001.png',
    '상가공장창고펜션': '/attached_assets/상가펜션-001.png'
  };

  return imageMap[type] || '/attached_assets/주택-001.png';
}

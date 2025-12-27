import { google } from 'googleapis';
import { storage } from './storage';
import { InsertProperty } from '@shared/schema';
import { log } from './vite';
import { resizeImages } from './image-resizer';

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
  AB: 27, // 승강기유무 (elevator) - "유"이면 체크, "무"이거나 빈값이면 비체크
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
  AQ: 42, // 담당중개사 (agentName) - 텍스트로 저장
  AR: 43, // 매물설명 (propertyDescription)
  AS: 44, // 비공개메모 (privateNote)
  AT: 45, // 제목 (title)
  AU: 46, // 설명 (description)
  AV: 47, // 이미지1
  AW: 48, // 이미지2
  AX: 49, // 이미지3
  AY: 50, // 이미지4
  AZ: 51, // 이미지5
  BA: 52, // 유튜브URL (youtubeUrl)
};

// 중복 매물 확인 함수
export async function checkDuplicatesFromSheet(
  spreadsheetId: string,
  apiKey: string,
  range: string,
  filterDate: string
): Promise<{
  success: boolean;
  duplicates?: { rowIndex: number; address: string; existingPropertyId: number; existingPropertyTitle: string }[];
  error?: string;
}> {
  try {
    const sheets = google.sheets({ version: 'v4', auth: apiKey });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return { success: true, duplicates: [] };
    }

    const filterDateTime = new Date(filterDate);
    filterDateTime.setHours(0, 0, 0, 0);

    // 유효한 행에서 주소 수집
    const addressMap: Map<string, number> = new Map();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 3) continue;
      
      const rowDateStr = row[COL.A]?.toString().trim();
      if (!rowDateStr) continue;
      
      let rowDate: Date;
      if (rowDateStr.includes('/')) {
        const parts = rowDateStr.split('/');
        if (parts[0].length === 4) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else if (rowDateStr.includes('-')) {
        rowDate = new Date(rowDateStr);
      } else if (rowDateStr.includes('.')) {
        const parts = rowDateStr.split('.');
        if (parts[0].length === 4) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else {
        rowDate = new Date(rowDateStr);
        if (isNaN(rowDate.getTime())) continue;
      }
      
      rowDate.setHours(0, 0, 0, 0);
      if (rowDate < filterDateTime) continue;
      
      const address = row[COL.C]?.toString().trim();
      if (address) {
        addressMap.set(address, i + 2); // 엑셀 행 번호 (1-indexed + 헤더)
      }
    }

    if (addressMap.size === 0) {
      return { success: true, duplicates: [] };
    }

    // 기존 매물과 비교
    const addresses = Array.from(addressMap.keys());
    const existingProperties = await storage.getPropertiesByAddresses(addresses);
    
    const duplicates = existingProperties.map(prop => ({
      rowIndex: addressMap.get(prop.address) || 0,
      address: prop.address,
      existingPropertyId: prop.id,
      existingPropertyTitle: prop.title
    }));

    return { success: true, duplicates };
  } catch (error) {
    log(`중복 확인 실패: ${error}`, 'error');
    return { success: false, error: `중복 확인 실패: ${error}` };
  }
}

// 구글 시트 데이터를 부동산 매물 데이터로 변환하는 함수
export async function importPropertiesFromSheet(
  spreadsheetId: string,
  apiKey: string,
  range: string = '토지!A2:BA',
  filterDate: string,
  skipAddresses: string[] = [] // 건너뛸 주소 목록
): Promise<{
  success: boolean;
  count?: number;
  importedIds?: number[];
  skippedCount?: number;
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

    log(`구글 시트에서 ${rows.length}개의 행을 찾았습니다. (시트: ${range})`, 'info');

    // 필터 날짜를 Date 객체로 변환 (필수)
    const filterDateTime = new Date(filterDate);
    filterDateTime.setHours(0, 0, 0, 0);
    log(`날짜 필터 적용: ${filterDate} 이후의 데이터만 가져옵니다.`, 'info');

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

        // A열(인덱스 0)의 날짜 확인 및 필터링 (필수)
        const rowDateStr = row[COL.A]?.toString().trim();
        
        // A열에 날짜가 없으면 스킵
        if (!rowDateStr) {
          log(`행 ${i+2}: A열에 날짜가 없어 스킵됨`, 'info');
          continue;
        }
        
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
        } else if (rowDateStr.includes('.')) {
          // YYYY.MM.DD 또는 MM.DD.YYYY 형식
          const parts = rowDateStr.split('.');
          if (parts[0].length === 4) {
            rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            rowDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        } else {
          rowDate = new Date(rowDateStr);
        }
        
        rowDate.setHours(0, 0, 0, 0);
        
        if (isNaN(rowDate.getTime())) {
          log(`행 ${i+2}: 날짜 형식이 올바르지 않습니다 (${rowDateStr}), 스킵됨`, 'warn');
          continue;
        }
        
        // 날짜 필터 적용: 선택한 날짜 이후(같거나 이후)의 데이터만 가져오기
        if (rowDate < filterDateTime) {
          log(`행 ${i+2}: 날짜 필터로 제외됨 (${rowDateStr} < ${filterDate})`, 'info');
          continue;
        }
        
        log(`행 ${i+2}: 날짜 필터 통과 (${rowDateStr} >= ${filterDate})`, 'info');
        
        // 행 패딩 전 원본 데이터 로깅
        log(`행 ${i+2}: 패딩 전 행 길이: ${row.length}`, 'info');
        
        // 원본 이미지 열 데이터 확인 (패딩 전)
        const originalAV = row[COL.AV] || '(없음)';
        const originalAW = row[COL.AW] || '(없음)';
        const originalAX = row[COL.AX] || '(없음)';
        const originalAY = row[COL.AY] || '(없음)';
        const originalAZ = row[COL.AZ] || '(없음)';
        log(`행 ${i+2}: 원본 이미지 데이터 - AV: "${String(originalAV).substring(0, 30)}", AW: "${String(originalAW).substring(0, 30)}", AX: "${String(originalAX).substring(0, 30)}"`, 'info');
        
        // 행 패딩: Google Sheets API가 빈 셀을 잘라내기 때문에 BA열까지 패딩
        const requiredLength = COL.BA + 1; // BA열 포함하려면 53개 요소 필요
        while (row.length < requiredLength) {
          row.push('');
        }
        log(`행 ${i+2}: 패딩 후 행 길이: ${row.length}`, 'info');
        
        // 중복 매물 건너뛰기 체크
        const rowAddress = row[COL.C]?.toString().trim();
        if (rowAddress && skipAddresses.includes(rowAddress)) {
          log(`행 ${i+2}: 중복 매물로 건너뜀 (주소: ${rowAddress})`, 'info');
          continue;
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
        
        // 금액 필드용 함수 (만원 → 원 변환: *10000)
        const getMoneyValue = (idx: number): string | null => {
          const val = getNumericValue(idx);
          if (!val || val === '0') return null;
          const numericVal = parseFloat(val);
          if (isNaN(numericVal)) return null;
          return String(Math.round(numericVal * 10000));
        };
        const getBooleanValue = (idx: number): boolean => {
          const val = getValue(idx).toLowerCase();
          return val === 'true' || val === '1' || val === 'yes' || val === '예' || val === 'o';
        };
        
        // 승강기 체크 - "유"이면 true, "무"이거나 빈값이면 false
        const getElevatorValue = (idx: number): boolean => {
          const val = getValue(idx).trim();
          return val === '유';
        };
        
        // 이미지 URL 수집 (AV-AZ 열에서 가져오기)
        const collectImageUrls = (): string[] => {
          const imageColumns = [COL.AV, COL.AW, COL.AX, COL.AY, COL.AZ];
          const urls: string[] = [];
          log(`[이미지] 행 ${i+2}: 이미지 열 확인 시작 - 행 길이: ${row.length}, 이미지열 인덱스: ${imageColumns.join(',')}`, 'info');
          for (const col of imageColumns) {
            if (col < row.length) {
              const rawValue = row[col];
              const url = rawValue?.toString().trim() || '';
              log(`[이미지] 행 ${i+2}: 열 ${col} 원본값: "${String(rawValue).substring(0, 100)}", 타입: ${typeof rawValue}`, 'info');
              
              // URL 검증 - 공백 제거 후 http/https 체크
              const cleanUrl = url.replace(/\s+/g, '');
              if (cleanUrl && cleanUrl.length > 0) {
                if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('//')) {
                  const finalUrl = cleanUrl.startsWith('//') ? 'https:' + cleanUrl : cleanUrl;
                  log(`[이미지] 행 ${i+2}: 유효한 URL 발견: ${finalUrl.substring(0, 80)}...`, 'info');
                  urls.push(finalUrl);
                } else {
                  log(`[이미지] 행 ${i+2}: 열 ${col} - URL 형식이 아님 (값: ${cleanUrl.substring(0, 50)})`, 'info');
                }
              }
            } else {
              log(`[이미지] 행 ${i+2}: 열 ${col}이 행 길이(${row.length})를 초과`, 'info');
            }
          }
          log(`[이미지] 행 ${i+2}: 총 ${urls.length}개의 유효한 이미지 URL 발견`, 'info');
          return urls;
        };

        // 거래유형 파싱 (쉼표로 구분된 다중 값 지원)
        const dealTypeStr = getValue(COL.AD);
        let dealTypeArray: string[] = ['매매'];
        if (dealTypeStr) {
          dealTypeArray = dealTypeStr.split(',').map(s => s.trim()).filter(s => s);
          if (dealTypeArray.length === 0) dealTypeArray = ['매매'];
        }

        // 이미지 URL 수집 및 리사이징 (1027x768)
        const originalImageUrls = collectImageUrls();
        let processedImageUrls: string[] = [];
        
        if (originalImageUrls.length > 0) {
          log(`행 ${i+2}: ${originalImageUrls.length}개 이미지 리사이징 시작...`, 'info');
          processedImageUrls = await resizeImages(originalImageUrls);
          log(`행 ${i+2}: 이미지 리사이징 완료 (${processedImageUrls.length}개)`, 'info');
        }
        
        // 이미지가 없으면 기본 이미지 사용
        const propertyType = mapPropertyType(getValue(COL.Y));
        if (processedImageUrls.length === 0) {
          processedImageUrls = [getDefaultImageForPropertyType(propertyType)];
        }

        // 시트 열 매핑
        const propertyData: Partial<InsertProperty> = {
          title: getValue(COL.AT) || '제목을 입력하세요',
          description: getValue(COL.AU) || getValue(COL.AR) || '',
          type: propertyType,
          price: (() => {
            const priceVal = getNumericValue(COL.AE);
            if (!priceVal || priceVal === '0') return '0';
            // 가격 * 10000 (만원 단위를 원 단위로 변환)
            const numericPrice = parseFloat(priceVal);
            if (isNaN(numericPrice)) return '0';
            return String(Math.round(numericPrice * 10000));
          })(),
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
          elevator: getElevatorValue(COL.AB), // "유"이면 체크, "무"이거나 빈값이면 비체크
          parking: getValue(COL.AC) || null,
          heatingSystem: getValue(COL.V) || null,
          approvalDate: getValue(COL.X) || null,
          
          // 토지 정보
          landType: getValue(COL.D) || null,
          zoneType: getValue(COL.E) || null,
          
          // 금액 정보 (만원 → 원 변환)
          dealType: dealTypeArray,
          deposit: getMoneyValue(COL.AF),
          depositAmount: getMoneyValue(COL.AG),
          monthlyRent: getMoneyValue(COL.AH),
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
          coListing: false, // 공동중개 기본값
          agentName: getValue(COL.AQ) || null, // 담당중개사 이름 (텍스트)
          propertyDescription: getValue(COL.AR) || null,
          privateNote: getValue(COL.AS) || null,
          youtubeUrl: getValue(COL.BA) || null,
          
          // 이미지 URL 처리 - 리사이징된 이미지 사용
          imageUrl: processedImageUrls[0],
          imageUrls: processedImageUrls,
          featured: false,
          displayOrder: 0,
          isVisible: true,
          agentId: 4 // 기본값 4 (이민호)
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

// 속성 유형 매핑 함수 - 새로운 부동산 유형: 토지,단독,근린,아파트,다세대,연립,원투룸,다가구,오피스텔,기타
function mapPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    '토지': '토지',
    '단독': '단독',
    '단독주택': '단독',
    '주택': '단독',
    '근린': '근린',
    '근린상가': '근린',
    '아파트': '아파트',
    '다세대': '다세대',
    '연립': '연립',
    '원룸': '원투룸',
    '투룸': '원투룸',
    '원투룸': '원투룸',
    '다가구': '다가구',
    '오피스텔': '오피스텔',
    '상가': '근린',
    '공장': '기타',
    '창고': '기타',
    '펜션': '기타',
    '기타': '기타'
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
  return '기타';
}

// 속성 유형에 따른 기본 이미지 URL 반환 함수
function getDefaultImageForPropertyType(type: string): string {
  const imageMap: Record<string, string> = {
    '토지': '/attached_assets/토지-001.png',
    '단독': '/attached_assets/주택-001.png',
    '근린': '/attached_assets/상가펜션-001.png',
    '아파트': '/attached_assets/아파트-001.png',
    '다세대': '/attached_assets/아파트-001.png',
    '연립': '/attached_assets/아파트-001.png',
    '원투룸': '/attached_assets/원룸-001.png',
    '다가구': '/attached_assets/아파트-001.png',
    '오피스텔': '/attached_assets/아파트-001.png',
    '기타': '/attached_assets/주택-001.png'
  };

  return imageMap[type] || '/attached_assets/주택-001.png';
}

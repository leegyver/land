import { google } from 'googleapis';
import { storage } from './storage';
import { InsertProperty } from '@shared/schema';
import { log } from './vite';

// 시트별 열 매핑 정의
const SHEET_MAPPINGS: Record<string, {
  type: string;
  dateColumn: number;
  mapping: Record<string, number>;
}> = {
  '토지': {
    type: '토지',
    dateColumn: 2, // C열 (날짜)
    mapping: {
      district: 3, // D:읍면동
      address: 4, // E:지번
      landType: 5, // F:지목
      zoneType: 6, // G:용도지역
      size: 8, // I:㎡
      pricePerPyeong: 10, // K:평단가
      supplyArea: 12, // M:대지/공급㎡
      supplyAreaPyeong: 13, // N:대지/공급(평)
      privateArea: 14, // O:연면적/전용㎡
      privateAreaPyeong: 15, // P:연면적/전용(평)
      areaSize: 16, // Q:평형
      floor: 17, // R:층수
      totalFloors: 18, // S:총층수
      direction: 19, // T:방향
      elevator: 20, // U:승강기
      parking: 21, // V:주차대수
      heatingSystem: 22, // W:난방방식
      heatingFuel: 23, // X:난방연료
      approvalDate: 24, // Y:사용승인
      housingType: 25, // Z:주택종류
      commercialType: 26, // AA:상가업종
      factoryWarehouse: 27, // AB:공장/창고
      electricPower: 28, // AC:전력량
      dealType: 29, // AD:거래종류
      price: 30, // AE:매매가
      deposit: 31, // AF:전세금
      depositMonthly: 32, // AG:보증금
      monthlyRent: 33, // AH:월세
      maintenanceFee: 34, // AI:관리비
      ownerName: 35, // AJ:소유자
      ownerPhone: 36, // AK:소유자전화
      tenantName: 37, // AL:임차인
      tenantPhone: 38, // AM:임차인전화
      clientName: 39, // AN:의뢰인
      clientPhone: 40, // AO:의뢰인전화
      specialNote: 41, // AP:특이사항
      coListing: 42, // AQ:공동중개
      description: 43, // AR:매물설명
      privateNote: 44, // AS:비공개메모
    }
  },
  '주택': {
    type: '주택',
    dateColumn: 2, // C열 (날짜)
    mapping: {
      district: 3, // D:읍면동
      address: 4, // E:지번
      landType: 5, // F:지목
      zoneType: 6, // G:용도지역
      supplyArea: 8, // I:공급
      supplyAreaPyeong: 9, // J:(평)
      privateArea: 10, // K:전용
      privateAreaPyeong: 11, // L:(평)
      direction: 12, // M:방향
      heatingSystem: 13, // N:난방방식
      heatingFuel: 14, // O:연료
      approvalDate: 15, // P:사용승인
      housingType: 16, // Q:주택종류
      commercialType: 17, // R:상가업종
      factoryWarehouse: 18, // S:공장/창고
      electricPower: 19, // T:전력량
      dealType: 20, // U:거래
      price: 21, // V:매매가
      deposit: 22, // W:전세금
      depositMonthly: 23, // X:보증금
      monthlyRent: 24, // Y:월세
      maintenanceFee: 25, // Z:관리비
      ownerName: 26, // AA:소유자
      ownerPhone: 27, // AB:소유자전화
      tenantName: 28, // AC:임차인
      tenantPhone: 29, // AD:임차인전화
      clientName: 30, // AE:의뢰인
      clientPhone: 31, // AF:의뢰인전화
      specialNote: 32, // AG:특이사항
      coListing: 33, // AH:공동중개
      description: 34, // AI:매물설명
      privateNote: 35, // AJ:비공개메모
    }
  },
  '아파트연립다세대': {
    type: '아파트연립다세대',
    dateColumn: 2, // C열 (날짜)
    mapping: {
      district: 3, // D:읍면동
      address: 4, // E:지번
      buildingName: 5, // F:건물명
      unitNumber: 6, // G:동호
      supplyArea: 8, // I:공급
      supplyAreaPyeong: 9, // J:(평)
      privateArea: 10, // K:전용
      privateAreaPyeong: 11, // L:(평)
      areaSize: 12, // M:평형
      floor: 13, // N:층수
      totalFloors: 14, // O:총층
      direction: 15, // P:방향
      elevator: 16, // Q:승강기
      parking: 17, // R:주차
      heatingSystem: 18, // S:난방방식
      heatingFuel: 19, // T:연료
      approvalDate: 20, // U:사용승인
      housingType: 21, // V:주택종류
      commercialType: 22, // W:상가업종
      factoryWarehouse: 23, // X:공장/창고
      electricPower: 24, // Y:전력량
      dealType: 25, // Z:거래종류
      price: 26, // AA:매매가
      deposit: 27, // AB:전세금
      depositMonthly: 28, // AC:보증금
      monthlyRent: 29, // AD:월세
      maintenanceFee: 30, // AE:관리비
      ownerName: 31, // AF:소유자
      ownerPhone: 32, // AG:소유자전화
      tenantName: 33, // AH:임차인
      tenantPhone: 34, // AI:임차인전화
      clientName: 35, // AJ:의뢰인
      clientPhone: 36, // AK:의뢰인전화
      specialNote: 37, // AL:특이사항
      coListing: 38, // AM:공동중개
      description: 39, // AN:매물설명
      privateNote: 40, // AO:비공개메모
    }
  },
  '서희': {
    type: '아파트연립다세대',
    dateColumn: 2, // C열 (날짜)
    mapping: {
      district: 3, // D:읍면동
      address: 4, // E:지번
      unitNumber: 5, // F:동호
      supplyArea: 7, // H:공급
      supplyAreaPyeong: 8, // I:(평형)
      privateArea: 9, // J:전용
      privateAreaPyeong: 10, // K:(평)
      areaSize: 11, // L:타입
      direction: 13, // N:방향
      approvalDate: 14, // O:사용승인
      housingType: 15, // P:주택종류
      commercialType: 16, // Q:상가업종
      factoryWarehouse: 17, // R:공장/창고
      electricPower: 18, // S:전력량
      dealType: 19, // T:거래종류
      price: 20, // U:매매가
      deposit: 21, // V:전세금
      depositMonthly: 22, // W:보증금
      monthlyRent: 23, // X:월세
      ownerName: 24, // Y:소유자
      ownerPhone: 25, // Z:소유자전화
      tenantName: 26, // AA:임차인
      tenantPhone: 27, // AB:임차인전화
      clientName: 28, // AC:의뢰인
      clientPhone: 29, // AD:의뢰인전화
      coListing: 30, // AE:공동중개
      description: 31, // AF:매물설명
      privateNote: 32, // AG:비공개메모
    }
  },
  '원투룸': {
    type: '원투룸',
    dateColumn: 2, // C열 (날짜)
    mapping: {
      district: 3, // D:읍면동
      address: 4, // E:지번
      landType: 5, // F:지목
      zoneType: 6, // G:용도지역
      aptName: 7, // H:아파트명
      buildingName: 8, // I:건물명
      unitNumber: 9, // J:동호
      supplyArea: 11, // L:공급
      supplyAreaPyeong: 12, // M:(평)
      privateArea: 13, // N:전용
      privateAreaPyeong: 14, // O:(평)
      areaSize: 15, // P:평형
      floor: 16, // Q:층수
      totalFloors: 17, // R:총층
      direction: 18, // S:방향
      elevator: 19, // T:승강기
      parking: 20, // U:주차
      heatingSystem: 21, // V:난방
      heatingFuel: 22, // W:연료
      approvalDate: 23, // X:사용승인
      housingType: 24, // Y:주택종류
      commercialType: 25, // Z:상가업종
      factoryWarehouse: 26, // AA:공장/창고
      electricPower: 27, // AB:전력량
      dealType: 28, // AC:거래종류
      price: 29, // AD:매매가
      deposit: 30, // AE:전세금
      depositMonthly: 31, // AF:보증금
      monthlyRent: 32, // AG:월세
      maintenanceFee: 33, // AH:관리비
      ownerName: 34, // AI:소유자
      ownerPhone: 35, // AJ:소유자전화
      tenantName: 36, // AK:임차인
      tenantPhone: 37, // AL:임차인전화
      clientName: 38, // AM:의뢰인
      clientPhone: 39, // AN:의뢰인전화
      specialNote: 40, // AO:특이사항
      coListing: 41, // AP:공동중개
      description: 42, // AQ:매물설명
      privateNote: 43, // AR:비공개메모
    }
  },
  '상가공장창고펜션': {
    type: '상가공장창고펜션',
    dateColumn: 2, // C열 (날짜)
    mapping: {
      district: 3, // D:읍면동
      address: 4, // E:지번
      landType: 5, // F:지목
      zoneType: 6, // G:용도지역
      buildingName: 7, // H:건물명
      supplyArea: 9, // J:공급
      supplyAreaPyeong: 10, // K:(평)
      privateArea: 11, // L:전용
      privateAreaPyeong: 12, // M:(평)
      areaSize: 13, // N:평형
      floor: 14, // O:층수
      totalFloors: 15, // P:총층수
      direction: 16, // Q:방향
      elevator: 17, // R:승강기
      parking: 18, // S:주차
      heatingSystem: 19, // T:난방
      heatingFuel: 20, // U:연료
      approvalDate: 21, // V:사용승인
      commercialCategory: 22, // W:상가종류
      commercialType: 23, // X:업종
      factoryWarehouse: 24, // Y:공장/창고
      electricPower: 25, // Z:전력량
      dealType: 26, // AA:거래
      price: 27, // AB:매매가
      deposit: 28, // AC:전세금
      depositMonthly: 29, // AD:보증금
      monthlyRent: 30, // AE:월세
      maintenanceFee: 31, // AF:관리비
      ownerName: 32, // AG:소유자
      ownerPhone: 33, // AH:소유자전화
      tenantName: 34, // AI:임차인
      tenantPhone: 35, // AJ:임차인전화
      clientName: 36, // AK:의뢰인
      clientPhone: 37, // AL:의뢰인전화
      specialNote: 38, // AM:특이사항
      coListing: 39, // AN:공동중개
      description: 40, // AO:매물설명
      privateNote: 41, // AP:비공개메모
    }
  }
};

// 구글 시트 데이터를 부동산 매물 데이터로 변환하는 함수
export async function importPropertiesFromSheet(
  spreadsheetId: string,
  apiKey: string,
  range: string = 'Sheet1!A2:AZ',
  filterDate?: string
): Promise<{
  success: boolean;
  count?: number;
  importedIds?: number[];
  error?: string;
  skipped?: number;
}> {
  try {
    // 시트 이름 추출
    const sheetName = range.split('!')[0];
    const sheetMapping = SHEET_MAPPINGS[sheetName];
    
    if (!sheetMapping) {
      return { 
        success: false, 
        error: `지원되지 않는 시트입니다: "${sheetName}". 지원 시트: ${Object.keys(SHEET_MAPPINGS).join(', ')}` 
      };
    }

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

    log(`구글 시트 [${sheetName}]에서 ${rows.length}개의 행을 찾았습니다.`, 'info');

    // 가져온 프로퍼티 ID 목록
    const importedIds: number[] = [];
    
    // 에러 기록
    const errors: string[] = [];
    
    // 스킵된 행 수
    let skippedCount = 0;
    
    // 날짜 필터가 있는 경우 Date 객체로 변환
    const filterDateObj = filterDate ? new Date(filterDate) : null;
    if (filterDateObj) {
      filterDateObj.setHours(0, 0, 0, 0);
      log(`날짜 필터 적용: ${filterDate} 이후 데이터만 가져옵니다.`, 'info');
    }

    const { mapping, dateColumn, type } = sheetMapping;

    // 각 행을 처리하여 매물 데이터로 변환
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        
        // 행 데이터가 충분히 있는지 확인
        if (!row || row.length < 5) {
          skippedCount++;
          continue;
        }
        
        // 날짜 필터링 (C열 기준)
        if (filterDateObj && row[dateColumn]) {
          const rowDate = parseDate(row[dateColumn]?.toString().trim());
          if (rowDate && rowDate < filterDateObj) {
            skippedCount++;
            continue;
          }
        }

        // 매물 데이터 생성
        const getValue = (key: string) => {
          const idx = mapping[key];
          return idx !== undefined && row[idx] !== undefined ? row[idx]?.toString().trim() : null;
        };

        const getNumericValue = (key: string) => {
          const val = getValue(key);
          if (!val) return null;
          const cleaned = val.replace(/[,원₩\s]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? null : num;
        };

        const getBooleanValue = (key: string) => {
          const val = getValue(key);
          if (!val) return false;
          return val === 'O' || val === 'o' || val === 'Y' || val === 'y' || 
                 val === '예' || val === '있음' || val === 'true' || val === 'TRUE';
        };

        // 주소 생성 (읍면동 + 지번)
        const district = getValue('district') || '';
        const addressNum = getValue('address') || '';
        const fullAddress = `인천 강화군 ${district} ${addressNum}`.trim();
        
        // 제목 생성
        const buildingName = getValue('buildingName');
        const title = buildingName 
          ? `${district} ${buildingName}` 
          : `${district} ${type}`;

        // 거래 유형 처리
        let dealTypeArray: string[] = ['매매'];
        const dealTypeValue = getValue('dealType');
        if (dealTypeValue) {
          dealTypeArray = [dealTypeValue];
        }

        // 매물 데이터 구성
        const propertyData: Partial<InsertProperty> = {
          title: title || `${district} 매물`,
          description: getValue('description') || '',
          type: type,
          price: (getNumericValue('price') || 0).toString(),
          address: fullAddress,
          district: district || '강화읍',
          size: (getNumericValue('size') || getNumericValue('supplyArea') || 0).toString(),
          bedrooms: 0,
          bathrooms: 0,
          imageUrl: getDefaultImageForPropertyType(type),
          imageUrls: [getDefaultImageForPropertyType(type)],
          featured: false,
          agentId: 4,
          
          // 위치 정보
          buildingName: getValue('buildingName'),
          unitNumber: getValue('unitNumber'),
          
          // 면적 정보
          supplyArea: getNumericValue('supplyArea')?.toString() || getNumericValue('supplyAreaPyeong')?.toString() || null,
          privateArea: getNumericValue('privateArea')?.toString() || getNumericValue('privateAreaPyeong')?.toString() || null,
          areaSize: getValue('areaSize'),
          
          // 건물 정보
          floor: getNumericValue('floor') ? Math.floor(getNumericValue('floor')!) : null,
          totalFloors: getNumericValue('totalFloors') ? Math.floor(getNumericValue('totalFloors')!) : null,
          direction: getValue('direction'),
          elevator: getBooleanValue('elevator'),
          parking: getValue('parking'),
          heatingSystem: getValue('heatingSystem'),
          approvalDate: getValue('approvalDate'),
          
          // 토지 정보
          landType: getValue('landType'),
          zoneType: getValue('zoneType'),
          
          // 금액 정보
          dealType: dealTypeArray,
          deposit: getNumericValue('deposit')?.toString() || getNumericValue('depositMonthly')?.toString() || null,
          monthlyRent: getNumericValue('monthlyRent')?.toString() || null,
          maintenanceFee: getNumericValue('maintenanceFee')?.toString() || null,
          
          // 연락처 정보
          ownerName: getValue('ownerName'),
          ownerPhone: getValue('ownerPhone'),
          tenantName: getValue('tenantName'),
          tenantPhone: getValue('tenantPhone'),
          clientName: getValue('clientName'),
          clientPhone: getValue('clientPhone'),
          
          // 추가 정보
          specialNote: getValue('specialNote'),
          coListing: getBooleanValue('coListing'),
          privateNote: getValue('privateNote'),
        };

        // 필수 필드 검증 (주소가 있으면 가져오기)
        if (!propertyData.address || propertyData.address === '인천 강화군  ') {
          errors.push(`행 ${i+2}: 주소가 누락되었습니다.`);
          skippedCount++;
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
    
    if (skippedCount > 0) {
      log(`${skippedCount}개의 행이 스킵되었습니다 (날짜 필터 또는 데이터 부족).`, 'info');
    }

    return {
      success: true,
      count: importedIds.length,
      importedIds,
      skipped: skippedCount,
      error: errors.length > 0 ? `${errors.length}개의 행에서 오류가 발생했습니다` : undefined
    };
  } catch (error) {
    log(`구글 시트 데이터 가져오기 실패: ${error}`, 'error');
    return { success: false, error: `구글 시트 데이터 가져오기 실패: ${error}` };
  }
}

// 날짜 파싱 함수
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // YYYY-MM-DD 형식
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    // YYYY.MM.DD 형식
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateStr)) {
      const d = new Date(dateStr.replace(/\./g, '-'));
      if (!isNaN(d.getTime())) return d;
    }
    // YYYY/MM/DD 형식
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
      const d = new Date(dateStr.replace(/\//g, '-'));
      if (!isNaN(d.getTime())) return d;
    }
    // MM/DD/YYYY 형식
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    // 숫자만 있는 경우 (구글 시트 시리얼 날짜)
    if (/^\d+$/.test(dateStr)) {
      const serial = parseInt(dateStr);
      // 엑셀/구글 시트 시리얼 날짜 변환 (1899-12-30 기준)
      const d = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {
    return null;
  }
  
  return null;
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

// 지원하는 시트 목록 반환
export function getSupportedSheets(): string[] {
  return Object.keys(SHEET_MAPPINGS);
}

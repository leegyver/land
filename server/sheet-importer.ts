import { google } from 'googleapis';
import { storage } from './storage';
import { InsertProperty } from '@shared/schema';
import { log } from './vite';

// 구글 시트 데이터를 부동산 매물 데이터로 변환하는 함수
export async function importPropertiesFromSheet(
  spreadsheetId: string,
  apiKey: string,
  range: string = 'Sheet1!A2:Z'
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

        // 시트 열 매핑 (확장된 버전)
        // A:제목, B:설명, C:유형, D:가격, E:주소, F:지역, G:면적, H:침실수, I:욕실수,
        // J:층수, K:총층수, L:이미지URL, M:이미지URLs, N:추천매물, O:거래유형, P:건축년도,
        // Q:보증금, R:월세, S:관리비, T:지목, U:용도지역, V:건물명, W:동호수, X:공급면적,
        // Y:전용면적, Z:평형, AA:방향, AB:승강기유무, AC:주차대수, AD:난방방식, AE:사용승인일,
        // AF:소유자, AG:소유자전화, AH:임차인, AI:임차인전화, AJ:의뢰인, AK:의뢰인전화,
        // AL:특이사항, AM:공동중개유무, AN:비공개메모
        const propertyData: Partial<InsertProperty> = {
          title: row[0] || '',
          description: row[1] || '',
          type: mapPropertyType(row[2] || ''),
          price: row[3] || '',
          address: row[4] || '',
          district: row[5] || '',
          size: row[6]?.toString() || '0',
          bedrooms: parseInt(row[7]) || 0,
          bathrooms: parseInt(row[8]) || 0,
          floor: parseInt(row[9]) || null,
          totalFloors: parseInt(row[10]) || null,
          imageUrl: row[11] || getDefaultImageForPropertyType(mapPropertyType(row[2] || '')),
          imageUrls: row[12] ? JSON.parse(row[12]) : [row[11] || getDefaultImageForPropertyType(mapPropertyType(row[2] || ''))],
          featured: row[13]?.toLowerCase() === 'true' || false,
          dealType: row[14] ? [row[14]] : ['매매'], // O열: 거래유형
          yearBuilt: row[15] || null, // P열: 건축년도
          deposit: row[16] || null, // Q열: 보증금
          monthlyRent: row[17] || null, // R열: 월세
          maintenanceFee: row[18] || null, // S열: 관리비
          landType: row[19] || null, // T열: 지목
          zoneType: row[20] || null, // U열: 용도지역
          buildingName: row[21] || null, // V열: 건물명
          unitNumber: row[22] || null, // W열: 동호수
          supplyArea: row[23] || null, // X열: 공급면적
          privateArea: row[24] || null, // Y열: 전용면적
          areaSize: row[25] || null, // Z열: 평형
          direction: row[26] || null, // AA열: 방향
          elevator: row[27]?.toLowerCase() === 'true' || false, // AB열: 승강기유무
          parking: row[28] || null, // AC열: 주차대수
          heatingSystem: row[29] || null, // AD열: 난방방식
          approvalDate: row[30] || null, // AE열: 사용승인일
          ownerName: row[31] || null, // AF열: 소유자
          ownerPhone: row[32] || null, // AG열: 소유자전화
          tenantName: row[33] || null, // AH열: 임차인
          tenantPhone: row[34] || null, // AI열: 임차인전화
          clientName: row[35] || null, // AJ열: 의뢰인
          clientPhone: row[36] || null, // AK열: 의뢰인전화
          specialNote: row[37] || null, // AL열: 특이사항
          coListing: row[38]?.toLowerCase() === 'true' || false, // AM열: 공동중개유무
          privateNote: row[39] || null, // AN열: 비공개메모
          agentId: 4 // 기본 중개사 ID
        };

        // 필수 필드 검증
        if (!propertyData.title || !propertyData.price || !propertyData.address) {
          errors.push(`행 ${i+2}: 필수 필드(제목, 가격, 주소)가 누락되었습니다.`);
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
      log(`${errors.length}개의 행에서 오류가 발생했습니다: ${errors.join('; ')}`, 'error');
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

  // 정확한 매칭 시도
  if (typeMap[type]) {
    return typeMap[type];
  }

  // 부분 매칭 시도
  for (const key in typeMap) {
    if (type.includes(key)) {
      return typeMap[key];
    }
  }

  // 기본값
  return '주택';
}

// 속성 유형에 따른 기본 이미지 URL 반환 함수
function getDefaultImageForPropertyType(type: string): string {
  const imageMap: Record<string, string> = {
    '토지': '/assets/토지-001.png',
    '주택': '/assets/주택-001.png',
    '아파트연립다세대': '/assets/아파트-001.png',
    '원투룸': '/assets/원룸-001.png',
    '상가공장창고펜션': '/assets/상가펜션-001.png'
  };

  return imageMap[type] || '/assets/주택-001.png';
}
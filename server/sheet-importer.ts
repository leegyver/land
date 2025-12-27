import { google } from 'googleapis';
import { storage } from './storage';
import { InsertProperty } from '@shared/schema';
import { log } from './vite';

// 구글 시트 데이터를 부동산 매물 데이터로 변환하는 함수
export async function importPropertiesFromSheet(
  spreadsheetId: string,
  apiKey: string,
  range: string = 'Sheet1!A2:AN',
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
      filterDateTime.setHours(0, 0, 0, 0); // 시간 부분 제거
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
        if (filterDateTime && row[0]) {
          const rowDate = new Date(row[0]);
          rowDate.setHours(0, 0, 0, 0); // 시간 부분 제거
          
          if (isNaN(rowDate.getTime())) {
            log(`행 ${i+2}: 날짜 형식이 올바르지 않습니다 (${row[0]})`, 'warn');
          } else if (rowDate < filterDateTime) {
            log(`행 ${i+2}: 날짜 필터로 제외됨 (${row[0]} < ${filterDate})`, 'info');
            continue; // 선택된 날짜 이전의 데이터는 건너뜀
          }
        }

        // 시트 열 매핑 (업데이트된 버전)
        // AT:제목, AU:설명, Y:유형, AE:가격, C:주소, B:지역, J:면적, P:침실수, Q:욕실수,
        // S:층수, T:총층수, U:방향, V:난방방식, X:사용승인일,
        // D:지목, E:용도지역, G:건물명, H:동호수, J:공급면적, M:전용면적, O:평형,
        // AD:거래유형, AG:보증금, AH:월세, AI:관리비,
        // AJ:소유자, AK:소유자전화, AL:임차인, AM:임차인전화, AN:의뢰인, AO:의뢰인전화,
        // AP:특이사항, AQ:공동중개, AR:매물설명, AS:비공개메모, BA:유튜브URL,
        // AB:승강기유무, AC:주차
        const propertyData: Partial<InsertProperty> = {
          title: row[45] || '', // AT열: 제목
          description: row[46] || '', // AU열: 설명
          type: mapPropertyType(row[24] || ''), // Y열: 유형
          price: row[30] || '', // AE열: 가격
          address: row[2] || '', // C열: 주소
          district: row[1] || '', // B열: 지역
          size: row[9]?.toString() || '0', // J열: 면적
          bedrooms: parseInt(row[15]) || 0, // P열: 침실수
          bathrooms: parseInt(row[16]) || 0, // Q열: 욕실수
          floor: parseInt(row[18]) || null, // S열: 층수
          totalFloors: parseInt(row[19]) || null, // T열: 총층수
          direction: row[20] || null, // U열: 방향
          heatingSystem: row[21] || null, // V열: 난방방식
          approvalDate: row[23] || null, // X열: 사용승인일
          landType: row[3] || null, // D열: 지목
          zoneType: row[4] || null, // E열: 용도지역
          buildingName: row[6] || null, // G열: 건물명
          unitNumber: row[7] || null, // H열: 동호수
          supplyArea: row[9] || null, // J열: 공급면적
          privateArea: row[12] || null, // M열: 전용면적
          areaSize: row[14] || null, // O열: 평형
          dealType: row[29] ? [row[29]] : ['매매'], // AD열: 거래유형
          deposit: row[32] || null, // AG열: 보증금
          monthlyRent: row[33] || null, // AH열: 월세
          maintenanceFee: row[34] || null, // AI열: 관리비
          ownerName: row[35] || null, // AJ열: 소유자
          ownerPhone: row[36] || null, // AK열: 소유자전화
          tenantName: row[37] || null, // AL열: 임차인
          tenantPhone: row[38] || null, // AM열: 임차인전화
          clientName: row[39] || null, // AN열: 의뢰인
          clientPhone: row[40] || null, // AO열: 의뢰인전화
          specialNote: row[41] || null, // AP열: 특이사항
          coListing: row[42]?.toLowerCase() === 'true' || false, // AQ열: 공동중개
          propertyDescription: row[43] || null, // AR열: 매물설명
          privateNote: row[44] || null, // AS열: 비공개메모
          youtubeUrl: row[52] || null, // BA열: 유튜브URL
          elevator: row[27]?.toLowerCase() === 'true' || false, // AB열: 승강기유무
          parking: row[28] || null, // AC열: 주차
          imageUrl: getDefaultImageForPropertyType(mapPropertyType(row[24] || '')), // 기본 이미지
          imageUrls: [], // 빈 배열로 초기화
          featured: false, // 기본값
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
    '토지': '/attached_assets/토지-001.png',
    '주택': '/attached_assets/주택-001.png',
    '아파트연립다세대': '/attached_assets/아파트-001.png',
    '원투룸': '/attached_assets/원룸-001.png',
    '상가공장창고펜션': '/attached_assets/상가펜션-001.png'
  };

  return imageMap[type] || '/attached_assets/주택-001.png';
}
/**
 * 지도 지오코딩을 위한 주소 정제 및 검색어 생성 유틸리티
 */

/**
 * 부동산 주소에서 지오코더 검색을 방해하는 요소 제거 및 대표 지번 추출
 * 예: "171-6, 171-5" -> "171-6"
 * 예: "346-27외" -> "346-27"
 * 예: "346-27 외 2필지" -> "346-27"
 * 예: "171-6 및 171-5" -> "171-6"
 * 예: "171-6~171-8" -> "171-6"
 */
export function cleanAddressForSearch(rawAddress: string): string {
  if (!rawAddress) return "";

  let cleaned = rawAddress
    // 1. 대괄호 및 소괄호 내용 제거
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    // 2. 외 N필지, 일괄매각, 외 지상 등 수식어 제거
    .replace(/외\s*\d+\s*필지/gi, ' ')
    .replace(/외\s*일필지/gi, ' ')
    .replace(/외\s*\d+/gi, ' ')
    .replace(/외\s*지상/gi, ' ')
    .replace(/외\s*필지/gi, ' ')
    .replace(/일괄매각/gi, ' ')
    .replace(/일대/gi, ' ');

  // 3. 쉼표(,), 슬래시(/), 물결(~), '및' 등으로 연결된 복수 지번 중 첫 번째 대표 지번만 유지
  cleaned = cleaned
    .replace(/[,/~및].*$/, '')
    .replace(/\s*외$/, '');

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * 시/도/군/구 및 읍/면/리와 상세주소를 결합하여 카카오맵 지오코더에 최적화된 검색어 생성
 */
export function buildGeocodeQuery(district: string = "", address: string = "", mapAddress?: string | null): string {
  const targetAddress = cleanAddressForSearch(mapAddress || (address && address !== "***" ? address : ""));
  const cleanDistrict = (district || "").trim();

  if (!targetAddress) {
    // 상세주소가 없는 경우 지역명(읍/면/리) 기준
    if (!cleanDistrict.includes("강화") && !cleanDistrict.includes("서울") && !cleanDistrict.includes("인천") && !cleanDistrict.includes("경기")) {
      return `인천광역시 강화군 ${cleanDistrict}`.trim();
    } else if (cleanDistrict.includes("강화") && !cleanDistrict.includes("군") && !cleanDistrict.includes("인천")) {
      return cleanDistrict.replace(/강화\s*/, "인천광역시 강화군 ");
    } else if (cleanDistrict.includes("강화군") && !cleanDistrict.includes("인천")) {
      return `인천광역시 ${cleanDistrict}`;
    }
    return cleanDistrict;
  }

  // 상세주소에 이미 시/도 정보가 포함되어 있는 경우
  if (targetAddress.includes("인천") || targetAddress.includes("서울") || targetAddress.includes("경기")) {
    return targetAddress;
  }

  // 행정구역 표준화 (강화군 위주)
  let baseRegion = cleanDistrict;
  if (!baseRegion.includes("인천") && !baseRegion.includes("서울") && !baseRegion.includes("경기")) {
    if (!baseRegion.includes("강화군")) {
      baseRegion = `인천광역시 강화군 ${baseRegion}`;
    } else {
      baseRegion = `인천광역시 ${baseRegion}`;
    }
  }

  // 지역명 중복 제거 (예: district에 '사기리'가 있고 address에도 '사기리 481-1' 형태로 있을 때)
  let addrPart = targetAddress;
  const tokens = baseRegion.split(/\s+/);
  for (const token of tokens) {
    if (token && addrPart.startsWith(token)) {
      addrPart = addrPart.substring(token.length).trim();
    }
  }

  return `${baseRegion} ${addrPart}`.trim().replace(/\s+/g, ' ');
}

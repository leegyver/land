/**
 * 서버 측 카카오 로컬 REST API 기반 지오코딩 헬퍼
 */

const KAKAO_KEY = process.env.KAKAO_API_KEY || 'c10ff047acab69c70dd45f74c8055db0';

export function cleanAddressForSearch(rawAddress: string): string {
  if (!rawAddress) return "";

  let cleaned = rawAddress
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/외\s*\d+\s*필지/gi, ' ')
    .replace(/외\s*일필지/gi, ' ')
    .replace(/외\s*\d+/gi, ' ')
    .replace(/외\s*지상/gi, ' ')
    .replace(/외\s*필지/gi, ' ')
    .replace(/일괄매각/gi, ' ')
    .replace(/일대/gi, ' ');

  // 쉼표, 물결, 슬래시, '및' 이후 복수 지번 제거 (첫 번째 대표 지번만 유지)
  cleaned = cleaned
    .replace(/[,/~및].*$/, '')
    .replace(/\s*외$/, '');

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function buildGeocodeQuery(district: string = "", address: string = ""): string {
  const targetAddress = cleanAddressForSearch(address && address !== "***" ? address : "");
  const cleanDistrict = (district || "").trim();

  if (!targetAddress) {
    if (!cleanDistrict.includes("강화") && !cleanDistrict.includes("서울") && !cleanDistrict.includes("인천") && !cleanDistrict.includes("경기")) {
      return `인천광역시 강화군 ${cleanDistrict}`.trim();
    } else if (cleanDistrict.includes("강화") && !cleanDistrict.includes("군") && !cleanDistrict.includes("인천")) {
      return cleanDistrict.replace(/강화\s*/, "인천광역시 강화군 ");
    } else if (cleanDistrict.includes("강화군") && !cleanDistrict.includes("인천")) {
      return `인천광역시 ${cleanDistrict}`;
    }
    return cleanDistrict;
  }

  if (targetAddress.includes("인천") || targetAddress.includes("서울") || targetAddress.includes("경기")) {
    return targetAddress;
  }

  let baseRegion = cleanDistrict;
  if (!baseRegion.includes("인천") && !baseRegion.includes("서울") && !baseRegion.includes("경기")) {
    if (!baseRegion.includes("강화군")) {
      baseRegion = `인천광역시 강화군 ${baseRegion}`;
    } else {
      baseRegion = `인천광역시 ${baseRegion}`;
    }
  }

  let addrPart = targetAddress;
  const tokens = baseRegion.split(/\s+/);
  for (const token of tokens) {
    if (token && addrPart.startsWith(token)) {
      addrPart = addrPart.substring(token.length).trim();
    }
  }

  return `${baseRegion} ${addrPart}`.trim().replace(/\s+/g, ' ');
}

export async function geocodePropertyAddress(district: string, address: string): Promise<{ latitude: number; longitude: number } | null> {
  const query = buildGeocodeQuery(district, address);
  if (!query || query.length < 2) return null;

  try {
    // 1단계: 카카오 주소 검색
    const addrUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const addrRes = await fetch(addrUrl, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }
    });

    if (addrRes.ok) {
      const data = await addrRes.json();
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        return {
          latitude: parseFloat(doc.y),
          longitude: parseFloat(doc.x)
        };
      }
    }

    // 2단계: 카카오 키워드 검색 폴백
    const kwdUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
    const kwdRes = await fetch(kwdUrl, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }
    });

    if (kwdRes.ok) {
      const data = await kwdRes.json();
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        return {
          latitude: parseFloat(doc.y),
          longitude: parseFloat(doc.x)
        };
      }
    }

    // 3단계: 지역 단위(읍/면/리) 검색 폴백
    const areaMatch = query.match(/(?:인천(?:광역시)?\s*)?(?:강화군\s*)?([가-힣]+[읍면동])(?:\s+([가-힣]+리))?/);
    if (areaMatch) {
      const fallbackQuery = `인천 강화군 ${areaMatch[1]} ${areaMatch[2] || ''}`.trim();
      const fbUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(fallbackQuery)}`;
      const fbRes = await fetch(fbUrl, {
        headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }
      });
      if (fbRes.ok) {
        const data = await fbRes.json();
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0];
          return {
            latitude: parseFloat(doc.y),
            longitude: parseFloat(doc.x)
          };
        }
      }
    }
  } catch (error) {
    console.error("서버 지오코딩 예외 발생:", error);
  }

  return null;
}

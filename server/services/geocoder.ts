import fetch from 'node-fetch';
import { log } from '../vite';

const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '';
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string, district?: string): Promise<GeocodeResult | null> {
  const queryDistrict = district || "";
  const cleanAddress = address || "";
  
  let query = (queryDistrict.includes("강화") || queryDistrict.includes("서울") || queryDistrict.includes("인천")
    ? `${queryDistrict} ${cleanAddress}`
    : `인천광역시 강화군 ${queryDistrict} ${cleanAddress}`).trim().replace(/\s+/g, ' ');

  // 1. Try Kakao First
  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data.documents && data.documents.length > 0) {
        return {
          lat: parseFloat(data.documents[0].y),
          lng: parseFloat(data.documents[0].x)
        };
      }
    } else {
      log(`Kakao Geocoding failed: ${response.status}`, 'warn');
    }
  } catch (error) {
    log(`Kakao Geocoding error: ${error}`, 'error');
  }

  // 2. Fallback to Naver
  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET
      }
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data.addresses && data.addresses.length > 0) {
        return {
          lat: parseFloat(data.addresses[0].y),
          lng: parseFloat(data.addresses[0].x)
        };
      }
    } else {
      log(`Naver Geocoding failed: ${response.status}`, 'error');
    }
  } catch (error) {
    log(`Naver Geocoding error: ${error}`, 'error');
  }

  return null;
}

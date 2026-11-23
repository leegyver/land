import { db } from '../db';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DATA_GO_KEY = process.env.DATA_GO_KR_API_KEY ? decodeURIComponent(process.env.DATA_GO_KR_API_KEY) : '';
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY || process.env.KAKAO_API_KEY || '';
const GANGHWA_LAWD_CD = '28710'; // 인천광역시 강화군

// 1. 테이블 초기화
export function initGanghwaTransactionTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ganghwa_real_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_type TEXT NOT NULL,
      sigungu_cd TEXT NOT NULL DEFAULT '28710',
      bjdong_cd TEXT,
      umd_nm TEXT NOT NULL,
      jibun TEXT NOT NULL,
      address_name TEXT NOT NULL,
      bonbun INTEGER,
      bubun INTEGER,
      deal_year INTEGER NOT NULL,
      deal_month INTEGER NOT NULL,
      deal_day INTEGER,
      deal_date TEXT NOT NULL,
      deal_amount INTEGER NOT NULL,
      deal_area REAL NOT NULL,
      pyeong REAL NOT NULL,
      pyeong_price INTEGER NOT NULL,
      jimok TEXT,
      land_use TEXT,
      building_name TEXT,
      floor INTEGER,
      lat REAL,
      lng REAL,
      unique_key TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_grt_lat_lng ON ganghwa_real_transactions(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_grt_deal_date ON ganghwa_real_transactions(deal_date);
    CREATE INDEX IF NOT EXISTS idx_grt_deal_type ON ganghwa_real_transactions(deal_type);
    CREATE INDEX IF NOT EXISTS idx_grt_address_name ON ganghwa_real_transactions(address_name);
    CREATE INDEX IF NOT EXISTS idx_grt_unique_key ON ganghwa_real_transactions(unique_key);

    CREATE TABLE IF NOT EXISTS ganghwa_address_coords (
      address_name TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ganghwa_sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 2. 주소 좌표 변환 및 캐싱
export async function getOrFetchCoords(address: string, umdNm?: string): Promise<{ lat: number; lng: number } | null> {
  const cleanAddr = address.trim();
  if (!cleanAddr) return null;

  try {
    const cached = db.prepare('SELECT lat, lng FROM ganghwa_address_coords WHERE address_name = ?').get(cleanAddr) as any;
    if (cached && cached.lat && cached.lng) {
      return { lat: cached.lat, lng: cached.lng };
    }

    if (!KAKAO_KEY) return null;

    // 1차: 마스킹 기호(*) 제거한 주소로 지오코딩 시도 (예: 9* -> 9)
    const sanitizedAddr = cleanAddr.replace(/\*+/g, '').trim();

    let res = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
      params: { query: sanitizedAddr },
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
      timeout: 4000
    });

    let doc = res.data?.documents?.[0];

    // 2차: 주소 검색 실패 시 읍/면/리 법정동 단위 검색
    if (!doc && umdNm) {
      const villageAddr = `인천광역시 강화군 ${umdNm}`.trim();
      res = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
        params: { query: villageAddr },
        headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
        timeout: 4000
      });
      doc = res.data?.documents?.[0];
    }

    if (doc && doc.x && doc.y) {
      const lng = parseFloat(doc.x);
      const lat = parseFloat(doc.y);
      db.prepare(`
        INSERT OR REPLACE INTO ganghwa_address_coords (address_name, lat, lng)
        VALUES (?, ?, ?)
      `).run(cleanAddr, lat, lng);
      return { lat, lng };
    }
  } catch (err: any) {
    // geocoding silent error
  }
  return null;
}

// 3. 월별 실거래가 단일 API 수집
async function fetchMonthApi(dealYmd: string, type: '토지' | '단독다가구' | '아파트', pageNo = 1): Promise<any[]> {
  if (!DATA_GO_KEY) return [];

  let endpoint = '';
  if (type === '토지') {
    endpoint = 'https://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade';
  } else if (type === '단독다가구') {
    endpoint = 'https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade';
  } else {
    endpoint = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
  }

  try {
    const res = await axios.get(endpoint, {
      params: {
        serviceKey: DATA_GO_KEY,
        LAWD_CD: GANGHWA_LAWD_CD,
        DEAL_YMD: dealYmd,
        numOfRows: 100,
        pageNo,
        _type: 'json'
      },
      timeout: 6000
    });

    const body = res.data?.response?.body;
    const items = body?.items?.item || [];
    const list = Array.isArray(items) ? items : (items ? [items] : []);

    const totalCount = parseInt(body?.totalCount || '0', 10);
    if (totalCount > pageNo * 100) {
      const nextList = await fetchMonthApi(dealYmd, type, pageNo + 1);
      return [...list, ...nextList];
    }
    return list;
  } catch (err: any) {
    console.warn(`[GanghwaSync] API error for ${type} ${dealYmd}:`, err.message);
    return [];
  }
}

// 4. 레코드 정제 및 DB 저장
const insertStmt = () => db.prepare(`
  INSERT OR IGNORE INTO ganghwa_real_transactions (
    deal_type, sigungu_cd, bjdong_cd, umd_nm, jibun, address_name,
    bonbun, bubun, deal_year, deal_month, deal_day, deal_date,
    deal_amount, deal_area, pyeong, pyeong_price, jimok, land_use,
    building_name, floor, lat, lng, unique_key
  ) VALUES (
    @deal_type, @sigungu_cd, @bjdong_cd, @umd_nm, @jibun, @address_name,
    @bonbun, @bubun, @deal_year, @deal_month, @deal_day, @deal_date,
    @deal_amount, @deal_area, @pyeong, @pyeong_price, @jimok, @land_use,
    @building_name, @floor, @lat, @lng, @unique_key
  )
`);

export async function processAndSaveTrades(rawList: any[], type: '토지' | '단독다가구' | '아파트'): Promise<number> {
  if (!rawList || rawList.length === 0) return 0;
  initGanghwaTransactionTables();

  const insert = insertStmt();
  let savedCount = 0;

  const insertTransaction = db.transaction((rows: any[]) => {
    for (const r of rows) {
      const res = insert.run(r);
      if (res.changes > 0) savedCount++;
    }
  });

  const parsedRows: any[] = [];

  for (const item of rawList) {
    const rawAmt = String(item.dealAmount || item.거래금액 || '0').replace(/,/g, '').trim();
    const dealAmount = parseInt(rawAmt, 10);
    if (isNaN(dealAmount) || dealAmount <= 0) continue;

    let dealArea = 0;
    if (type === '토지') {
      dealArea = parseFloat(String(item.dealArea || '0'));
    } else if (type === '단독다가구') {
      dealArea = parseFloat(String(item.plottageAr || item.totalFloorAr || item.dealArea || '0'));
    } else {
      dealArea = parseFloat(String(item.excluUseAr || item.dealArea || '0'));
    }
    if (isNaN(dealArea)) dealArea = 0;

    const pyeong = Math.round(dealArea * 0.3025 * 10) / 10;
    const pyeongPrice = pyeong > 0 ? Math.round(dealAmount / pyeong) : 0;

    const umdNm = String(item.umdNm || item.법정동 || '').trim();
    const bonbun = item.bonbun !== undefined && item.bonbun !== null && item.bonbun !== '' ? parseInt(String(item.bonbun), 10) : null;
    const bubun = item.bubun !== undefined && item.bubun !== null && item.bubun !== '' ? parseInt(String(item.bubun), 10) : null;

    let jibun = String(item.jibun || item.지번 || '').trim();
    if (!jibun && bonbun !== null) {
      jibun = `${bonbun}${bubun ? '-' + bubun : ''}`;
    }

    const year = parseInt(String(item.dealYear || item.년 || '0'), 10);
    const month = parseInt(String(item.dealMonth || item.월 || '0'), 10);
    const day = parseInt(String(item.dealDay || item.일 || '1'), 10);
    if (!year || !month) continue;

    const dealDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const addressName = `인천광역시 강화군 ${umdNm} ${jibun}`.trim();

    let buildingName = '';
    if (type === '아파트') {
      buildingName = item.aptNm || item.아파트 || '아파트';
    } else if (type === '단독다가구') {
      buildingName = item.houseType || '단독주택';
    } else {
      buildingName = item.jimok ? `토지 (${item.jimok})` : '토지';
    }

    const uniqueKey = `${type}_${dealDate}_${umdNm}_${jibun}_${dealAmount}_${dealArea}`;

    parsedRows.push({
      deal_type: type,
      sigungu_cd: GANGHWA_LAWD_CD,
      bjdong_cd: item.bjdongCd || null,
      umd_nm: umdNm,
      jibun,
      address_name: addressName,
      bonbun,
      bubun,
      deal_year: year,
      deal_month: month,
      deal_day: day,
      deal_date: dealDate,
      deal_amount: dealAmount,
      deal_area: dealArea,
      pyeong,
      pyeong_price: pyeongPrice,
      jimok: item.jimok || null,
      land_use: item.landUse || null,
      building_name: buildingName,
      floor: item.floor ? parseInt(String(item.floor), 10) : null,
      lat: null,
      lng: null,
      unique_key: uniqueKey
    });
  }

  insertTransaction(parsedRows);
  return savedCount;
}

// 5. 미할당 좌표 일괄 지오코딩 작업
export async function batchGeocodeMissing(limit = 100): Promise<number> {
  initGanghwaTransactionTables();

  // 좌표가 없는 고유 주소 조회
  const missingAddrs = db.prepare(`
    SELECT DISTINCT address_name, umd_nm 
    FROM ganghwa_real_transactions 
    WHERE (lat IS NULL OR lng IS NULL) AND address_name IS NOT NULL AND address_name != ''
    LIMIT ?
  `).all(limit) as { address_name: string; umd_nm: string }[];

  let updatedCount = 0;
  for (const item of missingAddrs) {
    const coords = await getOrFetchCoords(item.address_name, item.umd_nm);
    if (coords) {
      db.prepare(`
        UPDATE ganghwa_real_transactions 
        SET lat = ?, lng = ?
        WHERE address_name = ?
      `).run(coords.lat, coords.lng, item.address_name);
      updatedCount++;
    }
    // API 레이트 리밋 방지
    await new Promise(r => setTimeout(r, 60));
  }

  return updatedCount;
}

// 6. 단일 월 전체 수집
export async function syncMonth(dealYmd: string): Promise<{ land: number; house: number; apt: number }> {
  console.log(`[GanghwaSync] Syncing ${dealYmd}...`);
  const [landList, houseList, aptList] = await Promise.all([
    fetchMonthApi(dealYmd, '토지'),
    fetchMonthApi(dealYmd, '단독다가구'),
    fetchMonthApi(dealYmd, '아파트')
  ]);

  const land = await processAndSaveTrades(landList, '토지');
  const house = await processAndSaveTrades(houseList, '단독다가구');
  const apt = await processAndSaveTrades(aptList, '아파트');

  return { land, house, apt };
}

// 7. 최근 거래 데이터 동기화 (이번 달 + 지난 달)
export async function syncRecentGanghwa(): Promise<void> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const currentYm = `${y}${String(m).padStart(2, '0')}`;
  const prevDate = new Date(y, m - 2, 1);
  const prevYm = `${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  console.log(`[GanghwaSync] Daily sync: ${prevYm}, ${currentYm}`);
  await syncMonth(prevYm);
  await syncMonth(currentYm);
  await batchGeocodeMissing(300);

  db.prepare(`
    INSERT OR REPLACE INTO ganghwa_sync_meta (key, value, updated_at)
    VALUES ('last_daily_sync', ?, CURRENT_TIMESTAMP)
  `).run(new Date().toISOString());
}

// 8. 5년치 전수 백필 (2021년 1월 ~ 현재)
let isBackfillRunning = false;
export async function backfillGanghwa5Years(onProgress?: (progress: { currentYm: string; count: number; totalMonths: number }) => void): Promise<{ totalSaved: number }> {
  if (isBackfillRunning) {
    console.log('[GanghwaSync] Backfill is already running.');
    return { totalSaved: 0 };
  }

  isBackfillRunning = true;
  initGanghwaTransactionTables();

  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;

  const months: string[] = [];
  for (let y = 2021; y <= endYear; y++) {
    const maxM = (y === endYear) ? endMonth : 12;
    for (let m = 1; m <= maxM; m++) {
      months.push(`${y}${String(m).padStart(2, '0')}`);
    }
  }

  let totalSaved = 0;
  console.log(`[GanghwaSync] Starting 5-year backfill (${months.length} months from ${months[0]} to ${months[months.length - 1]})...`);

  try {
    for (let i = 0; i < months.length; i++) {
      const ym = months[i];
      const res = await syncMonth(ym);
      const savedInMonth = res.land + res.house + res.apt;
      totalSaved += savedInMonth;

      if (onProgress) {
        onProgress({ currentYm: ym, count: totalSaved, totalMonths: months.length });
      }

      // 서버 부하 및 API 차단 방지용 딜레이 (150ms)
      await new Promise(r => setTimeout(r, 150));
    }

    // 1차 지오코딩 배치 실행
    console.log('[GanghwaSync] Geocoding initial batch...');
    await batchGeocodeMissing(1000);

    db.prepare(`
      INSERT OR REPLACE INTO ganghwa_sync_meta (key, value, updated_at)
      VALUES ('5year_backfill_completed', ?, CURRENT_TIMESTAMP)
    `).run(new Date().toISOString());

  } finally {
    isBackfillRunning = false;
  }

  return { totalSaved };
}

// 9. 지도 영역(Bounding Box) 내 실거래가 조회 함수
export interface QueryBoundsParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  types?: string[]; // ['토지', '단독다가구', '아파트']
  years?: number;   // 1, 3, 5
  limit?: number;
}

export function getGanghwaTransactionsInBounds(params: QueryBoundsParams) {
  initGanghwaTransactionTables();

  const { minLat, maxLat, minLng, maxLng, types = ['토지', '단독다가구', '아파트'], years = 5, limit = 200 } = params;

  const cutoffYear = new Date().getFullYear() - years;
  const placeholders = types.map(() => '?').join(',');

  const query = `
    SELECT 
      id, deal_type, umd_nm, jibun, address_name,
      deal_year, deal_month, deal_day, deal_date,
      deal_amount, deal_area, pyeong, pyeong_price,
      jimok, land_use, building_name, floor,
      lat, lng
    FROM ganghwa_real_transactions
    WHERE lat BETWEEN ? AND ?
      AND lng BETWEEN ? AND ?
      AND deal_type IN (${placeholders})
      AND deal_year >= ?
    ORDER BY deal_date DESC
    LIMIT ?
  `;

  const rows = db.prepare(query).all(minLat, maxLat, minLng, maxLng, ...types, cutoffYear, limit) as any[];

  return rows.map(r => ({
    ...r,
    dealAmountFormatted: formatKoreanWon(r.deal_amount),
    pyeongPriceFormatted: r.pyeong_price > 0 ? `${r.pyeong_price.toLocaleString()}만원/평` : '-'
  }));
}

// 10. 특정 지번의 실거래 내역 조회
export function getGanghwaTransactionsForParcel(umdNm: string, jibun: string) {
  initGanghwaTransactionTables();

  const query = `
    SELECT *
    FROM ganghwa_real_transactions
    WHERE umd_nm = ? AND (jibun = ? OR jibun LIKE ?)
    ORDER BY deal_date DESC
    LIMIT 20
  `;

  const rows = db.prepare(query).all(umdNm, jibun, `${jibun}-%`) as any[];
  return rows.map(r => ({
    ...r,
    dealAmountFormatted: formatKoreanWon(r.deal_amount),
    pyeongPriceFormatted: r.pyeong_price > 0 ? `${r.pyeong_price.toLocaleString()}만원/평` : '-'
  }));
}

// 11. 현재 DB 통계 조회
export function getGanghwaStats() {
  initGanghwaTransactionTables();

  const total = db.prepare('SELECT COUNT(*) as count FROM ganghwa_real_transactions').get() as any;
  const withCoords = db.prepare('SELECT COUNT(*) as count FROM ganghwa_real_transactions WHERE lat IS NOT NULL').get() as any;
  const landCount = db.prepare("SELECT COUNT(*) as count FROM ganghwa_real_transactions WHERE deal_type = '토지'").get() as any;
  const houseCount = db.prepare("SELECT COUNT(*) as count FROM ganghwa_real_transactions WHERE deal_type = '단독다가구'").get() as any;
  const aptCount = db.prepare("SELECT COUNT(*) as count FROM ganghwa_real_transactions WHERE deal_type = '아파트'").get() as any;
  const latestDate = db.prepare('SELECT MAX(deal_date) as maxDate FROM ganghwa_real_transactions').get() as any;
  const oldestDate = db.prepare('SELECT MIN(deal_date) as minDate FROM ganghwa_real_transactions').get() as any;
  const meta = db.prepare("SELECT value FROM ganghwa_sync_meta WHERE key = '5year_backfill_completed'").get() as any;

  return {
    totalCount: total?.count || 0,
    withCoordsCount: withCoords?.count || 0,
    landCount: landCount?.count || 0,
    houseCount: houseCount?.count || 0,
    aptCount: aptCount?.count || 0,
    latestDate: latestDate?.maxDate || '-',
    oldestDate: oldestDate?.minDate || '-',
    isBackfillCompleted: !!meta?.value,
    isBackfillRunning
  };
}

// 12. 매일 새벽 자동 동기화 스케줄러
export function setupGanghwaTransactionScheduler() {
  initGanghwaTransactionTables();

  const runDailySync = async () => {
    try {
      console.log('[GanghwaSync] Running scheduled daily transaction sync...');
      await syncRecentGanghwa();
      console.log('[GanghwaSync] Scheduled daily transaction sync completed.');
    } catch (err: any) {
      console.error('[GanghwaSync] Scheduled daily sync error:', err.message);
    }
  };

  // 24시간마다 실행 (서버 시작 2분 후 최초 점검)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    runDailySync();
  }, 2 * 60 * 1000);

  setInterval(runDailySync, TWENTY_FOUR_HOURS);
  console.log('[GanghwaSync] Ganghwa transaction daily scheduler initialized.');
}

function formatKoreanWon(manwon: number): string {
  if (manwon >= 10000) {
    const uk = Math.floor(manwon / 10000);
    const rest = manwon % 10000;
    return rest > 0 ? `${uk}억 ${rest.toLocaleString()}만원` : `${uk}억원`;
  }
  return `${manwon.toLocaleString()}만원`;
}

import { backfillGanghwa5Years, getGanghwaStats, batchGeocodeMissing } from '../services/ganghwa-transactions';

async function main() {
  console.log('=== 강화군 5년치 실거래가 전수 수집 및 DB 구축 시작 ===');
  const beforeStats = getGanghwaStats();
  console.log('초기 DB 상태:', beforeStats);

  const res = await backfillGanghwa5Years((p) => {
    console.log(`[진행중] ${p.currentYm} 완료 (누적 신규저장: ${p.count}건)`);
  });

  console.log('5년치 수집 완료. 총 신규 저장 건수:', res.totalSaved);

  console.log('좌표 변환(Geocoding) 대량 실행 중...');
  let totalGeocoded = 0;
  for (let i = 0; i < 30; i++) {
    const count = await batchGeocodeMissing(200);
    totalGeocoded += count;
    console.log(`지오코딩 배치 #${i + 1}: ${count}건 변환 완료 (누적: ${totalGeocoded})`);
    if (count === 0) break;
  }

  const afterStats = getGanghwaStats();
  console.log('=== 최종 DB 구축 완료 상태 ===');
  console.log(afterStats);
  process.exit(0);
}

main().catch(err => {
  console.error('Backfill error:', err);
  process.exit(1);
});

import React from "react";

interface PrintablePropertyLookupReportProps {
  data: any;
}

export default function PrintablePropertyLookupReport({ data }: PrintablePropertyLookupReportProps) {
  if (!data || !data.success) return null;

  const basic = data.basicInfo || {};
  const land = data.landLedger || {};
  const bld = data.buildingLedger || {};
  const owner = data.ownership || {};
  const trades = data.transactions || {};
  const ai = data.aiSummary || {};

  const mainBld = bld.buildings?.[0] || null;
  const isMultiBld = (bld.buildings?.length || 0) > 1;

  // 총 공시지가 한글 포맷팅
  const formatTotalWon = (val: number) => {
    if (!val || val <= 0) return "-";
    const uk = Math.floor(val / 100000000);
    const man = Math.round((val % 100000000) / 10000);
    if (uk > 0) {
      return man > 0 ? `${uk}억 ${man.toLocaleString()}만원` : `${uk}억원`;
    }
    return `${man.toLocaleString()}만원`;
  };

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return (
    <div className="hidden print:block text-slate-900 bg-white font-sans p-0 m-0 max-w-[210mm] mx-auto text-[10px] leading-tight">
      {/* 1. 상단 브랜딩 & 헤더 */}
      <div className="border-b-2 border-slate-900 pb-1.5 mb-1.5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px] tracking-tight">
            <span>🏛️ 이가이버 부동산 · 공공데이터 실시간 연계</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            부동산 종합 분석 브리핑 리포트
          </h1>
        </div>
        <div className="text-right text-[9.5px] text-slate-500 space-y-0.5">
          <div>
            <span className="font-semibold text-slate-700">발행일자:</span> {todayStr}
          </div>
          <div>
            <span className="font-semibold text-slate-700">데이터출처:</span> 국토교통부 · 브이월드(VWorld)
          </div>
        </div>
      </div>

      {/* 2. 대상 부동산 기본 정보 바 */}
      <div className="bg-slate-50 border border-slate-300 rounded p-1.5 mb-1.5 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold text-[9.5px] px-1.5 py-0.5 rounded shrink-0">
              대상지번
            </span>
            <span className="text-[13px] font-bold text-slate-900">{basic.addressName}</span>
            {basic.isMountain && (
              <span className="bg-amber-100 text-amber-800 text-[9px] px-1 py-0.2 rounded font-semibold shrink-0">
                산(임야)
              </span>
            )}
          </div>
          {basic.roadAddressName && (
            <div className="text-[9.5px] text-slate-600">도로명: {basic.roadAddressName}</div>
          )}
        </div>
        <div className="text-right text-[9.5px] text-slate-600 shrink-0">
          <div>
            <span className="font-semibold text-slate-700">PNU:</span> {basic.pnu || "-"}
          </div>
          <div>
            <span className="font-semibold text-slate-700">용도지역:</span> {land.useArea1Nm || "-"}{" "}
            {land.useArea2Nm ? `(${land.useArea2Nm})` : ""}
          </div>
        </div>
      </div>

      {/* 3. 2단 분할: [좌: 공인 지적도(연속지적도)] vs [우: 토지대장 및 소유 현황] */}
      <div className="grid grid-cols-2 gap-2 mb-1.5">
        {/* (1) 지적도 (연속지적도 및 필지 경계선) */}
        <div className="border border-slate-300 rounded overflow-hidden flex flex-col bg-white">
          <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10.5px] flex justify-between items-center">
            <span>🗺️ 공인 지적도 (국토교통부 연속지적도)</span>
            <span className="text-[8.5px] font-normal text-slate-300">필지경계·지번 확인</span>
          </div>
          <div className="relative w-full h-[150px] bg-slate-50 overflow-hidden flex-1 flex items-center justify-center">
            {basic.lat && basic.lng ? (
              <>
                <img
                  src={`/api/property/cadastral-map-image?lat=${basic.lat}&lng=${basic.lng}&delta=0.0012&width=500&height=320`}
                  alt="지적도"
                  className="w-full h-full object-cover"
                />
                {/* 대상 필지 중심 핀 오버레이 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none drop-shadow">
                  <div className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                    대상지
                  </div>
                  <div className="w-0 h-0 border-x-[3.5px] border-x-transparent border-t-[5px] border-t-red-600" />
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-[10px]">지적도 좌표 정보 없음</div>
            )}
          </div>
          <div className="bg-slate-100 border-t border-slate-200 px-2 py-0.5 text-[8.5px] text-slate-600 flex justify-between">
            <span>※ 중심점(빨간핀): 해당 지번 필지</span>
            <span>축척: 약 1/1,200</span>
          </div>
        </div>

        {/* (2) 토지대장 및 소유 현황 */}
        <div className="border border-slate-300 rounded overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10.5px] flex justify-between items-center">
            <span>📄 토지대장 및 소유 현황</span>
            <span className="text-[8.5px] font-normal text-slate-300">
              공시지가 {land.standardYear || "-"}년 기준
            </span>
          </div>
          <table className="w-full text-[9.5px] border-collapse flex-1">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 w-24 text-slate-700">지목 / 면적</td>
                <td className="p-1 font-bold text-slate-900">
                  {land.landCategoryNm || "-"} / {land.areaM2 ? Number(land.areaM2).toLocaleString() : 0}㎡ ({land.areaPyeong || 0}평)
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">공시지가 (㎡당)</td>
                <td className="p-1 font-bold text-blue-700">
                  {land.officialPricePerM2 ? Number(land.officialPricePerM2).toLocaleString() : 0}원 / ㎡
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">토지 공시총액</td>
                <td className="p-1 font-semibold text-slate-900">
                  약 {formatTotalWon(land.officialPriceTotal)}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">법정 건폐/용적</td>
                <td className="p-1 text-slate-800">
                  건폐율 <span className="font-bold text-slate-900">{land.legalBcRatLimit || 60}%↓</span> / 용적률{" "}
                  <span className="font-bold text-slate-900">{land.legalVlRatLimit || 200}%↓</span>
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">도로 / 지형형상</td>
                <td className="p-1 text-slate-800">
                  {land.roadSideNm || "-"} · {land.terrainHeightNm || "-"} ({land.terrainShapeNm || "-"})
                </td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">소유 및 권리</td>
                <td className="p-1 text-slate-800">
                  {owner.ownerTypeNm || "개인"} ({owner.isCoOwned ? `공유 ${owner.coOwnerCount}명` : "단독소유"}) ·{" "}
                  {owner.changeDate || "-"} {owner.changeCauseNm || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 건축물대장 현황 표 */}
      <div className="border border-slate-300 rounded overflow-hidden mb-1.5">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10.5px] flex justify-between items-center">
          <span>🏢 건축물대장 현황</span>
          <span className="text-[8.5px] font-normal text-slate-300">
            {bld.hasData ? `총 ${bld.buildingCount}개동` : "등재 건축물 없음"}
          </span>
        </div>
        {bld.hasData && mainBld ? (
          <table className="w-full text-[9.5px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 w-20 text-slate-700">건물명/용도</td>
                <td className="p-1 font-bold text-slate-900 w-1/3">
                  {mainBld.bldNm} ({mainBld.mainPurpsNm})
                  {isMultiBld && ` 외 ${bld.buildingCount - 1}개동`}
                </td>
                <td className="bg-slate-100 font-semibold p-1 w-20 text-slate-700">구조/층수</td>
                <td className="p-1 text-slate-800">
                  {mainBld.strctNm} / 지상 {mainBld.grndFlrCnt}층
                  {mainBld.ugrndFlrCnt > 0 ? ` (지하 ${mainBld.ugrndFlrCnt}층)` : ""}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">연면적/건축</td>
                <td className="p-1 font-bold text-slate-900">
                  {Number(mainBld.totAreaM2).toLocaleString()}㎡ ({mainBld.totAreaPyeong}평) / {Number(mainBld.archAreaM2).toLocaleString()}㎡
                </td>
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">실제 건폐/용적</td>
                <td className="p-1 font-bold text-blue-700">
                  건폐율 {mainBld.bcRat > 0 ? `${mainBld.bcRat}%` : "-"} / 용적률 {mainBld.vlRat > 0 ? `${mainBld.vlRat}%` : "-"}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">준공/주차</td>
                <td className="p-1 text-slate-800">
                  {mainBld.useAprDay || "-"} ({mainBld.buildingAgeYears || 0}년차) · 주차 {mainBld.parkingCount || 0}대
                </td>
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">위반 여부</td>
                <td className="p-1 font-bold">
                  {mainBld.isViolated ? (
                    <span className="text-red-600">⚠️ 위반건축물 등재</span>
                  ) : (
                    <span className="text-emerald-700">✓ 정상 (위반건축물 표기 없음)</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="p-2 text-center text-slate-500 text-[9.5px] bg-slate-50">
            공부상 등재된 건축물이 없는 나대지 상태이거나 가설건축물일 수 있습니다.
          </div>
        )}
      </div>

      {/* 5. 최근 실거래가 현황 표 */}
      <div className="border border-slate-300 rounded overflow-hidden mb-1.5">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10.5px] flex justify-between items-center">
          <span>💰 국토교통부 최근 실거래가 신고 내역</span>
          <span className="text-[8.5px] font-normal text-slate-300">
            {trades.hasDirectTrades ? "⭐ 선택 주소지 직접 거래 내역 포함" : "반경 인근 실거래 사례"}
          </span>
        </div>
        {trades.hasData && trades.items?.length > 0 ? (
          <table className="w-full text-[9px] text-center border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-0.5 w-14">구분</th>
                <th className="p-0.5 w-18">거래일자</th>
                <th className="p-0.5 w-16">물건유형</th>
                <th className="p-0.5 text-left">거래 대상 / 위치</th>
                <th className="p-0.5 w-24">면적</th>
                <th className="p-0.5 text-right w-24">거래금액</th>
                <th className="p-0.5 text-right w-20">평당가격</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {trades.items.slice(0, 3).map((t: any, idx: number) => (
                <tr key={idx} className={t.isDirectMatch ? "bg-blue-50/80 font-semibold" : ""}>
                  <td className="p-0.5">
                    {t.isDirectMatch ? (
                      <span className="bg-blue-600 text-white text-[7.5px] px-1 py-0.2 rounded font-bold">
                        해당지번
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[8px]">인근</span>
                    )}
                  </td>
                  <td className="p-0.5">{t.dealDate || "-"}</td>
                  <td className="p-0.5 font-medium">{t.__tradeType || t.tradeType || "부동산"}</td>
                  <td className="p-0.5 text-left truncate max-w-[150px]">{t.name || "-"}</td>
                  <td className="p-0.5">
                    {t.excluUseAr || t.dealArea || t.areaM2 || "-"}㎡ ({t.pyeong || t.areaPyeong || "-"}평)
                  </td>
                  <td className="p-0.5 text-right font-bold text-blue-700">
                    {t.dealAmountFormatted || (t.dealAmount ? `${Number(t.dealAmount).toLocaleString()}만원` : "-")}
                  </td>
                  <td className="p-0.5 text-right text-slate-600">{t.pyeongPriceFormatted || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-2 text-center text-slate-400 text-[9.5px]">
            최근 국토교통부에 신고된 실거래가 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 6. AI 종합 브리핑 및 주요 규제 분석 */}
      <div className="border border-blue-200 bg-blue-50/40 rounded p-1.5 mb-1.5">
        <div className="font-bold text-[10px] text-blue-900 mb-0.5 flex items-center gap-1">
          <span>✨ AI 부동산 종합 브리핑 및 권리·규제 분석</span>
        </div>
        <div className="space-y-0.5 text-[9px] text-slate-800">
          {ai.points?.slice(0, 4).map((pt: string, idx: number) => (
            <div key={idx} className="flex items-start gap-1">
              <span className="text-blue-600 font-bold shrink-0">•</span>
              <span>{pt}</span>
            </div>
          ))}
          {ai.riskAnalysis?.length > 0 && (
            <div className="mt-0.5 pt-0.5 border-t border-blue-200 text-[8.5px] text-slate-600">
              <span className="font-bold text-slate-800">주요 규제 및 유의사항: </span>
              {ai.riskAnalysis.join(" ")}
            </div>
          )}
        </div>
      </div>

      {/* 7. 공인중개사 정보 및 안내 푸터 */}
      <div className="border-t border-slate-300 pt-1 flex items-center justify-between text-[8.5px] text-slate-500">
        <div>
          <span className="font-bold text-slate-800 text-[9px]">이가이버 공인중개사사무소</span> | 대표: 이강욱 |
          인천광역시 강화군 강화읍 남문로 1, 1층 | ☎ 032-934-3120 · 010-4787-3120
        </div>
        <div className="text-slate-400">
          ※ 본 문서는 공공데이터 기반 참고자료로 법적 효력이 없습니다.
        </div>
      </div>
    </div>
  );
}

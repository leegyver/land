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

  return (
    <div className="hidden print:block text-slate-900 bg-white font-sans p-0 m-0 w-full text-[10px] leading-tight">
      {/* 지도 안내 캡션 바 */}
      <div className="flex justify-between items-center text-[8.5px] text-slate-500 mb-1 px-1">
        <span>※ 상단 지도: 카카오맵 지적편집도 실시간 연동 (중심 핀: 선택 대상필지)</span>
        <span>용도지역 및 지번 경계선 확인</span>
      </div>

      {/* 1. 토지대장 및 건축물대장 2열 나란히 배치 */}
      <div className="grid grid-cols-2 gap-2 mb-1.5">
        {/* (1) 토지대장 및 소유 현황 */}
        <div className="border border-slate-300 rounded overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10px] flex justify-between items-center">
            <span>📄 토지대장 및 소유 현황</span>
            <span className="text-[8px] font-normal text-slate-300">
              공시지가 {land.standardYear || "-"}년 기준
            </span>
          </div>
          <table className="w-full text-[9px] border-collapse flex-1">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1 w-20 text-slate-700">지목 / 면적</td>
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
                <td className="bg-slate-100 font-semibold p-1 text-slate-700">도로 / 지형</td>
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

        {/* (2) 건축물대장 현황 */}
        <div className="border border-slate-300 rounded overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10px] flex justify-between items-center">
            <span>🏢 건축물대장 현황</span>
            <span className="text-[8px] font-normal text-slate-300">
              {bld.hasData ? `총 ${bld.buildingCount}개동` : "등재 건축물 없음"}
            </span>
          </div>
          {bld.hasData && mainBld ? (
            <table className="w-full text-[9px] border-collapse flex-1">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100 font-semibold p-1 w-20 text-slate-700">건물명/용도</td>
                  <td className="p-1 font-bold text-slate-900">
                    {mainBld.bldNm} ({mainBld.mainPurpsNm})
                    {isMultiBld && ` 외 ${bld.buildingCount - 1}개동`}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100 font-semibold p-1 text-slate-700">연면적 / 건축</td>
                  <td className="p-1 font-bold text-slate-900">
                    {Number(mainBld.totAreaM2).toLocaleString()}㎡ ({mainBld.totAreaPyeong}평) / {Number(mainBld.archAreaM2).toLocaleString()}㎡
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100 font-semibold p-1 text-slate-700">구조 / 층수</td>
                  <td className="p-1 text-slate-800">
                    {mainBld.strctNm} / 지상 {mainBld.grndFlrCnt}층
                    {mainBld.ugrndFlrCnt > 0 ? ` (지하 ${mainBld.ugrndFlrCnt}층)` : ""}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100 font-semibold p-1 text-slate-700">실제 건폐/용적</td>
                  <td className="p-1 font-bold text-blue-700">
                    건폐율 {mainBld.bcRat > 0 ? `${mainBld.bcRat}%` : "-"} / 용적률 {mainBld.vlRat > 0 ? `${mainBld.vlRat}%` : "-"}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100 font-semibold p-1 text-slate-700">준공 / 주차</td>
                  <td className="p-1 text-slate-800">
                    {mainBld.useAprDay || "-"} ({mainBld.buildingAgeYears || 0}년차) · 주차 {mainBld.parkingCount || 0}대
                  </td>
                </tr>
                <tr>
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
            <div className="p-3 text-center text-slate-500 text-[9px] bg-slate-50 flex-1 flex items-center justify-center">
              공부상 등재된 건축물이 없는 나대지 상태이거나 가설건축물일 수 있습니다.
            </div>
          )}
        </div>
      </div>

      {/* 2. 최근 실거래가 현황 표 */}
      <div className="border border-slate-300 rounded overflow-hidden mb-1.5">
        <div className="bg-slate-800 text-white font-bold px-2 py-0.5 text-[10px] flex justify-between items-center">
          <span>💰 국토교통부 최근 실거래가 신고 내역</span>
          <span className="text-[8px] font-normal text-slate-300">
            {trades.hasDirectTrades ? "⭐ 선택 주소지 직접 거래 내역 포함" : "반경 인근 실거래 사례"}
          </span>
        </div>
        {trades.hasData && trades.items?.length > 0 ? (
          <table className="w-full text-[8.5px] text-center border-collapse">
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
          <div className="p-1.5 text-center text-slate-400 text-[9px]">
            최근 국토교통부에 신고된 실거래가 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 3. AI 종합 브리핑 및 주요 규제 분석 */}
      <div className="border border-blue-200 bg-blue-50/40 rounded p-1.5 mb-1.5">
        <div className="font-bold text-[9.5px] text-blue-900 mb-0.5 flex items-center gap-1">
          <span>✨ AI 부동산 종합 브리핑 및 권리·규제 분석</span>
        </div>
        <div className="space-y-0.5 text-[8.5px] text-slate-800">
          {ai.points?.slice(0, 4).map((pt: string, idx: number) => (
            <div key={idx} className="flex items-start gap-1">
              <span className="text-blue-600 font-bold shrink-0">•</span>
              <span>{pt}</span>
            </div>
          ))}
          {ai.riskAnalysis?.length > 0 && (
            <div className="mt-0.5 pt-0.5 border-t border-blue-200 text-[8px] text-slate-600">
              <span className="font-bold text-slate-800">주요 규제 및 유의사항: </span>
              {ai.riskAnalysis.join(" ")}
            </div>
          )}
        </div>
      </div>

      {/* 4. 공인중개사 정보 및 안내 푸터 */}
      <div className="border-t border-slate-300 pt-1 flex items-center justify-between text-[8px] text-slate-500">
        <div>
          <span className="font-bold text-slate-800 text-[8.5px]">이가이버 공인중개사사무소</span> | 대표: 이강욱 |
          인천광역시 강화군 강화읍 남문로 1, 1층 | ☎ 032-934-3120 · 010-4787-3120
        </div>
        <div className="text-slate-400">
          ※ 본 문서는 공공데이터 기반 참고자료로 법적 효력이 없습니다.
        </div>
      </div>
    </div>
  );
}

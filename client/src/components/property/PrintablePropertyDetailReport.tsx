import React from "react";
import { Property } from "@shared/schema";
import { formatKoreanPrice } from "@/lib/formatter";

interface PrintablePropertyDetailReportProps {
  property: Property;
  displayTitle: string;
  displayAddress: string;
  images: string[];
}

export default function PrintablePropertyDetailReport({
  property,
  displayTitle,
  displayAddress,
  images
}: PrintablePropertyDetailReportProps) {
  if (!property) return null;

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  // 거래유형 텍스트 정리
  const dealTypeStr = Array.isArray(property.dealType)
    ? property.dealType.join(", ")
    : (property.dealType || "매매");

  // 평수 계산
  const formatArea = (val: string | null | undefined) => {
    if (!val) return "-";
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
    if (isNaN(num) || num <= 0) return val;
    const pyeong = Math.round(num * 0.3025 * 10) / 10;
    return `${num.toLocaleString()}㎡ (약 ${pyeong}평)`;
  };

  return (
    <div className="hidden print:block text-slate-900 bg-white font-sans p-0 m-0 max-w-[210mm] mx-auto text-[10.5px] leading-tight">
      {/* 1. 상단 브랜딩 & 헤더 */}
      <div className="border-b-2 border-slate-900 pb-2 mb-2 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px] tracking-tight">
            <span>🏢 이가이버 부동산 매물 브리핑 리포트</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5 truncate max-w-[150mm]">
            {displayTitle}
          </h1>
        </div>
        <div className="text-right text-[10px] text-slate-500 space-y-0.5 shrink-0">
          <div>
            <span className="font-semibold text-slate-700">매물번호:</span> #{property.id}
          </div>
          <div>
            <span className="font-semibold text-slate-700">출력일자:</span> {todayStr}
          </div>
        </div>
      </div>

      {/* 2. 핵심 가격 & 거래 유형 배너 */}
      <div className="bg-slate-900 text-white p-2.5 rounded mb-2 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="bg-orange-500 text-slate-950 font-black text-[10.5px] px-2 py-0.5 rounded">
              {property.type || "부동산"}
            </span>
            <span className="font-bold text-[12px] text-slate-200">
              {dealTypeStr}
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            소재지: {displayAddress}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">거래 가격</div>
          <div className="text-lg font-black text-amber-400">
            {formatKoreanPrice(property.price)}
            {property.monthlyRent && ` / 월 ${property.monthlyRent}만원`}
          </div>
        </div>
      </div>

      {/* 3. 매물 사진 (가로 2열 배치) */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="h-[155px] overflow-hidden rounded border border-slate-300 bg-slate-100 flex flex-col">
          <div className="bg-slate-700 text-white font-bold px-2 py-0.5 text-[9.5px]">
            📷 매물 대표 현장 사진
          </div>
          <div className="flex-1 overflow-hidden">
            <img
              src={images?.[0] || property.imageUrl}
              alt="매물 대표 사진"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="h-[155px] overflow-hidden rounded border border-slate-300 bg-slate-100 flex flex-col">
          <div className="bg-slate-700 text-white font-bold px-2 py-0.5 text-[9.5px]">
            📷 매물 현장 사진
          </div>
          <div className="flex-1 overflow-hidden">
            <img
              src={images?.[1] || images?.[0] || property.imageUrl}
              alt="매물 현장 사진"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 4. 매물 상세 제원 표 (2단 분할 테이블) */}
      <div className="border border-slate-300 rounded overflow-hidden mb-2">
        <div className="bg-slate-800 text-white font-bold px-2 py-1 text-[11px] flex justify-between items-center">
          <span>📋 중개대상물 상세 정보</span>
          <span className="text-[9px] font-normal text-slate-300">공인중개사법 시행규칙 제17조의2 표시사항</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <table className="w-full text-[10px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 w-24 text-slate-700">매물 종류</td>
                <td className="p-1.5 font-bold text-slate-900">{property.type || "-"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">대지/토지면적</td>
                <td className="p-1.5 font-bold text-slate-900">
                  {formatArea(property.areaSize || property.size)}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">연면적 / 전용</td>
                <td className="p-1.5 font-semibold text-slate-900">
                  {property.privateArea
                    ? formatArea(property.privateArea)
                    : (property.supplyArea ? formatArea(property.supplyArea) : "-")}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">해당층 / 총층수</td>
                <td className="p-1.5 text-slate-800">
                  {property.floor ? `${property.floor}층` : (property.floorLevel || "-")} /{" "}
                  {property.totalFloors ? `${property.totalFloors}층` : "-"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">방수 / 욕실수</td>
                <td className="p-1.5 text-slate-800">
                  {property.bedrooms ? `방 ${property.bedrooms}개` : "-"} /{" "}
                  {property.bathrooms ? `욕실 ${property.bathrooms}개` : "-"}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">방향 / 주차</td>
                <td className="p-1.5 text-slate-800">
                  {property.direction || "-"} / {property.parking || "-"}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-[10px] border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 w-24 text-slate-700">관리비</td>
                <td className="p-1.5 font-bold text-slate-900">
                  {property.maintenanceFee ? `${property.maintenanceFee}만원` : "확인요망 / 없음"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">입주가능일</td>
                <td className="p-1.5 text-slate-800">
                  {property.availableDate || "즉시 입주 / 협의"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">난방 방식</td>
                <td className="p-1.5 text-slate-800">{property.heatingSystem || "-"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">용도지역</td>
                <td className="p-1.5 text-slate-800">{property.zoneType || "-"}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">지목</td>
                <td className="p-1.5 text-slate-800">{property.landType || "-"}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-semibold p-1.5 text-slate-700">사용승인일</td>
                <td className="p-1.5 text-slate-800">{property.approvalDate || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. 매물 상세 특징 및 설명 */}
      <div className="border border-slate-300 rounded p-2 mb-2 bg-slate-50">
        <div className="font-bold text-[10.5px] text-slate-900 mb-1 flex items-center gap-1">
          <span>📝 매물 상세 설명 및 입지 특장점</span>
        </div>
        <div className="text-[9.5px] text-slate-700 leading-relaxed whitespace-pre-line line-clamp-6">
          {property.propertyDescription || property.description || property.specialNote || "상세 설명이 등록되지 않은 매물입니다."}
        </div>
        {property.specialNote && property.propertyDescription && (
          <div className="mt-1 pt-1 border-t border-slate-200 text-[9px] text-blue-800">
            <span className="font-bold">특기사항:</span> {property.specialNote}
          </div>
        )}
      </div>

      {/* 6. 공인중개사 정보 및 안내 푸터 */}
      <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between text-[9px] text-slate-500">
        <div>
          <span className="font-bold text-slate-800 text-[9.5px]">이가이버 공인중개사사무소</span> | 대표: {property.agentName || "이강욱"} |
          인천광역시 강화군 강화읍 남문로 1, 1층 | ☎ 032-934-3120 · 010-4787-3120
        </div>
        <div className="text-slate-400">
          중개등록번호: 28710-2023-00010
        </div>
      </div>
    </div>
  );
}

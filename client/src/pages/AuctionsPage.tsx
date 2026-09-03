import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Gavel, ShieldCheck, Clock, Phone, ArrowRight, CheckCircle2, FileText, Scale, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Auction } from "@shared/schema";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";

export default function AuctionsPage() {
  const [filterType, setFilterType] = useState<string>("all");

  const { data: auctions = [], isLoading } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  const filteredAuctions = auctions.filter((item) => {
    if (filterType === "all") return true;
    return item.propertyType === filterType;
  });

  const getDDay = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr);
      const today = new Date();
      target.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "D-Day (오늘)";
      if (diffDays > 0) return `D-${diffDays}`;
      return "마감";
    } catch {
      return "진행중";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-20">
      <Helmet>
        <title>반값 법원 경매·공매 | 이가이버부동산</title>
        <meta name="description" content="강화군 유일 법원 정식 등록 공인중개사 이가이버. 시세 반값 찬스! 권리분석부터 법원 입찰대리, 명도까지 100% 안전하게 책임집니다." />
      </Helmet>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white py-12 md:py-20 border-b-2 border-amber-500/40">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 text-xs md:text-sm font-black px-4 py-1.5 rounded-full border border-amber-400/40 mb-4">
            <Gavel className="w-4 h-4" />
            <span>강화군 유일 법원 정식 등록 공인중개사</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            강화도 법원 경매·공매,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
              이가이버가 100% 안전하게
            </span>{" "}
            낙찰받아 드립니다
          </h1>

          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-8 font-medium">
            시세보다 30%~50% 저렴한 강화도 알짜 경매 물건! 복잡한 권리분석, 현장 임장, 법원 동행 및 입찰대리, 명도까지 원스톱으로 책임집니다.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:010-4787-3120"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm md:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/30 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4 fill-slate-950" />
              <span>010-4787-3120 경매 의뢰 상담</span>
            </a>
            <Button
              onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-sm md:text-base h-12 px-6 rounded-2xl"
            >
              카톡 1:1 맞춤물건 문의
            </Button>
          </div>
        </div>
      </div>

      {/* 4-Step Safety Process */}
      <div className="container mx-auto px-4 max-w-5xl -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-black flex items-center justify-center mx-auto md:mx-0 mb-2">
              1
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">맞춤 물건 발굴</h4>
            <p className="text-xs text-slate-500">예산과 용도에 딱 맞는 강화군 법원 경매물건 추천</p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center mx-auto md:mx-0 mb-2">
              2
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">철저한 권리분석</h4>
            <p className="text-xs text-slate-500">등기부·임대차·현장답사로 숨은 리스크 100% 차단</p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-black flex items-center justify-center mx-auto md:mx-0 mb-2">
              3
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">법원 대리 입찰</h4>
            <p className="text-xs text-slate-500">인천지방법원 현장에서 적정 낙찰가로 안전 대리입찰</p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-black flex items-center justify-center mx-auto md:mx-0 mb-2">
              4
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">명도 & 소유권 이전</h4>
            <p className="text-xs text-slate-500">낙찰 후 입주 협의부터 등기 완료까지 올인원 케어</p>
          </div>
        </div>
      </div>

      {/* Filter & Listing Section */}
      <div className="container mx-auto px-4 max-w-6xl mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              진행 중인 강화군 추천 경매 물건
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              이가이버가 직접 엄선한 안전하고 메리트 높은 법원 경매 리스트입니다.
            </p>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl shrink-0">
            {[
              { label: "전체", value: "all" },
              { label: "주택", value: "주택" },
              { label: "토지", value: "토지" },
              { label: "농가주택", value: "농가주택" },
              { label: "상가", value: "상가" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  filterType === f.value
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-3xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-amber-300 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              조건에 맞는 경매 물건을 권리분석 중입니다
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              관심 있으신 강화군 지역이나 사건번호를 문의해주시면, 실시간 대법원 경매 시스템에서 가장 안전한 물건을 즉시 찾아 권리분석해 드립니다.
            </p>
            <a
              href="tel:010-4787-3120"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-md transition-all"
            >
              <Phone className="w-4 h-4 fill-slate-950" />
              <span>010-4787-3120 경매 무료 상담</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <div
                key={auction.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 hover:shadow-2xl transition-all duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={auction.imageUrl || "/assets/default-property-images/house.png"}
                    alt={auction.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {auction.discountRate && auction.discountRate > 0 && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-full shadow-lg">
                      ⚡ -{auction.discountRate}% 반값
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-400/30">
                    <Clock className="w-3 h-3" />
                    <span>{getDDay(auction.auctionDate)}</span>
                  </div>
                  <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                    {auction.court} | {auction.caseNumber}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {auction.propertyType}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        입찰일: {auction.auctionDate.split(" ")[0]}
                      </span>
                      {auction.safetyRating && (
                        <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          {auction.safetyRating}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 mb-1">
                      {auction.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                      {auction.address}
                    </p>

                    {/* Prices */}
                    <div className="bg-slate-50 rounded-2xl p-3 mb-3 border border-slate-100">
                      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                        <span>감정평가액</span>
                        <span className="line-through">{auction.appraisalPrice}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-700">최저입찰가</span>
                        <span className="text-lg sm:text-xl font-black text-rose-600">
                          {auction.minimumPrice}
                        </span>
                      </div>
                    </div>

                    {/* Expert Comment */}
                    {auction.expertComment && (
                      <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 mb-2 line-clamp-2">
                        💡 <strong>이가이버 소견:</strong> {auction.expertComment}
                      </p>
                    )}
                  </div>

                  {/* CTA Call Button */}
                  <a
                    href="tel:010-4787-3120"
                    className="mt-3 w-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>입찰대리 상담 (010-4787-3120)</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

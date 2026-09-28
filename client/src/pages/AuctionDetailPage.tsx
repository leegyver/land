import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import {
  Gavel,
  ShieldCheck,
  Clock,
  Phone,
  ArrowLeft,
  Share2,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Play,
  FileText,
  BadgePercent,
  Check,
  ExternalLink,
  Info
} from "lucide-react";
import { Auction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";
import { formatPriceDisplay, calculateAuctionDiscountRate, calculateAuctionDepositRate, safeFormatDate, formatAreaDisplay } from "@/lib/formatter";
import KakaoMap from "@/components/map/KakaoMap";

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { data: auction, isLoading, error } = useQuery<Auction>({
    queryKey: [`/api/auctions/${id}`],
    enabled: !!id,
  });

  const getDDay = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr);
      const today = new Date();
      target.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return { label: "D-Day (오늘 매각)", isUrgent: true };
      if (diffDays > 0) return { label: `D-${diffDays}일 남음`, isUrgent: diffDays <= 7 };
      return { label: "매각 마감", isUrgent: false };
    } catch {
      return { label: "진행중", isUrgent: false };
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      let videoId = "";
      if (urlObj.hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v") || "";
      } else if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast({ title: "링크 복사 완료", description: "경매 매물 링크가 클립보드에 복사되었습니다." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: "주소 복사 완료", description: "소재지 주소가 복사되었습니다." });
  };

  const cleanSearchAddress = (addr: string) => {
    if (!addr) return "";
    return addr
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/외\s*\d+\s*필지/gi, " ")
      .replace(/외\s*일필지/gi, " ")
      .replace(/외\s*\d+/gi, " ")
      .replace(/일괄매각/gi, " ")
      .replace(/외\s*지상/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] py-16">
        <div className="container mx-auto px-4 max-w-5xl animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
          <div className="h-72 bg-slate-200 rounded-3xl" />
          <div className="h-48 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 text-center max-w-md">
          <Gavel className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">경매 물건을 찾을 수 없습니다</h2>
          <p className="text-sm text-slate-500 mb-6">존재하지 않거나 삭제된 경매 사건입니다.</p>
          <Link href="/auctions">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl">
              경매 물건 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 가격 분석 및 포맷팅
  const appraisal = formatPriceDisplay(auction.appraisalPrice);
  const minimum = formatPriceDisplay(auction.minimumPrice);
  const deposit = formatPriceDisplay(auction.deposit);
  const discountRate = calculateAuctionDiscountRate(auction.appraisalPrice, auction.minimumPrice, auction.discountRate);
  const depositInfo = calculateAuctionDepositRate(auction.minimumPrice, auction.deposit);

  // 면적 포맷팅 (㎡ 및 평 환산)
  const landAreaInfo = formatAreaDisplay(auction.landArea);
  const buildingAreaInfo = formatAreaDisplay(auction.buildingArea);

  // 절감액 계산
  const savedWon = appraisal.rawWon > 0 && minimum.rawWon > 0 && appraisal.rawWon > minimum.rawWon
    ? appraisal.rawWon - minimum.rawWon
    : 0;
  const savedDisplay = savedWon > 0 ? formatPriceDisplay(savedWon) : null;

  // D-Day 상태
  const dday = getDDay(auction.auctionDate);

  // 이미지 목록 파싱
  let galleryImages: string[] = [auction.imageUrl];
  if (auction.imageUrls) {
    try {
      const parsed = JSON.parse(auction.imageUrls);
      if (Array.isArray(parsed)) {
        galleryImages = Array.from(new Set([auction.imageUrl, ...parsed])).filter(Boolean);
      }
    } catch {
      // JSON 파싱 실패시 단일 URL 배열 유지
    }
  }

  const currentMainImage = selectedImage || galleryImages[0] || "/assets/default-property-images/house.png";

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">
      <Helmet>
        <title>{`[경매 ${auction.caseNumber}] ${auction.title} | 이가이버부동산`}</title>
        <meta
          name="description"
          content={`[${auction.court} ${auction.caseNumber}] 감정가 ${auction.appraisalPrice} 대비 최저가 ${auction.minimumPrice} (${discountRate}% 할인). ${auction.expertComment || "강화군 법원 정식 등록 공인중개사 안전 입찰대리"}`}
        />
        <meta property="og:title" content={`[법원경매] ${auction.title} - 최저가 ${auction.minimumPrice}`} />
        <meta property="og:image" content={auction.imageUrl} />
      </Helmet>

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
          <Link
            href="/auctions"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>경매 목록으로</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 hover:bg-slate-50"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isCopied ? "복사됨" : "공유하기"}</span>
            </Button>
            <a
              href="tel:010-4787-3120"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 fill-slate-950" />
              <span>전화문의</span>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl mt-6 space-y-6">
        {/* Title Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-slate-900 text-white font-extrabold hover:bg-slate-900">
              {auction.court}
            </Badge>
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 font-bold">
              {auction.propertyType}
            </Badge>
            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 font-bold">
              사건번호 {auction.caseNumber}
            </Badge>
            {auction.safetyRating && (
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>권리분석 {auction.safetyRating}</span>
              </Badge>
            )}
            {landAreaInfo.pyeongText && (
              <Badge variant="outline" className="text-slate-800 bg-amber-50 border-amber-300 font-extrabold">
                토지 {landAreaInfo.pyeongText}
              </Badge>
            )}
            {buildingAreaInfo.pyeongText && (
              <Badge variant="outline" className="text-slate-800 bg-amber-50 border-amber-300 font-extrabold">
                건물 {buildingAreaInfo.pyeongText}
              </Badge>
            )}
            <Badge
              className={`ml-auto font-black ${
                auction.status === "진행중"
                  ? "bg-rose-500 text-white hover:bg-rose-500"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {auction.status}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug mb-3">
            {auction.title}
          </h1>

          <div className="flex items-center gap-2 text-slate-600 text-xs sm:text-sm">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium">{auction.address}</span>
            <button
              onClick={() => handleCopyAddress(auction.address)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              title="주소 복사"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Media Gallery Section */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900">
            <img
              src={currentMainImage}
              alt={auction.title}
              className="w-full h-full object-contain"
            />
            {discountRate > 0 && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm sm:text-base font-black px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-1">
                <span>⚡ -{discountRate}%</span>
                <span>{discountRate >= 50 ? "반값 찬스" : "할인"}</span>
              </div>
            )}
            <div className={`absolute top-4 right-4 text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md ${
              dday.isUrgent
                ? "bg-rose-600/90 text-white border border-rose-300/40"
                : "bg-slate-950/80 text-amber-400 border border-amber-400/40"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{dday.label}</span>
            </div>
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    currentMainImage === img ? "border-amber-500 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRICE DASHBOARD (금액 한눈에 알아보기 쉽게 표기) */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-500/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-2">
                <BadgePercent className="w-3.5 h-3.5" />
                <span>감정평가액 대비 실시간 최저가 분석</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                입찰 핵심 가격표
              </h2>
            </div>

            {/* D-Day Box */}
            <div className="bg-white/10 rounded-2xl p-3 sm:px-5 sm:py-3 border border-white/10 flex items-center justify-between md:justify-start gap-4">
              <div>
                <div className="text-[11px] text-slate-300 font-medium">매각기일 (입찰일시)</div>
                <div className="text-sm sm:text-base font-extrabold text-amber-300">
                  {auction.auctionDate}
                </div>
              </div>
              <div className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl">
                {dday.label}
              </div>
            </div>
          </div>

          {/* 3 Price Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            {/* 1. 감정평가액 */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-xs text-slate-300 font-semibold mb-1">
                감정평가액 (시작 기준가)
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-300 line-through">
                {appraisal.korean}
              </div>
              {appraisal.won !== "-" && (
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  {appraisal.won}
                </div>
              )}
            </div>

            {/* 2. 현재 최저입찰가 (하이라이트) */}
            <div className="bg-gradient-to-br from-rose-950/60 to-red-900/40 rounded-2xl p-5 border-2 border-rose-500/60 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-rose-300 font-black">
                  현재 최저입찰가
                </span>
                {discountRate > 0 ? (
                  <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                    -{discountRate}% 저감
                  </span>
                ) : (
                  <span className="bg-blue-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                    신건 100%
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                {minimum.korean}
              </div>
              {minimum.won !== "-" && (
                <div className="text-xs text-rose-200 mt-1 font-mono font-bold">
                  {minimum.won}
                </div>
              )}
              {savedDisplay && (
                <div className="mt-2 pt-2 border-t border-rose-500/30 text-[11px] text-amber-300 font-extrabold">
                  💡 감정가 대비 {savedDisplay.korean} 절감!
                </div>
              )}
            </div>

            {/* 3. 입찰보증금 */}
            <div className={`rounded-2xl p-5 border transition-all ${
              depositInfo.isSpecial
                ? "bg-gradient-to-br from-rose-950/60 to-red-950/40 border-2 border-rose-500 shadow-xl"
                : "bg-amber-500/10 border-amber-500/30"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-black ${
                  depositInfo.isSpecial ? "text-rose-300" : "text-amber-300"
                }`}>
                  입찰 보증금 ({depositInfo.isSpecial ? `특별매각조건 ${depositInfo.rate}%` : `최저가의 ${depositInfo.rate}%`})
                </span>
                {depositInfo.isSpecial ? (
                  <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    특별매각조건 {depositInfo.rate}%
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 font-bold px-1.5 py-0.5 rounded">
                    필수 지참
                  </span>
                )}
              </div>
              <div className={`text-xl sm:text-2xl font-black ${
                depositInfo.isSpecial ? "text-rose-400" : "text-amber-400"
              }`}>
                {deposit.korean}
              </div>
              {deposit.won !== "-" && (
                <div className={`text-xs mt-1 font-mono ${
                  depositInfo.isSpecial ? "text-rose-200/90 font-bold" : "text-amber-200/80"
                }`}>
                  {deposit.won}
                </div>
              )}
              <div className={`mt-2 pt-2 border-t text-[11px] font-medium leading-relaxed ${
                depositInfo.isSpecial
                  ? "border-rose-500/30 text-rose-300 font-bold"
                  : "border-white/10 text-slate-300"
              }`}>
                {depositInfo.isSpecial
                  ? `⚠️ 재매각 등 특별매각조건으로 최저가의 ${depositInfo.rate}%를 당일 법원 수표 1매로 지참 필수`
                  : `* 입찰 당일 법원에 수표 1매로 지참 (최저가의 ${depositInfo.rate}%)`}
              </div>
            </div>
          </div>
        </div>

        {/* SPECIFICATION GRID TABLE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>경매 물건 상세 명세</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-400 font-medium">사건번호</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                {auction.caseNumber}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-400 font-medium">관할 법원계</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                {auction.court}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-400 font-medium">물건 종류</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                {auction.propertyType}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-400 font-medium">토지 (대지) 면적</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{landAreaInfo.sqmText || landAreaInfo.fullText}</span>
                {landAreaInfo.pyeongText && (
                  <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-md font-black shadow-xs">
                    {landAreaInfo.pyeongText}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-400 font-medium">건물 (전용) 면적</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{buildingAreaInfo.sqmText || buildingAreaInfo.fullText}</span>
                {buildingAreaInfo.pyeongText && (
                  <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-md font-black shadow-xs">
                    {buildingAreaInfo.pyeongText}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs text-slate-400 font-medium">지역 / 행정구역</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                인천광역시 강화군 {auction.district || ""}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              depositInfo.isSpecial ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="text-xs text-slate-400 font-medium">입찰 보증금 (지참 요율)</div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className={depositInfo.isSpecial ? "text-rose-700" : ""}>{deposit.korean}</span>
                {depositInfo.isSpecial ? (
                  <span className="bg-rose-600 text-white text-[11px] px-2 py-0.5 rounded font-black">
                    특별매각조건 {depositInfo.rate}%
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded font-bold">
                    일반 {depositInfo.rate}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EXPERT COMMENT & RIGHTS ANALYSIS (이가이버 권리분석 & 전문가 소견) */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-amber-300/80 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>강화군 유일 법원 정식 등록 공인중개사</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                이가이버 권리분석 & 종합 소견
              </h3>
            </div>
          </div>

          {/* Expert Comment */}
          {auction.expertComment && (
            <div className="bg-white/90 p-5 rounded-2xl border border-amber-200 shadow-sm">
              <div className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                <span>💡 전문가 추천 및 입찰 전략 소견</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                {auction.expertComment}
              </p>
            </div>
          )}

          {/* Special Rights */}
          {auction.specialRights && (
            <div className="bg-white/90 p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>특수권리 및 권리분석 체크포인트</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {auction.specialRights}
              </p>
            </div>
          )}

          {/* Guarantee Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-extrabold text-sm sm:text-base text-amber-400">
                100% 안전한 법원 입찰대리 & 명도 보증
              </div>
              <p className="text-xs text-slate-300">
                권리분석 오류 시 공제증서 손해배상 보장 | 낙찰 후 신속한 명도 협의 및 소유권 이전 완료
              </p>
            </div>
            <a
              href="tel:010-4787-3120"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-xl shrink-0 inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4 fill-slate-950" />
              <span>권리분석 즉시 상담</span>
            </a>
          </div>
        </div>

        {/* Youtube Video (if exists) */}
        {auction.youtubeUrl && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-600 fill-red-600" />
              <span>현장 임장 및 영상 브리핑</span>
            </h3>
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-md">
              <iframe
                src={getYoutubeEmbedUrl(auction.youtubeUrl)}
                title="현장 임장 영상"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Location Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>물건 소재지 위치</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{auction.address}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyAddress(auction.address)}
                className="rounded-xl text-xs font-bold"
              >
                주소 복사
              </Button>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(cleanSearchAddress(auction.address))}`}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1 shadow-sm"
              >
                <span>카카오맵</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(cleanSearchAddress(auction.address))}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1 shadow-sm"
              >
                <span>네이버지도</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 relative">
            <KakaoMap
              properties={[{
                id: auction.id,
                title: auction.title,
                address: auction.address,
                mapAddress: cleanSearchAddress(auction.address),
                district: auction.district || "",
                type: auction.propertyType,
                price: auction.minimumPrice,
                imageUrl: auction.imageUrl,
              } as any]}
              singleProperty={{
                id: auction.id,
                title: auction.title,
                address: auction.address,
                mapAddress: cleanSearchAddress(auction.address),
                district: auction.district || "",
                type: auction.propertyType,
                price: auction.minimumPrice,
                imageUrl: auction.imageUrl,
              } as any}
              zoom={4}
            />
          </div>
        </div>

        {/* 4-Step Process Guide */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-6 text-center">
            이가이버 법원 경매 대리입찰 진행 절차
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">물건 의뢰 및 상담</h4>
              <p className="text-xs text-slate-500">사건번호 기반 1:1 맞춤 상담</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">철저한 권리분석</h4>
              <p className="text-xs text-slate-500">인수권리·임차인 현장답사</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">법원 대리 입찰</h4>
              <p className="text-xs text-slate-500">인천지방법원 적정가 입찰</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-black text-sm flex items-center justify-center mx-auto mb-2">
                4
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">명도 & 소유권 이전</h4>
              <p className="text-xs text-slate-500">낙찰 후 입주까지 올인원 케어</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-2xl">
        <div className="container mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <div className="text-xs text-slate-400 font-medium">최저입찰가 ({discountRate}% 저감)</div>
            <div className="text-xl font-black text-rose-600">{minimum.korean}</div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => window.open(KAKAO_CHANNEL_URL, "_blank")}
              variant="outline"
              className="flex-1 sm:flex-initial h-12 rounded-2xl border-slate-300 font-bold text-slate-700 hover:bg-slate-100 px-5"
            >
              카톡 1:1 상담
            </Button>
            <a
              href="tel:010-4787-3120"
              className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-black h-12 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm sm:text-base"
            >
              <Phone className="w-4 h-4 fill-slate-950" />
              <span>010-4787-3120 경매 의뢰</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

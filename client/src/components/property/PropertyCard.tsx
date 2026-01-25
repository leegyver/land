import { useState } from "react";
import { Link } from "wouter";
import { Heart, Maximize, Bed, Bath, Loader2, Phone, X } from "lucide-react";
import { SiKakaotalk } from "react-icons/si";
import { type Property } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/config/siteConfig";

const phoneNumber = siteConfig.phoneNumber;
const kakaoChannelUrl = siteConfig.kakaoChannelUrl;

interface PropertyCardProps {
  property: Property;
}

const formatPrice = (price: string | number | null | undefined, showDecimals: boolean = true) => {
  if (price === null || price === undefined) return '';
  const numPrice = Number(price);
  if (numPrice >= 100000000) {
    const value = numPrice / 100000000;
    return showDecimals ? `${value.toFixed(2)}억 원` : `${Math.floor(value)}억 원`;
  } else if (numPrice >= 10000) {
    const value = numPrice / 10000;
    return showDecimals ? `${value.toFixed(2)}만원` : `${Math.floor(value)}만원`;
  }
  return numPrice.toLocaleString() + '원';
};

const hasValidPrice = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined || value === '' || value === '0' || value === 0) {
    return false;
  }
  const numValue = Number(value);
  return !isNaN(numValue) && numValue > 0;
};

const PropertyCard = ({ property }: PropertyCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPhonePopup, setShowPhonePopup] = useState(false);

  // 관심매물 상태 조회
  const { data: favoriteData, isLoading: favoriteLoading } = useQuery<{ isFavorite: boolean }>({
    queryKey: [`/api/properties/${property.id}/is-favorite`],
    enabled: !!property.id && !!user, // 사용자가 로그인한 경우에만 쿼리 실행
  });

  // 관심매물 추가 mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/favorites", { propertyId: Number(property.id) });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "관심매물 등록",
        description: "관심매물로 등록되었습니다.",
      });
      // 관심매물 상태 업데이트
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${property.id}/is-favorite`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: (error: Error) => {
      toast({
        title: "관심매물 등록 실패",
        description: "관심매물 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 관심매물 삭제 mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/favorites/${property.id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "관심매물 삭제",
        description: "관심매물에서 삭제되었습니다.",
      });
      // 관심매물 상태 업데이트
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${property.id}/is-favorite`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: (error: Error) => {
      toast({
        title: "관심매물 삭제 실패",
        description: "관심매물 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 관심매물 토글 함수
  const toggleFavorite = () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "관심매물 기능은 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    if (favoriteData?.isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border-none ring-1 ring-gray-100">
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* 부동산 유형 표시 */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
          <Badge
            className={cn(
              "font-medium shadow-sm border-0",
              property.type === "아파트" || property.type === "아파트연립다세대" ? "bg-blue-600" :
                property.type === "주택" ? "bg-emerald-600" :
                  property.type === "오피스텔" || property.type === "원투룸" ? "bg-purple-600" :
                    property.type === "토지" ? "bg-amber-600" : "bg-gray-800"
            )}
          >
            {property.type}
          </Badge>
        </div>

        {/* 거래 유형 표시 */}
        <div className="absolute top-3 right-3 z-20 flex flex-wrap gap-1 justify-end">
          {property.dealType && Array.isArray(property.dealType) && property.dealType
            .filter((type) => ['매매', '전세', '월세'].includes(type))
            .map((type, index) => (
              <Badge
                key={index}
                className={cn(
                  "font-medium shadow-sm border-0",
                  type === "매매" ? "bg-rose-500" :
                    type === "전세" ? "bg-orange-500" :
                      type === "월세" ? "bg-indigo-500" : "bg-gray-500"
                )}
              >
                {type}
              </Badge>
            ))}
        </div>

        {/* 이미지와 그라데이션 오버레이 */}
        <Link href={`/properties/${property.id}`}>
          <div className="w-full h-full cursor-pointer relative">
            <img
              src={property.imageUrl || siteConfig.defaultImageUrl}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

            {/* 이미지 하단에 지역 정보 표시 */}
            <div className="absolute bottom-3 left-3 text-white z-10 flex items-center text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {property.district}
            </div>
          </div>
        </Link>

        {/* 찜하기 버튼 (이미지 위에 배치) */}
        <button
          className={cn(
            "absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md",
            favoriteData?.isFavorite ? "bg-white text-rose-500" : "bg-black/30 text-white hover:bg-white hover:text-rose-500 backdrop-blur-sm"
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          disabled={favoriteLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
        >
          {favoriteLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Heart className={cn("w-5 h-5", favoriteData?.isFavorite && "fill-current")} />
          )}
        </button>
      </div>

      <div className="p-5 flex flex-col h-[180px]">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-lg font-bold mb-2 text-gray-800 hover:text-primary transition-colors cursor-pointer line-clamp-2 h-[3.5rem] leading-snug">
            {property.title}
          </h3>
        </Link>

        {/* 가격 정보 */}
        <div className="mt-1 mb-4 flex-grow">
          {hasValidPrice(property.price) && (
            <div className="text-2xl font-extrabold text-gray-900">
              {formatPrice(property.price)}
            </div>
          )}
          {!hasValidPrice(property.price) && hasValidPrice(property.deposit) && (
            <div className="text-2xl font-extrabold text-gray-900">
              전세 {formatPrice(property.deposit, false)}
            </div>
          )}
          {!hasValidPrice(property.price) && !hasValidPrice(property.deposit) && hasValidPrice(property.monthlyRent) && (
            <div className="text-2xl font-extrabold text-gray-900">
              월세 {formatPrice(property.depositAmount, false)} / {formatPrice(property.monthlyRent, false)}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => setShowPhonePopup(true)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 py-2.5 rounded-lg hover:bg-primary hover:text-white transition-all text-sm font-semibold border border-gray-200 hover:border-primary"
          >
            <Phone className="w-4 h-4" />
            <span>전화문의</span>
          </button>

          <a
            href={kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 flex items-center justify-center bg-[#FEE500] text-[#191919] rounded-lg hover:bg-[#FDD835] transition-all"
            title="카카오톡 상담"
          >
            <SiKakaotalk className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* PC 전화번호 팝업 */}
      {showPhonePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPhonePopup(false)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">친절 상담 문의</h3>
              <button onClick={() => setShowPhonePopup(false)} className="bg-gray-100 rounded-full p-1 text-gray-500 hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-primary" />
              </div>
              <p className="text-gray-500 mb-2">언제든지 편하게 연락주세요</p>
              <a href={`tel:${phoneNumber}`} className="text-3xl font-black text-gray-900 hover:text-primary transition-colors block mb-6">
                {phoneNumber}
              </a>
              <div className="flex gap-2 justify-center">
                <a href={`tel:${phoneNumber}`} className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 flex items-center">
                  <Phone className="w-4 h-4 mr-2" /> 전화걸기
                </a>
                <button onClick={() => setShowPhonePopup(false)} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50">
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PropertyCard;

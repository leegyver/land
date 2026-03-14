import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Heart, Maximize, Bed, Bath, Loader2, Phone, X, MapPin } from "lucide-react";
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
import { formatKoreanPrice } from "@/lib/formatter";
import { useSaju } from "@/contexts/SajuContext";
import { getCompatibilityScore } from "@/lib/saju";
import { Sparkles } from "lucide-react";

const phoneNumber = siteConfig.phoneNumber;
const kakaoChannelUrl = siteConfig.kakaoChannelUrl;

interface PropertyCardProps {
  property: Property;
}

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
  const { sajuData } = useSaju();
  const queryClient = useQueryClient();
  const [showPhonePopup, setShowPhonePopup] = useState(false);

  // Saju compatibility calc
  const compatibility = useMemo(() => {
    if (!user || !sajuData || !property) return null;
    return getCompatibilityScore(sajuData, {
      id: property.id,
      direction: property.direction,
      floor: property.floor
    });
  }, [user, sajuData, property]);

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
    <Card className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 group border border-slate-200 h-full flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden shrink-0">
        {/* 거래 유형 표시 */}
        <div className="absolute top-3 right-3 z-20 flex flex-wrap gap-1 justify-end">
          {property.dealType && Array.isArray(property.dealType) && property.dealType
            .filter((type) => ['매매', '전세', '월세'].includes(type))
            .map((type, index) => (
              <Badge
                key={index}
                className={cn(
                  "font-medium shadow-none border px-2.5 py-1 rounded-full text-xs backdrop-blur-md",
                  type === "매매" ? "bg-rose-500/90 text-white border-rose-600/20" :
                    type === "전세" ? "bg-orange-500/90 text-white border-orange-600/20" :
                      type === "월세" ? "bg-indigo-500/90 text-white border-indigo-600/20" : "bg-gray-500 text-white"
                )}
              >
                {type}
              </Badge>
            ))}
        </div>

        {/* 사주 궁합 배지 */}
        {compatibility && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-purple-600/90 text-white border-purple-400/20 font-bold shadow-sm px-2.5 py-1 rounded-full text-[11px] backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              사주 궁합 {compatibility.score}점
            </Badge>
          </div>
        )}

        {/* 이미지와 그라데이션 오버레이 */}
        <Link href={`/properties/${property.id}`}>
          <div className="w-full h-full cursor-pointer relative">
            <img
              src={property.imageUrl || siteConfig.defaultImageUrl}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-40" />
          </div>
        </Link>
      </div>

      <div className="p-4 flex flex-col flex-grow relative">
        <Link href={`/properties/${property.id}`}>
          <div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 line-clamp-2 leading-tight">
              {property.title}
            </h3>

            {/* 위치 및 배지 - 한 줄로 배치 시도하거나 간격 최소화 */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              <div className="flex items-center text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {property.district}
              </div>
            </div>

            <div className="mb-3">
              <Badge
                variant="outline"
                className="font-normal text-blue-600 border-blue-600 bg-blue-50 hover:bg-blue-100 text-xs h-6 px-2"
              >
                {property.type}
              </Badge>
            </div>

            {/* 가격 정보 (리스트 형태) - 간격 최소화 */}
            <div className="flex flex-col gap-1 mb-0">
              {hasValidPrice(property.price) && (
                <div className="text-lg font-bold text-blue-600 leading-snug">
                  매매가: {formatKoreanPrice(property.price)}
                </div>
              )}
              {hasValidPrice(property.deposit) && (
                <div className="text-lg font-bold text-blue-600 leading-snug">
                  전세: {formatKoreanPrice(property.deposit)}
                </div>
              )}
              {hasValidPrice(property.depositAmount) && (
                <div className="text-lg font-bold text-blue-600 leading-snug">
                  보증금: {formatKoreanPrice(property.depositAmount)}
                </div>
              )}
              {hasValidPrice(property.monthlyRent) && (
                <div className="text-lg font-bold text-blue-600 leading-snug">
                  월세: {formatKoreanPrice(property.monthlyRent)}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* 찜하기 버튼 (콘텐츠 영역 우측) */}
        <button
          className={cn(
            "absolute top-[4.5rem] right-3 z-20 w-8 h-8 flex items-center justify-center transition-all bg-white/50 backdrop-blur-sm rounded-full",
            favoriteData?.isFavorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          disabled={favoriteLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
        >
          {favoriteLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className={cn("w-5 h-5", favoriteData?.isFavorite && "fill-current")} />
          )}
        </button>

        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowPhonePopup(true)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-sm hover:shadow-md"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>전화문의</span>
          </button>

          <a
            href={kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
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

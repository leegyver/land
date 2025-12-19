import { Link } from "wouter";
import { Heart, Maximize, Bed, Bath, Loader2 } from "lucide-react";
import { type Property } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PropertyCardProps {
  property: Property;
}

const formatPrice = (price: string | number) => {
  const numPrice = Number(price);
  if (numPrice >= 100000000) {
    return `${(numPrice / 100000000).toFixed(2)}억 원`;
  } else if (numPrice >= 10000) {
    return `${(numPrice / 10000).toFixed(2)}만원`;
  }
  return numPrice.toLocaleString() + '원';
};

const PropertyCard = ({ property }: PropertyCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
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
    <Card className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition group">
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* 부동산 유형 표시 */}
        <Badge 
          className={cn(
            "absolute top-3 left-3 z-10 font-medium text-sm",
            property.type === "아파트" || property.type === "아파트연립다세대" ? "bg-blue-500" : 
            property.type === "주택" ? "bg-green-600" : 
            property.type === "오피스텔" || property.type === "원투룸" ? "bg-purple-600" : 
            property.type === "빌라" ? "bg-orange-600" : 
            property.type === "상가공장창고펜션" ? "bg-yellow-600" :
            property.type === "토지" ? "bg-emerald-600" : "bg-primary"
          )}
        >
          {property.type}
        </Badge>
        
        {/* 거래 유형 표시: 모든 거래유형 (매매/전세/월세 등) */}
        <div className="absolute top-3 right-3 z-10 flex flex-wrap gap-1 justify-end">
          {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
            <Badge 
              key={index}
              className={cn(
                "font-medium text-sm",
                type === "매매" ? "bg-red-600" : 
                type === "전세" ? "bg-amber-600" : 
                type === "월세" ? "bg-indigo-600" :
                type === "완료" ? "bg-gray-600" :
                type === "보류중" ? "bg-pink-606" : "bg-secondary"
              )}
            >
              {type}
            </Badge>
          ))}
        </div>
        
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>
      <div className="p-6">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-xl font-bold mb-1 hover:text-primary transition-colors cursor-pointer line-clamp-2">
            {property.title}
          </h3>
        </Link>
        <p className="flex items-center text-gray-500 text-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {property.district}
        </p>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-medium px-2 py-0 border-primary text-primary">
                {property.type}
              </Badge>
              {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2 py-0",
                    type === "매매" ? "border-red-500 text-red-500" : 
                    type === "전세" ? "border-amber-500 text-amber-500" : 
                    type === "월세" ? "border-indigo-500 text-indigo-500" :
                    type === "완료" ? "border-gray-500 text-gray-500" :
                    type === "보류중" ? "border-pink-500 text-pink-500" :
                    "border-secondary text-secondary"
                  )}
                >
                  {type}
                </Badge>
              ))}
            </div>
            <span className="text-xl font-bold text-primary">{formatPrice(property.price)}</span>
          </div>
          <button 
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              favoriteLoading && "opacity-50 cursor-not-allowed",
              favoriteData?.isFavorite
                ? "text-red-500 hover:text-red-600"
                : "text-gray-400 hover:text-red-500"
            )}
            onClick={toggleFavorite}
            disabled={favoriteLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
            aria-label={favoriteData?.isFavorite ? "관심매물 삭제" : "관심매물 추가"}
          >
            {favoriteLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Heart 
                className={cn(
                  "w-5 h-5", 
                  favoriteData?.isFavorite && "fill-current"
                )}
              />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;

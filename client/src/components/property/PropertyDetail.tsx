import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Maximize,
  Bed,
  Bath,
  MapPin,
  Calendar,
  Phone,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { SiKakaotalk } from "react-icons/si";
import { siteConfig } from "@/config/siteConfig";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import KakaoMap from "@/components/map/KakaoMap";
import { Property as PropertyType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PropertyInquiryBoard from "@/components/property/PropertyInquiryBoard";
import { formatKoreanPrice } from "@/lib/formatter";
import { useSaju } from "@/contexts/SajuContext";
import { getCompatibilityScore } from "@/lib/saju";
import SajuFormModal from "@/components/saju/SajuFormModal";
import SajuDetailModal from "@/components/saju/SajuDetailModal";
import TarotModal from "@/components/tarot/TarotModal";

// 타입 문제를 위한 전역 선언
declare global {
  interface Window {
    kakao: any;
    Kakao: any;
    kakaoKey?: string;
    kakaoMapLoaded?: boolean;
    siteName?: string;
  }
}

// Property 타입 확장
type Property = PropertyType & {
  latitude?: string | number;
  longitude?: string | number;
};

interface PropertyDetailProps {
  propertyId: string;
}

const getYoutubeEmbedUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    let videoId = '';
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
};

const PropertyDetail = ({ propertyId }: PropertyDetailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const { user } = useAuth();
  const { toast } = useToast();

  // Saju & Tarot Logic
  const { sajuData, openSajuModal } = useSaju();
  const [isTarotOpen, setIsTarotOpen] = useState(false);
  const [isSajuDetailOpen, setIsSajuDetailOpen] = useState(false);
  const [compatibility, setCompatibility] = useState<{
    score: number,
    comment: string,
    details?: {
      investment: { style: string, advice: string },
      styling: { colors: string, tip: string },
      location: string
    }
  } | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentImageIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const { data: propertyData, isLoading: propertyLoading, error: propertyError } = useQuery<PropertyType>({
    queryKey: [`/api/properties/${propertyId}`],
  });

  // Property 데이터를 확장된 타입으로 캐스팅
  const property = propertyData as Property | undefined;

  // 관심매물 상태 조회
  const { data: favoriteData, isLoading: favoriteLoading } = useQuery<{ isFavorite: boolean }>({
    queryKey: [`/api/properties/${propertyId}/is-favorite`],
    enabled: !!propertyId,
  });

  // 관심매물 추가 mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/favorites", { propertyId: Number(propertyId) });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "관심매물 등록",
        description: "관심매물로 등록되었습니다.",
      });
      // 관심매물 상태 업데이트
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/is-favorite`] });
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
      const res = await apiRequest("DELETE", `/api/favorites/${propertyId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "관심매물 삭제",
        description: "관심매물에서 삭제되었습니다.",
      });
      // 관심매물 상태 업데이트
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/is-favorite`] });
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

  // 카카오 SDK 초기화 및 이미지 설정
  const defaultImage = siteConfig.defaultImageUrl;
  const images = property ? (
    Array.isArray(property.imageUrls) && property.imageUrls.length > 0
      ? property.imageUrls
      : (property.imageUrl ? [property.imageUrl] : [defaultImage])
  ) : [defaultImage];

  useEffect(() => {
    if (property &&
      typeof property.featuredImageIndex === 'number' &&
      Array.isArray(property.imageUrls) &&
      property.imageUrls[property.featuredImageIndex]) {
      setCurrentImageIndex(property.featuredImageIndex);
    }

    // 카카오 SDK 초기화 (Share용)
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
    if (window.Kakao && !window.Kakao.isInitialized() && KAKAO_API_KEY) {
      try {
        window.Kakao.init(KAKAO_API_KEY);
      } catch (e) {
        console.error(e);
      }
    }
  }, [property]);

  // Calculate compatibility when property or sajuData changes
  useEffect(() => {
    if (property && sajuData) {
      const features = {
        id: property.id,
        direction: property.direction || '정보없음',
        floor: property.floor || 1
      };
      const result = getCompatibilityScore(sajuData, features);
      setCompatibility(result);
    } else {
      setCompatibility(null);
    }
  }, [property, sajuData]);

  const handleShareClick = async () => {
    if (!property) return;
    try {
      if (!window.Kakao || !window.Kakao.isInitialized()) {
        toast({ title: "공유를 준비중입니다", description: "잠시후 다시 시도해주세요" });
        return;
      }
      const currentUrl = window.location.href;
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `[이가이버 부동산] ${property.title}`,
          description: `${property.district} ${property.type} - ${formatKoreanPrice(property.price)}`,
          imageUrl: images[0] || siteConfig.defaultImageUrl,
          link: { mobileWebUrl: currentUrl, webUrl: currentUrl }
        },
        buttons: [{ title: '매물 확인하기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } }]
      });
    } catch (error) {
      // Fallback context copy
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "주소가 복사되었습니다", description: "친구에게 붙여넣기하세요" });
    }
  };



  if (propertyLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] w-full rounded-lg mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 p-8 rounded-lg text-red-600 inline-block">
          <h2 className="text-2xl font-bold mb-2">매물을 찾을 수 없습니다</h2>
          <Button onClick={() => window.history.back()} className="mt-4">돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 섹션 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{property.title}</h1>
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {property.type && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1">
              {property.type}
            </Badge>
          )}
          {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, i) => (
            <Badge key={i} className={`text-sm px-3 py-1 ${type === '매매' ? 'bg-red-500' : type === '전세' ? 'bg-orange-500' : 'bg-purple-500'}`}>
              {type}
            </Badge>
          ))}
        </div>
        <div className="flex items-center text-gray-600 mb-1">
          <MapPin className="w-5 h-5 mr-1" />
          <span>{property.district}</span>
        </div>
        {property.agentName && (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded text-sm inline-block font-medium">
            담당공인중개사는 "{property.agentName}" 부동산 대표입니다
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* 왼쪽: 이미지 갤러리 */}
        <div className="lg:col-span-2">
          <Carousel setApi={setApi} className="w-full relative group">
            <CarouselContent>
              {images.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden relative w-full">
                    <img
                      src={img}
                      alt={`매물 상세 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CarouselNext className="right-2 bg-white/80 hover:bg-white border-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Carousel>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => api?.scrollTo(idx)}
                  className={`aspect-[16/9] rounded overflow-hidden border-2 ${currentImageIndex === idx ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`썸네일 ${idx}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 사이드바 정보 */}
        <div className="space-y-6">
          {/* 위치 정보 박스 */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">위치 정보</h3>
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              {property.district}
            </div>

            {/* Saju Compatibility Card - Static Block above Map */}
            {user ? (
              <div className="mb-4 bg-white rounded-lg border border-purple-100 p-4 shadow-sm">
                {sajuData && compatibility ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-purple-600" /> 사주 궁합 점수
                      </h4>
                      <span className={`text-xl font-black ${compatibility.score >= 80 ? 'text-green-600' : compatibility.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {compatibility.score}점
                      </span>
                    </div>

                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100/50">
                      <p className="text-sm text-slate-700 font-bold mb-1">총평</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {compatibility.comment}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {compatibility.details && (
                        <>
                          {/* Investment/Living Advice */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 px-2 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">부동산 운</div>
                              <span className="text-xs font-bold text-slate-800">{compatibility.details.investment.style}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-1">{compatibility.details.investment.advice}</p>
                          </div>

                          {/* Styling Advice */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 px-2 bg-green-50 text-green-600 rounded text-[10px] font-bold">인테리어</div>
                              <span className="text-xs font-bold text-slate-800">추천 색상: {compatibility.details.styling.colors}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-1">{compatibility.details.styling.tip}</p>
                          </div>

                          {/* Location Advice */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 px-2 bg-orange-50 text-orange-600 rounded text-[10px] font-bold">입지 조언</div>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-1">{compatibility.details.location}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 -mx-4 -mb-4 p-3 px-4 rounded-b-lg">
                      <button
                        className="text-[11px] text-purple-600 font-bold hover:underline"
                        onClick={() => setIsSajuDetailOpen(true)}
                      >
                        상세 분석 더보기 &gt;
                      </button>
                      <button
                        className="text-[11px] text-purple-600 font-bold flex items-center gap-0.5 hover:underline"
                        onClick={() => setIsTarotOpen(true)}
                      >
                        <HelpCircle className="w-3 h-3" /> 타로 고민상담
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={user ? openSajuModal : undefined}
                    className="flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all rounded-lg p-4 border-2 border-dashed border-purple-100 group"
                  >
                    <Sparkles className="w-6 h-6 text-purple-300 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-slate-600 font-bold">내 사주와 맞을까?</span>
                    <p className="text-[10px] text-slate-400 mb-2">정보 입력 후 맞춤형 부동산 풀이를 확인하세요</p>
                    {user ? (
                      <Button variant="outline" size="sm" className="h-7 text-xs text-purple-600 border-purple-200">
                        지금 알아보기
                      </Button>
                    ) : (
                      <Link href="/auth">
                        <Button variant="outline" size="sm" className="h-7 text-xs text-purple-600 border-purple-200">
                          회원가입 후 확인하기
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4 bg-slate-50 rounded-lg border border-slate-100 p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">로그인하시면 나의 사주와 매물의<br />궁합 점수를 확인할 수 있습니다.</p>
                <Link href="/auth">
                  <Button variant="outline" size="sm" className="h-7 text-xs">로그인하기</Button>
                </Link>
              </div>
            )}

            {/* 미니 맵 (정적 이미지 혹은 KakaoMap) */}
            <div className="h-48 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100">
              {property && <KakaoMap properties={[property]} singleProperty={property} zoom={5} />}
            </div>
          </div>

          {/* 가격 정보 박스 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="space-y-0.5">
              {property.price && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">매매가</span>
                  <span className="text-blue-700 font-bold text-lg">{formatKoreanPrice(property.price)}</span>
                </div>
              )}
              {property.deposit && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">전세금</span>
                  <span className="text-blue-700 font-bold text-lg">{formatKoreanPrice(property.deposit)}</span>
                </div>
              )}
              {property.depositAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">보증금</span>
                  <span className="text-blue-700 font-bold text-lg">{formatKoreanPrice(property.depositAmount)}</span>
                </div>
              )}
              {property.monthlyRent && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">월세</span>
                  <span className="text-blue-700 font-bold text-lg">{formatKoreanPrice(property.monthlyRent)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 카카오톡 배너 */}
          <a href={siteConfig.kakaoChannelUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
            <div className="bg-[#FEE500] rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <div className="font-bold text-[#191919] text-lg">1:1 상담 시작하기</div>
                <div className="text-xs text-gray-700 opacity-80">카카오톡 오픈채팅으로 빠르고 편리하게</div>
              </div>
              <SiKakaotalk className="w-10 h-10 text-[#191919]" />
            </div>
          </a>

          {/* 버튼 그룹 */}
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-12" onClick={toggleFavorite}>
              <Heart className={`w-5 h-5 ${favoriteData?.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              {favoriteData?.isFavorite ? '관심매물 등록됨' : '관심매물'}
            </Button>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-12" onClick={handleShareClick}>
              <Share2 className="w-5 h-5 text-gray-500" />
              친구에게 공유하기
            </Button>
          </div>
        </div>
      </div>

      {/* 주요 특징 (4개 박스) */}
      <h3 className="text-xl font-bold mb-4">주요 특징</h3>
      {/* 주요 특징 (4개 박스) - 값이 0이거나 없으면 숨김 처리됨 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {property.size && Number(property.size) > 0 ? (
          <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <Maximize className="w-8 h-8 text-primary mb-2" />
            <div className="font-bold text-lg text-gray-900">{property.size}m²</div>
            <div className="text-sm text-gray-500">총면적</div>
          </div>
        ) : null}
        {property.bedrooms && Number(property.bedrooms) > 0 ? (
          <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <Bed className="w-8 h-8 text-primary mb-2" />
            <div className="font-bold text-lg text-gray-900">{property.bedrooms}개</div>
            <div className="text-sm text-gray-500">침실</div>
          </div>
        ) : null}
        {property.bathrooms && Number(property.bathrooms) > 0 ? (
          <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <Bath className="w-8 h-8 text-primary mb-2" />
            <div className="font-bold text-lg text-gray-900">{property.bathrooms}개</div>
            <div className="text-sm text-gray-500">욕실</div>
          </div>
        ) : null}
        {property.direction && property.direction.trim().length > 0 && property.direction !== '정보없음' ? (
          <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <Calendar className="w-8 h-8 text-primary mb-2" />
            <div className="font-bold text-lg text-gray-900">{property.direction}</div>
            <div className="text-sm text-gray-500">방향(출입구기준)</div>
          </div>
        ) : null}
      </div>

      {/* 상세 정보 (2단 레이아웃) */}
      <h3 className="text-xl font-bold mb-4">상세 정보</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
        {/* 왼쪽 컬럼 */}
        <div className="space-y-8">
          {/* 기본 정보 */}
          <div>
            <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">기본 정보</h4>
            <table className="w-full text-sm">
              <tbody>
                {property.approvalDate && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">사용승인</td><td className="py-3 font-medium">{property.approvalDate}</td></tr>
                )}
                <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">유형</td><td className="py-3 font-medium">{property.type}</td></tr>
              </tbody>
            </table>
          </div>

          {/* 면적 정보 */}
          <div>
            <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">면적 정보</h4>
            <table className="w-full text-sm">
              <tbody>
                {property.size && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">총면적</td><td className="py-3 font-medium">{property.size}m² (약 {(Number(property.size) * 0.3025).toFixed(2)}평)</td></tr>
                )}
                {property.supplyArea && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">공급면적</td><td className="py-3 font-medium">{property.supplyArea}m² (약 {(Number(property.supplyArea) * 0.3025).toFixed(2)}평)</td></tr>
                )}
                {property.privateArea && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">전용면적</td><td className="py-3 font-medium">{property.privateArea}m² (약 {(Number(property.privateArea) * 0.3025).toFixed(2)}평)</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="space-y-8">
          {/* 건물 정보 - 하나라도 값이 있을 때만 노출 */}
          {(() => {
            const hasTotalFloors = property.totalFloors && Number(property.totalFloors) > 0;
            const hasRooms = (property.bedrooms && Number(property.bedrooms) > 0) || (property.bathrooms && Number(property.bathrooms) > 0);
            const hasDirection = property.direction && property.direction.trim().length > 0;
            const hasElevator = property.elevator === true; // 체크된 경우만 표시
            const hasParking = property.parking && property.parking.trim().length > 0;

            if (!hasTotalFloors && !hasRooms && !hasDirection && !hasElevator && !hasParking) return null;

            return (
              <div>
                <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">건물 정보</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {hasTotalFloors && (
                      <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">총 층수</td><td className="py-3 font-medium">{property.totalFloors}층</td></tr>
                    )}
                    {hasRooms && (
                      <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">방 / 욕실</td><td className="py-3 font-medium">방 {property.bedrooms || 0}개 / 욕실 {property.bathrooms || 0}개</td></tr>
                    )}
                    {hasDirection && (
                      <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">방향</td><td className="py-3 font-medium">{property.direction}</td></tr>
                    )}
                    {hasElevator && (
                      <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">승강기</td><td className="py-3 font-medium">있음</td></tr>
                    )}
                    {hasParking && (
                      <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">주차</td><td className="py-3 font-medium">{property.parking}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* 가격 정보 */}
          <div>
            <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">가격 정보</h4>
            <table className="w-full text-sm">
              <tbody>
                {property.price && Number(property.price) > 0 && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">매매가</td><td className="py-3 font-medium">{formatKoreanPrice(property.price)}</td></tr>
                )}
                {property.deposit && Number(property.deposit) > 0 && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">전세금</td><td className="py-3 font-medium">{formatKoreanPrice(property.deposit)}</td></tr>
                )}
                {property.depositAmount && Number(property.depositAmount) > 0 && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">보증금</td><td className="py-3 font-medium">{formatKoreanPrice(property.depositAmount)}</td></tr>
                )}
                {property.monthlyRent && Number(property.monthlyRent) > 0 && (
                  <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">월세</td><td className="py-3 font-medium">{formatKoreanPrice(property.monthlyRent)}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 매물 설명 */}
      {property.description && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-lg mb-3 text-gray-900">매물 설명</h4>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {property.description}
          </div>
        </div>
      )}

      {/* 추가 설명 (specialNote or propertyDescription) */}
      {((property.specialNote && property.specialNote.trim().length > 0) || (property.propertyDescription && property.propertyDescription.trim().length > 0)) && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-lg mb-3 text-gray-900">추가 설명</h4>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {property.specialNote || property.propertyDescription}
          </div>
        </div>
      )}

      {/* 매물 영상 */}
      {property.youtubeUrl && (
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-4">매물 영상</h3>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={getYoutubeEmbedUrl(property.youtubeUrl)}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 문의 게시판 */}
      <div className="mb-12">
        <h3 className="text-xl font-bold mb-4">이 매물 문의게시판</h3>
        <PropertyInquiryBoard propertyId={Number(propertyId)} />
      </div>

      {/* 하단 큰 지도 (숨김 - 사이드바 미니맵 사용, 필요시 활성화) */}
      <div id="detail-map" className="hidden"></div>

      {/* Modals */}
      <SajuFormModal />
      {property && (
        <TarotModal
          isOpen={isTarotOpen}
          onClose={() => setIsTarotOpen(false)}
          propertyTitle={property.title}
        />
      )}
      <SajuDetailModal
        isOpen={isSajuDetailOpen}
        onClose={() => setIsSajuDetailOpen(false)}
        sajuData={sajuData}
        username={user?.username}
      />
    </div>
  );
};

export default PropertyDetail;
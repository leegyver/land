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
import { Link, useLocation } from "wouter";
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
  HelpCircle,
  FileBadge
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
import { Card, CardContent } from "@/components/ui/card";
import PropertyInquiryBoard from "@/components/property/PropertyInquiryBoard";
import { formatKoreanPrice } from "@/lib/formatter";
import { useSaju } from "@/contexts/SajuContext";
import { getCompatibilityScore } from "@/lib/saju";
import SajuFormModal from "@/components/saju/SajuFormModal";
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
  mapAddress?: string | null;
  realtorInfo?: {
    businessName?: string;
    realtorName?: string;
    realtorPhone?: string;
    realtorPhoto?: string;
    realtorAddress?: string;
    realtorLicenseNo?: string;
  };
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
  const [, setLocation] = useLocation(); // hook added

  // Saju & Tarot Logic
  const { sajuData, openSajuModal } = useSaju();
  const [isTarotOpen, setIsTarotOpen] = useState(false);
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

  // 상세주소 비공개 로직 (토지, 단독, 근린) - 관리자(admin, master) 및 매물 등록 당사자는 예외
  const privacyTypes = ["토지", "단독", "근린"];
  const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master';
  const isOwner = (user?.id && property?.agentId) ? Number(user.id) === Number(property.agentId) : false;
  const isPrivacyType = property && property.type && privacyTypes.some(t => property.type.includes(t)) && !isAdminOrMaster && !isOwner;
  const displayAddress = property
    ? isPrivacyType
      ? `${property.district} (상세주소 비공개)`
      : `${property.district}${property.address ? ` ${property.address}` : ""}`
    : "";

  // 제목/이미지 보강 로직 (대표님 요청사항)
  const displayTitle = (property.title === "제목을 입력하세요" || !property.title || property.title.length > 50) 
    ? (property.description && property.description.length > 5 && property.description.length < 50 
        ? property.description 
        : `${property.type} - ${property.district} ${property.address || ""}`)
    : property.title;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 섹션 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayTitle}</h1>
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
          <span>{displayAddress}</span>
        </div>
        {property.agentName && (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded text-sm inline-block font-medium">
            담당공인중개사는 "{property.agentName}" 대표입니다
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
                      loading="lazy"
                      decoding="async"
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
                  <img src={img} className="w-full h-full object-cover" alt={`썸네일 ${idx}`} loading="lazy" decoding="async" />
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
              {displayAddress}
            </div>

            {/* Saju Compatibility Card - Static Block above Map */}
            {user ? (
              <div className="mb-4 bg-white rounded-lg border border-purple-100 p-4 shadow-sm">
                {sajuData && compatibility ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm md:text-base font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-600" /> 사주 궁합 점수
                      </h4>
                      <span className={`text-xl md:text-2xl font-black ${compatibility.score >= 80 ? 'text-green-600' : compatibility.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
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
                              <div className="p-1 px-2 bg-blue-50 text-blue-600 rounded text-[11px] md:text-xs font-bold">부동산 운</div>
                              <span className="text-xs md:text-sm font-bold text-slate-800">{compatibility.details.investment.style}</span>
                            </div>
                            <p className="text-xs text-slate-500 pl-1">{compatibility.details.investment.advice}</p>
                          </div>

                          {/* Styling Advice */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 px-2 bg-green-50 text-green-600 rounded text-[11px] md:text-xs font-bold">인테리어</div>
                              <span className="text-xs md:text-sm font-bold text-slate-800">추천 색상: {compatibility.details.styling.colors}</span>
                            </div>
                            <p className="text-xs text-slate-500 pl-1">{compatibility.details.styling.tip}</p>
                          </div>

                          {/* Location Advice */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 px-2 bg-orange-50 text-orange-600 rounded text-[11px] md:text-xs font-bold">입지 조언</div>
                            </div>
                            <p className="text-xs text-slate-500 pl-1">{compatibility.details.location}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 -mx-4 -mb-4 p-3 px-4 rounded-b-lg">
                      <button
                        className="text-[11px] text-purple-600 font-bold hover:underline"
                        onClick={() => setLocation("/saju")}
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
            <div className="bg-[#FEE500] rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:scale-[1.02] transition-transform">
              <div>
                <div className="font-bold text-[#191919] text-lg">1:1 상담 신청하기</div>
                <div className="text-xs text-gray-700 opacity-80">카카오톡으로 빠르고 편리하게</div>
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

      {/* 관리자/소유자 전용 정보 (권한이 있을 때만 노출) */}
      {(property.ownerName || property.ownerPhone || property.tenantName || property.tenantPhone || property.clientName || property.clientPhone || property.privateNote || property.unitNumber) && (
        <div className="mb-12">
          <Card className="border-red-200 bg-red-50/30 overflow-hidden">
            <div className="bg-red-500 px-4 py-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h3 className="font-bold text-white text-sm">중개사 / 관리자 전용 정보 (외부 비공개)</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-red-900 border-b border-red-200 pb-1 mb-2">상세 주소 정보</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {property.address && (
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="text-gray-500">실제 지번주소</span>
                          <span className="font-medium text-gray-900">{property.address}</span>
                        </div>
                      )}
                      {property.buildingName && (
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="text-gray-500">건물명</span>
                          <span className="font-medium text-gray-900">{property.buildingName}</span>
                        </div>
                      )}
                      {property.unitNumber && (
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="text-gray-500">상세 동/호수</span>
                          <span className="font-medium text-red-700">{property.unitNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {property.privateNote && (
                    <div>
                      <h4 className="font-bold text-sm text-red-900 border-b border-red-200 pb-1 mb-2">비공개 메모 (내부용)</h4>
                      <div className="text-sm text-gray-700 bg-white p-3 rounded border border-red-100 whitespace-pre-wrap">
                        {property.privateNote}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-red-900 border-b border-red-200 pb-1 mb-2">연락처 정보</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      {(property.ownerName || property.ownerPhone) && (
                        <div className="bg-white p-2 rounded border border-red-100 flex justify-between items-center">
                          <span className="text-gray-500 font-medium">소유자</span>
                          <span className="font-bold text-gray-900">
                            {property.ownerName} {property.ownerPhone ? `(${property.ownerPhone})` : ''}
                          </span>
                        </div>
                      )}
                      {(property.tenantName || property.tenantPhone) && (
                        <div className="bg-white p-2 rounded border border-red-100 flex justify-between items-center">
                          <span className="text-gray-500 font-medium">세입자</span>
                          <span className="font-bold text-gray-900">
                            {property.tenantName} {property.tenantPhone ? `(${property.tenantPhone})` : ''}
                          </span>
                        </div>
                      )}
                      {(property.clientName || property.clientPhone) && (
                        <div className="bg-white p-2 rounded border border-red-100 flex justify-between items-center">
                          <span className="text-gray-500 font-medium">의뢰인</span>
                          <span className="font-bold text-gray-900">
                            {property.clientName} {property.clientPhone ? `(${property.clientPhone})` : ''}
                          </span>
                        </div>
                      )}
                      {!property.ownerName && !property.ownerPhone && !property.tenantName && !property.tenantPhone && !property.clientName && !property.clientPhone && (
                        <div className="text-gray-400 italic text-center py-2">등록된 연락처 정보가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <div className="text-sm text-gray-500">
              {property.type && ["단독", "아파트", "다세대", "다가구", "연립", "원투룸"].some(t => property.type.includes(t))
                ? "방향(거실기준)"
                : "방향(출입구기준)"}
            </div>
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
            const hasFloorLevel = !!(property as any).floorLevel && (property as any).floorLevel.trim().length > 0;

            if (!hasTotalFloors && !hasRooms && !hasDirection && !hasElevator && !hasParking && !hasFloorLevel) return null;

            return (
              <div>
                <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-800 pb-2">건물 정보</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {hasTotalFloors && (
                      <tr className="border-b border-gray-200"><td className="py-3 text-gray-500 w-32">총 층수</td><td className="py-3 font-medium">{property.totalFloors}층</td></tr>
                    )}
                    {hasFloorLevel && (() => {
                      const level = (property as any).floorLevel;
                      const colorMap: Record<string, string> = {
                        '고': 'bg-blue-100 text-blue-700 border border-blue-200',
                        '중': 'bg-green-100 text-green-700 border border-green-200',
                        '저': 'bg-amber-100 text-amber-700 border border-amber-200',
                      };
                      return (
                        <tr className="border-b border-gray-200">
                          <td className="py-3 text-gray-500 w-32">층수표시</td>
                          <td className="py-3 font-medium">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${colorMap[level] || 'bg-gray-100 text-gray-700'}`}>{level}층</span>
                          </td>
                        </tr>
                      );
                    })()}
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

      {/* 공인중개사 프로필 카드 */}
      {property.realtorInfo && (
        <div className="mb-12 bg-white rounded-xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Verified Professional Realtor</h3>
            </div>
            <Badge className="bg-yellow-400 text-slate-900 font-bold border-none">PREMIUM AGENT</Badge>
          </div>

          <div className="p-6 py-5 md:flex items-center gap-8">
            {/* 왼쪽: 프로필 이미지/아이콘 */}
            <div className="flex-shrink-0 mb-4 md:mb-0 relative self-center">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-100 rounded-full flex items-center justify-center border-4 border-slate-900 overflow-hidden">
                {property.realtorInfo.realtorPhoto ? (
                  <img
                    src={property.realtorInfo.realtorPhoto}
                    alt={property.realtorInfo.realtorName || '공인중개사'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl md:text-5xl font-black text-slate-800">
                    {(property.realtorInfo.realtorName || 'I').charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-lg">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* 중간: 중개사 정보 */}
            <div className="flex-grow">
              <div className="mb-3">
                <div className="text-blue-600 font-black text-xs md:text-sm uppercase tracking-widest mb-1">{property.realtorInfo.businessName || "공인중개사사무소"}</div>
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  {property.realtorInfo.realtorName || "이가이버 공인중개사"} <span className="text-base md:text-lg font-bold text-slate-500">Representative</span>
                </h4>
              </div>

              <div className="space-y-2 mb-2 md:mb-0">
                <div className="flex items-center gap-3 text-slate-700 font-bold">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-slate-900" />
                  </div>
                  <span className="text-base md:text-lg">{property.realtorInfo.realtorPhone || "010-0000-0000"}</span>
                </div>

                {property.realtorInfo.realtorAddress && (
                  <div className="flex items-center gap-3 text-slate-600 text-sm md:text-base">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="font-bold">{property.realtorInfo.realtorAddress}</span>
                  </div>
                )}

                {property.realtorInfo.realtorLicenseNo && (
                  <div className="flex items-center gap-3 text-slate-600 text-sm md:text-base">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <FileBadge className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="font-bold">등록번호: {property.realtorInfo.realtorLicenseNo}</span>
                  </div>
                )}

                {!property.realtorInfo.realtorAddress && (
                  <div className="flex items-center gap-3 text-slate-600 text-sm md:text-base">
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="font-bold">{property.district} Area Expert</span>
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div className="flex-shrink-0 flex flex-col gap-2 min-w-[180px]">
              <a href={`tel:${property.realtorInfo.realtorPhone}`} className="block">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-12 rounded-lg flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(59,130,246,1)] active:translate-y-1 active:shadow-none transition-all">
                  <Phone className="w-4 h-4 fill-white" />
                  CALL NOW
                </Button>
              </a>
              <a href={siteConfig.kakaoChannelUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-[#FEE500] hover:bg-[#FDD000] text-[#191919] font-black h-12 rounded-lg flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(25,25,25,0.2)] active:translate-y-1 active:shadow-none transition-all">
                  <SiKakaotalk className="w-5 h-5" />
                  CONSULT
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              REAL-TIME RESPONSE
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Badge variant="outline" className="border-slate-300 text-slate-500 font-bold">PROFESSIONAL LICENSE VERIFIED</Badge>
            </div>
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

      {/* Modals */}
      <SajuFormModal />
      {property && (
        <TarotModal
          isOpen={isTarotOpen}
          onClose={() => setIsTarotOpen(false)}
          propertyTitle={property.title}
        />
      )}
    </div>
  );
};

export default PropertyDetail;
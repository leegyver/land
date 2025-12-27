import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { 
  Maximize, 
  Bed, 
  Bath, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  Share2, 
  Heart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import KakaoMap from "@/components/map/KakaoMap";
// 네이버 지도 API 사용
import kakaoImage from "../../assets/kakao.jpg";
import { Property as PropertyType } from "@shared/schema";

// Property 타입 확장 (latitude, longitude 추가)
type Property = PropertyType & {
  latitude?: string | number;
  longitude?: string | number;
};
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PropertyInquiryBoard from "@/components/property/PropertyInquiryBoard";

interface PropertyDetailProps {
  propertyId: string;
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

const getYoutubeEmbedUrl = (url: string) => {
  // 유튜브 URL을 임베드 URL로 변환
  try {
    const urlObj = new URL(url);
    let videoId = '';
    
    // youtube.com/watch?v=VIDEO_ID 형식
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    }
    // youtu.be/VIDEO_ID 형식
    else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
};

const PropertyDetail = ({ propertyId }: PropertyDetailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 카카오 SDK 초기화
  useEffect(() => {
    try {
      // HTML에 직접 설정된 API 키 사용
      const KAKAO_API_KEY = window.kakaoKey;
      
      if (!KAKAO_API_KEY) {
        console.error("카카오 API 키가 설정되지 않았습니다");
        return;
      }

      if (window.Kakao && !window.Kakao.isInitialized()) {
        console.log("카카오 SDK 초기화 시도");
        window.Kakao.init(KAKAO_API_KEY);
        console.log("카카오 SDK 초기화 성공:", window.Kakao.isInitialized());
      } else if (!window.Kakao) {
        console.error("카카오 SDK가 로드되지 않았습니다");
      } else {
        console.log("카카오 SDK가 이미 초기화되어 있습니다");
      }
    } catch (error) {
      console.error("카카오 SDK 초기화 오류:", error);
    }
  }, []);
  
  const { data: propertyData, isLoading: propertyLoading, error: propertyError } = useQuery<PropertyType>({
    queryKey: [`/api/properties/${propertyId}`],
  });
  
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
  
  // 카카오톡 공유 기능 핸들러
  const handleShareClick = async () => {
    if (!property) {
      console.error("매물 정보가 없습니다");
      return;
    }
    
    try {
      // 사이트 설정 정보 직접 가져오기 (설정 파일에서)
      const siteName = siteConfig.siteName;
      
      // 현재 표시된 이미지 정보 및 기타 디버깅 정보 추출
      const currentImage = Array.isArray(images) && images.length > 0 ? images[currentImageIndex] : null;
      
      console.log("카카오 공유 시도", { 
        kakaoLoaded: !!window.Kakao,
        kakaoInitialized: window.Kakao ? window.Kakao.isInitialized() : false,
        propertyTitle: property.title,
        currentImageUrl: currentImage,
        siteName: siteName
      });
      
      if (!window.Kakao) {
        throw new Error("카카오 SDK가 로드되지 않았습니다");
      }
      
      if (!window.Kakao.isInitialized()) {
        // SDK가 초기화되지 않았다면 다시 시도
        const KAKAO_API_KEY = window.kakaoKey;
        if (KAKAO_API_KEY) {
          console.log("카카오 SDK 재초기화 시도");
          window.Kakao.init(KAKAO_API_KEY);
          console.log("카카오 SDK 재초기화 결과:", window.Kakao.isInitialized());
          
          if (!window.Kakao.isInitialized()) {
            throw new Error("카카오 SDK 초기화에 실패했습니다");
          }
        } else {
          throw new Error("카카오 API 키가 설정되지 않았습니다");
        }
      }
      
      // 대표 이미지 대신 고정 이미지 URL 사용 (base64 데이터 URL은 카카오에서 제대로 처리되지 않음)
      // 실제 배포 시에는 서버에 이미지를 올려두고 해당 URL을 사용하는 것이 좋음
      const imageUrl = siteConfig.defaultImageUrl;
      
      console.log("카카오 공유 이미지 URL:", imageUrl);
      
      // 현재 페이지 URL
      const currentUrl = window.location.href;
      console.log("현재 URL:", currentUrl);
      
      // 하드코딩으로 이름 지정 (카카오 캐싱 문제 해결용)
      const companyName = "이가이버 부동산";
      
      // 더 간단한 템플릿 사용
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `[이가이버 부동산] ${property.title}`,
          description: `${property.district} ${property.type} - ${formatPrice(property.price)}`,
          imageUrl: 'https://www.ganghwa.go.kr/images/kr/sub/sub0305_img01.jpg',
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl
          }
        },
        buttons: [
          {
            title: '매물 확인하기',
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl
            }
          }
        ]
      });
      
      console.log("카카오 공유 요청 성공", {
        siteName: companyName,
        title: `[이가이버 부동산] ${property.title}`,
        imageUrl: 'https://www.ganghwa.go.kr/images/kr/sub/sub0305_img01.jpg'
      });
    } catch (error) {
      console.error("카카오 공유 중 오류 발생:", error);
      
      // 사용자에게 오류 내용 알림 (한번만 표시)
      toast({
        title: "카카오 공유 실패",
        description: "클립보드에 정보를 복사합니다",
        variant: "destructive",
      });
      
      // 오류 발생 시 항상 클립보드 복사로 대체
      try {
        const shareText = `[${siteConfig.siteName}] ${property.title}\n${property.district} 위치 - ${property.type} - ${formatPrice(property.price)}\n${window.location.href}`;
        
        navigator.clipboard.writeText(shareText)
          .then(() => {
            toast({
              title: "클립보드에 복사되었습니다",
              description: "카카오톡에 붙여넣어 공유하세요",
            });
          });
      } catch (clipboardError) {
        console.error("클립보드 복사도 실패:", clipboardError);
        toast({
          title: "공유 중 오류가 발생했습니다",
          description: "공유 URL: " + window.location.href,
          variant: "destructive",
        });
      }
    }
  };
  
  // Property 데이터를 확장된 타입으로 캐스팅
  const property = propertyData as Property | undefined;
  
  // 부동산 등록시 첨부한 이미지들을 사용
  const defaultImage = "https://via.placeholder.com/800x500?text=매물+이미지+준비중";
  
  // 지도 관련 코드는 KakaoMap 컴포넌트로 이동했습니다.
  
  // imageUrls 배열이 있으면 사용하고, 없으면 기존 imageUrl을 배열로 변환
  // 이미지가 하나도 없는 경우 기본 이미지 사용
  const images = property ? (
    Array.isArray(property.imageUrls) && property.imageUrls.length > 0 
      ? property.imageUrls 
      : (property.imageUrl ? [property.imageUrl] : [defaultImage])
  ) : [defaultImage];
  
  // 이미지 로딩 후 대표 이미지를 먼저 표시
  useEffect(() => {
    // 대표 이미지 표시
    if (property && 
        typeof property.featuredImageIndex === 'number' && 
        Array.isArray(property.imageUrls) && 
        property.imageUrls[property.featuredImageIndex]) {
      setCurrentImageIndex(property.featuredImageIndex);
    }

    // 카카오 SDK 초기화
    if (property && window.Kakao && window.Kakao.isInitialized()) {
      console.log("카카오 SDK가 이미 초기화되어 있습니다");
    } else if (property && window.Kakao && !window.Kakao.isInitialized()) {
      console.log("카카오 SDK 초기화 시도");
      const key = window.kakaoKey || import.meta.env.VITE_KAKAO_API_KEY;
      if (key) {
        window.Kakao.init(key);
        console.log("카카오 SDK 초기화 성공:", window.Kakao.isInitialized());
      }
    }

    // 지도는 이제 KakaoMap 컴포넌트에서 처리합니다.
  }, [property]);
  
  // 위치 좌표 관련 코드는 KakaoMap 컴포넌트로 이동했습니다.

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  if (propertyLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-lg mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}
            </div>
            
            <div className="mt-8">
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
              
              <div className="mt-6">
                <Skeleton className="h-6 w-1/4 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 p-6 rounded-lg text-red-600">
          <h2 className="text-2xl font-bold mb-2">매물을 찾을 수 없습니다</h2>
          <p>요청하신 매물 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.</p>
          <Link href="/properties">
            <Button className="mt-4">매물 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* 부동산 유형 뱃지 */}
          <Badge 
            className={`text-sm font-medium ${
              property.type === "아파트" || property.type === "아파트연립다세대" ? "bg-blue-500" : 
              property.type === "주택" ? "bg-green-600" : 
              property.type === "오피스텔" || property.type === "원투룸" ? "bg-purple-600" : 
              property.type === "빌라" ? "bg-orange-600" : 
              property.type === "상가공장창고펜션" ? "bg-yellow-600" :
              property.type === "토지" ? "bg-emerald-600" : "bg-primary"
            }`}
          >
            {property.type}
          </Badge>
          
          {/* 거래 유형 뱃지들 */}
          {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
            <Badge 
              key={index}
              className={`text-sm font-medium ${
                type === "매매" ? "bg-red-600" : 
                type === "전세" ? "bg-amber-600" : 
                type === "월세" ? "bg-indigo-600" :
                type === "완료" ? "bg-gray-600" :
                type === "보류중" ? "bg-pink-600" : "bg-secondary"
              }`}
            >
              {type}
            </Badge>
          ))}
        </div>
        <p className="text-gray-medium flex items-center text-base">
          <MapPin className="w-5 h-5 mr-1.5 text-primary" /> 
          {/* 주소에서 지번 정보를 제외 - 대략적인 위치만 표시 */}
          {property.district}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Main image gallery */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-4 bg-gray-100">
            {images.length > 1 && (
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 z-10 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <img 
              src={images[currentImageIndex]} 
              alt={property.title} 
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 z-10 shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  className={`aspect-[16/9] overflow-hidden rounded-md bg-gray-100 ${currentImageIndex === index ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200'}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`${property.title} 이미지 ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* 불필요한 박스 제거 */}
          
          <div className="mt-8">
            {/* 매물 설명은 매물 정보 상단에 표시하므로 여기서는 제거 */}
            
            <h3 className="text-xl font-bold mb-4">주요 특징</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col items-center shadow-sm">
                <Maximize className="text-primary mb-2 h-6 w-6" />
                <span className="font-bold text-lg">{property.size}m²</span>
                <span className="text-sm text-gray-600">총면적</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col items-center shadow-sm">
                <Bed className="text-primary mb-2 h-6 w-6" />
                <span className="font-bold text-lg">{property.bedrooms}개</span>
                <span className="text-sm text-gray-600">침실</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col items-center shadow-sm">
                <Bath className="text-primary mb-2 h-6 w-6" />
                <span className="font-bold text-lg">{property.bathrooms}개</span>
                <span className="text-sm text-gray-600">욕실</span>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col items-center shadow-sm">
                <Calendar className="text-primary mb-2 h-6 w-6" />
                <span className="font-bold text-lg">{property.direction || "남향"}</span>
                <span className="text-sm text-gray-600">방향</span>
              </div>
            </div>
            
            {/* 상세 부동산 정보 표 */}
            <div className="mt-8 mb-6">
              <h3 className="text-xl font-bold mb-4">상세 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  {(property.buildingName || property.unitNumber || property.approvalDate || property.type) && (
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">기본 정보</h4>
                      <table className="w-full">
                        <tbody>
                        {property.buildingName && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600 w-1/3">건물명</td>
                            <td className="py-2 font-medium">{property.buildingName}</td>
                          </tr>
                        )}
                        {/* 주소는 개인정보 보호를 위해 상세페이지에서 표시하지 않음 */}
                        {property.approvalDate && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">사용승인</td>
                            <td className="py-2 font-medium">{property.approvalDate}</td>
                          </tr>
                        )}
                        {property.type && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">유형</td>
                            <td className="py-2 font-medium">{property.type}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* 면적 정보 - 정보가 있는 경우에만 표시 */}
                  {(property.size || property.supplyArea || property.privateArea || property.areaSize) && (
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">면적 정보</h4>
                      <table className="w-full">
                        <tbody>
                        {/* 총면적 - 기본 정보의 면적필드 사용 */}
                        {property.size && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600 w-1/3">총면적</td>
                            <td className="py-2 font-medium">
                              {`${property.size}m² (약 ${(Number(property.size) * 0.3025).toFixed(2)}평)`}
                            </td>
                          </tr>
                        )}
                        
                        {/* 공급면적 - 상세정보의 공급필드 사용 */}
                        {property.supplyArea && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600 w-1/3">공급면적</td>
                            <td className="py-2 font-medium">
                              {`${property.supplyArea}m² (약 ${(Number(property.supplyArea) * 0.3025).toFixed(2)}평)`}
                            </td>
                          </tr>
                        )}
                        
                        {/* 전용면적 - 상세정보의 전용필드 사용 */}
                        {property.privateArea && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">전용면적</td>
                            <td className="py-2 font-medium">
                              {`${property.privateArea}m² (약 ${(Number(property.privateArea) * 0.3025).toFixed(2)}평)`}
                            </td>
                          </tr>
                        )}
                        
                        {/* 평형 정보는 관리자 페이지의 평형 필드값만 사용 */}
                        {property.areaSize && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">평형</td>
                            <td className="py-2 font-medium">
                              {`${property.areaSize}평형`}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>

                {/* 건물 정보 - 정보가 있는 경우에만 표시 */}
                <div className="space-y-4">
                  {(property.floor || property.totalFloors || property.bedrooms || property.bathrooms || 
                    property.direction || property.elevator !== undefined || property.parking || 
                    property.heatingSystem) && (
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">건물 정보</h4>
                      <table className="w-full">
                        <tbody>
                        {property.totalFloors && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">총 층수</td>
                            <td className="py-2 font-medium">{property.totalFloors}층</td>
                          </tr>
                        )}
                        {(property.bedrooms !== undefined && property.bathrooms !== undefined) && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">방 / 욕실</td>
                            <td className="py-2 font-medium">방 {property.bedrooms}개 / 욕실 {property.bathrooms}개</td>
                          </tr>
                        )}
                        {property.direction && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">방향</td>
                            <td className="py-2 font-medium">{property.direction}</td>
                          </tr>
                        )}
                        {property.elevator !== undefined && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">승강기</td>
                            <td className="py-2 font-medium">{property.elevator ? "있음" : "없음"}</td>
                          </tr>
                        )}
                        {property.parking && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">주차</td>
                            <td className="py-2 font-medium">{property.parking}</td>
                          </tr>
                        )}
                        {property.heatingSystem && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">난방</td>
                            <td className="py-2 font-medium">{property.heatingSystem}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}

                  {/* 가격 정보 - 정보가 있는 경우에만 표시 */}
                  {(property.price || property.deposit || property.monthlyRent || property.maintenanceFee) && (
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">가격 정보</h4>
                      <table className="w-full">
                        <tbody>
                        {property.price && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600 w-1/3">매매가</td>
                            <td className="py-2 font-medium">{formatPrice(property.price)}</td>
                          </tr>
                        )}
                        {property.deposit && Number(property.deposit) > 0 && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">전세금</td>
                            <td className="py-2 font-medium">{formatPrice(property.deposit)}</td>
                          </tr>
                        )}
                        {property.depositAmount && Number(property.depositAmount) > 0 && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">보증금</td>
                            <td className="py-2 font-medium">{formatPrice(property.depositAmount)}</td>
                          </tr>
                        )}
                        {property.monthlyRent && Number(property.monthlyRent) > 0 && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">월세</td>
                            <td className="py-2 font-medium">{formatPrice(property.monthlyRent)}</td>
                          </tr>
                        )}
                        {property.maintenanceFee && Number(property.maintenanceFee) > 0 && (
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">관리비</td>
                            <td className="py-2 font-medium">{formatPrice(property.maintenanceFee)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              </div>
              
              {/* 담당중개사 표시 */}
              {property.agentName && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    (매물담당 "{property.agentName}" 공인중개사 대표)
                  </p>
                </div>
              )}
              
              {/* 매물 설명 섹션 */}
              {property.description && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">매물 설명</h4>
                  <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
                </div>
              )}
              
              {/* 특이사항 섹션 */}
              {property.specialNote && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">매물 특이사항</h4>
                  <p className="text-gray-700 whitespace-pre-line">{property.specialNote}</p>
                </div>
              )}
              
              {/* 매물 문의게시판 - 매물 특이사항 아래로 이동 */}
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-4">이 매물 문의게시판</h3>
                <PropertyInquiryBoard propertyId={Number(propertyId)} />
              </div>
              
              {/* 유튜브 영상 섹션 */}
              {property.youtubeUrl && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-4">매물 영상</h3>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={getYoutubeEmbedUrl(property.youtubeUrl)}
                      title="매물 영상"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              
              {/* 매물 상세 설명 필드 복원 - 특이사항 위에 배치 */}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-4">
            <h3 className="text-xl font-semibold mb-2">위치 정보</h3>
            <p className="text-gray-700">
              <MapPin className="inline-block w-4 h-4 mr-1 text-primary" />
              {property.district}
            </p>
          </div>
          
          {/* 위치 정보 표시 - 카카오 지도 사용 (KakaoMap 컴포넌트로 대체) */}
          <div className="bg-gray-50 rounded-lg overflow-hidden h-64 mb-4">
            <div className="w-full h-full relative">
              {/* KakaoMap 컴포넌트 (단일 매물 모드) */}
              {property && (
                <KakaoMap 
                  singleProperty={property} 
                  zoom={3} 
                />
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">거래 정보</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-500 text-sm">매물 가격</span>
                <div className="text-2xl font-bold text-primary mt-1">{formatPrice(property.price)}</div>
              </div>
              {property.deposit && Number(property.deposit) > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">전세금</span>
                  <div className="text-lg font-medium mt-1">{formatPrice(property.deposit)}</div>
                </div>
              )}
              {property.depositAmount && Number(property.depositAmount) > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">보증금</span>
                  <div className="text-lg font-medium mt-1">{formatPrice(property.depositAmount)}</div>
                </div>
              )}
              {property.monthlyRent && Number(property.monthlyRent) > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">월세</span>
                  <div className="text-xl font-bold mt-1">{formatPrice(property.monthlyRent)}</div>
                </div>
              )}
              {property.maintenanceFee && Number(property.maintenanceFee) > 0 && (
                <div>
                  <span className="text-gray-500 text-sm">관리비</span>
                  <div className="text-lg font-medium mt-1">{formatPrice(property.maintenanceFee)}</div>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                {/* 카카오톡 문의 이미지 */}
                <div className="w-full mb-2 cursor-pointer">
                  <img 
                    src={kakaoImage} 
                    alt="카카오톡으로 문의하기" 
                    className="w-full h-auto rounded-lg border border-[#FEE500] hover:opacity-90 transition-opacity"
                    onClick={() => window.open("http://pf.kakao.com/_xaxbxlxfs/chat", "_blank")}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant={favoriteData?.isFavorite ? "secondary" : "outline"} 
                    className="w-full relative"
                    onClick={toggleFavorite}
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                  >
                    <Heart 
                      className={`w-4 h-4 mr-2 ${favoriteData?.isFavorite ? 'text-red-500 fill-red-500' : ''}`} 
                    />
                    {favoriteData?.isFavorite ? '관심매물 등록됨' : '관심매물'}
                  </Button>
                  
                  {/* 공유 버튼 */}
                  <Button 
                    variant="outline" 
                    className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border-yellow-300 relative pl-10"
                    onClick={() => handleShareClick()}
                  >
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                      <svg width="22" height="20" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFE812" d="M128 36.108C57.655 36.108 0 80.783 0 135.993c0 34.742 23.34 65.333 58.572 83.97c-2.564 9.503-9.247 34.391-10.577 39.688c-1.652 6.531 2.407 6.451 5.063 4.693c2.097-1.387 33.289-22.525 46.723-31.673c9.141 1.323 18.638 2.022 28.22 2.022c70.345 0 128-44.675 128-99.885c0-55.21-57.655-99.885-128-99.885"/>
                        <path fill="#381F1F" d="M70.318 146.234c-3.993 0-7.241-3.248-7.241-7.241V113.95c0-3.993 3.248-7.241 7.241-7.241c3.993 0 7.241 3.248 7.241 7.241v25.043c0 3.993-3.248 7.241-7.241 7.241zm33.507 0c-3.993 0-7.241-3.248-7.241-7.241V113.95c0-3.993 3.248-7.241 7.241-7.241c3.993 0 7.241 3.248 7.241 7.241v25.043c0 3.993-3.248 7.241-7.241 7.241zm33.507 0c-3.993 0-7.241-3.248-7.241-7.241V113.95c0-3.992 3.248-7.241 7.241-7.241c3.993 0 7.241 3.249 7.241 7.241v25.043c0 3.993-3.248 7.241-7.241 7.241zm33.508 0c-3.993 0-7.241-3.248-7.241-7.241V113.95c0-3.992 3.248-7.241 7.241-7.241c3.993 0 7.241 3.249 7.241 7.241v25.043c0 3.993-3.248 7.241-7.241 7.241z"/>
                      </svg>
                    </div>
                    친구에게 공유하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
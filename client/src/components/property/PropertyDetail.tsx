import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
// 카카오톡 이미지 가져오기
import kakaoImage from "../../assets/kakao.jpg";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyInquiryBoard from "@/components/property/PropertyInquiryBoard";

interface PropertyDetailProps {
  propertyId: string;
}

const formatPrice = (price: string | number) => {
  const numPrice = Number(price);
  if (numPrice >= 100000000) {
    return `${(numPrice / 100000000).toFixed(1)}억 원`;
  } else if (numPrice >= 10000) {
    return `${(numPrice / 10000).toFixed(0)}만원`;
  }
  return numPrice.toLocaleString() + '원';
};

const PropertyDetail = ({ propertyId }: PropertyDetailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
  });
  
  // 부동산 등록시 첨부한 이미지들을 사용
  const defaultImage = "https://via.placeholder.com/800x500?text=매물+이미지+준비중";
  
  // imageUrls 배열이 있으면 사용하고, 없으면 기존 imageUrl을 배열로 변환
  // 이미지가 하나도 없는 경우 기본 이미지 사용
  const images = property ? (
    Array.isArray(property.imageUrls) && property.imageUrls.length > 0 
      ? property.imageUrls 
      : (property.imageUrl ? [property.imageUrl] : [defaultImage])
  ) : [defaultImage];
  
  // 이미지 로딩 후 대표 이미지를 먼저 표시
  useEffect(() => {
    if (property && 
        typeof property.featuredImageIndex === 'number' && 
        Array.isArray(property.imageUrls) && 
        property.imageUrls[property.featuredImageIndex]) {
      setCurrentImageIndex(property.featuredImageIndex);
    }
  }, [property]);

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
          <div className="relative h-[400px] overflow-hidden rounded-lg mb-4 bg-gray-100 flex items-center justify-center">
            {images.length > 1 && (
              <button 
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 z-10 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="h-full flex items-center justify-center">
              <img 
                src={images[currentImageIndex]} 
                alt={property.title} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
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
                  className={`h-20 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${currentImageIndex === index ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200'}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`${property.title} 이미지 ${index + 1}`} 
                    className="max-w-full max-h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* 문의 게시판을 매물 설명 위쪽으로 이동 */}
          <Card className="mt-8 mb-8">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4">이 매물 문의게시판</h3>
              <PropertyInquiryBoard propertyId={Number(propertyId)} />
            </CardContent>
          </Card>
          
          <Tabs defaultValue="details" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">매물 정보</TabsTrigger>
              <TabsTrigger value="map">위치 정보</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <h2 className="text-2xl font-bold mb-4">매물 설명</h2>
              <p className="text-gray-medium whitespace-pre-line mb-6">
                {property.description}
              </p>
              
              <h3 className="text-xl font-bold mb-4">주요 특징</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex flex-col items-center shadow-sm">
                  <Maximize className="text-primary mb-2 h-6 w-6" />
                  <span className="font-bold text-lg">{property.size}m²</span>
                  <span className="text-sm text-gray-600">면적</span>
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
                          {property.unitNumber && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">동호수</td>
                              <td className="py-2 font-medium">{property.unitNumber}</td>
                            </tr>
                          )}
                          {/* 주소는 개인정보 보호를 위해 상세페이지에서 표시하지 않음 */}
                          {property.approvalDate && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">사용승인</td>
                              <td className="py-2 font-medium">{property.approvalDate}</td>
                            </tr>
                          )}
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">유형</td>
                            <td className="py-2 font-medium">{property.type}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">공동중개</td>
                            <td className="py-2 font-medium">{property.coListing ? "예" : "아니오"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 면적 정보 */}
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">면적 정보</h4>
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600 w-1/3">공급면적</td>
                            <td className="py-2 font-medium">{property.supplyArea ? `${property.supplyArea}m²` : `${property.size}m²`}</td>
                          </tr>
                          {property.privateArea && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">전용면적</td>
                              <td className="py-2 font-medium">{property.privateArea}m²</td>
                            </tr>
                          )}
                          {property.areaSize && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">평형</td>
                              <td className="py-2 font-medium">{property.areaSize}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 건물 정보 */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">건물 정보</h4>
                      <table className="w-full">
                        <tbody>
                          {property.floor && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600 w-1/3">해당 층</td>
                              <td className="py-2 font-medium">{property.floor}층</td>
                            </tr>
                          )}
                          {property.totalFloors && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">총 층수</td>
                              <td className="py-2 font-medium">{property.totalFloors}층</td>
                            </tr>
                          )}
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">방 / 욕실</td>
                            <td className="py-2 font-medium">방 {property.bedrooms}개 / 욕실 {property.bathrooms}개</td>
                          </tr>
                          {property.direction && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">방향</td>
                              <td className="py-2 font-medium">{property.direction}</td>
                            </tr>
                          )}
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600">승강기</td>
                            <td className="py-2 font-medium">{property.elevator ? "있음" : "없음"}</td>
                          </tr>
                          {property.parking && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">주차</td>
                              <td className="py-2 font-medium">{property.parking}</td>
                            </tr>
                          )}
                          {property.heatingSystem && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">난방방식</td>
                              <td className="py-2 font-medium">{property.heatingSystem}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* 금액 정보 */}
                    <div className="border-b pb-2">
                      <h4 className="font-semibold text-lg mb-3">금액 정보</h4>
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 text-gray-600 w-1/3">매매가</td>
                            <td className="py-2 font-medium">{formatPrice(property.price)}</td>
                          </tr>
                          {property.deposit && Number(property.deposit) > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-gray-600">보증금</td>
                              <td className="py-2 font-medium">{formatPrice(property.deposit)}</td>
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
                  </div>
                </div>
              </div>
              
              {/* 특이사항 섹션 */}
              {property.specialNote && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">매물 특이사항</h4>
                  <p className="text-gray-700 whitespace-pre-line">{property.specialNote}</p>
                </div>
              )}
              
              {/* 부동산 상세 설명 */}
              {property.propertyDescription && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-2">매물 상세 설명</h4>
                  <p className="text-gray-700 whitespace-pre-line">{property.propertyDescription}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="map">
              <div className="bg-gray-light p-2 rounded-lg overflow-hidden h-64">
                {/* 카카오맵 API를 통해 지도를 불러오는 것이 더 좋지만 현재는 프로토타입으로 대체 */}
                <img 
                  src="https://images.unsplash.com/photo-1609587312208-cea54be969e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600" 
                  alt={`${property.district} 지역 지도`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">위치 정보</h3>
                <div className="space-y-4">
                  {/* 주소는 개인정보 보호를 위해 지도 탭에서 표시하지 않음 */}
                  <p className="text-gray-medium">
                    <span className="font-semibold block">지역:</span> {property.district}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {/* 가격 표시 */}
                  <h2 className="text-2xl font-bold text-primary mb-2">{formatPrice(property.price)}</h2>
                  
                  {/* 거래 유형 뱃지들 */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className={`text-xs font-medium px-2 py-0.5 
                          ${type === "매매" ? "border-red-500 text-red-500" : 
                            type === "전세" ? "border-amber-500 text-amber-500" : 
                            type === "월세" ? "border-indigo-500 text-indigo-500" :
                            type === "완료" ? "border-gray-500 text-gray-500" :
                            type === "보류중" ? "border-pink-500 text-pink-500" : 
                            "border-secondary text-secondary"
                          }`}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* 부동산 유형 */}
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium mb-2 
                      ${property.type === "아파트" || property.type === "아파트연립다세대" ? "border-blue-500 text-blue-500" : 
                        property.type === "주택" ? "border-green-600 text-green-600" : 
                        property.type === "오피스텔" || property.type === "원투룸" ? "border-purple-600 text-purple-600" : 
                        property.type === "빌라" ? "border-orange-600 text-orange-600" : 
                        property.type === "상가공장창고펜션" ? "border-yellow-600 text-yellow-600" :
                        property.type === "토지" ? "border-emerald-600 text-emerald-600" : 
                        "border-primary text-primary"
                      }`}
                  >
                    {property.type}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4 border-gray-100">
                <h3 className="font-medium text-base mb-3">매물 정보</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center p-2 bg-gray-50 rounded-md">
                    <Maximize className="text-primary w-4 h-4 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">면적</div>
                      <div className="font-medium">{property.supplyArea ? `${property.supplyArea}m²` : `${property.size}m²`}</div>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-gray-50 rounded-md">
                    <Bed className="text-primary w-4 h-4 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">침실</div>
                      <div className="font-medium">{property.bedrooms}개</div>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-gray-50 rounded-md">
                    <Bath className="text-primary w-4 h-4 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">욕실</div>
                      <div className="font-medium">{property.bathrooms}개</div>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-gray-50 rounded-md">
                    <MapPin className="text-primary w-4 h-4 mr-2" />
                    <div>
                      <div className="text-xs text-gray-500">지역</div>
                      <div className="font-medium">{property.district}</div>
                    </div>
                  </div>
                </div>
                
                {/* 추가 정보 표시 - 더 많은 정보 담기 */}
                {(property.floor || property.totalFloors || property.direction || property.elevator) && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {property.floor && (
                      <div className="flex items-center p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="text-xs text-gray-500">층수</div>
                          <div className="font-medium">{property.floor}층 / {property.totalFloors || "?"}층</div>
                        </div>
                      </div>
                    )}
                    {property.direction && (
                      <div className="flex items-center p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="text-xs text-gray-500">방향</div>
                          <div className="font-medium">{property.direction}</div>
                        </div>
                      </div>
                    )}
                    {property.elevator !== undefined && (
                      <div className="flex items-center p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="text-xs text-gray-500">승강기</div>
                          <div className="font-medium">{property.elevator ? "있음" : "없음"}</div>
                        </div>
                      </div>
                    )}
                    {property.heatingSystem && (
                      <div className="flex items-center p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="text-xs text-gray-500">난방</div>
                          <div className="font-medium">{property.heatingSystem}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 카카오톡 문의하기 링크 */}
                <a 
                  href="https://pf.kakao.com/_xaxbxlxfs/chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full mt-5 hover:opacity-90 transition-opacity"
                >
                  <img 
                    src={kakaoImage}
                    alt="카카오톡 1:1 상담 시작하기"
                    className="w-full rounded-md shadow-sm"
                  />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
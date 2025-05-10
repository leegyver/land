import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  
  // Mock multiple images since we only have one per property in our schema
  const images = property ? [
    property.imageUrl,
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab8e17a9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
  ] : [];

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
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
            <Badge key={index} className="bg-secondary">{type}</Badge>
          ))}
        </div>
        <p className="text-gray-medium flex items-center">
          <MapPin className="w-4 h-4 mr-1" /> 
          {/* 주소에서 지번 정보를 제외 - 대략적인 위치만 표시 */}
          {property.district}, {property.city}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Main image gallery */}
          <div className="relative h-[400px] overflow-hidden rounded-lg mb-4">
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <img 
              src={images[currentImageIndex]} 
              alt={property.title} 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={`h-20 overflow-hidden rounded-md ${currentImageIndex === index ? 'ring-2 ring-primary' : ''}`}
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
                <div className="bg-gray-light p-4 rounded-lg flex flex-col items-center">
                  <Maximize className="text-primary mb-2" />
                  <span className="font-bold">{property.size}m²</span>
                  <span className="text-sm text-gray-medium">면적</span>
                </div>
                <div className="bg-gray-light p-4 rounded-lg flex flex-col items-center">
                  <Bed className="text-primary mb-2" />
                  <span className="font-bold">{property.bedrooms}개</span>
                  <span className="text-sm text-gray-medium">침실</span>
                </div>
                <div className="bg-gray-light p-4 rounded-lg flex flex-col items-center">
                  <Bath className="text-primary mb-2" />
                  <span className="font-bold">{property.bathrooms}개</span>
                  <span className="text-sm text-gray-medium">욕실</span>
                </div>
                <div className="bg-gray-light p-4 rounded-lg flex flex-col items-center">
                  <Calendar className="text-primary mb-2" />
                  <span className="font-bold">즉시 입주</span>
                  <span className="text-sm text-gray-medium">입주가능일</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="map">
              <div className="bg-gray-light p-2 rounded-lg overflow-hidden h-64">
                <img 
                  src="https://images.unsplash.com/photo-1609587312208-cea54be969e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600" 
                  alt={`${property.district} 지역 지도`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-2">위치 정보</h3>
                <p className="text-gray-medium">
                  {property.district}, {property.city}는 중심부에 위치하고 있으며, 주변에 대중교통, 학교, 상업시설 등이 잘 갖추어져 있습니다.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge className="mb-2" variant="outline">{property.type}</Badge>
                  <h2 className="text-2xl font-bold text-primary">{formatPrice(property.price)}</h2>
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
              
              <div className="space-y-4 mt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-medium">면적</span>
                  <span className="font-medium">{property.size}m²</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-medium">침실</span>
                  <span className="font-medium">{property.bedrooms}개</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-medium">욕실</span>
                  <span className="font-medium">{property.bathrooms}개</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-medium">지역</span>
                  <span className="font-medium">{property.district}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          

          
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4">이 매물 문의게시판</h3>
              <PropertyInquiryBoard propertyId={Number(propertyId)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

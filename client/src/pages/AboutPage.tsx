import { Helmet } from "react-helmet";
import { useState } from "react";
import { MapIcon } from "lucide-react";
import KakaoMap from "@/components/map/KakaoMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const AboutPage = () => {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedDealType, setSelectedDealType] = useState<string>("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");

  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>강화도 실거래가 | 이가이버부동산</title>
        <meta 
          name="description" 
          content="강화도 지역 부동산의 실거래가 정보를 확인하세요. 이가이버부동산에서 제공하는 강화도 지역 토지, 주택, 아파트 등의 최신 실거래가 정보를 확인할 수 있습니다."
        />
        <meta property="og:title" content="강화도 실거래가 | 이가이버부동산" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="강화도 지역 부동산의 실거래가 정보를 확인하세요. 이가이버부동산에서 제공하는 강화도 지역 토지, 주택, 아파트 등의 최신 실거래가 정보를 확인할 수 있습니다." />
      </Helmet>

      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">강화도 실거래가</h1>
          <p className="text-gray-medium mt-2">
            강화도 지역 부동산 실거래가 정보를 확인하세요.
          </p>
        </div>
      </div>
      
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* 필터 영역 */}
          <div className="mx-auto max-w-4xl bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">지역</label>
                <Select 
                  onValueChange={(value) => setSelectedArea(value)} 
                  defaultValue={selectedArea}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="강화읍">강화읍</SelectItem>
                    <SelectItem value="내가면">내가면</SelectItem>
                    <SelectItem value="양도면">양도면</SelectItem>
                    <SelectItem value="하점면">하점면</SelectItem>
                    <SelectItem value="송해면">송해면</SelectItem>
                    <SelectItem value="교동면">교동면</SelectItem>
                    <SelectItem value="삼산면">삼산면</SelectItem>
                    <SelectItem value="서도면">서도면</SelectItem>
                    <SelectItem value="불은면">불은면</SelectItem>
                    <SelectItem value="선원면">선원면</SelectItem>
                    <SelectItem value="양사면">양사면</SelectItem>
                    <SelectItem value="길상면">길상면</SelectItem>
                    <SelectItem value="화도면">화도면</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">거래 유형</label>
                <Select 
                  onValueChange={(value) => setSelectedDealType(value)} 
                  defaultValue={selectedDealType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="거래 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="매매">매매</SelectItem>
                    <SelectItem value="전세">전세</SelectItem>
                    <SelectItem value="월세">월세</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">부동산 유형</label>
                <Select 
                  onValueChange={(value) => setSelectedPropertyType(value)} 
                  defaultValue={selectedPropertyType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="부동산 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="아파트">아파트</SelectItem>
                    <SelectItem value="연립다세대">연립다세대</SelectItem>
                    <SelectItem value="단독다가구">단독/다가구</SelectItem>
                    <SelectItem value="토지">토지</SelectItem>
                    <SelectItem value="상가">상가</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-primary hover:bg-secondary text-white">
                검색
              </Button>
            </div>
          </div>
          
          {/* 지도 영역 */}
          <div className="mx-auto max-w-4xl mb-8">
            <div className="mb-3 flex items-center">
              <MapIcon className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-bold">지도로 실거래가 보기</h2>
            </div>
            <div className="h-[50vh] w-full rounded-lg overflow-hidden shadow-md">
              <KakaoMap />
            </div>
          </div>
          
          {/* 실거래가 정보 영역 */}
          <div className="mx-auto max-w-4xl bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">실거래가 정보</h2>
            <p className="text-center text-lg">
              실시간 실거래가 정보 준비 중입니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

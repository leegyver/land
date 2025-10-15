import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PropertyCard from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MapIcon } from "lucide-react";
import KakaoMap from "@/components/map/KakaoMap";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  district: z.string(),
  type: z.string(),
  priceRange: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const PropertiesPage = () => {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  const initialDistrict = searchParams.get("district") || "all";
  const initialType = searchParams.get("type") || "all";
  const initialMinPrice = searchParams.get("minPrice");
  const initialMaxPrice = searchParams.get("maxPrice");
  
  let initialPriceRange = "all";
  if (initialMinPrice && initialMaxPrice) {
    initialPriceRange = `${initialMinPrice}-${initialMaxPrice}`;
  }

  const [filterParams, setFilterParams] = useState({
    district: initialDistrict,
    type: initialType,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      district: initialDistrict,
      type: initialType,
      priceRange: initialPriceRange,
    },
  });

  // URL이 변경될 때 폼 값 업데이트
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const district = params.get("district") || "all";
    const type = params.get("type") || "all";
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    
    let priceRange = "all";
    if (minPrice && maxPrice) {
      priceRange = `${minPrice}-${maxPrice}`;
    }
    
    form.reset({
      district,
      type,
      priceRange,
    });
    
    setFilterParams({
      district,
      type,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  }, [location, form]);

  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/search", filterParams],
    queryFn: async () => {
      // 검색 파라미터 구성
      const searchParams = new URLSearchParams();
      
      if (filterParams.district && filterParams.district !== "all") {
        searchParams.append("district", filterParams.district);
      }
      
      if (filterParams.type && filterParams.type !== "all") {
        searchParams.append("type", filterParams.type);
      }
      
      if (filterParams.minPrice && filterParams.maxPrice) {
        searchParams.append("minPrice", filterParams.minPrice);
        searchParams.append("maxPrice", filterParams.maxPrice);
      }
      
      // URL 생성 및 요청
      const url = `/api/search?${searchParams.toString()}`;
      console.log("검색 요청 URL:", url);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const onSubmit = (data: FormValues) => {
    const newParams: Record<string, string | null> = {
      district: data.district !== "all" ? data.district : null,
      type: data.type !== "all" ? data.type : null,
      minPrice: null,
      maxPrice: null,
    };

    if (data.priceRange !== "all") {
      const [min, max] = data.priceRange.split("-");
      newParams.minPrice = min;
      newParams.maxPrice = max;
    }

    setFilterParams({
      district: newParams.district || "all",
      type: newParams.type || "all",
      minPrice: newParams.minPrice || null,
      maxPrice: newParams.maxPrice || null,
    });
  };

  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">매물 검색</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>지역</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="지역 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {/* 강화읍 옵션 */}
                          <SelectItem value="강화읍 갑곳리">강화읍 갑곳리</SelectItem>
                          <SelectItem value="강화읍 관청리">강화읍 관청리</SelectItem>
                          <SelectItem value="강화읍 국화리">강화읍 국화리</SelectItem>
                          <SelectItem value="강화읍 남산리">강화읍 남산리</SelectItem>
                          <SelectItem value="강화읍 대산리">강화읍 대산리</SelectItem>
                          <SelectItem value="강화읍 신문리">강화읍 신문리</SelectItem>
                          <SelectItem value="강화읍 옥림리">강화읍 옥림리</SelectItem>
                          <SelectItem value="강화읍 용정리">강화읍 용정리</SelectItem>
                          <SelectItem value="강화읍 월곳리">강화읍 월곳리</SelectItem>

                          {/* 교동면 옵션 */}
                          <SelectItem value="교동면 고구리">교동면 고구리</SelectItem>
                          <SelectItem value="교동면 난정리">교동면 난정리</SelectItem>
                          <SelectItem value="교동면 대룡리">교동면 대룡리</SelectItem>
                          <SelectItem value="교동면 동산리">교동면 동산리</SelectItem>
                          <SelectItem value="교동면 무학리">교동면 무학리</SelectItem>
                          <SelectItem value="교동면 봉소리">교동면 봉소리</SelectItem>
                          <SelectItem value="교동면 삼선리">교동면 삼선리</SelectItem>
                          <SelectItem value="교동면 상용리">교동면 상용리</SelectItem>
                          <SelectItem value="교동면 서한리">교동면 서한리</SelectItem>
                          <SelectItem value="교동면 양갑리">교동면 양갑리</SelectItem>
                          <SelectItem value="교동면 읍내리">교동면 읍내리</SelectItem>
                          <SelectItem value="교동면 인사리">교동면 인사리</SelectItem>
                          <SelectItem value="교동면 지석리">교동면 지석리</SelectItem>

                          {/* 길상면 옵션 */}
                          <SelectItem value="길상면 길직리">길상면 길직리</SelectItem>
                          <SelectItem value="길상면 동검리">길상면 동검리</SelectItem>
                          <SelectItem value="길상면 선두리">길상면 선두리</SelectItem>
                          <SelectItem value="길상면 온수리">길상면 온수리</SelectItem>
                          <SelectItem value="길상면 장흥리">길상면 장흥리</SelectItem>
                          <SelectItem value="길상면 초지리">길상면 초지리</SelectItem>

                          {/* 내가면 옵션 */}
                          <SelectItem value="내가면 고천리">내가면 고천리</SelectItem>
                          <SelectItem value="내가면 구하리">내가면 구하리</SelectItem>
                          <SelectItem value="내가면 오상리">내가면 오상리</SelectItem>
                          <SelectItem value="내가면 외포리">내가면 외포리</SelectItem>
                          <SelectItem value="내가면 황청리">내가면 황청리</SelectItem>

                          {/* 불은면 옵션 */}
                          <SelectItem value="불은면 고능리">불은면 고능리</SelectItem>
                          <SelectItem value="불은면 넙성리">불은면 넙성리</SelectItem>
                          <SelectItem value="불은면 덕성리">불은면 덕성리</SelectItem>
                          <SelectItem value="불은면 두운리">불은면 두운리</SelectItem>
                          <SelectItem value="불은면 삼동암리">불은면 삼동암리</SelectItem>
                          <SelectItem value="불은면 삼성리">불은면 삼성리</SelectItem>
                          <SelectItem value="불은면 신현리">불은면 신현리</SelectItem>
                          <SelectItem value="불은면 오두리">불은면 오두리</SelectItem>

                          {/* 삼산면 옵션 */}
                          <SelectItem value="삼산면 매음리">삼산면 매음리</SelectItem>
                          <SelectItem value="삼산면 미법리">삼산면 미법리</SelectItem>
                          <SelectItem value="삼산면 상리">삼산면 상리</SelectItem>
                          <SelectItem value="삼산면 서검리">삼산면 서검리</SelectItem>
                          <SelectItem value="삼산면 석모리">삼산면 석모리</SelectItem>
                          <SelectItem value="삼산면 석포리">삼산면 석포리</SelectItem>
                          <SelectItem value="삼산면 하리">삼산면 하리</SelectItem>

                          {/* 서도면 옵션 */}
                          <SelectItem value="서도면 말도리">서도면 말도리</SelectItem>
                          <SelectItem value="서도면 볼음도리">서도면 볼음도리</SelectItem>
                          <SelectItem value="서도면 아차도리">서도면 아차도리</SelectItem>
                          <SelectItem value="서도면 주문도리">서도면 주문도리</SelectItem>

                          {/* 선원면 옵션 */}
                          <SelectItem value="선원면 금월리">선원면 금월리</SelectItem>
                          <SelectItem value="선원면 냉정리">선원면 냉정리</SelectItem>
                          <SelectItem value="선원면 선행리">선원면 선행리</SelectItem>
                          <SelectItem value="선원면 신정리">선원면 신정리</SelectItem>
                          <SelectItem value="선원면 연리">선원면 연리</SelectItem>
                          <SelectItem value="선원면 지산리">선원면 지산리</SelectItem>
                          <SelectItem value="선원면 창리">선원면 창리</SelectItem>

                          {/* 송해면 옵션 */}
                          <SelectItem value="송해면 당산리">송해면 당산리</SelectItem>
                          <SelectItem value="송해면 상도리">송해면 상도리</SelectItem>
                          <SelectItem value="송해면 솔정리">송해면 솔정리</SelectItem>
                          <SelectItem value="송해면 숭뢰리">송해면 숭뢰리</SelectItem>
                          <SelectItem value="송해면 신당리">송해면 신당리</SelectItem>
                          <SelectItem value="송해면 양오리">송해면 양오리</SelectItem>
                          <SelectItem value="송해면 하도리">송해면 하도리</SelectItem>

                          {/* 양도면 옵션 */}
                          <SelectItem value="양도면 건평리">양도면 건평리</SelectItem>
                          <SelectItem value="양도면 길정리">양도면 길정리</SelectItem>
                          <SelectItem value="양도면 능내리">양도면 능내리</SelectItem>
                          <SelectItem value="양도면 도장리">양도면 도장리</SelectItem>
                          <SelectItem value="양도면 삼흥리">양도면 삼흥리</SelectItem>
                          <SelectItem value="양도면 인산리">양도면 인산리</SelectItem>
                          <SelectItem value="양도면 조산리">양도면 조산리</SelectItem>
                          <SelectItem value="양도면 하일리">양도면 하일리</SelectItem>

                          {/* 양사면 옵션 */}
                          <SelectItem value="양사면 교산리">양사면 교산리</SelectItem>
                          <SelectItem value="양사면 덕하리">양사면 덕하리</SelectItem>
                          <SelectItem value="양사면 북성리">양사면 북성리</SelectItem>
                          <SelectItem value="양사면 인화리">양사면 인화리</SelectItem>
                          <SelectItem value="양사면 철산리">양사면 철산리</SelectItem>

                          {/* 하점면 옵션 */}
                          <SelectItem value="하점면 망월리">하점면 망월리</SelectItem>
                          <SelectItem value="하점면 부근리">하점면 부근리</SelectItem>
                          <SelectItem value="하점면 삼거리">하점면 삼거리</SelectItem>
                          <SelectItem value="하점면 신봉리">하점면 신봉리</SelectItem>
                          <SelectItem value="하점면 신삼리">하점면 신삼리</SelectItem>
                          <SelectItem value="하점면 이강리">하점면 이강리</SelectItem>
                          <SelectItem value="하점면 장정리">하점면 장정리</SelectItem>
                          <SelectItem value="하점면 창후리">하점면 창후리</SelectItem>

                          {/* 화도면 옵션 */}
                          <SelectItem value="화도면 내리">화도면 내리</SelectItem>
                          <SelectItem value="화도면 덕포리">화도면 덕포리</SelectItem>
                          <SelectItem value="화도면 동막리">화도면 동막리</SelectItem>
                          <SelectItem value="화도면 문산리">화도면 문산리</SelectItem>
                          <SelectItem value="화도면 사기리">화도면 사기리</SelectItem>
                          <SelectItem value="화도면 상방리">화도면 상방리</SelectItem>
                          <SelectItem value="화도면 여차리">화도면 여차리</SelectItem>
                          <SelectItem value="화도면 장화리">화도면 장화리</SelectItem>
                          <SelectItem value="화도면 흥왕리">화도면 흥왕리</SelectItem>
                          
                          {/* 기타 옵션 */}
                          <SelectItem value="기타지역">기타지역</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>유형</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="유형 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="토지">토지</SelectItem>
                          <SelectItem value="주택">주택</SelectItem>
                          <SelectItem value="아파트연립다세대">아파트/연립/다세대</SelectItem>
                          <SelectItem value="원투룸">원룸/투룸</SelectItem>
                          <SelectItem value="상가공장창고펜션">상가/공장/창고/펜션</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격대</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="가격대 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="0-100000000">1억 이하</SelectItem>
                          <SelectItem value="100000000-300000000">1억~3억</SelectItem>
                          <SelectItem value="300000000-500000000">3억~5억</SelectItem>
                          <SelectItem value="500000000-1000000000">5억~10억</SelectItem>
                          <SelectItem value="1000000000-9999999999">10억 이상</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary hover:bg-secondary text-white">
                    검색
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Map Section */}
        <div className="mb-8">
          <div className="mb-3 flex items-center">
            <MapIcon className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-bold">지도로 부동산찾기</h2>
          </div>
          <div className="h-[40vh] w-full rounded-lg overflow-hidden mb-6">
            <KakaoMap />
          </div>
        </div>
        
        {/* Properties Results */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {filterParams.district !== "all" && `${filterParams.district} `}
            {filterParams.type !== "all" && `${filterParams.type} `}
            매물
          </h2>
          {properties && (
            <p className="text-gray-medium">총 {properties.length}개의 매물</p>
          )}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-lg text-red-600">
            <h3 className="text-xl font-bold mb-2">매물을 불러오는 중 오류가 발생했습니다</h3>
            <p>잠시 후 다시 시도해주세요.</p>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-light p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-4">검색 결과가 없습니다</h3>
            <p className="text-gray-medium mb-6">검색 조건을 변경하여 다시 시도해보세요.</p>
            <Button onClick={() => {
              form.reset({
                district: "all",
                type: "all",
                priceRange: "all",
              });
              setFilterParams({
                district: "all",
                type: "all",
                minPrice: null,
                maxPrice: null,
              });
            }}>
              필터 초기화
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;

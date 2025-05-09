import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PropertyCard from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/search", filterParams],
    queryFn: async () => {
      const url = new URL("/api/search", window.location.origin);
      
      if (filterParams.district !== "all") {
        url.searchParams.append("district", filterParams.district);
      }
      
      if (filterParams.type !== "all") {
        url.searchParams.append("type", filterParams.type);
      }
      
      if (filterParams.minPrice && filterParams.maxPrice) {
        url.searchParams.append("minPrice", filterParams.minPrice);
        url.searchParams.append("maxPrice", filterParams.maxPrice);
      }
      
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="지역 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="강화읍">강화읍</SelectItem>
                          <SelectItem value="교동면">교동면</SelectItem>
                          <SelectItem value="길상면">길상면</SelectItem>
                          <SelectItem value="내가면">내가면</SelectItem>
                          <SelectItem value="불은면">불은면</SelectItem>
                          <SelectItem value="삼산면">삼산면</SelectItem>
                          <SelectItem value="서도면">서도면</SelectItem>
                          <SelectItem value="선원면">선원면</SelectItem>
                          <SelectItem value="송해면">송해면</SelectItem>
                          <SelectItem value="양도면">양도면</SelectItem>
                          <SelectItem value="양사면">양사면</SelectItem>
                          <SelectItem value="하점면">하점면</SelectItem>
                          <SelectItem value="화도면">화도면</SelectItem>
                          <SelectItem value="강화외지역">강화외지역</SelectItem>
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
                        defaultValue={field.value}
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
                        defaultValue={field.value}
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
      
      <div className="container mx-auto px-4 py-12">
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

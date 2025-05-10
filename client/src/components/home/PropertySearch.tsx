import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const FormSchema = z.object({
  district: z.string(),
  type: z.string(),
  priceRange: z.string(),
});

const PropertySearch = () => {
  const [, setLocation] = useLocation();
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      district: "all",
      type: "all",
      priceRange: "all",
    },
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    // 검색 파라미터 구성
    let searchParams = new URLSearchParams();
    
    // 지역 설정 추가
    if (data.district !== "all") {
      searchParams.append("district", data.district);
    }
    
    // 유형 설정 추가
    if (data.type !== "all") {
      searchParams.append("type", data.type);
    }
    
    // 가격 범위 설정 추가
    if (data.priceRange !== "all") {
      const [min, max] = data.priceRange.split("-");
      if (min) searchParams.append("minPrice", min);
      if (max) searchParams.append("maxPrice", max);
    }
    
    // 디버깅용 로그
    console.log("검색 파라미터:", {
      district: data.district,
      type: data.type,
      priceRange: data.priceRange
    });
    console.log("검색 URL:", `/properties?${searchParams.toString()}`);
    
    // 해당 URL로 페이지 이동
    setLocation(`/properties?${searchParams.toString()}`);
  };

  return (
    <section className="bg-gray-light py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">매물 검색</h2>
        
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
                        <SelectItem value="강화군">강화군</SelectItem>
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
    </section>
  );
};

export default PropertySearch;

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
    
    // 해당 URL로 페이지 이동
    setLocation(`/properties?${searchParams.toString()}`);
  };

  return (
    <div className="bg-white p-6">
      <h2 className="text-2xl font-bold mb-6">매물 검색</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
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
                    {/* 기타 면/리 옵션들 */}
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
  );
};

export default PropertySearch;

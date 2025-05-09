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
    let searchParams = new URLSearchParams();
    
    if (data.district !== "all") {
      searchParams.append("district", data.district);
    }
    
    if (data.type !== "all") {
      searchParams.append("type", data.type);
    }
    
    if (data.priceRange !== "all") {
      const [min, max] = data.priceRange.split("-");
      if (min) searchParams.append("minPrice", min);
      if (max) searchParams.append("maxPrice", max);
    }
    
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
                        <SelectItem value="all">서울 전체</SelectItem>
                        <SelectItem value="강남구">강남구</SelectItem>
                        <SelectItem value="서초구">서초구</SelectItem>
                        <SelectItem value="마포구">마포구</SelectItem>
                        <SelectItem value="용산구">용산구</SelectItem>
                        <SelectItem value="송파구">송파구</SelectItem>
                        <SelectItem value="성북구">성북구</SelectItem>
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
                        <SelectItem value="아파트">아파트</SelectItem>
                        <SelectItem value="빌라">빌라</SelectItem>
                        <SelectItem value="주택">주택</SelectItem>
                        <SelectItem value="오피스텔">오피스텔</SelectItem>
                        <SelectItem value="펜트하우스">펜트하우스</SelectItem>
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

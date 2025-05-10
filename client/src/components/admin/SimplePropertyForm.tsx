import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Property, insertPropertySchema } from "@shared/schema";

// 부동산 유형 목록
const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];

// 통합된 지역 목록 (읍면동리)
const allLocations = [
  "강화군외",
  "강화읍 갑곳리",
  "강화읍 관청리",
  "강화읍 국화리",
  "강화읍 남산리",
  "강화읍 대산리",
  "강화읍 신문리",
  "강화읍 옥림리",
  "강화읍 용정리",
  "강화읍 월곳리",
  "교동면 고구리",
  "교동면 난정리",
  "교동면 대룡리",
  "교동면 동산리",
  "교동면 무학리",
  "교동면 봉소리",
  "교동면 삼선리",
  "교동면 상용리",
  "교동면 서한리",
  "교동면 양갑리",
  "교동면 읍내리",
  "교동면 인사리",
  "교동면 지석리",
  "길상면 길직리",
  "길상면 동검리",
  "길상면 선두리",
  "길상면 온수리",
  "길상면 장흥리",
  "길상면 초지리",
  "내가면 고천리",
  "내가면 구하리",
  "내가면 오상리",
  "내가면 외포리",
  "내가면 황청리",
  "불은면 고능리",
  "불은면 넙성리",
  "불은면 덕성리",
  "불은면 두운리",
  "불은면 삼동암리",
  "불은면 삼성리",
  "불은면 신현리",
  "불은면 오두리",
  "삼산면 매음리",
  "삼산면 미법리",
  "삼산면 상리",
  "삼산면 서검리",
  "삼산면 석모리",
  "삼산면 석포리",
  "삼산면 하리",
  "서도면 말도리",
  "서도면 볼음도리",
  "서도면 아차도리",
  "서도면 주문도리",
  "선원면 금월리",
  "선원면 냉정리",
  "선원면 선행리",
  "선원면 신정리",
  "선원면 연리",
  "선원면 지산리",
  "선원면 창리",
  "송해면 당산리",
  "송해면 상도리",
  "송해면 솔정리",
  "송해면 숭뢰리",
  "송해면 신당리",
  "송해면 양오리",
  "송해면 하도리",
  "양도면 건평리",
  "양도면 길정리",
  "양도면 능내리",
  "양도면 도장리",
  "양도면 삼흥리",
  "양도면 인산리",
  "양도면 조산리",
  "양도면 하일리",
  "양사면 교산리",
  "양사면 덕하리",
  "양사면 북성리",
  "양사면 인화리",
  "양사면 철산리",
  "하점면 망월리",
  "하점면 부근리",
  "하점면 삼거리",
  "하점면 신봉리",
  "하점면 신삼리",
  "하점면 이강리",
  "하점면 장정리",
  "하점면 창후리",
  "화도면 내리",
  "화도면 덕포리",
  "화도면 동막리",
  "화도면 문산리",
  "화도면 사기리",
  "화도면 상방리",
  "화도면 여차리",
  "화도면 장화리",
  "화도면 흥왕리",
];

// 읍면 리스트 (위의 데이터에서 추출)
const districts = [
  "강화읍",
  "교동면",
  "길상면",
  "내가면",
  "불은면",
  "삼산면",
  "서도면",
  "선원면",
  "송해면",
  "양도면",
  "양사면",
  "하점면",
  "화도면",
];

// 거래 종류
const dealTypes = ["매매", "전세", "월세", "완료", "보류중"];

// 세부 지역 정보 (이전 데이터 구조 유지를 위한 임시 변수)
const detailedDistricts: { [key: string]: string[] } = {
  강화읍: [
    "강화읍 갑곳리",
    "강화읍 관청리",
    "강화읍 국화리",
    "강화읍 남산리",
    "강화읍 대산리",
    "강화읍 신문리",
    "강화읍 옥림리",
    "강화읍 용정리",
    "강화읍 월곳리",
  ],
  교동면: [
    "교동면 고구리",
    "교동면 난정리",
    "교동면 대룡리",
    "교동면 동산리",
    "교동면 무학리",
    "교동면 봉소리",
    "교동면 삼선리",
    "교동면 상용리",
    "교동면 서한리",
    "교동면 양갑리",
    "교동면 읍내리",
    "교동면 인사리",
    "교동면 지석리",
  ],
  길상면: [
    "길상면 길직리",
    "길상면 동검리",
    "길상면 선두리",
    "길상면 온수리",
    "길상면 장흥리",
    "길상면 초지리",
  ],
  내가면: [
    "내가면 고천리",
    "내가면 구하리",
    "내가면 오상리",
    "내가면 외포리",
    "내가면 황청리",
  ],
  불은면: [
    "불은면 고능리",
    "불은면 넙성리",
    "불은면 덕성리",
    "불은면 두운리",
    "불은면 삼동암리",
    "불은면 삼성리",
    "불은면 신현리",
    "불은면 오두리",
  ],
  삼산면: [
    "삼산면 매음리",
    "삼산면 미법리",
    "삼산면 상리",
    "삼산면 서검리",
    "삼산면 석모리",
    "삼산면 석포리",
    "삼산면 하리",
  ],
  서도면: [
    "서도면 말도리",
    "서도면 볼음도리",
    "서도면 아차도리",
    "서도면 주문도리",
  ],
  선원면: [
    "선원면 금월리",
    "선원면 냉정리",
    "선원면 선행리",
    "선원면 신정리",
    "선원면 연리",
    "선원면 지산리",
    "선원면 창리",
  ],
  송해면: [
    "송해면 당산리",
    "송해면 상도리",
    "송해면 솔정리",
    "송해면 숭뢰리",
    "송해면 신당리",
    "송해면 양오리",
    "송해면 하도리",
  ],
  양도면: [
    "양도면 건평리",
    "양도면 길정리",
    "양도면 능내리",
    "양도면 도장리",
    "양도면 삼흥리",
    "양도면 인산리",
    "양도면 조산리",
    "양도면 하일리",
  ],
  양사면: [
    "양사면 교산리",
    "양사면 덕하리",
    "양사면 북성리",
    "양사면 인화리",
    "양사면 철산리",
  ],
  하점면: [
    "하점면 망월리",
    "하점면 부근리",
    "하점면 삼거리",
    "하점면 신봉리",
    "하점면 신삼리",
    "하점면 이강리",
    "하점면 장정리",
    "하점면 창후리",
  ],
  화도면: [
    "화도면 내리",
    "화도면 덕포리",
    "화도면 동막리",
    "화도면 문산리",
    "화도면 사기리",
    "화도면 상방리",
    "화도면 여차리",
    "화도면 장화리",
    "화도면 흥왕리",
  ],
};

// 속성 입력 값 스키마
const propertyFormSchema = insertPropertySchema.extend({
  price: z.union([z.string(), z.number()]).optional(),
  size: z.union([z.string(), z.number()]).optional(),
  supplyArea: z.union([z.string(), z.number()]).optional().nullable(),
  privateArea: z.union([z.string(), z.number()]).optional().nullable(),
  floor: z.union([z.string(), z.number()]).optional().nullable(),
  totalFloors: z.union([z.string(), z.number()]).optional().nullable(),
  deposit: z.union([z.string(), z.number()]).optional().nullable(),
  monthlyRent: z.union([z.string(), z.number()]).optional().nullable(),
  maintenanceFee: z.union([z.string(), z.number()]).optional().nullable(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface SimplePropertyFormProps {
  onClose: () => void;
  property?: Property | null;
}

export function SimplePropertyForm({ onClose, property }: SimplePropertyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 부동산 등록/수정 폼
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      // 기본 정보
      title: "",
      description: "",
      type: "토지",
      price: "",
      district: "강화읍 갑곳리", 
      address: "",
      size: "",
      agentId: 1,
      
      // 위치 정보
      buildingName: "",
      unitNumber: "",
      
      // 면적 정보
      supplyArea: "",
      privateArea: "",
      areaSize: "",
      
      // 건물 정보
      floor: "",
      totalFloors: "",
      direction: "",
      elevator: false,
      parking: "",
      heatingSystem: "",
      approvalDate: "",
      
      // 금액 정보
      dealType: ["매매"],
      deposit: "",
      monthlyRent: "",
      maintenanceFee: "",
      
      // 연락처 정보
      ownerName: "",
      ownerPhone: "",
      tenantName: "",
      tenantPhone: "",
      clientName: "",
      clientPhone: "",
      
      // 추가 정보
      specialNote: "",
      coListing: false,
      propertyDescription: "",
      privateNote: "",
      
      // 기존 필드
      bedrooms: 0,
      bathrooms: 0,
      featured: false,
    },
  });

  // 지역 선택 로직이 단일 드롭다운으로 통합되었습니다.

  // 부동산 생성 뮤테이션
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const res = await apiRequest("POST", "/api/properties", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "부동산 등록에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 등록 성공",
        description: "새로운 부동산이 등록되었습니다.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부동산 수정 뮤테이션
  const updatePropertyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: PropertyFormValues;
    }) => {
      const res = await apiRequest("PATCH", `/api/properties/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "부동산 수정에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 수정 성공",
        description: "부동산 정보가 수정되었습니다.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 폼 제출 처리
  const onSubmit = (data: PropertyFormValues) => {
    if (property) {
      updatePropertyMutation.mutate({ id: property.id, data });
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  // 속성이 변경될 때마다 폼 업데이트
  useEffect(() => {
    if (property) {
      // 폼 값 설정
      form.reset({
        title: property.title,
        description: property.description,
        type: property.type,
        price: property.price.toString(),
        address: property.address,
        district: property.district,
        size: property.size.toString(),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        imageUrl: property.imageUrl,
        agentId: property.agentId,
        featured: property.featured === null ? false : property.featured,
        buildingName: property.buildingName || "",
        unitNumber: property.unitNumber || "",
        supplyArea: property.supplyArea ? property.supplyArea.toString() : "",
        privateArea: property.privateArea ? property.privateArea.toString() : "",
        areaSize: property.areaSize || "",
        floor: property.floor ? property.floor.toString() : "",
        totalFloors: property.totalFloors ? property.totalFloors.toString() : "",
        direction: property.direction || "",
        elevator: property.elevator === null ? false : property.elevator,
        parking: property.parking || "",
        heatingSystem: property.heatingSystem || "",
        approvalDate: property.approvalDate || "",
        dealType: Array.isArray(property.dealType) ? property.dealType : ["매매"],
        deposit: property.deposit ? property.deposit.toString() : "",
        monthlyRent: property.monthlyRent ? property.monthlyRent.toString() : "",
        maintenanceFee: property.maintenanceFee ? property.maintenanceFee.toString() : "",
        ownerName: property.ownerName || "",
        ownerPhone: property.ownerPhone || "",
        tenantName: property.tenantName || "",
        tenantPhone: property.tenantPhone || "",
        clientName: property.clientName || "",
        clientPhone: property.clientPhone || "",
        specialNote: property.specialNote || "",
        coListing: property.coListing === null ? false : property.coListing,
        propertyDescription: property.propertyDescription || "",
        privateNote: property.privateNote || "",
      });
    } else {
      // 새 속성 등록을 위한 초기값 설정
      form.reset({
        // 기본 정보
        title: "",
        description: "",
        type: "토지",
        price: "",
        district: "강화읍 갑곳리", 
        address: "",
        size: "",
        imageUrl: "",
        agentId: 1,
        
        // 위치 정보
        buildingName: "",
        unitNumber: "",
        
        // 면적 정보
        supplyArea: "",
        privateArea: "",
        areaSize: "",
        
        // 건물 정보
        floor: "",
        totalFloors: "",
        direction: "",
        elevator: false,
        parking: "",
        heatingSystem: "",
        approvalDate: "",
        
        // 금액 정보
        dealType: ["매매"],
        deposit: "",
        monthlyRent: "",
        maintenanceFee: "",
        
        // 연락처 정보
        ownerName: "",
        ownerPhone: "",
        tenantName: "",
        tenantPhone: "",
        clientName: "",
        clientPhone: "",
        
        // 추가 정보
        specialNote: "",
        coListing: false,
        propertyDescription: "",
        privateNote: "",
        
        // 기존 필드
        bedrooms: 0,
        bathrooms: 0,
        featured: false,
      });
    }
  }, [property, form]);

  return (
    <div className="bg-white p-6 shadow-md rounded-lg max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          {property ? "부동산 수정" : "새 부동산 등록"}
        </h2>
        <p className="text-sm text-gray-500">
          {property ? "부동산 정보를 수정하세요" : "새로운 부동산 매물을 등록하세요"}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="부동산 제목" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
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
                        <SelectTrigger>
                          <SelectValue placeholder="부동산 유형 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="부동산에 대한 상세 설명"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>가격</FormLabel>
                    <FormControl>
                      <Input placeholder="가격 (원)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>면적 (㎡)</FormLabel>
                    <FormControl>
                      <Input placeholder="면적 (㎡)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>지역 (읍면동리)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="지역 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {allLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>지번</FormLabel>
                    <FormControl>
                      <Input placeholder="지번 주소" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="buildingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>건물명</FormLabel>
                    <FormControl>
                      <Input placeholder="건물명 (선택사항)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>동호수</FormLabel>
                    <FormControl>
                      <Input placeholder="동호수 (선택사항)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="supplyArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>공급면적 (평)</FormLabel>
                    <FormControl>
                      <Input placeholder="공급면적 (선택사항)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="privateArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전용면적 (평)</FormLabel>
                    <FormControl>
                      <Input placeholder="전용면적 (선택사항)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이미지 URL</FormLabel>
                    <FormControl>
                      <Input placeholder="이미지 URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="dealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>거래 종류</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {dealTypes.map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={field.value.includes(type) ? "default" : "outline"}
                          onClick={() => {
                            const newValue = field.value.includes(type)
                              ? field.value.filter((t) => t !== type)
                              : [...field.value, type];
                            field.onChange(newValue.length ? newValue : ["매매"]);
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>침실 수</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="침실 수"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>욕실 수</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="욕실 수"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">추천 매물로 표시</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}>
              {(createPropertyMutation.isPending || updatePropertyMutation.isPending) ? "처리 중..." : property ? "수정" : "등록"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
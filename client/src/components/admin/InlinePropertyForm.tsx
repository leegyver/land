import React, { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Property, insertPropertySchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

// 부동산 유형 목록
const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];

// 읍면 리스트
const districts = [
  "강화읍",
  "교동면",
  "길상면",
  "내가면",
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

// 세부 지역 정보
const detailedDistricts: { [key: string]: string[] } = {
  강화읍: [
    "강화읍 갑곳리",
    "강화읍 관청리",
    "강화읍 국화리",
    "강화읍 남산리",
    "강화읍 대산리",
    "강화읍 옥림리",
    "강화읍 용정리",
    "강화읍 월곶리",
  ],
  교동면: [
    "교동면 고구리",
    "교동면 대룡리",
    "교동면 무학리",
    "교동면 봉소리",
    "교동면 삼선리",
    "교동면 상용리",
    "교동면 서한리",
    "교동면 소룡리",
    "교동면 읍내리",
    "교동면 정운리",
    "교동면 지석리",
    "교동면 화개리",
  ],
  길상면: [
    "길상면 길직리",
    "길상면 동검리",
    "길상면 마리",
    "길상면 망월리",
    "길상면 온수리",
    "길상면 선두리",
    "길상면 초지리",
  ],
  내가면: [
    "내가면 고천리",
    "내가면 오상리",
    "내가면 외포리",
    "내가면 지석리",
  ],
  삼산면: [
    "삼산면 매음리",
    "삼산면 석모리",
    "삼산면 서검리",
    "삼산면 석모리",
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
    "선원면 연리",
    "선원면 창리",
  ],
  송해면: [
    "송해면 당산리",
    "송해면 양오리",
    "송해면 하도리",
    "송해면 장정리",
    "송해면 신당리",
    "송해면 천산리",
    "송해면 숭뢰리",
  ],
  양도면: [
    "양도면 감정리",
    "양도면 건평리",
    "양도면 도장리",
    "양도면 삼흥리",
    "양도면 인산리",
    "양도면 조산리",
    "양도면 인일리",
    "양도면 하일리",
  ],
  양사면: [
    "양사면 교산리",
    "양사면 덕하리",
    "양사면 덕하리",
    "양사면 북성리",
    "양사면 상도리",
    "양사면 송학리",
    "양사면 신당리",
    "양사면 인화리",
    "양사면 철산리",
  ],
  하점면: [
    "하점면 신봉리",
    "하점면 신삼리",
    "하점면 이강리",
    "하점면 장정리",
    "하점면 창후리",
  ],
  화도면: [
    "화도면 내리",
    "화도면 문산리",
    "화도면 사기리",
    "화도면 상방리",
    "화도면 장화리",
    "화도면 흥왕리",
  ],
};

// 속성 입력 값 스키마
const propertyFormSchema = insertPropertySchema.extend({
  price: z.union([z.string(), z.number()]).optional(),
  size: z.union([z.string(), z.number()]).optional(),
  imageUrl: z.string().optional(),
  supplyArea: z.union([z.string(), z.number()]).optional().nullable(),
  privateArea: z.union([z.string(), z.number()]).optional().nullable(),
  floor: z.union([z.string(), z.number()]).optional().nullable(),
  totalFloors: z.union([z.string(), z.number()]).optional().nullable(),
  deposit: z.union([z.string(), z.number()]).optional().nullable(),
  monthlyRent: z.union([z.string(), z.number()]).optional().nullable(),
  maintenanceFee: z.union([z.string(), z.number()]).optional().nullable(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface InlinePropertyFormProps {
  onClose: () => void;
  property?: Property | null;
}

export function InlinePropertyForm({ onClose, property }: InlinePropertyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMainDistrict, setSelectedMainDistrict] = useState<string>(districts[0]);
  const [detailedDistrictOptions, setDetailedDistrictOptions] = useState<string[]>(
    detailedDistricts[districts[0]]
  );

  const defaultFormValues: PropertyFormValues = {
    title: "",
    description: "",
    type: "토지",
    price: "",
    district: "강화읍 갑곳리",
    address: "",
    size: "",
    agentId: 1,
    bedrooms: 0,
    bathrooms: 0,
    featured: false,
    dealType: ["매매"],
    imageUrl: "",
    
    // 추가 필드들 (빈 문자열로 초기화)
    buildingName: "",
    unitNumber: "",
    supplyArea: "",
    privateArea: "",
    areaSize: "",
    floor: "",
    totalFloors: "",
    direction: "",
    elevator: false,
    parking: "",
    heatingSystem: "",
    approvalDate: "",
    deposit: "",
    monthlyRent: "",
    maintenanceFee: "",
    ownerName: "",
    ownerPhone: "",
    tenantName: "",
    tenantPhone: "",
    clientName: "",
    clientPhone: "",
    specialNote: "",
    coListing: false,
    propertyDescription: "",
    privateNote: "",
  };

  // 부동산 등록/수정 폼
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: defaultFormValues,
  });

  // 선택된 읍면에 따라 세부 지역 옵션 업데이트
  useEffect(() => {
    if (selectedMainDistrict && detailedDistricts[selectedMainDistrict]) {
      setDetailedDistrictOptions(detailedDistricts[selectedMainDistrict]);
      
      // 첫 번째 세부 지역을 기본값으로 설정
      if (detailedDistricts[selectedMainDistrict].length > 0) {
        form.setValue("district", detailedDistricts[selectedMainDistrict][0]);
      }
    }
  }, [selectedMainDistrict, form]);

  // 속성이 변경될 때 폼 업데이트
  useEffect(() => {
    if (property) {
      // 현재 읍면 찾기
      const mainDistrict = districts.find(d => 
        property.district.startsWith(d)
      ) || districts[0];
      
      setSelectedMainDistrict(mainDistrict);
      
      // 폼 초기화
      const formValues: Partial<PropertyFormValues> = {
        title: property.title || "",
        description: property.description || "",
        type: property.type || "토지",
        price: property.price ? property.price.toString() : "",
        address: property.address || "",
        district: property.district || "강화읍 갑곳리",
        size: property.size ? property.size.toString() : "",
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        agentId: property.agentId || 1,
        featured: !!property.featured,
        buildingName: property.buildingName || "",
        unitNumber: property.unitNumber || "",
        supplyArea: property.supplyArea ? property.supplyArea.toString() : "",
        privateArea: property.privateArea ? property.privateArea.toString() : "",
        areaSize: property.areaSize || "",
        floor: property.floor ? property.floor.toString() : "",
        totalFloors: property.totalFloors ? property.totalFloors.toString() : "",
        direction: property.direction || "",
        elevator: !!property.elevator,
        parking: property.parking || "",
        heatingSystem: property.heatingSystem || "",
        approvalDate: property.approvalDate || "",
        dealType: Array.isArray(property.dealType) && property.dealType.length > 0 
          ? property.dealType 
          : ["매매"],
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
        coListing: !!property.coListing,
        propertyDescription: property.propertyDescription || "",
        privateNote: property.privateNote || "",
      };
      
      form.reset(formValues);
    } else {
      form.reset(defaultFormValues);
    }
  }, [property, form]);

  // 부동산 생성 뮤테이션
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      console.log('부동산 등록 요청 데이터:', data);
      const res = await apiRequest("POST", "/api/properties", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 등록 성공",
        description: "새로운 부동산이 등록되었습니다.",
      });
      onClose();
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
    mutationFn: async ({ id, data }: { id: number; data: PropertyFormValues }) => {
      console.log('부동산 수정 요청 데이터:', data);
      const res = await apiRequest("PATCH", `/api/properties/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 수정 성공",
        description: "부동산 정보가 수정되었습니다.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 폼 제출 핸들러
  const onSubmit = (data: PropertyFormValues) => {
    // 숫자 필드 안전 처리
    const processedData = {
      ...data,
      floor: data.floor === "" ? "" : data.floor,
      totalFloors: data.totalFloors === "" ? "" : data.totalFloors,
      supplyArea: data.supplyArea === "" ? "" : data.supplyArea,
      privateArea: data.privateArea === "" ? "" : data.privateArea,
      deposit: data.deposit === "" ? "" : data.deposit,
      monthlyRent: data.monthlyRent === "" ? "" : data.monthlyRent,
      maintenanceFee: data.maintenanceFee === "" ? "" : data.maintenanceFee,
    };
    
    if (property) {
      updatePropertyMutation.mutate({ id: property.id, data: processedData });
    } else {
      createPropertyMutation.mutate(processedData);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{property ? "부동산 수정" : "새 부동산 등록"}</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="rounded-full h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 기본 정보 */}
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

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>유형</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="부동산에 대한 간략한 설명"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              {/* 읍면동 선택 */}
              <div>
                <FormLabel>읍면</FormLabel>
                <Select
                  value={selectedMainDistrict}
                  onValueChange={(value) => setSelectedMainDistrict(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>읍면동</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상세 지역 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {detailedDistrictOptions.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>층수</FormLabel>
                    <FormControl>
                      <Input placeholder="층수" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalFloors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>총층</FormLabel>
                    <FormControl>
                      <Input placeholder="총층" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          variant={
                            field.value && field.value.includes(type)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            const currentValue = field.value || [];
                            const newValue = currentValue.includes(type)
                              ? currentValue.filter((t) => t !== type)
                              : [...currentValue, type];
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

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>추천 매물로 표시</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
      </CardContent>
    </Card>
  );
}
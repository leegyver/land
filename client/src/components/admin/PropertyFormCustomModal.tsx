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
import { CustomModal } from "@/components/ui/custom-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Property, insertPropertySchema } from "@shared/schema";

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
    "강화읍 내리",
    "강화읍 대산리",
    "강화읍 망월리",
    "강화읍 명륜리",
    "강화읍 묘안리",
    "강화읍 박달리",
    "강화읍 방향리",
    "강화읍 북산리",
    "강화읍 불은면",
    "강화읍 신문리",
    "강화읍 신정리",
    "강화읍 옥림리",
    "강화읍 용정리",
    "강화읍 월곶리",
    "강화읍 인산리",
    "강화읍 중앙로",
    "강화읍 청송리",
    "강화읍 최촌리",
    "강화읍 홍릉리",
  ],
  교동면: [
    "교동면 고구리",
    "교동면 대룡리",
    "교동면 무학리",
    "교동면 방리",
    "교동면 봉소리",
    "교동면 삼선리",
    "교동면 상용리",
    "교동면 서한리",
    "교동면 소룡리",
    "교동면 읍내리",
    "교동면 정운리",
    "교동면 지석리",
    "교동면 철산리",
    "교동면 하일리",
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
    "내가면 나리",
    "내가면 내동리",
    "내가면 대곶리",
    "내가면 망하리",
    "내가면 박석리",
    "내가면 양오리",
    "내가면 오상리",
    "내가면 외포리",
    "내가면 장터리",
    "내가면 지석리",
    "내가면 창후리",
  ],
  삼산면: [
    "삼산면 매음리",
    "삼산면 물가리",
    "삼산면 석모리",
    "삼산면 서검리",
    "삼산면 석모리",
    "삼산면 약암리",
    "삼산면 윤상리",
    "삼산면 하리",
  ],
  서도면: [
    "서도면 말도리",
    "서도면 볼음도리",
    "서도면 수리",
    "서도면 아차도리",
    "서도면 주문도리",
  ],
  선원면: [
    "선원면 금월리",
    "선원면 동막리",
    "선원면 선원리",
    "선원면 신당리",
    "선원면 연리",
    "선원면 원당리",
    "선원면 창리",
    "선원면 포내리",
    "선원면 해산리",
  ],
  송해면: [
    "송해면 가숭리",
    "송해면 당산리",
    "송해면 대산리",
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
    "하점면 망원리",
    "하점면 봉천리",
    "하점면 신봉리",
    "하점면 신삼리",
    "하점면 양오리",
    "하점면 이강리",
    "하점면 장정리",
    "하점면 창후리",
    "하점면 참리",
    "하점면 충도리",
  ],
  화도면: [
    "화도면 갑곶리",
    "화도면 건평리",
    "화도면 내리",
    "화도면 덕포리",
    "화도면 문산리",
    "화도면 사기리",
    "화도면 상방리",
    "화도면 서산리",
    "화도면 장화리",
    "화도면 주문리",
    "화도면 천삼리",
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

interface PropertyFormCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
}

export function PropertyFormCustomModal({ isOpen, onClose, property }: PropertyFormCustomModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMainDistrict, setSelectedMainDistrict] = useState("강화읍");
  const [detailedDistrictOptions, setDetailedDistrictOptions] = useState<string[]>(detailedDistricts["강화읍"]);
  
  // 부동산 등록/수정 폼
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      // 기본 정보
      title: "",
      description: "",
      type: "토지",
      price: "",
      city: "인천",
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
    },
  });

  // 선택된 읍면에 따라 세부 지역 옵션 업데이트
  useEffect(() => {
    if (selectedMainDistrict && detailedDistricts[selectedMainDistrict]) {
      setDetailedDistrictOptions(detailedDistricts[selectedMainDistrict]);
      // 첫 번째 세부 지역을 기본값으로 설정
      form.setValue("district", detailedDistricts[selectedMainDistrict][0]);
    }
  }, [selectedMainDistrict, form]);
  
  // 읍면 변경 핸들러
  const handleDistrictChange = (value: string) => {
    setSelectedMainDistrict(value);
  };

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
      const mainDistrict = districts.find(d => 
        property.district.startsWith(d)
      ) || "강화읍";
      
      setSelectedMainDistrict(mainDistrict);
      
      // 폼 값 설정
      form.reset({
        title: property.title,
        description: property.description,
        type: property.type,
        price: property.price.toString(),
        address: property.address,
        city: property.city,
        district: property.district,
        size: property.size.toString(),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        imageUrl: property.imageUrl,
        agentId: property.agentId,
        featured: property.featured === null ? undefined : property.featured,
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
        city: "인천",
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
    <CustomModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={property ? "부동산 수정" : "새 부동산 등록"}
    >
      <div>
        <p className="text-sm text-gray-500 mb-4">
          {property ? "부동산 정보를 수정하세요" : "새로운 부동산 매물을 등록하세요"}
        </p>
        
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

              <div>
                <FormItem>
                  <FormLabel>읍면</FormLabel>
                  <Select
                    onValueChange={handleDistrictChange}
                    defaultValue={selectedMainDistrict}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>읍면동</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
    </CustomModal>
  );
}
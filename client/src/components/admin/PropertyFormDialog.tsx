import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Property, InsertProperty, insertPropertySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// 상수 정의
const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
const dealTypes = ["매매", "전세", "월세", "완료", "보류중"];
const districts = ["강화읍", "교동면", "길상면", "내가면", "삼산면", "서도면", "선원면", "송해면", "양도면", "양사면", "하점면", "화도면"];
const detailedDistricts: { [key: string]: string[] } = {
  "강화읍": ["강화읍 갑곳리", "강화읍 관청리", "강화읍 국화리", "강화읍 남산리", "강화읍 대산리", "강화읍 대릉리", "강화읍 망월리", "강화읍 문산리", "강화읍 박우물리", "강화읍 방축리", "강화읍 북산리", "강화읍 서산리", "강화읍 신문리", "강화읍 신철리", "강화읍 옥림리", "강화읍 용정리", "강화읍 월곶리", "강화읍 장기리", "강화읍 조산리", "강화읍 중앙리"],
  "교동면": ["교동면 고구리", "교동면 대룡리", "교동면 무학리", "교동면 봉소리", "교동면 상용리", "교동면 서한리", "교동면 소양리", "교동면 신명리", "교동면 읍내리", "교동면 지석리", "교동면 철산리", "교동면 창후리", "교동면 화개리", "교동면 화산리"],
  "길상면": ["길상면 길직리", "길상면 동검리", "길상면 망월리", "길상면 선두리", "길상면 온수리", "길상면 장흥리", "길상면 초지리"],
  "내가면": ["내가면 고천리", "내가면 구하리", "내가면 냉정리", "내가면 대명리", "내가면 오상리", "내가면 외포리", "내가면 장천리", "내가면 중앙리", "내가면 진창리"],
  "삼산면": ["삼산면 길정리", "삼산면 매음리", "삼산면 미법리", "삼산면 석모리", "삼산면 서검리", "삼산면 석모리", "삼산면 상리", "삼산면 하리"],
  "서도면": ["서도면 대벽리", "서도면 말도리", "서도면 볼음도리", "서도면 서도리", "서도면 아차도리", "서도면 주문도리"],
  "선원면": ["선원면 금월리", "선원면 냉정리", "선원면 대리", "선원면 동락리", "선원면 선행리", "선원면 신정리", "선원면 연리", "선원면 지산리", "선원면 창리", "선원면 포내리"],
  "송해면": ["송해면 당산리", "송해면 동산리", "송해면 반제리", "송해면 상도리", "송해면 솔정리", "송해면 신당리", "송해면 양오리", "송해면 장정리", "송해면 하도리", "송해면 황청리"],
  "양도면": ["양도면 건평리", "양도면 길정리", "양도면 도장리", "양도면 백석리", "양도면 삼흥리", "양도면 송해리", "양도면 인산리", "양도면 조곡리", "양도면 포촌리"],
  "양사면": ["양사면 교산리", "양사면 덕하리", "양사면 덕하리", "양사면 도장리", "양사면 마영리", "양사면 북성리", "양사면 송월리", "양사면 인화리", "양사면 철산리", "양사면 초지리"],
  "하점면": ["하점면 망원리", "하점면 망월리", "하점면 부근리", "하점면 산삼리", "하점면 삼거리", "하점면 신봉리", "하점면 신삼리", "하점면 양오리", "하점면 이강리", "하점면 장정리", "하점면 창후리"],
  "화도면": ["화도면 감정리", "화도면 계남리", "화도면 내리", "화도면 덕포리", "화도면 문산리", "화도면 사기리", "화도면 사창리", "화도면 상방리", "화도면 서순리", "화도면 장화리", "화도면 주문리", "화도면 천상리", "화도면 청담리", "화도면 화도리", "화도면 흥왕리"]
};

// 폼 스키마 정의
const propertyFormSchema = insertPropertySchema.extend({
  // 기본 정보
  price: z
    .union([
      z.string().min(1, "가격은 필수 입력 항목입니다").refine((val) => !isNaN(Number(val)), {
        message: "가격은 숫자 형식이어야 합니다",
      }),
      z.number().min(1, "가격은 필수 입력 항목입니다")
    ]),
  size: z
    .union([
      z.string().min(1, "면적은 필수 입력 항목입니다").refine((val) => !isNaN(Number(val)), {
        message: "면적은 숫자 형식이어야 합니다",
      }),
      z.number().min(1, "면적은 필수 입력 항목입니다")
    ]),
  
  // 위치 정보
  district: z.string().min(1, "읍면동은 필수 입력 항목입니다"),
  address: z.string().min(1, "지번은 필수 입력 항목입니다"),
  buildingName: z.string().optional(),
  unitNumber: z.string().optional(),
  
  // 면적 정보
  supplyArea: z.union([z.string().optional(), z.number().optional()]),
  privateArea: z.union([z.string().optional(), z.number().optional()]),
  areaSize: z.string().optional(),
  
  // 건물 정보
  floor: z.union([
    z.string().optional().transform(val => val === "" ? undefined : Number(val)),
    z.number().optional()
  ]),
  totalFloors: z.union([
    z.string().optional().transform(val => val === "" ? undefined : Number(val)),
    z.number().optional()
  ]),
  direction: z.string().optional(),
  elevator: z.boolean().optional().default(false),
  parking: z.string().optional(),
  heatingSystem: z.string().optional(),
  approvalDate: z.string().optional(),
  
  // 금액 정보
  dealType: z.array(z.string()).default(["매매"]),
  deposit: z.union([z.string().optional(), z.number().optional()]),
  monthlyRent: z.union([z.string().optional(), z.number().optional()]),
  maintenanceFee: z.union([z.string().optional(), z.number().optional()]),
  
  // 연락처 정보
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  tenantName: z.string().optional(),
  tenantPhone: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  
  // 추가 정보
  specialNote: z.string().optional(),
  coListing: z.boolean().optional().default(false),
  propertyDescription: z.string().optional(),
  privateNote: z.string().optional(),
  
  // 기존 필드들
  bedrooms: z.union([
    z.string().optional().transform(val => val ? Number(val) : 0), 
    z.number().min(0, "침실 수는 0 이상이어야 합니다")
  ]),
  bathrooms: z.union([
    z.string().optional().transform(val => val ? Number(val) : 0), 
    z.number().min(0, "욕실 수는 0 이상이어야 합니다")
  ]),
  featured: z.boolean().optional().default(false),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
}

export function PropertyFormDialog({ isOpen, onClose, property }: PropertyFormDialogProps) {
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
        buildingName: property.buildingName || undefined,
        unitNumber: property.unitNumber || undefined,
        supplyArea: property.supplyArea ? property.supplyArea.toString() : undefined,
        privateArea: property.privateArea ? property.privateArea.toString() : undefined,
        areaSize: property.areaSize || undefined,
        floor: property.floor ? property.floor.toString() : undefined,
        totalFloors: property.totalFloors ? property.totalFloors.toString() : undefined,
        direction: property.direction || undefined,
        elevator: property.elevator === null ? undefined : property.elevator,
        parking: property.parking || undefined,
        heatingSystem: property.heatingSystem || undefined,
        approvalDate: property.approvalDate || undefined,
        dealType: Array.isArray(property.dealType) ? property.dealType : ["매매"],
        deposit: property.deposit ? property.deposit.toString() : undefined,
        monthlyRent: property.monthlyRent ? property.monthlyRent.toString() : undefined,
        maintenanceFee: property.maintenanceFee ? property.maintenanceFee.toString() : undefined,
        ownerName: property.ownerName || undefined,
        ownerPhone: property.ownerPhone || undefined,
        tenantName: property.tenantName || undefined,
        tenantPhone: property.tenantPhone || undefined,
        clientName: property.clientName || undefined,
        clientPhone: property.clientPhone || undefined,
        specialNote: property.specialNote || undefined,
        coListing: property.coListing === null ? undefined : property.coListing,
        propertyDescription: property.propertyDescription || undefined,
        privateNote: property.privateNote || undefined,
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

  // 대화 상자가 열려있을 때만 렌더링
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "부동산 수정" : "새 부동산 등록"}</DialogTitle>
          <DialogDescription>
            {property ? "부동산 정보를 수정하세요" : "새로운 부동산 매물을 등록하세요"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </DialogContent>
    </Dialog>
  );
}
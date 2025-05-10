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
import { Loader2, X } from "lucide-react";

// 부동산 유형 목록
const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];

// 읍면 리스트
const districts = [
  "강화읍", "교동면", "길상면", "내가면", "불은면", "삼산면", "서도면", "선원면", 
  "송해면", "양도면", "양사면", "하점면", "화도면"
];

// 거래 종류
const dealTypes = ["매매", "전세", "월세", "완료", "보류중"];

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
  imageUrl: z.string().optional(),
  elevator: z.boolean().optional().nullable(),
  featured: z.boolean().optional().nullable(),
  coListing: z.boolean().optional().nullable(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface InlinePropertyFormProps {
  onClose: () => void;
  property?: Property | null;
}

export function InlinePropertyForm({ onClose, property }: InlinePropertyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: PropertyFormValues = {
    title: "",
    description: "",
    type: "토지",
    price: "",
    district: "강화읍",
    address: "",
    size: "",
    agentId: 1,
    bedrooms: 0,
    bathrooms: 0,
    featured: false,
    dealType: ["매매"],
    imageUrl: "", 
    imageUrls: [], // 다중 이미지 지원
    buildingName: "",
    unitNumber: "",
    supplyArea: null,
    privateArea: null,
    areaSize: "",
    floor: null,
    totalFloors: null,
    direction: "",
    elevator: null,
    parking: "",
    heatingSystem: "",
    approvalDate: "",
    deposit: null,
    monthlyRent: null,
    maintenanceFee: null,
    ownerName: "",
    ownerPhone: "",
    tenantName: "",
    tenantPhone: "",
    clientName: "",
    clientPhone: "",
    specialNote: "",
    coListing: null,
    propertyDescription: "",
    privateNote: "",
  };

  // 부동산 등록/수정 폼
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: defaultFormValues,
  });

  // 속성이 변경될 때 폼 업데이트
  useEffect(() => {
    if (property) {
      form.reset({
        ...defaultFormValues,
        ...property,
        price: property.price ? property.price.toString() : "",
        size: property.size ? property.size.toString() : "",
        dealType: Array.isArray(property.dealType) && property.dealType.length > 0 
          ? property.dealType 
          : ["매매"],
        featured: property.featured === null ? null : Boolean(property.featured),
        elevator: property.elevator === null ? null : Boolean(property.elevator),
        coListing: property.coListing === null ? null : Boolean(property.coListing),
        supplyArea: property.supplyArea ? property.supplyArea.toString() : null,
        privateArea: property.privateArea ? property.privateArea.toString() : null,
        floor: property.floor ? property.floor.toString() : null,
        totalFloors: property.totalFloors ? property.totalFloors.toString() : null,
        deposit: property.deposit ? property.deposit.toString() : null,
        monthlyRent: property.monthlyRent ? property.monthlyRent.toString() : null,
        maintenanceFee: property.maintenanceFee ? property.maintenanceFee.toString() : null,
      });
    } else {
      form.reset(defaultFormValues);
    }
  }, [property, form]);

  // 폼 제출 핸들러
  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true);
    try {
      // 데이터 타입 변환
      const formattedData = {
        ...data,
        // 숫자 필드 변환
        price: data.price ? parseFloat(data.price.toString()) : null,
        size: data.size ? parseFloat(data.size.toString()) : null,
        supplyArea: data.supplyArea ? parseFloat(data.supplyArea.toString()) : null,
        privateArea: data.privateArea ? parseFloat(data.privateArea.toString()) : null,
        floor: data.floor ? parseInt(data.floor.toString()) : null,
        totalFloors: data.totalFloors ? parseInt(data.totalFloors.toString()) : null,
        deposit: data.deposit ? parseFloat(data.deposit.toString()) : null,
        monthlyRent: data.monthlyRent ? parseFloat(data.monthlyRent.toString()) : null,
        maintenanceFee: data.maintenanceFee ? parseFloat(data.maintenanceFee.toString()) : null,
        
        // 불리언 필드 변환
        featured: data.featured === null ? false : Boolean(data.featured),
        elevator: data.elevator === null ? false : Boolean(data.elevator),
        coListing: data.coListing === null ? false : Boolean(data.coListing),
      };

      if (property) {
        // 부동산 수정
        const res = await apiRequest("PATCH", `/api/properties/${property.id}`, formattedData);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "부동산 수정에 실패했습니다");
        }
        
        // 성공 처리
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        toast({
          title: "부동산 수정 성공",
          description: "부동산 정보가 수정되었습니다.",
        });
      } else {
        // 새 부동산 생성
        const res = await apiRequest("POST", "/api/properties", formattedData);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "부동산 등록에 실패했습니다");
        }
        
        // 성공 처리
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        toast({
          title: "부동산 등록 성공",
          description: "새로운 부동산이 등록되었습니다.",
        });
      }
      
      onClose();
    } catch (error) {
      // 오류 처리
      toast({
        title: property ? "부동산 수정 실패" : "부동산 등록 실패",
        description: error instanceof Error ? error.message : "오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="상세 주소" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>추천 매물</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        이 매물을 추천 매물로 표시합니다.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : property ? (
                  "수정하기"
                ) : (
                  "등록하기"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
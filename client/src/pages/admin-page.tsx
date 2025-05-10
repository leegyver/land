import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Property, User, News, insertPropertySchema } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2, Home, Plus, Trash2, Edit, Check } from "lucide-react";

// 부동산 타입 및 읍면동 데이터
const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];

// 거래 종류 (다중 선택 가능)
const dealTypes = ["매매", "전세", "월세", "완료", "보류중"];

// 읍면 
const districts = [
  "강화읍", "교동면", "길상면", "내가면", "불은면", "삼산면", "서도면", "선원면", 
  "송해면", "양도면", "양사면", "하점면", "화도면", "강화외지역"
];

// 읍면동 세부 카테고리
interface DetailedDistrictsType {
  [key: string]: string[];
}

const detailedDistricts: DetailedDistrictsType = {
  "강화읍": ["강화읍 갑곳리", "강화읍 관청리", "강화읍 국화리", "강화읍 남산리", "강화읍 대산리", "강화읍 신문리", "강화읍 옥림리", "강화읍 용정리", "강화읍 월곳리"],
  "교동면": ["교동면 고구리", "교동면 난정리", "교동면 대룡리", "교동면 동산리", "교동면 무학리", "교동면 봉소리", "교동면 삼선리", "교동면 상용리", "교동면 서한리", "교동면 양갑리", "교동면 읍내리", "교동면 인사리", "교동면 지석리"],
  "길상면": ["길상면 길직리", "길상면 동검리", "길상면 선두리", "길상면 온수리", "길상면 장흥리", "길상면 초지리"],
  "내가면": ["내가면 고천리", "내가면 구하리", "내가면 오상리", "내가면 외포리", "내가면 황청리"],
  "불은면": ["불은면 고능리", "불은면 넙성리", "불은면 덕성리", "불은면 두운리", "불은면 삼동암리", "불은면 삼성리", "불은면 신현리", "불은면 오두리"],
  "삼산면": ["삼산면 매음리", "삼산면 미법리", "삼산면 상리", "삼산면 서검리", "삼산면 석모리", "삼산면 석포리", "삼산면 하리"],
  "서도면": ["서도면 말도리", "서도면 볼음도리", "서도면 아차도리", "서도면 주문도리"],
  "선원면": ["선원면 금월리", "선원면 냉정리", "선원면 선행리", "선원면 신정리", "선원면 연리", "선원면 지산리", "선원면 창리"],
  "송해면": ["송해면 당산리", "송해면 상도리", "송해면 솔정리", "송해면 숭뢰리", "송해면 신당리", "송해면 양오리", "송해면 하도리"],
  "양도면": ["양도면 건평리", "양도면 길정리", "양도면 능내리", "양도면 도장리", "양도면 삼흥리", "양도면 인산리", "양도면 조산리", "양도면 하일리"],
  "양사면": ["양사면 교산리", "양사면 덕하리", "양사면 북성리", "양사면 인화리", "양사면 철산리"],
  "하점면": ["하점면 망월리", "하점면 부근리", "하점면 삼거리", "하점면 신봉리", "하점면 신삼리", "하점면 이강리", "하점면 장정리", "하점면 창후리"],
  "화도면": ["화도면 내리", "화도면 덕포리", "화도면 동막리", "화도면 문산리", "화도면 사기리", "화도면 상방리", "화도면 여차리", "화도면 장화리", "화도면 흥왕리"],
  "강화외지역": ["기타지역"]
};

// 부동산 등록 폼 스키마 확장 (유효성 검사 추가)
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
  floor: z.union([z.string().optional(), z.number().optional()]),
  totalFloors: z.union([z.string().optional(), z.number().optional()]),
  direction: z.string().optional(),
  elevator: z.boolean().optional().default(false),
  parking: z.string().optional(),
  heatingSystem: z.string().optional(),
  approvalDate: z.string().optional(),
  
  // 금액 정보
  dealType: z.array(z.string()).default([]),
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

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("properties");
  const [openPropertyDialog, setOpenPropertyDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | false>(false);
  const [isDeletingUser, setIsDeletingUser] = useState<number | false>(false);
  const [isDeletingNews, setIsDeletingNews] = useState<number | false>(false);
  const [selectedMainDistrict, setSelectedMainDistrict] = useState("강화읍");
  const [detailedDistrictOptions, setDetailedDistrictOptions] = useState<string[]>(detailedDistricts["강화읍"]);
  
  // 부동산 등록/수정 폼
  const propertyForm = useForm<PropertyFormValues>({
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
      propertyForm.setValue("district", detailedDistricts[selectedMainDistrict][0]);
    }
  }, [selectedMainDistrict, propertyForm]);
  
  // 읍면 변경 핸들러
  const handleDistrictChange = (value: string) => {
    setSelectedMainDistrict(value);
  };

  // 부동산 목록 조회
  const {
    data: properties,
    isLoading: isLoadingProperties,
    error: propertiesError,
  } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // 사용자 목록 조회 (관리자만)
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: currentUser?.role === "admin",
  });
  
  // 뉴스 목록 조회
  const {
    data: news,
    isLoading: isLoadingNews,
    error: newsError,
  } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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
      setOpenPropertyDialog(false);
      propertyForm.reset();
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
      setOpenPropertyDialog(false);
      setEditingProperty(null);
      propertyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부동산 삭제 뮤테이션
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeleting(id);
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "부동산 삭제에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 삭제 성공",
        description: "부동산이 삭제되었습니다.",
      });
      setIsDeleting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });
  
  // 사용자 삭제 뮤테이션
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeletingUser(id);
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "사용자 삭제에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "사용자 삭제 성공",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
      setIsDeletingUser(false);
    },
    onError: (error: Error) => {
      toast({
        title: "사용자 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeletingUser(false);
    },
  });

  // 뉴스 삭제 뮤테이션
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeletingNews(id);
      const res = await apiRequest("DELETE", `/api/news/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "뉴스 삭제에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "뉴스 삭제 성공",
        description: "뉴스가 성공적으로 삭제되었습니다.",
      });
      setIsDeletingNews(false);
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeletingNews(false);
    },
  });

  // 부동산 폼 제출 핸들러
  const onPropertySubmit = (data: PropertyFormValues) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  // 부동산 수정 열기
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    
    // 폼 값 설정 (null 값을 undefined로 변환하여 타입 호환성 문제 해결)
    propertyForm.reset({
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
    
    setOpenPropertyDialog(true);
  };

  // 부동산 삭제 핸들러
  const handleDeleteProperty = (id: number) => {
    if (confirm("정말로 이 부동산을 삭제하시겠습니까?")) {
      deletePropertyMutation.mutate(id);
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleCloseDialog = () => {
    setOpenPropertyDialog(false);
    setEditingProperty(null);
    propertyForm.reset();
  };

  // 새 부동산 추가 핸들러
  const handleAddProperty = () => {
    setEditingProperty(null);
    propertyForm.reset({
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
    setOpenPropertyDialog(true);
  };

  // 로딩 상태 표시
  if (isLoadingProperties) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 오류 상태 표시
  if (propertiesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">오류가 발생했습니다: {propertiesError.message}</p>
        <Button variant="default" onClick={() => window.location.reload()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">관리자 패널</h1>
          <Breadcrumb className="mt-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                  홈
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>관리자 패널</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            <span className="font-bold">{currentUser?.username}</span> ({currentUser?.role})
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">부동산 관리</TabsTrigger>
          <TabsTrigger value="news">뉴스 관리</TabsTrigger>
          <TabsTrigger value="users" disabled={currentUser?.role !== "admin"}>
            사용자 관리
          </TabsTrigger>
        </TabsList>

        {/* 부동산 관리 탭 */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>부동산 목록</CardTitle>
                  <CardDescription>
                    등록된 부동산 매물 목록을 관리합니다.
                  </CardDescription>
                </div>
                <Button onClick={handleAddProperty}>
                  <Plus className="h-4 w-4 mr-2" />
                  부동산 등록
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>총 {properties?.length || 0}개의 부동산 매물</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>정보</TableHead>
                    <TableHead>특징</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties?.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{property.title}</TableCell>
                      <TableCell>{property.type}</TableCell>
                      <TableCell>{property.district}</TableCell>
                      <TableCell>{parseInt(property.price).toLocaleString()}원</TableCell>
                      <TableCell>{property.bedrooms}침실 {property.bathrooms}욕실 {property.size}㎡</TableCell>
                      <TableCell>
                        {property.featured && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            추천
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditProperty(property)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={isDeleting === property.id}
                          >
                            {isDeleting === property.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 부동산 등록/수정 다이얼로그 */}
          <Dialog open={openPropertyDialog} onOpenChange={setOpenPropertyDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProperty ? "부동산 수정" : "새 부동산 등록"}</DialogTitle>
                <DialogDescription>
                  {editingProperty
                    ? "부동산 정보를 수정하세요"
                    : "새로운 부동산 매물을 등록하세요"}
                </DialogDescription>
              </DialogHeader>

              <Form {...propertyForm}>
                <form
                  onSubmit={propertyForm.handleSubmit(onPropertySubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormField
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
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
                        control={propertyForm.control}
                        name="dealType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>거래 종류</FormLabel>
                            <div className="flex flex-wrap gap-2">
                              {dealTypes.map((type) => (
                                <Button
                                  key={type}
                                  type="button"
                                  variant={field.value && Array.isArray(field.value) && field.value.includes(type) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    // 현재 값이 undefined이거나 배열이 아닌 경우 빈 배열로 초기화
                                    const currentValue = field.value && Array.isArray(field.value) ? field.value : [];
                                    const newValue = currentValue.includes(type)
                                      ? currentValue.filter((t) => t !== type)
                                      : [...currentValue, type];
                                    field.onChange(newValue);
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
                        control={propertyForm.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>침실 수</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="침실 수"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>욕실 수</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="욕실 수"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="w-4 h-4 mt-1"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>추천 매물</FormLabel>
                              <FormDescription>
                                이 매물을 메인 화면에 추천 매물로 표시합니다.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit">
                      {editingProperty ? "수정" : "등록"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 뉴스 관리 탭 */}
        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>뉴스 목록</CardTitle>
              <CardDescription>
                등록된 뉴스 목록을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>총 {news?.length || 0}개의 뉴스</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>출처</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{item.title}</TableCell>
                      <TableCell>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {item.source || "네이버 뉴스"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (confirm("정말로 이 뉴스를 삭제하시겠습니까?")) {
                              deleteNewsMutation.mutate(item.id);
                            }
                          }}
                          disabled={isDeletingNews === item.id}
                        >
                          {isDeletingNews === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 사용자 관리 탭 (관리자만) */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>
                등록된 사용자 목록을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersError ? (
                <div className="text-center py-10">
                  <p className="text-red-500 mb-4">오류가 발생했습니다: {usersError.message}</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>총 {users?.length || 0}명의 사용자</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>사용자명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {/* createdAt은 현재 User 타입에 없으므로 표시하지 않음 */}
                          -
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (user.role === "admin") {
                                toast({
                                  title: "관리자 계정을 삭제할 수 없습니다",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (
                                confirm(
                                  "정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                                )
                              ) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={
                              isDeletingUser === user.id || user.role === "admin"
                            }
                          >
                            {isDeletingUser === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
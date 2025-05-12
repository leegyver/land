import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Property, User, News, insertPropertySchema } from "@shared/schema";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  RefreshCw, Settings, ListFilter, Layout, LogOut, Plus, 
  Trash2, Edit, Loader2, Check, Home, X, MoreHorizontal
} from "lucide-react";

// 기본 UI 컴포넌트
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 폼 스키마
const propertyFormSchema = insertPropertySchema.extend({
  price: z.string().optional(),
  size: z.string().optional(),
  supplyArea: z.string().optional(),
  privateArea: z.string().optional(),
  floor: z.string().optional(),
  totalFloors: z.string().optional(),
  deposit: z.string().optional(),
  monthlyRent: z.string().optional(),
  maintenanceFee: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

// 부동산 유형 목록
const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];

// 읍면 리스트
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
  "강화외지역"
];

// 거래 종류
const dealTypes = ["매매", "전세", "월세", "완료", "보류중"];

// 세부 지역 정보
const detailedDistricts: { [key: string]: string[] } = {
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

export default function AdminPageFixed() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("properties");
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | false>(false);
  const [isDeletingUser, setIsDeletingUser] = useState<number | false>(false);
  const [isDeletingNews, setIsDeletingNews] = useState<number | false>(false);
  const [isUpdatingNews, setIsUpdatingNews] = useState(false);
  const [selectedMainDistrict, setSelectedMainDistrict] = useState("강화읍");
  const [detailedDistrictOptions, setDetailedDistrictOptions] = useState<string[]>(
    detailedDistricts["강화읍"]
  );
  
  // 클라이언트 측 데이터 관리
  const [localProperties, setLocalProperties] = useState<Property[]>([]);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [localNews, setLocalNews] = useState<News[]>([]);
  const [newsLoaded, setNewsLoaded] = useState(false);
  
  // 다중 선택 관련 상태
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentDeleteType, setCurrentDeleteType] = useState<'properties' | 'news' | 'users' | null>(null);
  
  // 필터 상태
  const [filterType, setFilterType] = useState<string>("");
  const [filterDistrict, setFilterDistrict] = useState<string>("");
  const [filterDealType, setFilterDealType] = useState<string>("");
  
  // 필터링에 사용할 목록들
  const propertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  const dealTypes = ["매매", "전세", "월세", "단기임대"];
  
  // 지역 목록 (district)
  const districts = [
    "강화읍 갑곳리",
    "강화읍 관청리",
    "강화읍 국화리",
    "강화읍 남산리",
    "강화읍 대산리",
    "강화읍 신문리",
    "강화읍 옥림리",
    "강화읍 용정리",
    "화도면 장화리",
    "길상면 길직리",
    "길상면 선두리",
    "길상면 온수리",
    "길상면 장흥리",
    "길상면 초지리"
  ];

  // 기본 폼 값
  const defaultFormValues: PropertyFormValues = {
    title: "",
    description: "",
    type: "토지",
    price: "",
    city: "인천",
    district: detailedDistricts[selectedMainDistrict][0],
    address: "",
    size: "",
    imageUrl: "",
    agentId: 1,
    bedrooms: 0,
    bathrooms: 0,
    featured: false,
    dealType: ["매매"],
    
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

  // 부동산 목록 조회
  const {
    data: properties,
    isLoading: isLoadingProperties,
    error: propertiesError,
  } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // 프로퍼티 데이터 로딩 시 로컬 상태 업데이트
  useEffect(() => {
    if (properties && !propertiesLoaded) {
      setLocalProperties(properties);
      setPropertiesLoaded(true);
      setSelectedProperties([]);
    }
  }, [properties, propertiesLoaded]);

  // 사용자 목록 조회 (관리자만)
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: currentUser?.role === "admin"
  });

  // 사용자 데이터 로딩 시 로컬 상태 업데이트
  useEffect(() => {
    if (users && !usersLoaded) {
      setLocalUsers(users);
      setUsersLoaded(true);
      setSelectedUsers([]);
    }
  }, [users, usersLoaded]);
  
  // 뉴스 목록 조회
  const {
    data: news,
    isLoading: isLoadingNews,
    error: newsError,
  } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" }),
    onSuccess: (data) => {
      if (!newsLoaded) {
        setLocalNews(data);
        setNewsLoaded(true);
      }
    }
  });

  // 부동산 생성 뮤테이션
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      console.log('부동산 등록 요청 데이터:', data);
      const res = await apiRequest("POST", "/api/properties", data);
      return await res.json();
    },
    onSuccess: (newProperty) => {
      // 클라이언트 측 상태 업데이트
      setLocalProperties(prev => [...prev, newProperty]);
      
      // 서버 데이터 동기화 (백그라운드)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      }, 100);
      
      toast({
        title: "부동산 등록 성공",
        description: "새로운 부동산이 등록되었습니다.",
      });
      setShowPropertyForm(false);
      setEditingProperty(null);
      form.reset(defaultFormValues);
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
    onSuccess: (updatedProperty) => {
      // 클라이언트 측 상태 업데이트
      setLocalProperties(prev => 
        prev.map(item => item.id === updatedProperty.id ? updatedProperty : item)
      );
      
      // 서버 데이터 동기화 (백그라운드)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      }, 100);
      
      toast({
        title: "부동산 수정 성공",
        description: "부동산 정보가 수정되었습니다.",
      });
      setShowPropertyForm(false);
      setEditingProperty(null);
      form.reset(defaultFormValues);
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
      return { id, result: await res.json() };
    },
    onSuccess: ({ id, result }) => {
      // 클라이언트 측 상태 업데이트
      setLocalProperties(prev => prev.filter(item => item.id !== id));
      
      // 서버 데이터 동기화 (백그라운드)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      }, 100);
      
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
      return { id, result: await res.json() };
    },
    onSuccess: ({ id, result }) => {
      // 클라이언트 측 상태 업데이트
      setLocalUsers(prev => prev.filter(item => item.id !== id));
      
      // 서버 데이터 동기화 (백그라운드)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }, 100);
      
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
      return { id, result: await res.json() };
    },
    onSuccess: ({ id, result }) => {
      // 클라이언트 측 상태 업데이트
      setLocalNews(prev => prev.filter(item => item.id !== id));
      
      // 서버 데이터 동기화 (백그라운드)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      }, 100);
      
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

  // 뉴스 수동 업데이트 mutation
  const updateNewsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/admin/update-news");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/latest"] });
      toast({
        title: "뉴스 업데이트 성공",
        description: "최신 뉴스가 성공적으로 업데이트되었습니다.",
      });
      setIsUpdatingNews(false);
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsUpdatingNews(false);
    },
  });

  // 부동산 다중 삭제 mutation
  const batchDeletePropertiesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/properties/batch-delete", { ids });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 일괄 삭제 완료",
        description: data.message,
      });
      setSelectedProperties([]);
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 뉴스 다중 삭제 mutation
  const batchDeleteNewsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/news/batch-delete", { ids });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/latest"] });
      toast({
        title: "뉴스 일괄 삭제 완료",
        description: data.message,
      });
      setSelectedNews([]);
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 사용자 다중 삭제 mutation
  const batchDeleteUsersMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/users/batch-delete", { ids });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "사용자 일괄 삭제 완료",
        description: data.message,
      });
      
      // 자기 자신을 포함해서 삭제했는지 확인
      if (data.skippedSelf) {
        toast({
          title: "알림",
          description: "현재 로그인된 계정은 삭제할 수 없습니다.",
        });
      }
      
      setSelectedUsers([]);
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "사용자 일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // 뉴스 수동 업데이트 핸들러
  const handleUpdateNews = () => {
    if (window.confirm("네이버 뉴스 API를 통해 최신 뉴스를 가져오시겠습니까?")) {
      setIsUpdatingNews(true);
      updateNewsMutation.mutate();
    }
  };
  
  // 부동산 삭제 핸들러
  const handleDeleteProperty = (id: number) => {
    if (window.confirm("정말로 이 부동산을 삭제하시겠습니까?")) {
      deletePropertyMutation.mutate(id);
    }
  };
  
  // 다중 선택 핸들러
  const handleSelectProperty = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, id]);
    } else {
      setSelectedProperties(selectedProperties.filter(propId => propId !== id));
    }
  };
  
  const handleSelectNews = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNews([...selectedNews, id]);
    } else {
      setSelectedNews(selectedNews.filter(newsId => newsId !== id));
    }
  };
  
  const handleSelectUser = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, id]);
    } else {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    }
  };
  
  // 일괄 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (type: 'properties' | 'news' | 'users') => {
    setCurrentDeleteType(type);
    setIsDeleteAlertOpen(true);
  };
  
  // 일괄 삭제 실행
  const handleBatchDelete = () => {
    if (!currentDeleteType) return;
    
    switch (currentDeleteType) {
      case 'properties':
        if (selectedProperties.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 부동산 매물을 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeletePropertiesMutation.mutate(selectedProperties);
        break;
      
      case 'news':
        if (selectedNews.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 뉴스를 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteNewsMutation.mutate(selectedNews);
        break;
      
      case 'users':
        if (selectedUsers.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 사용자를 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteUsersMutation.mutate(selectedUsers);
        break;
    }
  };

  // 참고: 다중 선택 관련 핸들러는 위에서 이미 정의되었습니다.
  
  // 폼 닫기 핸들러
  const handleCloseForm = () => {
    setShowPropertyForm(false);
    setEditingProperty(null);
    form.reset(defaultFormValues);
  };

  // 부동산 수정 열기
  const handleEditProperty = (property: Property) => {
    // 현재 선택된 부동산 저장
    setEditingProperty(property);
    
    // 현재 읍면 찾기
    const mainDistrict = districts.find(d => 
      property.district.startsWith(d)
    ) || "강화읍";
    
    setSelectedMainDistrict(mainDistrict);
    setDetailedDistrictOptions(detailedDistricts[mainDistrict]);
    
    // 폼 초기화
    form.reset({
      title: property.title || "",
      description: property.description || "",
      type: property.type || "토지",
      price: property.price ? property.price.toString() : "",
      address: property.address || "",
      city: property.city || "인천",
      district: property.district || detailedDistricts[mainDistrict][0],
      size: property.size ? property.size.toString() : "",
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      imageUrl: property.imageUrl || "",
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
    });
    
    // 폼 표시
    setShowPropertyForm(true);
  };

  // 새 부동산 추가 핸들러
  const handleAddProperty = () => {
    setEditingProperty(null);
    form.reset(defaultFormValues);
    setShowPropertyForm(true);
  };

  // 읍면 변경 핸들러
  const handleDistrictChange = (value: string) => {
    setSelectedMainDistrict(value);
    setDetailedDistrictOptions(detailedDistricts[value]);
    
    // 첫 번째 세부 지역을 기본값으로 설정
    if (detailedDistricts[value].length > 0) {
      form.setValue("district", detailedDistricts[value][0]);
    }
  };
  
  // 폼 제출 핸들러
  const onSubmit = (data: PropertyFormValues) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  // 로딩 상태 표시
  if (isLoadingProperties && !propertiesLoaded) {
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

  // 필터링 함수
  const filterProperties = (props: Property[]) => {
    if (!props) return [];
    
    return props.filter(property => {
      // 유형 필터
      if (filterType && property.type !== filterType) {
        return false;
      }
      
      // 지역 필터
      if (filterDistrict && typeof property.district === 'string') {
        if (property.district !== filterDistrict) {
          return false;
        }
      }
      
      // 거래유형 필터
      if (filterDealType && property.dealType) {
        // 배열인 경우
        if (Array.isArray(property.dealType)) {
          return property.dealType.includes(filterDealType);
        } 
        // 문자열인 경우
        else if (typeof property.dealType === 'string') {
          return property.dealType === filterDealType;
        }
        return false;
      }
      
      return true;
    });
  };
  
  // 표시할 데이터 결정
  const baseProperties = propertiesLoaded ? localProperties : (properties || []);
  const displayProperties = filterProperties(baseProperties);
  const displayUsers = usersLoaded ? localUsers : (users || []);
  const displayNews = newsLoaded ? localNews : (news || []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 일괄 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택한 항목 일괄 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDeleteType === 'properties' && `선택한 ${selectedProperties.length}개의 부동산 매물을 삭제하시겠습니까?`}
              {currentDeleteType === 'news' && `선택한 ${selectedNews.length}개의 뉴스를 삭제하시겠습니까?`}
              {currentDeleteType === 'users' && `선택한 ${selectedUsers.length}개의 사용자를 삭제하시겠습니까?`}
              <br /><br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
                <div className="flex gap-2">
                  {selectedProperties.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => openDeleteConfirm('properties')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {selectedProperties.length}개 삭제
                    </Button>
                  )}
                  <Button onClick={handleAddProperty} type="button">
                    <Plus className="h-4 w-4 mr-2" />
                    부동산 등록
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 필터 UI */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-3">필터링</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Select
                      value={filterType}
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="유형별 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">전체 유형</SelectItem>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select
                      value={filterDistrict}
                      onValueChange={setFilterDistrict}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="지역별 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">전체 지역</SelectItem>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select
                      value={filterDealType}
                      onValueChange={setFilterDealType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="거래유형별 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">전체 거래유형</SelectItem>
                        {dealTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(filterType || filterDistrict || filterDealType) && (
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFilterType("");
                        setFilterDistrict("");
                        setFilterDealType("");
                      }}
                    >
                      필터 초기화
                    </Button>
                  </div>
                )}
              </div>
              
              <Table>
                <TableCaption>총 {displayProperties?.length || 0}개의 부동산 매물</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedProperties.length > 0 && selectedProperties.length === displayProperties.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProperties(displayProperties.map(p => p.id));
                          } else {
                            setSelectedProperties([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>정보</TableHead>
                    <TableHead>거래유형</TableHead>
                    <TableHead>특징</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedProperties.includes(property.id)}
                          onCheckedChange={(checked) => handleSelectProperty(property.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{property.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{property.title}</TableCell>
                      <TableCell>{property.type}</TableCell>
                      <TableCell>{property.district}</TableCell>
                      <TableCell>{parseInt(property.price).toLocaleString()}원</TableCell>
                      <TableCell>{property.bedrooms}침실 {property.bathrooms}욕실 {property.size}㎡</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {property.dealType && (Array.isArray(property.dealType) ? property.dealType.length > 0 : typeof property.dealType === 'string' && property.dealType.length > 0) ? (
                            Array.isArray(property.dealType) ? 
                              property.dealType.map((type, idx) => {
                                const dealTypeClass = 
                                  typeof type === 'string' && type.includes("매매") 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : typeof type === 'string' && type.includes("전세")
                                    ? 'bg-green-100 text-green-800'
                                    : typeof type === 'string' && type.includes("월세")
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800';
                                
                                return (
                                  <span key={idx} className={`px-2 py-1 rounded-full text-xs inline-block ${dealTypeClass}`}>
                                    {type}
                                  </span>
                                );
                              })
                            : (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                typeof property.dealType === 'string' && property.dealType.includes("매매") 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : typeof property.dealType === 'string' && property.dealType.includes("전세")
                                  ? 'bg-green-100 text-green-800'
                                  : typeof property.dealType === 'string' && property.dealType.includes("월세")
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {property.dealType}
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              미지정
                            </span>
                          )}
                        </div>
                      </TableCell>
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
                            type="button"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={isDeleting === property.id}
                            type="button"
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

          {/* 속성 폼 */}
          {showPropertyForm && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{editingProperty ? "부동산 수정" : "새 부동산 등록"}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCloseForm} 
                  className="rounded-full h-8 w-8 p-0"
                  type="button"
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
                          onValueChange={handleDistrictChange}
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
                      <Button type="button" variant="outline" onClick={handleCloseForm}>
                        취소
                      </Button>
                      <Button type="submit" disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}>
                        {(createPropertyMutation.isPending || updatePropertyMutation.isPending) ? "처리 중..." : editingProperty ? "수정" : "등록"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 뉴스 관리 탭 */}
        <TabsContent value="news">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>뉴스 목록</CardTitle>
                <CardDescription>
                  등록된 뉴스 목록을 관리합니다.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedNews.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => openDeleteConfirm('news')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {selectedNews.length}개 삭제
                  </Button>
                )}
                <Button 
                  onClick={handleUpdateNews} 
                  disabled={isUpdatingNews}
                  className="ml-auto"
                >
                {isUpdatingNews ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    업데이트 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    뉴스 업데이트
                  </>
                )}
              </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>총 {displayNews?.length || 0}개의 뉴스</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedNews.length > 0 && selectedNews.length === displayNews.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNews(displayNews.map(n => n.id));
                          } else {
                            setSelectedNews([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>출처</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayNews.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedNews.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectNews(item.id, !!checked)}
                        />
                      </TableCell>
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
                            if (window.confirm("정말로 이 뉴스를 삭제하시겠습니까?")) {
                              deleteNewsMutation.mutate(item.id);
                            }
                          }}
                          disabled={isDeletingNews === item.id}
                          type="button"
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>사용자 목록</CardTitle>
                <CardDescription>
                  등록된 사용자 목록을 관리합니다.
                </CardDescription>
              </div>
              {selectedUsers.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => openDeleteConfirm('users')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {selectedUsers.length}명 삭제
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingUsers && !usersLoaded ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersError ? (
                <div className="text-center py-10">
                  <p className="text-red-500 mb-4">오류가 발생했습니다: {usersError.message}</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>총 {displayUsers?.length || 0}명의 사용자</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedUsers.length > 0 && selectedUsers.length === displayUsers.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(displayUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>사용자명</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                          />
                        </TableCell>
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
                                window.confirm(
                                  "정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                                )
                              ) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={
                              isDeletingUser === user.id || user.role === "admin"
                            }
                            type="button"
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
      {/* 삭제 확인 대화 상자 */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentDeleteType === 'properties' && '부동산 매물 일괄 삭제'}
              {currentDeleteType === 'news' && '뉴스 일괄 삭제'}
              {currentDeleteType === 'users' && '사용자 일괄 삭제'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentDeleteType === 'properties' && 
                `선택한 ${selectedProperties.length}개의 부동산 매물을 삭제하시겠습니까?`}
              {currentDeleteType === 'news' && 
                `선택한 ${selectedNews.length}개의 뉴스를 삭제하시겠습니까?`}
              {currentDeleteType === 'users' && 
                `선택한 ${selectedUsers.length}명의 사용자를 삭제하시겠습니까? 관리자 계정은 삭제되지 않습니다.`}
              <div className="mt-2 text-red-500">이 작업은 되돌릴 수 없습니다.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
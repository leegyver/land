import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Property, News, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw, Edit, Plus, Eye, FileSpreadsheet, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ImportFromSheetModal } from "@/components/admin/ImportFromSheetModal";
import InquiryNotifications from "@/components/admin/InquiryNotifications";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 선택된 항목 관리
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // 삭제 확인 대화 상자 상태
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentDeleteType, setCurrentDeleteType] = useState<'properties' | 'news' | 'users' | null>(null);
  
  // 개별 삭제 확인 대화 상자 상태
  const [isIndividualDeleteOpen, setIsIndividualDeleteOpen] = useState(false);
  const [individualDeleteId, setIndividualDeleteId] = useState<number | null>(null);
  const [individualDeleteType, setIndividualDeleteType] = useState<'property' | 'news' | 'user' | null>(null);
  
  // 데이터 로드를 위한 쿼리 매개변수
  const [skipCache, setSkipCache] = useState(false);
  
  // 필터링 상태 (초기값은 "all"로 모든 항목을 표시)
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterDealType, setFilterDealType] = useState<string>("all");
  
  // 스프레드시트 가져오기 모달 상태
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // 필터 옵션 - 요청받은 카테고리로 업데이트
  const propertyTypes = [
    { value: "토지", label: "토지" },
    { value: "주택", label: "주택" },
    { value: "아파트연립다세대", label: "아파트연립다세대" },
    { value: "원투룸", label: "원투룸" },
    { value: "상가공장창고펜션", label: "상가공장창고펜션" },
  ];
  
  const dealTypes = [
    { value: "매매", label: "매매" },
    { value: "전세", label: "전세" },
    { value: "월세", label: "월세" },
    { value: "완료", label: "완료" },
    { value: "보류중", label: "보류중" },
  ];
  
  // 지역 필터 - 제공된 정확한 위치 목록 사용
  const districts = [
    { value: "all", label: "모든 지역" },
    { value: "강화읍 갑곳리", label: "강화읍 갑곳리" },
    { value: "강화읍 관청리", label: "강화읍 관청리" },
    { value: "강화읍 국화리", label: "강화읍 국화리" },
    { value: "강화읍 남산리", label: "강화읍 남산리" },
    { value: "강화읍 대산리", label: "강화읍 대산리" },
    { value: "강화읍 신문리", label: "강화읍 신문리" },
    { value: "강화읍 옥림리", label: "강화읍 옥림리" },
    { value: "강화읍 용정리", label: "강화읍 용정리" },
    { value: "강화읍 월곳리", label: "강화읍 월곳리" },
    { value: "교동면 고구리", label: "교동면 고구리" },
    { value: "교동면 난정리", label: "교동면 난정리" },
    { value: "교동면 대룡리", label: "교동면 대룡리" },
    { value: "교동면 동산리", label: "교동면 동산리" },
    { value: "교동면 무학리", label: "교동면 무학리" },
    { value: "교동면 봉소리", label: "교동면 봉소리" },
    { value: "교동면 삼선리", label: "교동면 삼선리" },
    { value: "교동면 상용리", label: "교동면 상용리" },
    { value: "교동면 서한리", label: "교동면 서한리" },
    { value: "교동면 양갑리", label: "교동면 양갑리" },
    { value: "교동면 읍내리", label: "교동면 읍내리" },
    { value: "교동면 인사리", label: "교동면 인사리" },
    { value: "교동면 지석리", label: "교동면 지석리" },
    { value: "길상면 길직리", label: "길상면 길직리" },
    { value: "길상면 동검리", label: "길상면 동검리" },
    { value: "길상면 선두리", label: "길상면 선두리" },
    { value: "길상면 온수리", label: "길상면 온수리" },
    { value: "길상면 장흥리", label: "길상면 장흥리" },
    { value: "길상면 초지리", label: "길상면 초지리" },
    { value: "내가면 고천리", label: "내가면 고천리" },
    { value: "내가면 구하리", label: "내가면 구하리" },
    { value: "내가면 오상리", label: "내가면 오상리" },
    { value: "내가면 외포리", label: "내가면 외포리" },
    { value: "내가면 황청리", label: "내가면 황청리" },
    { value: "불은면 고능리", label: "불은면 고능리" },
    { value: "불은면 넙성리", label: "불은면 넙성리" },
    { value: "불은면 덕성리", label: "불은면 덕성리" },
    { value: "불은면 두운리", label: "불은면 두운리" },
    { value: "불은면 삼동암리", label: "불은면 삼동암리" },
    { value: "불은면 삼성리", label: "불은면 삼성리" },
    { value: "불은면 신현리", label: "불은면 신현리" },
    { value: "불은면 오두리", label: "불은면 오두리" },
    { value: "삼산면 매음리", label: "삼산면 매음리" },
    { value: "삼산면 미법리", label: "삼산면 미법리" },
    { value: "삼산면 상리", label: "삼산면 상리" },
    { value: "삼산면 서검리", label: "삼산면 서검리" },
    { value: "삼산면 석모리", label: "삼산면 석모리" },
    { value: "삼산면 석포리", label: "삼산면 석포리" },
    { value: "삼산면 하리", label: "삼산면 하리" },
    { value: "서도면 말도리", label: "서도면 말도리" },
    { value: "서도면 볼음도리", label: "서도면 볼음도리" },
    { value: "서도면 아차도리", label: "서도면 아차도리" },
    { value: "서도면 주문도리", label: "서도면 주문도리" },
    { value: "선원면 금월리", label: "선원면 금월리" },
    { value: "선원면 냉정리", label: "선원면 냉정리" },
    { value: "선원면 선행리", label: "선원면 선행리" },
    { value: "선원면 신정리", label: "선원면 신정리" },
    { value: "선원면 연리", label: "선원면 연리" },
    { value: "선원면 지산리", label: "선원면 지산리" },
    { value: "선원면 창리", label: "선원면 창리" },
    { value: "송해면 당산리", label: "송해면 당산리" },
    { value: "송해면 상도리", label: "송해면 상도리" },
    { value: "송해면 솔정리", label: "송해면 솔정리" },
    { value: "송해면 숭뢰리", label: "송해면 숭뢰리" },
    { value: "송해면 신당리", label: "송해면 신당리" },
    { value: "송해면 양오리", label: "송해면 양오리" },
    { value: "송해면 하도리", label: "송해면 하도리" },
    { value: "양도면 건평리", label: "양도면 건평리" },
    { value: "양도면 길정리", label: "양도면 길정리" },
    { value: "양도면 능내리", label: "양도면 능내리" },
    { value: "양도면 도장리", label: "양도면 도장리" },
    { value: "양도면 삼흥리", label: "양도면 삼흥리" },
    { value: "양도면 인산리", label: "양도면 인산리" },
    { value: "양도면 조산리", label: "양도면 조산리" },
    { value: "양도면 하일리", label: "양도면 하일리" },
    { value: "양사면 교산리", label: "양사면 교산리" },
    { value: "양사면 덕하리", label: "양사면 덕하리" },
    { value: "양사면 북성리", label: "양사면 북성리" },
    { value: "양사면 인화리", label: "양사면 인화리" },
    { value: "양사면 철산리", label: "양사면 철산리" },
    { value: "하점면 망월리", label: "하점면 망월리" },
    { value: "하점면 부근리", label: "하점면 부근리" },
    { value: "하점면 삼거리", label: "하점면 삼거리" },
    { value: "하점면 신봉리", label: "하점면 신봉리" },
    { value: "하점면 신삼리", label: "하점면 신삼리" },
    { value: "하점면 이강리", label: "하점면 이강리" },
    { value: "하점면 장정리", label: "하점면 장정리" },
    { value: "하점면 창후리", label: "하점면 창후리" },
    { value: "화도면 내리", label: "화도면 내리" },
    { value: "화도면 덕포리", label: "화도면 덕포리" },
    { value: "화도면 동막리", label: "화도면 동막리" },
    { value: "화도면 문산리", label: "화도면 문산리" },
    { value: "화도면 사기리", label: "화도면 사기리" },
    { value: "화도면 상방리", label: "화도면 상방리" },
    { value: "화도면 여차리", label: "화도면 여차리" },
    { value: "화도면 장화리", label: "화도면 장화리" },
    { value: "화도면 흥왕리", label: "화도면 흥왕리" },
    { value: "기타지역", label: "기타지역" }
  ];
  
  // 최신 부동산 유형 및 거래 유형 배열
  const propertyTypeArray = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  const dealTypeArray = ["매매", "전세", "월세", "단기임대", "완료", "보류중"];
  
  // 데이터 로드 - 관리자용 모든 매물 조회
  const { 
    data: properties,
    isLoading: isLoadingProperties,
    refetch: refetchProperties
  } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties", skipCache],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  const {
    data: news,
    isLoading: isLoadingNews,
    refetch: refetchNews
  } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // 간소화된 부동산 필터링 함수
  const filterProperties = (props: Property[]) => {
    if (!props) return [];
    
    // 필터링 로그
    console.log("필터링 적용: ", { filterType, filterDistrict, filterDealType });
    
    return props.filter(property => {
      // 유형 필터
      if (filterType && filterType !== 'all' && property.type !== filterType) {
        return false;
      }
      
      // 지역 필터
      if (filterDistrict && filterDistrict !== 'all' && property.district !== filterDistrict) {
        return false;
      }
      
      // 거래유형 필터 - 간소화된 로직으로 타입 오류 회피
      if (filterDealType && filterDealType !== 'all' && property.dealType) {
        // 배열 케이스만 처리
        try {
          // JSON 문자열인 경우 파싱 시도
          const dealTypesArray = Array.isArray(property.dealType) 
            ? property.dealType
            : (typeof property.dealType === 'string' && property.dealType.includes(','))
              ? property.dealType.replace('{', '').replace('}', '').split(',')
              : [property.dealType.toString()];
              
          return dealTypesArray.some(type => type.includes(filterDealType));
        } catch (e) {
          console.error("딜 타입 필터링 오류:", e, property.dealType);
          return false;
        }
      }
      
      return true;
    });
  };
  
  // 필터링된 부동산 목록
  const filteredProperties = filterProperties(properties || []);
  
  const {
    data: users,
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 추천 매물 데이터 조회
  const {
    data: featuredProperties,
    isLoading: isLoadingFeatured,
    refetch: refetchFeatured
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });
  
  // 데이터 로드 시 선택 초기화
  useEffect(() => {
    setSelectedProperties([]);
  }, [properties]);
  
  useEffect(() => {
    setSelectedNews([]);
  }, [news]);
  
  useEffect(() => {
    setSelectedUsers([]);
  }, [users]);
  
  // 단일 부동산 삭제 뮤테이션
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 삭제 성공",
        description: "부동산이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // 단일 뉴스 삭제 뮤테이션
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/news/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "뉴스 삭제 성공",
        description: "뉴스가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // 단일 사용자 삭제 뮤테이션
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "사용자 삭제 성공",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "사용자 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 추천 매물 순서 변경 뮤테이션
  const updatePropertyOrderMutation = useMutation({
    mutationFn: async ({ propertyId, displayOrder }: { propertyId: number; displayOrder: number }) => {
      const res = await apiRequest("PUT", `/api/properties/${propertyId}/order`, { displayOrder });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "순서 변경 성공",
        description: "매물 순서가 변경되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "순서 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 매물 노출 상태 토글 뮤테이션
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ propertyId, isVisible }: { propertyId: number; isVisible: boolean }) => {
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/visibility`, { isVisible });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
      toast({
        title: "노출 상태 변경 성공",
        description: "매물 노출 상태가 변경되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "노출 상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 추천 매물 드래그앤드롭 핸들러
  const handleDragEnd = (result: any) => {
    if (!result.destination || !featuredProperties) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // 배열 재정렬
    const reorderedProperties = Array.from(featuredProperties);
    const [movedProperty] = reorderedProperties.splice(sourceIndex, 1);
    reorderedProperties.splice(destinationIndex, 0, movedProperty);
    
    // 모든 매물의 displayOrder를 새로운 인덱스로 업데이트
    reorderedProperties.forEach((property, index) => {
      if (property.displayOrder !== index) {
        updatePropertyOrderMutation.mutate({
          propertyId: property.id,
          displayOrder: index
        });
      }
    });
  };

  // 일반 매물 드래그앤드롭 핸들러
  const handleAllPropertiesDragEnd = (result: any) => {
    if (!result.destination || !properties) return;
    
    // 필터가 활성화되어 있으면 드래그 차단
    if (filterType !== 'all' || filterDistrict !== 'all' || filterDealType !== 'all') {
      toast({
        title: "순서 변경 불가",
        description: "필터를 모두 '전체'로 설정한 후 순서를 변경해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // 배열 재정렬
    const reorderedProperties = Array.from(properties);
    const [movedProperty] = reorderedProperties.splice(sourceIndex, 1);
    reorderedProperties.splice(destinationIndex, 0, movedProperty);
    
    // Optimistic update: 즉시 캐시 업데이트
    queryClient.setQueryData(["/api/admin/properties", skipCache], reorderedProperties);
    
    // 모든 매물의 displayOrder를 새로운 인덱스로 업데이트
    reorderedProperties.forEach((property, index) => {
      if (property.displayOrder !== index) {
        updatePropertyOrderMutation.mutate({
          propertyId: property.id,
          displayOrder: index
        });
      }
    });
  };

  // 개별 삭제 핸들러 함수들
  const handleIndividualDelete = (id: number, type: 'property' | 'news' | 'user') => {
    setIndividualDeleteId(id);
    setIndividualDeleteType(type);
    setIsIndividualDeleteOpen(true);
  };

  const confirmIndividualDelete = () => {
    if (individualDeleteId && individualDeleteType) {
      switch (individualDeleteType) {
        case 'property':
          deletePropertyMutation.mutate(individualDeleteId);
          break;
        case 'news':
          deleteNewsMutation.mutate(individualDeleteId);
          break;
        case 'user':
          deleteUserMutation.mutate(individualDeleteId);
          break;
      }
    }
    setIsIndividualDeleteOpen(false);
    setIndividualDeleteId(null);
    setIndividualDeleteType(null);
  };
  
  // 일괄 삭제 뮤테이션
  const batchDeleteMutation = useMutation({
    mutationFn: async ({ type, ids }: { type: 'properties' | 'news' | 'users', ids: number[] }) => {
      const endpoint = `/api/admin/batch-delete/${type}`;
      const res = await apiRequest("POST", endpoint, { ids });
      return res;
    },
    onSuccess: () => {
      if (currentDeleteType === 'properties') {
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      } else if (currentDeleteType === 'news') {
        queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      } else if (currentDeleteType === 'users') {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
      
      // 선택 초기화
      if (currentDeleteType === 'properties') {
        setSelectedProperties([]);
      } else if (currentDeleteType === 'news') {
        setSelectedNews([]);
      } else if (currentDeleteType === 'users') {
        setSelectedUsers([]);
      }
      
      toast({
        title: "일괄 삭제 성공",
        description: "선택한 항목이 성공적으로 삭제되었습니다.",
      });
      
      // 모달 닫기
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      
      // 모달 닫기
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
  });
  
  // 뉴스 업데이트 뮤테이션
  const updateNewsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/news/update");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "뉴스 업데이트 성공",
        description: "뉴스가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
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
  
  // 전체 선택 핸들러
  const handleSelectAllProperties = (checked: boolean) => {
    if (checked && filteredProperties.length > 0) {
      setSelectedProperties(filteredProperties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };
  
  const handleSelectAllNews = (checked: boolean) => {
    if (checked && news) {
      setSelectedNews(news.map(n => n.id));
    } else {
      setSelectedNews([]);
    }
  };
  
  const handleSelectAllUsers = (checked: boolean) => {
    if (checked && users) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };
  
  // 삭제 확인 모달 열기
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
            description: "삭제할 부동산을 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteMutation.mutate({ type: 'properties', ids: selectedProperties });
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
        batchDeleteMutation.mutate({ type: 'news', ids: selectedNews });
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
        batchDeleteMutation.mutate({ type: 'users', ids: selectedUsers });
        break;
    }
  };
  
  // 페이지 렌더링 시 재로드
  useEffect(() => {
    if (skipCache) {
      refetchProperties();
      refetchNews();
      refetchUsers();
      setSkipCache(false);
    }
  }, [skipCache, refetchProperties, refetchNews, refetchUsers]);
  
  const handleRefreshClick = () => {
    setSkipCache(true);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
        <p className="text-gray-500">부동산, 뉴스, 사용자를 관리할 수 있습니다.</p>
      </div>
      
      <div className="mb-4 flex justify-end items-center gap-2">
        <InquiryNotifications />
        <Button variant="outline" onClick={handleRefreshClick}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>
      
      <Tabs defaultValue="properties">
        <TabsList className="mb-4">
          <TabsTrigger value="properties">부동산</TabsTrigger>
          <TabsTrigger value="featured">추천 매물 순서</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="users">사용자</TabsTrigger>
        </TabsList>

        {/* 부동산 탭 */}
        <TabsContent value="properties">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">부동산 관리</h2>
              <div className="flex space-x-2">
                {selectedProperties.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={() => openDeleteConfirm('properties')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    선택 삭제 ({selectedProperties.length})
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 mr-2"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  스프레드시트에서 가져오기
                </Button>
                <a 
                  href="/admin/properties/new"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 부동산 등록
                </a>
              </div>
            </div>
            
            {/* 필터 UI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">유형</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="모든 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 유형</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">지역</label>
                <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="모든 지역" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 지역</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.value} value={district.value}>
                        {district.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">거래 유형</label>
                <Select value={filterDealType} onValueChange={setFilterDealType}>
                  <SelectTrigger>
                    <SelectValue placeholder="모든 거래 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 거래 유형</SelectItem>
                    {dealTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoadingProperties ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* 필터가 활성화되어 있으면 드래그 앤 드롭 비활성화 */}
                {filterType === 'all' && filterDistrict === 'all' && filterDealType === 'all' ? (
                  <>
                    <DragDropContext onDragEnd={handleAllPropertiesDragEnd}>
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </TableHead>
                        <TableHead className="w-[40px]">
                          <Checkbox 
                            checked={filteredProperties && filteredProperties.length > 0 && selectedProperties.length === filteredProperties.length}
                            onCheckedChange={handleSelectAllProperties}
                          />
                        </TableHead>
                        <TableHead className="w-[80px]">번호</TableHead>
                        <TableHead className="min-w-[200px]">제목/이미지</TableHead>
                        <TableHead className="w-[120px]">유형</TableHead>
                        <TableHead className="min-w-[150px]">위치</TableHead>
                        <TableHead className="w-[120px]">가격</TableHead>
                        <TableHead className="w-[100px]">거래유형</TableHead>
                        <TableHead className="w-[100px]">노출상태</TableHead>
                        <TableHead className="w-[100px]">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Droppable droppableId="all-properties">
                      {(provided) => (
                        <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                          {!filteredProperties || filteredProperties.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-4">
                                {properties && properties.length > 0 
                                  ? "필터링 조건에 맞는 부동산이 없습니다." 
                                  : "등록된 부동산이 없습니다."}
                              </TableCell>
                            </TableRow>
                          ) : (
                            <>
                              {filteredProperties.map((property, index) => (
                                <Draggable key={property.id} draggableId={property.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <TableRow 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={snapshot.isDragging ? 'bg-gray-50' : ''}
                                    >
                                      <TableCell {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                                      </TableCell>
                                      <TableCell>
                                        <Checkbox 
                                          checked={selectedProperties.includes(property.id)}
                                          onCheckedChange={(checked) => 
                                            handleSelectProperty(property.id, checked === true)
                                          }
                                        />
                                      </TableCell>
                                      <TableCell>{property.id}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          {property.imageUrls && property.imageUrls.length > 0 ? (
                                            <div className="relative w-16 aspect-[16/9] overflow-hidden rounded">
                                              <img 
                                                src={property.imageUrls[0]} 
                                                alt={property.title} 
                                                className="h-full w-full object-cover"
                                              />
                                              {property.imageUrls.length > 1 && (
                                                <span className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-1">
                                                  +{property.imageUrls.length - 1}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="w-16 aspect-[16/9] bg-gray-200 rounded flex items-center justify-center">
                                              <span className="text-gray-400 text-xs">No Image</span>
                                            </div>
                                          )}
                                          <div>
                                            <div className="font-medium">{property.title}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                              {property.description}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>{property.type}</TableCell>
                                      <TableCell>
                                        <div className="truncate max-w-[150px]">{property.district} {property.address}</div>
                                      </TableCell>
                                      <TableCell>{property.price}</TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {Array.isArray(property.dealType) ? (
                                            property.dealType.map((type, idx) => (
                                              <span 
                                                key={idx} 
                                                className={`text-xs px-2 py-1 rounded ${
                                                  type === '매매' ? 'bg-blue-100 text-blue-800' : 
                                                  type === '전세' ? 'bg-green-100 text-green-800' : 
                                                  type === '월세' ? 'bg-orange-100 text-orange-800' : 
                                                  'bg-gray-100 text-gray-800'
                                                }`}
                                              >
                                                {type}
                                              </span>
                                            ))
                                          ) : (
                                            <span 
                                              className={`text-xs px-2 py-1 rounded ${
                                                property.dealType === '매매' ? 'bg-blue-100 text-blue-800' : 
                                                property.dealType === '전세' ? 'bg-green-100 text-green-800' : 
                                                property.dealType === '월세' ? 'bg-orange-100 text-orange-800' : 
                                                'bg-gray-100 text-gray-800'
                                              }`}
                                            >
                                              {property.dealType}
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          variant={property.isVisible ? "default" : "secondary"}
                                          onClick={() => 
                                            toggleVisibilityMutation.mutate({
                                              propertyId: property.id,
                                              isVisible: !property.isVisible
                                            })
                                          }
                                          disabled={toggleVisibilityMutation.isPending}
                                          className="text-xs"
                                        >
                                          {property.isVisible ? "노출" : "미노출"}
                                        </Button>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex space-x-1">
                                          <a 
                                            href={`/properties/${property.id}`} 
                                            className="p-2 text-gray-500 hover:text-primary"
                                            title="보기"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </a>
                                          <a 
                                            href={`/admin/properties/edit/${property.id}`} 
                                            className="p-2 text-gray-500 hover:text-primary"
                                            title="수정"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </a>
                                          <button 
                                            onClick={() => handleIndividualDelete(property.id, 'property')}
                                            className="p-2 text-gray-500 hover:text-red-500"
                                            title="삭제"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </>
                          )}
                        </TableBody>
                      )}
                    </Droppable>
                      </Table>
                    </DragDropContext>
                  </>
                ) : (
                  <div>
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
                      ⚠️ 필터가 적용된 상태에서는 순서 변경이 불가능합니다. 순서를 변경하려면 모든 필터를 "전체"로 설정해주세요.
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox 
                              checked={filteredProperties && filteredProperties.length > 0 && selectedProperties.length === filteredProperties.length}
                              onCheckedChange={handleSelectAllProperties}
                            />
                          </TableHead>
                          <TableHead className="w-[80px]">번호</TableHead>
                          <TableHead className="min-w-[200px]">제목/이미지</TableHead>
                          <TableHead className="w-[120px]">유형</TableHead>
                          <TableHead className="min-w-[150px]">위치</TableHead>
                          <TableHead className="w-[120px]">가격</TableHead>
                          <TableHead className="w-[100px]">거래유형</TableHead>
                          <TableHead className="w-[100px]">노출상태</TableHead>
                          <TableHead className="w-[100px]">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!filteredProperties || filteredProperties.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              {properties && properties.length > 0 
                                ? "필터링 조건에 맞는 부동산이 없습니다." 
                                : "등록된 부동산이 없습니다."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProperties.map((property) => (
                            <TableRow key={property.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedProperties.includes(property.id)}
                                  onCheckedChange={(checked) => 
                                    handleSelectProperty(property.id, checked === true)
                                  }
                                />
                              </TableCell>
                              <TableCell>{property.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {property.imageUrls && property.imageUrls.length > 0 ? (
                                    <div className="relative w-16 aspect-[16/9] overflow-hidden rounded">
                                      <img 
                                        src={property.imageUrls[0]} 
                                        alt={property.title} 
                                        className="h-full w-full object-cover"
                                      />
                                      {property.imageUrls.length > 1 && (
                                        <span className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-1">
                                          +{property.imageUrls.length - 1}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-16 aspect-[16/9] bg-gray-200 rounded flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">No Image</span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{property.title}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {property.description}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{property.type}</TableCell>
                              <TableCell>
                                <div className="truncate max-w-[150px]">{property.district} {property.address}</div>
                              </TableCell>
                              <TableCell>{property.price}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(property.dealType) ? (
                                    property.dealType.map((type, idx) => (
                                      <span 
                                        key={idx} 
                                        className={`text-xs px-2 py-1 rounded ${
                                          type === '매매' ? 'bg-blue-100 text-blue-800' : 
                                          type === '전세' ? 'bg-green-100 text-green-800' : 
                                          type === '월세' ? 'bg-orange-100 text-orange-800' : 
                                          'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {type}
                                      </span>
                                    ))
                                  ) : (
                                    <span 
                                      className={`text-xs px-2 py-1 rounded ${
                                        property.dealType === '매매' ? 'bg-blue-100 text-blue-800' : 
                                        property.dealType === '전세' ? 'bg-green-100 text-green-800' : 
                                        property.dealType === '월세' ? 'bg-orange-100 text-orange-800' : 
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {property.dealType}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={property.isVisible ? "default" : "secondary"}
                                  onClick={() => 
                                    toggleVisibilityMutation.mutate({
                                      propertyId: property.id,
                                      isVisible: !property.isVisible
                                    })
                                  }
                                  disabled={toggleVisibilityMutation.isPending}
                                  className="text-xs"
                                >
                                  {property.isVisible ? "노출" : "미노출"}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <a 
                                    href={`/properties/${property.id}`} 
                                    className="p-2 text-gray-500 hover:text-primary"
                                    title="보기"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </a>
                                  <a 
                                    href={`/admin/properties/edit/${property.id}`} 
                                    className="p-2 text-gray-500 hover:text-primary"
                                    title="수정"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </a>
                                  <button 
                                    onClick={() => handleIndividualDelete(property.id, 'property')}
                                    className="p-2 text-gray-500 hover:text-red-500"
                                    title="삭제"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 추천 매물 순서 관리 탭 */}
        <TabsContent value="featured">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">추천 매물 순서 관리</h2>
              <p className="text-sm text-gray-500">드래그하여 순서를 변경하세요</p>
            </div>
            
            {isLoadingFeatured ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !featuredProperties || featuredProperties.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">추천 매물이 없습니다.</p>
                <p className="text-sm text-gray-400">부동산 관리에서 매물을 추천으로 설정해주세요.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="featured-properties">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {featuredProperties.map((property, index) => (
                        <Draggable key={property.id} draggableId={property.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white border rounded-lg p-4 flex items-center space-x-4 transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-shrink-0 w-16 aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                                {property.images && property.images.length > 0 ? (
                                  <img 
                                    src={property.images[0]} 
                                    alt={property.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Eye className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-lg truncate mb-1">{property.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{property.propertyType}</span>
                                  <span>{property.district}</span>
                                  <span className="font-medium text-primary">
                                    {property.price.toLocaleString()}만원
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0 text-sm text-gray-500">
                                순서: {index + 1}
                              </div>
                              
                              <div className="flex-shrink-0">
                                <a 
                                  href={`/properties/${property.id}`} 
                                  className="p-2 text-gray-500 hover:text-primary"
                                  title="보기"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </TabsContent>

        {/* 뉴스 탭 */}
        <TabsContent value="news">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">뉴스 관리</h2>
              <div className="flex space-x-2">
                {selectedNews.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={() => openDeleteConfirm('news')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    선택 삭제 ({selectedNews.length})
                  </Button>
                )}
                <Button variant="outline" onClick={() => updateNewsMutation.mutate()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  뉴스 업데이트
                </Button>
              </div>
            </div>
            
            {isLoadingNews ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={news && news.length > 0 && selectedNews.length === news.length}
                          onCheckedChange={handleSelectAllNews}
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">번호</TableHead>
                      <TableHead className="min-w-[200px]">제목/이미지</TableHead>
                      <TableHead className="w-[120px]">출처</TableHead>
                      <TableHead className="w-[120px]">날짜</TableHead>
                      <TableHead className="w-[100px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!news || news.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          등록된 뉴스가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      news.map((newsItem) => (
                        <TableRow key={newsItem.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedNews.includes(newsItem.id)}
                              onCheckedChange={(checked) => 
                                handleSelectNews(newsItem.id, checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell>{newsItem.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {newsItem.imageUrl ? (
                                <div className="w-16 aspect-[16/9] overflow-hidden rounded">
                                  <img 
                                    src={newsItem.imageUrl} 
                                    alt={newsItem.title} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 aspect-[16/9] bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{newsItem.title}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {newsItem.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{newsItem.source}</TableCell>
                          <TableCell>
                            {newsItem.createdAt && new Date(newsItem.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <a 
                                href={`/news/${newsItem.id}`} 
                                className="p-2 text-gray-500 hover:text-primary"
                                title="보기"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <button 
                                onClick={() => handleIndividualDelete(newsItem.id, 'news')}
                                className="p-2 text-gray-500 hover:text-red-500"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 사용자 탭 */}
        <TabsContent value="users">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">사용자 관리</h2>
              {selectedUsers.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => openDeleteConfirm('users')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  선택 삭제 ({selectedUsers.length})
                </Button>
              )}
            </div>
            
            {isLoadingUsers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={users && users.length > 0 && selectedUsers.length === users.length}
                          onCheckedChange={handleSelectAllUsers}
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">번호</TableHead>
                      <TableHead className="min-w-[200px]">사용자명</TableHead>
                      <TableHead className="min-w-[150px]">전화번호</TableHead>
                      <TableHead className="min-w-[200px]">이메일</TableHead>
                      <TableHead className="w-[100px]">역할</TableHead>
                      <TableHead className="w-[100px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!users || users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          등록된 사용자가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => 
                                handleSelectUser(user.id, checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {user.id === 1 ? "010-4787-3120" : 
                             user.id === 3 ? "01047873120" : 
                             user.id === 4 ? "미제공" : 
                             user.phone || "전화번호 없음"}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span 
                              className={`text-xs px-2 py-1 rounded ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => handleIndividualDelete(user.id, 'user')}
                                className="p-2 text-gray-500 hover:text-red-500"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 개별 삭제 확인 대화 상자 */}
      <AlertDialog 
        open={isIndividualDeleteOpen} 
        onOpenChange={setIsIndividualDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {individualDeleteType === 'property' && '이 부동산을 삭제하시겠습니까?'}
              {individualDeleteType === 'news' && '이 뉴스를 삭제하시겠습니까?'}
              {individualDeleteType === 'user' && '이 사용자를 삭제하시겠습니까?'}
              <br />
              삭제된 데이터는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsIndividualDeleteOpen(false);
              setIndividualDeleteId(null);
              setIndividualDeleteType(null);
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmIndividualDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 일괄 삭제 확인 대화 상자 */}
      <AlertDialog 
        open={isDeleteAlertOpen} 
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDeleteType === 'properties' && `선택한 ${selectedProperties.length}개의 부동산을 삭제합니다.`}
              {currentDeleteType === 'news' && `선택한 ${selectedNews.length}개의 뉴스를 삭제합니다.`}
              {currentDeleteType === 'users' && `선택한 ${selectedUsers.length}개의 사용자를 삭제합니다.`}
              <br />
              이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 스프레드시트에서 데이터 가져오기 모달 */}
      <ImportFromSheetModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
}
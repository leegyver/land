import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Property, News, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw, Edit, Plus, Eye } from "lucide-react";
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
  
  // 필터링 상태 (지역 필터 제거)
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterDealType, setFilterDealType] = useState<string>("all");
  
  // 부동산 필터링 함수
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
      
      // 거래유형 필터
      if (filterDealType && filterDealType !== 'all' && property.dealType) {
        // 배열인 경우
        if (Array.isArray(property.dealType)) {
          return property.dealType.includes(filterDealType);
        } 
        // PostgreSQL 배열 형식의 문자열인 경우 ("{매매,월세}" 형태)
        else if (typeof property.dealType === 'string' && property.dealType.startsWith('{') && property.dealType.endsWith('}')) {
          const dealTypes = property.dealType.substring(1, property.dealType.length - 1).split(',');
          return dealTypes.includes(filterDealType);
        }
        // 일반 문자열인 경우 (매매 형태)
        else if (typeof property.dealType === 'string') {
          return property.dealType === filterDealType;
        }
        return false;
      }
      
      return true;
    });
  };
  
  // 선택된 항목 관리
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // 삭제 확인 대화 상자 상태
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentDeleteType, setCurrentDeleteType] = useState<'properties' | 'news' | 'users' | null>(null);
  
  // 데이터 로드를 위한 쿼리 매개변수
  const [skipCache, setSkipCache] = useState(false);
  
  // 필터 옵션 - DB에 있는 실제 필드값 적용
  const propertyTypes = [
    { value: "아파트", label: "아파트" },
    { value: "아파트연립다세대", label: "아파트연립다세대" },
    { value: "주택", label: "주택" },
    { value: "오피스텔", label: "오피스텔" },
    { value: "상가공장창고펜션", label: "상가공장창고펜션" },
  ];
  
  const dealTypes = [
    { value: "매매", label: "매매" },
    { value: "전세", label: "전세" },
    { value: "월세", label: "월세" },
    { value: "완료", label: "완료" },
    { value: "보류중", label: "보류중" },
  ];
  
  // 지역 필터 추가 (클라이언트 요청)
  const districts = [
    // 강화읍
    { value: "강화읍", label: "강화읍" },
    { value: "강화읍 갑곳리", label: "강화읍 갑곳리" },
    { value: "강화읍 국화리", label: "강화읍 국화리" },
    { value: "강화읍 남산리", label: "강화읍 남산리" },
    { value: "강화읍 내리", label: "강화읍 내리" },
    { value: "강화읍 망월리", label: "강화읍 망월리" },
    { value: "강화읍 방산리", label: "강화읍 방산리" },
    { value: "강화읍 북산리", label: "강화읍 북산리" },
    { value: "강화읍 신문리", label: "강화읍 신문리" },
    { value: "강화읍 옥림리", label: "강화읍 옥림리" },
    { value: "강화읍 용정리", label: "강화읍 용정리" },
    { value: "강화읍 월곶리", label: "강화읍 월곶리" },
    { value: "강화읍 관청리", label: "강화읍 관청리" },
    { value: "강화읍 대산리", label: "강화읍 대산리" },
    { value: "강화읍 석쇠리", label: "강화읍 석쇠리" },
    { value: "강화읍 합점리", label: "강화읍 합점리" },
    
    // 교동면
    { value: "교동면", label: "교동면" },
    { value: "교동면 대룡리", label: "교동면 대룡리" },
    { value: "교동면 상용리", label: "교동면 상용리" },
    { value: "교동면 고구리", label: "교동면 고구리" },
    { value: "교동면 난정리", label: "교동면 난정리" },
    { value: "교동면 삼선리", label: "교동면 삼선리" },
    { value: "교동면 무학리", label: "교동면 무학리" },
    { value: "교동면 인사리", label: "교동면 인사리" },
    
    // 삼산면
    { value: "삼산면", label: "삼산면" },
    { value: "삼산면 석모리", label: "삼산면 석모리" },
    { value: "삼산면 서검리", label: "삼산면 서검리" },
    { value: "삼산면 미법리", label: "삼산면 미법리" },
    { value: "삼산면 매음리", label: "삼산면 매음리" },
    { value: "삼산면 석포리", label: "삼산면 석포리" },
    
    // 서도면
    { value: "서도면", label: "서도면" },
    { value: "서도면 주문도리", label: "서도면 주문도리" },
    { value: "서도면 아차도리", label: "서도면 아차도리" },
    { value: "서도면 말도리", label: "서도면 말도리" },
    { value: "서도면 볼음도리", label: "서도면 볼음도리" },
    
    // 송해면
    { value: "송해면", label: "송해면" },
    { value: "송해면 당산리", label: "송해면 당산리" },
    { value: "송해면 상도리", label: "송해면 상도리" },
    { value: "송해면 하도리", label: "송해면 하도리" },
    { value: "송해면 솔정리", label: "송해면 솔정리" },
    { value: "송해면 신당리", label: "송해면 신당리" },
    
    // 양도면
    { value: "양도면", label: "양도면" },
    { value: "양도면 조산리", label: "양도면 조산리" },
    { value: "양도면 인산리", label: "양도면 인산리" },
    { value: "양도면 삼흥리", label: "양도면 삼흥리" },
    { value: "양도면 도장리", label: "양도면 도장리" },
    { value: "양도면 건평리", label: "양도면 건평리" },
    
    // 양사면
    { value: "양사면", label: "양사면" },
    { value: "양사면 덕하리", label: "양사면 덕하리" },
    { value: "양사면 북성리", label: "양사면 북성리" },
    { value: "양사면 철산리", label: "양사면 철산리" },
    { value: "양사면 인화리", label: "양사면 인화리" },
    { value: "양사면 감정리", label: "양사면 감정리" },
    
    // 하점면
    { value: "하점면", label: "하점면" },
    { value: "하점면 망원리", label: "하점면 망원리" },
    { value: "하점면 이강리", label: "하점면 이강리" },
    { value: "하점면 신봉리", label: "하점면 신봉리" },
    { value: "하점면 장정리", label: "하점면 장정리" },
    { value: "하점면 망월리", label: "하점면 망월리" },
    
    // 화도면
    { value: "화도면", label: "화도면" },
    { value: "화도면 사기리", label: "화도면 사기리" },
    { value: "화도면 장화리", label: "화도면 장화리" },
    { value: "화도면 흥왕리", label: "화도면 흥왕리" },
    { value: "화도면 내리", label: "화도면 내리" },
    { value: "화도면 덕포리", label: "화도면 덕포리" },
    
    // 내가면
    { value: "내가면", label: "내가면" },
    { value: "내가면 외포리", label: "내가면 외포리" },
    { value: "내가면 고천리", label: "내가면 고천리" },
    { value: "내가면 황청리", label: "내가면 황청리" },
    { value: "내가면 내리", label: "내가면 내리" },
    
    // 불은면
    { value: "불은면", label: "불은면" },
    { value: "불은면 두운리", label: "불은면 두운리" },
    { value: "불은면 오두리", label: "불은면 오두리" },
    { value: "불은면 삼성리", label: "불은면 삼성리" },
    { value: "불은면 덕성리", label: "불은면 덕성리" },
    
    // 선원면
    { value: "선원면", label: "선원면" },
    { value: "선원면 연리", label: "선원면 연리" },
    { value: "선원면 이룡리", label: "선원면 이룡리" },
    { value: "선원면 신정리", label: "선원면 신정리" },
    { value: "선원면 선원리", label: "선원면 선원리" },
    { value: "선원면 창리", label: "선원면 창리" },
    
    // 길상면
    { value: "길상면", label: "길상면" },
    { value: "길상면 길직리", label: "길상면 길직리" },
    { value: "길상면 장흥리", label: "길상면 장흥리" },
    { value: "길상면 온수리", label: "길상면 온수리" },
    { value: "길상면 선두리", label: "길상면 선두리" },
    
    // 기타
    { value: "강화읍 외 지역", label: "강화읍 외 지역" }
  ];
  
  // 기존 배열 (참고용)
  const oldPropertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  const oldDealTypes = ["매매", "전세", "월세", "단기임대", "완료", "보류중"];
  
  // 지역 관련 코드 제거 (클라이언트 요청)
  
  // 데이터 로드
  const { 
    data: properties,
    isLoading: isLoadingProperties,
  } = useQuery<Property[]>({
    queryKey: ["/api/properties", skipCache],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  const {
    data: news,
    isLoading: isLoadingNews,
  } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // 필터링된 부동산 목록
  const filteredProperties = filterProperties(properties || []);
  
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
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
        setSelectedProperties([]);
      } else if (currentDeleteType === 'news') {
        queryClient.invalidateQueries({ queryKey: ["/api/news"] });
        setSelectedNews([]);
      } else if (currentDeleteType === 'users') {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setSelectedUsers([]);
      }
      
      toast({
        title: "일괄 삭제 성공",
        description: "선택한 항목들이 성공적으로 삭제되었습니다.",
      });
      
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleteAlertOpen(false);
    },
  });
  
  // 부동산 삭제 핸들러
  const handleDeleteProperty = (id: number) => {
    if (window.confirm("정말로 이 부동산을 삭제하시겠습니까?")) {
      deletePropertyMutation.mutate(id);
    }
  };
  
  // 뉴스 삭제 핸들러
  const handleDeleteNews = (id: number) => {
    if (window.confirm("정말로 이 뉴스를 삭제하시겠습니까?")) {
      deleteNewsMutation.mutate(id);
    }
  };
  
  // 사용자 삭제 핸들러
  const handleDeleteUser = (id: number) => {
    if (window.confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      deleteUserMutation.mutate(id);
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
  
  // 데이터 새로고침
  const refreshData = () => {
    setSkipCache(prev => !prev);
    queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    
    toast({
      title: "데이터 새로고침",
      description: "최신 데이터를 불러오고 있습니다.",
    });
  };
  
  // 뉴스 수집 요청 함수
  const fetchNewsManually = async () => {
    try {
      await apiRequest("POST", "/api/admin/fetch-news");
      toast({
        title: "뉴스 수집 요청 성공",
        description: "새로운 뉴스를 수집 중입니다. 잠시 후 새로고침 해주세요.",
      });
      
      // 3초 후 자동 새로고침
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      }, 3000);
      
    } catch (error) {
      toast({
        title: "뉴스 수집 요청 실패",
        description: "뉴스 수집에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };
  
  // 현재 상태에 따른 제목 표시
  const getTitle = () => {
    if (!user) return "로딩 중...";
    return `관리자 대시보드 - ${user.username}님`;
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{getTitle()}</h1>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="properties">부동산</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="users">사용자</TabsTrigger>
          )}
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
                      <TableHead className="w-[100px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!filteredProperties || filteredProperties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
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
                                <div className="relative h-10 w-16 overflow-hidden rounded">
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
                              ) : property.imageUrl ? (
                                <div className="relative h-10 w-16 overflow-hidden rounded">
                                  <img 
                                    src={property.imageUrl} 
                                    alt={property.title} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-16 bg-gray-200 flex items-center justify-center rounded">
                                  <Edit className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <a 
                                  href={`/properties/${property.id}`}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {property.title}
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{property.type}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">{property.district}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('ko-KR', {
                              style: 'currency',
                              currency: 'KRW',
                              maximumFractionDigits: 0
                            }).format(Number(property.price))}
                          </TableCell>
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
                            <div className="flex space-x-2">
                              <a 
                                href={`/admin/properties/edit/${property.id}`}
                                className="inline-flex h-8 items-center justify-center rounded-md bg-blue-500 px-2 text-sm font-medium text-white shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <Edit className="h-4 w-4" />
                              </a>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteProperty(property.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                <Button 
                  variant="outline" 
                  onClick={fetchNewsManually}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  뉴스 수집
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
                      <TableHead>번호</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>출처</TableHead>
                      <TableHead>작성일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!news || news.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
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
                          <TableCell className="font-medium">
                            <a 
                              href={`/news/${newsItem.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {newsItem.title}
                            </a>
                          </TableCell>
                          <TableCell>{newsItem.source}</TableCell>
                          <TableCell>
                            {newsItem.createdAt 
                              ? new Date(newsItem.createdAt).toLocaleDateString() 
                              : '날짜 없음'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <a 
                                href={`/news/${newsItem.id}`}
                                className="inline-flex h-8 items-center justify-center rounded-md bg-blue-500 px-2 text-sm font-medium text-white shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteNews(newsItem.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        {/* 사용자 탭 (관리자만) */}
        {user?.role === "admin" && (
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
                        <TableHead>번호</TableHead>
                        <TableHead>사용자명</TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>권한</TableHead>
                        <TableHead>작업</TableHead>
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
                              {user.role !== 'admin' && (
                                <Checkbox 
                                  checked={selectedUsers.includes(user.id)}
                                  onCheckedChange={(checked) => 
                                    handleSelectUser(user.id, checked === true)
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell>{user.id}</TableCell>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === "admin" 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === "admin" ? "관리자" : "일반사용자"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {user.role !== 'admin' && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
        )}
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
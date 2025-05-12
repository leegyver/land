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
  
  // 선택된 항목 관리
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // 삭제 확인 대화 상자 상태
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentDeleteType, setCurrentDeleteType] = useState<'properties' | 'news' | 'users' | null>(null);
  
  // 데이터 로드를 위한 쿼리 매개변수
  const [skipCache, setSkipCache] = useState(false);
  
  // 필터링 상태 (초기값은 "all"로 모든 항목을 표시)
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterDealType, setFilterDealType] = useState<string>("all");
  
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
  
  // 지역 필터 - 실제 DB에 있는 매물 지역 기준으로 필터링
  const districts = [
    { value: "all", label: "모든 지역" },
    { value: "강남구", label: "강남구" },
    { value: "강화읍 갑곳리", label: "강화읍 갑곳리" },
    { value: "강화읍 관청리", label: "강화읍 관청리" },
    { value: "강화읍 국화리", label: "강화읍 국화리" },
    { value: "마포구", label: "마포구" },
    { value: "서초구", label: "서초구" },
    { value: "용산구", label: "용산구" },
    { value: "화도면 장화리", label: "화도면 장화리" }
  ];
  
  // 기존 배열 (참고용)
  const oldPropertyTypes = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  const oldDealTypes = ["매매", "전세", "월세", "단기임대", "완료", "보류중"];
  
  // 데이터 로드
  const { 
    data: properties,
    isLoading: isLoadingProperties,
    refetch: refetchProperties
  } = useQuery<Property[]>({
    queryKey: ["/api/properties", skipCache],
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
      
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={handleRefreshClick}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>
      
      <Tabs defaultValue="properties">
        <TabsList className="mb-4">
          <TabsTrigger value="properties">부동산</TabsTrigger>
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
                              ) : (
                                <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center">
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
                            <div className="flex space-x-1">
                              <a 
                                href={`/properties/${property.id}`} 
                                className="p-2 text-gray-500 hover:text-primary"
                                title="보기"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <a 
                                href={`/admin/properties/${property.id}/edit`} 
                                className="p-2 text-gray-500 hover:text-primary"
                                title="수정"
                              >
                                <Edit className="h-4 w-4" />
                              </a>
                              <button 
                                onClick={() => deletePropertyMutation.mutate(property.id)}
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
                                <div className="h-10 w-16 overflow-hidden rounded">
                                  <img 
                                    src={newsItem.imageUrl} 
                                    alt={newsItem.title} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center">
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
                                onClick={() => deleteNewsMutation.mutate(newsItem.id)}
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
                                onClick={() => deleteUserMutation.mutate(user.id)}
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
      
      {/* 삭제 확인 대화 상자 */}
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
    </div>
  );
}
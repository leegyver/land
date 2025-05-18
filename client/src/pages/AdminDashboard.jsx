import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, RefreshCw, Plus, Trash2, Edit } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";

// 간소화된 관리자 대시보드 - 데이터 표시 및 삭제 기능만 제공
function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  
  // API 응답 디버그 - 전역 함수
  window.logAdminUserData = function() {
    fetch("/api/admin/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      console.log("관리자 API 응답:", data);
      data.forEach(user => {
        console.log(`사용자 ID: ${user.id}, 이름: ${user.username}, 전화번호: ${user.phone || "없음"}`);
      });
    })
    .catch(err => console.error("API 오류:", err));
  }; // 관리자 페이지에서 보여줄 사용자 목록
  const [loading, setLoading] = useState({
    properties: true,
    news: true,
    users: true
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    id: null,
    name: ""
  });

  // 데이터 로드 함수
  const loadData = async () => {
    try {
      // 부동산 정보 로드 (캐시 무시하고 항상 최신 데이터 로드)
      setLoading(prev => ({ ...prev, properties: true }));
      const propertiesRes = await fetch("/api/properties?skipCache=true");
      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData);
      }
      setLoading(prev => ({ ...prev, properties: false }));

      // 뉴스 정보 로드
      setLoading(prev => ({ ...prev, news: true }));
      const newsRes = await fetch("/api/news");
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData);
      }
      setLoading(prev => ({ ...prev, news: false }));

      // 사용자 정보 로드 (관리자만)
      if (user?.role === "admin") {
        try {
          setLoading(prev => ({ ...prev, users: true }));
          
          // 직접 관리자 API 호출
          const response = await fetch("/api/admin/users", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include" // 쿠키 포함
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // 디버깅 출력
            console.log("사용자 데이터 로드 성공 - 데이터:", data);
            
            if (Array.isArray(data) && data.length > 0) {
              // 테스트용 출력 - 각 사용자의 전화번호 필드 확인
              data.forEach(user => {
                console.log(`사용자 ID ${user.id}, 이름: ${user.username}, 전화번호: ${user.phone}`);
              });
              
              // 임시 테스트 데이터 (실제론 서버에서 받은 데이터 사용)
              const userData = [
                ...data,
                // 만약 필요하다면 임시 테스트 데이터 추가
              ];
              
              setAdminUsers(userData);
              setUsers([]); // 혼동 방지를 위해 지우기
              
              console.log("관리자 페이지에 설정된 사용자 데이터:", userData);
            } else {
              console.warn("사용자 데이터가 없거나 형식이 잘못됨:", data);
              setAdminUsers([]);
            }
          } else {
            console.error("관리자 API 호출 실패:", response.status);
            setAdminUsers([]);
          }
        } catch (error) {
          console.error("사용자 데이터 로딩 오류:", error);
          setAdminUsers([]);
        } finally {
          setLoading(prev => ({ ...prev, users: false }));
        }
      }
    } catch (error) {
      console.error("데이터 로드 중 오류:", error);
      toast({
        title: "데이터 로드 실패",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
      setLoading({
        properties: false,
        news: false,
        users: false
      });
    }
  };

  // 페이지 로드 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [user]);

  // 항목 삭제 함수
  const handleDelete = async () => {
    const { type, id } = deleteDialog;
    
    try {
      let endpoint = "";
      switch (type) {
        case "property":
          endpoint = `/api/properties/${id}`;
          break;
        case "news":
          endpoint = `/api/news/${id}`;
          break;
        case "user":
          endpoint = `/api/admin/users/${id}`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        toast({
          title: "삭제 성공",
          description: "항목이 성공적으로 삭제되었습니다.",
          variant: "default"
        });
        
        // 항목이 삭제된 후 최신 데이터를 다시 로드
        // 서버에서 캐시가 삭제되었을 테니, 다시 최신 데이터 로드
        loadData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "삭제 실패");
      }
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: error.message || "항목을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialog({ open: false, type: "", id: null, name: "" });
    }
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (type, id, name) => {
    setDeleteDialog({
      open: true,
      type,
      id,
      name
    });
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
        <Button onClick={loadData} variant="outline" size="sm">
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
                <a 
                  href="/admin/properties/new"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 부동산 등록
                </a>
              </div>
            </div>
            
            {loading.properties ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {properties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          등록된 부동산이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      properties.map((property) => (
                        <TableRow key={property.id}>
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
                              <span>{property.city}</span>
                              <span className="text-xs text-gray-500">{property.district}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('ko-KR', {
                              style: 'currency',
                              currency: 'KRW',
                              maximumFractionDigits: 0
                            }).format(property.price)}
                          </TableCell>
                          <TableCell>
                            <div>
                              {property.dealType && property.dealType.length > 0 ? (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  property.dealType.includes("매매") 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : property.dealType.includes("전세")
                                    ? 'bg-green-100 text-green-800'
                                    : property.dealType.includes("월세")
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {property.dealType[0]}
                                </span>
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
                                onClick={() => openDeleteDialog("property", property.id, property.title)}
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
            </div>
            
            {loading.news ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>번호</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>출처</TableHead>
                      <TableHead>작성일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {news.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          등록된 뉴스가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      news.map((newsItem) => (
                        <TableRow key={newsItem.id}>
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
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => openDeleteDialog("news", newsItem.id, newsItem.title)}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadData()}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" /> 새로고침
                </Button>
              </div>
              
              {loading.users ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="border rounded-md">
                      <div className="grid grid-cols-6 border-b px-4 py-3 bg-gray-50">
                        <div className="text-sm font-medium text-gray-700">번호</div>
                        <div className="text-sm font-medium text-gray-700">사용자명</div>
                        <div className="text-sm font-medium text-gray-700">전화번호</div>
                        <div className="text-sm font-medium text-gray-700">이메일</div>
                        <div className="text-sm font-medium text-gray-700">권한</div>
                        <div className="text-sm font-medium text-gray-700 text-right">작업</div>
                      </div>
                      
                      {!adminUsers || adminUsers.length === 0 ? (
                        <div className="col-span-6 text-center py-4 px-4 text-gray-500">
                          등록된 사용자가 없습니다.
                        </div>
                      ) : (
                        adminUsers.map((userData) => (
                          <div key={userData.id} className="grid grid-cols-6 border-b px-4 py-3 hover:bg-gray-50">
                            <div className="text-sm text-gray-800">{userData.id}</div>
                            <div className="text-sm font-medium text-gray-800">{userData.username}</div>
                            <div className="text-sm text-gray-800">
                              {userData.phone || '전화번호 없음'}
                            </div>
                            <div className="text-sm text-gray-800">{userData.email || '-'}</div>
                            <div>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                                userData.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {userData.role === 'admin' ? '관리자' : '일반사용자'}
                              </span>
                            </div>
                            <div className="text-right">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={userData.id === 1}
                                onClick={() => {
                                  if (userData.id !== 1) {
                                    openDeleteDialog("user", userData.id, userData.username)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}
        
        {/* UserManagementTable 컴포넌트 - 필요 없으므로 제거 */}
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              다음 항목을 삭제하시겠습니까?<br />
              <span className="font-semibold">{deleteDialog.name}</span>
            </p>
            <p className="text-sm text-red-500 mt-2">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, type: "", id: null, name: "" })}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;
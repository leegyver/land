import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableCaption 
} from "@/components/ui/table";
import { Loader2, Home, Plus, Trash2, Edit, Check } from "lucide-react";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

// 타입 정의
type Property = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  type: string;
  price: string;
  city: string;
  district: string;
  address: string;
  size: string;
  bedrooms: number;
  bathrooms: number;
  featured: boolean;
  agentId: number;
  [key: string]: any;
};

type User = {
  id: number;
  username: string;
  email: string | null;
  role: string;
};

type News = {
  id: number;
  title: string;
  source: string;
  createdAt: string | null;
};

export default function AdminSimple() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [activeTab, setActiveTab] = useState("properties");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "properties" || activeTab === "") {
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        setProperties(data);
      } else if (activeTab === "users") {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        setUsers(data);
      } else if (activeTab === "news") {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to load news");
        const data = await res.json();
        setNews(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async (id: number, type: "property" | "user" | "news") => {
    try {
      setIsDeleting(id);
      
      let endpoint = "";
      switch (type) {
        case "property":
          endpoint = `/api/properties/${id}`;
          break;
        case "user":
          endpoint = `/api/admin/users/${id}`;
          break;
        case "news":
          endpoint = `/api/news/${id}`;
          break;
      }
      
      const res = await apiRequest("DELETE", endpoint);
      if (!res.ok) throw new Error(`Failed to delete ${type}`);
      
      // UI 업데이트
      if (type === "property") {
        setProperties(prev => prev.filter(item => item.id !== id));
      } else if (type === "user") {
        setUsers(prev => prev.filter(item => item.id !== id));
      } else if (type === "news") {
        setNews(prev => prev.filter(item => item.id !== id));
      }
      
      toast({
        title: `${type} 삭제 성공`,
        description: `${type === "property" ? "부동산" : type === "user" ? "사용자" : "뉴스"}가 삭제되었습니다.`,
      });
    } catch (err) {
      toast({
        title: `${type} 삭제 실패`,
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // 로딩 상태
  if (isLoading && properties.length === 0 && users.length === 0 && news.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl text-red-500 mb-4">Error: {error}</h2>
        <Button onClick={loadData}>다시 시도</Button>
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
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">부동산 목록</h2>
              <Button onClick={() => window.location.href = "/admin"}>
                <Plus className="h-4 w-4 mr-2" />
                부동산 등록
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>총 {properties.length}개의 부동산 매물</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>특징</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{property.title}</TableCell>
                      <TableCell>{property.type}</TableCell>
                      <TableCell>{property.district}</TableCell>
                      <TableCell>{parseInt(property.price).toLocaleString()}원</TableCell>
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
                            onClick={() => window.location.href = "/admin"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (confirm("정말로 이 부동산을 삭제하시겠습니까?")) {
                                handleDelete(property.id, "property");
                              }
                            }}
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
            </div>
          </div>
        </TabsContent>

        {/* 뉴스 관리 탭 */}
        <TabsContent value="news">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">뉴스 목록</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>총 {news.length}개의 뉴스</TableCaption>
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
                  {news.map((item) => (
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
                              handleDelete(item.id, "news");
                            }
                          }}
                          disabled={isDeleting === item.id}
                        >
                          {isDeleting === item.id ? (
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
            </div>
          </div>
        </TabsContent>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">사용자 목록</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>총 {users.length}명의 사용자</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>사용자명</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
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
                            if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
                              handleDelete(user.id, "user");
                            }
                          }}
                          disabled={isDeleting === user.id || user.role === "admin"}
                        >
                          {isDeleting === user.id ? (
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
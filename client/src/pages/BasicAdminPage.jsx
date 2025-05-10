import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Home, Plus, Trash2 } from "lucide-react";

// 순수 함수형 컴포넌트, 최소한의 로직만 사용
export default function BasicAdminPage() {
  const { user } = useAuth();
  const [properties, setProperties] = React.useState([]);
  const [news, setNews] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("properties");

  // 1회만 데이터 로드
  React.useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        
        // 모든 데이터를 로드
        const propertiesRes = await fetch("/api/properties");
        const newsRes = await fetch("/api/news");
        const usersRes = await fetch("/api/admin/users");
        
        if (propertiesRes.ok) {
          const data = await propertiesRes.json();
          setProperties(data);
        }
        
        if (newsRes.ok) {
          const data = await newsRes.json();
          setNews(data);
        }
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("데이터 로딩 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, []);
  
  // 삭제 함수 - 확인 다이얼로그 없이 바로 삭제
  const handleDelete = async (id, type) => {
    try {
      let endpoint = "";
      let stateUpdater = null;
      
      if (type === "property") {
        endpoint = `/api/properties/${id}`;
        stateUpdater = setProperties;
      } else if (type === "news") {
        endpoint = `/api/news/${id}`;
        stateUpdater = setNews;
      } else if (type === "user") {
        endpoint = `/api/admin/users/${id}`;
        stateUpdater = setUsers;
      }
      
      const response = await fetch(endpoint, {
        method: "DELETE"
      });
      
      if (response.ok) {
        // 클라이언트 측 상태만 업데이트하고 서버에 추가 요청 안함
        stateUpdater(prevItems => prevItems.filter(item => item.id !== id));
        alert(`${type} 삭제 성공`);
      } else {
        alert(`${type} 삭제 실패: ${response.statusText}`);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  
  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">관리자 페이지</h1>
        <div className="flex justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">관리자 페이지 (기본 버전)</h1>
        <div className="text-sm">
          <span className="font-bold">{user?.username}</span>
          {user?.role && <span className="ml-1 text-gray-500">({user.role})</span>}
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="mb-4">
          <p className="text-gray-500 mb-4">
            이 페이지는 기본 기능만 제공합니다. 모든 API 요청은 한 번만 수행되며, 
            최소한의 React 기능만 사용합니다.
          </p>
          <div className="flex space-x-4">
            <Button
              variant={activeTab === "properties" ? "default" : "outline"}
              onClick={() => setActiveTab("properties")}
            >
              부동산 ({properties.length})
            </Button>
            <Button
              variant={activeTab === "news" ? "default" : "outline"}
              onClick={() => setActiveTab("news")}
            >
              뉴스 ({news.length})
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
              disabled={user?.role !== "admin"}
            >
              사용자 ({users.length})
            </Button>
          </div>
        </div>
        
        {activeTab === "properties" && (
          <div>
            <h2 className="text-xl font-bold mb-4">부동산 목록</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">제목</th>
                    <th className="py-2 px-4 border-b text-left">유형</th>
                    <th className="py-2 px-4 border-b text-left">지역</th>
                    <th className="py-2 px-4 border-b text-left">가격</th>
                    <th className="py-2 px-4 border-b text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">등록된 부동산이 없습니다</td>
                    </tr>
                  ) : (
                    properties.map(property => (
                      <tr key={property.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{property.id}</td>
                        <td className="py-2 px-4 max-w-[200px] truncate">{property.title}</td>
                        <td className="py-2 px-4">{property.type}</td>
                        <td className="py-2 px-4">{property.district}</td>
                        <td className="py-2 px-4">{Number(property.price).toLocaleString()}원</td>
                        <td className="py-2 px-4 text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(property.id, "property")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === "news" && (
          <div>
            <h2 className="text-xl font-bold mb-4">뉴스 목록</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">제목</th>
                    <th className="py-2 px-4 border-b text-left">출처</th>
                    <th className="py-2 px-4 border-b text-left">날짜</th>
                    <th className="py-2 px-4 border-b text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {news.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-500">등록된 뉴스가 없습니다</td>
                    </tr>
                  ) : (
                    news.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{item.id}</td>
                        <td className="py-2 px-4 max-w-[300px] truncate">{item.title}</td>
                        <td className="py-2 px-4">{item.source || "네이버 뉴스"}</td>
                        <td className="py-2 px-4">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(item.id, "news")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === "users" && (
          <div>
            <h2 className="text-xl font-bold mb-4">사용자 목록</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">사용자명</th>
                    <th className="py-2 px-4 border-b text-left">이메일</th>
                    <th className="py-2 px-4 border-b text-left">권한</th>
                    <th className="py-2 px-4 border-b text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-500">등록된 사용자가 없습니다</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{user.id}</td>
                        <td className="py-2 px-4">{user.username}</td>
                        <td className="py-2 px-4">{user.email}</td>
                        <td className="py-2 px-4">{user.role}</td>
                        <td className="py-2 px-4 text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={user.role === "admin"}
                            onClick={() => user.role !== "admin" && handleDelete(user.id, "user")}
                          >
                            {user.role === "admin" ? "보호됨" : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
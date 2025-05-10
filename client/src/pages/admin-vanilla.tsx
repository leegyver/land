import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// 바닐라 JS 사용 관리자 페이지
export default function AdminVanilla() {
  const { user } = useAuth();
  const { toast } = useToast();

  // 컴포넌트가 마운트될 때 관리자 API 호출 및 UI 구축
  const handleLogout = () => {
    window.location.href = '/';
  };

  // 바닐라 JS로 DOM 조작을 처리하는 함수
  const deleteItem = async (id: number, type: string) => {
    // 확인 없이 바로 삭제 (confirm 사용시 DOM 관련 오류 발생)
    try {
      const endpoint = type === 'property' 
        ? `/api/properties/${id}` 
        : type === 'news' 
          ? `/api/news/${id}` 
          : `/api/admin/users/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }
      
      // 삭제 성공 후 행 수동 제거
      const row = document.getElementById(`${type}-${id}`);
      if (row) {
        row.style.opacity = '0.5';
        setTimeout(() => {
          if (row.parentNode) {
            row.parentNode.removeChild(row);
          }
        }, 300);
      }
      
      toast({
        title: "삭제 성공",
        description: `${type === 'property' ? '부동산' : type === 'news' ? '뉴스' : '사용자'}가 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">관리자 패널 (바닐라 버전)</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm">
            <span className="font-semibold">{user?.username}</span> 
            <span className="text-gray-500 ml-1">({user?.role})</span>
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout}>로그아웃</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          관리자 기능 (제한된 버전)
        </h2>
        <p className="text-gray-500 mb-6">
          이 페이지는 최소한의 DOM 조작으로만 작동합니다. 수정 기능을 이용하려면 기존 관리자 페이지를 이용해주세요.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={() => window.location.href = "/admin-old"} className="w-full">
            모든 기능 사용하기
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = "/properties"} 
            className="w-full"
          >
            부동산 목록 보기
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"} 
            className="w-full"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 부동산 데이터 테이블 */}
        <LoadTable 
          title="부동산 관리"
          endpoint="/api/properties"
          type="property"
          columns={["ID", "제목", "유형", "지역", "가격", "관리"]}
          renderRow={(item) => (
            <tr id={`property-${item.id}`} key={item.id} className="border-b transition-opacity hover:bg-gray-50">
              <td className="px-4 py-3">{item.id}</td>
              <td className="px-4 py-3 max-w-[200px] truncate">{item.title}</td>
              <td className="px-4 py-3">{item.type}</td>
              <td className="px-4 py-3">{item.district}</td>
              <td className="px-4 py-3">{Number(item.price).toLocaleString()}원</td>
              <td className="px-4 py-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteItem(item.id, 'property')}
                >
                  삭제
                </Button>
              </td>
            </tr>
          )}
          deleteItem={deleteItem}
        />

        {/* 뉴스 데이터 테이블 */}
        <LoadTable 
          title="뉴스 관리"
          endpoint="/api/news"
          type="news"
          columns={["ID", "제목", "출처", "날짜", "관리"]}
          renderRow={(item) => (
            <tr id={`news-${item.id}`} key={item.id} className="border-b transition-opacity hover:bg-gray-50">
              <td className="px-4 py-3">{item.id}</td>
              <td className="px-4 py-3 max-w-[350px] truncate">{item.title}</td>
              <td className="px-4 py-3">{item.source || "네이버 뉴스"}</td>
              <td className="px-4 py-3">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
              <td className="px-4 py-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteItem(item.id, 'news')}
                >
                  삭제
                </Button>
              </td>
            </tr>
          )}
          deleteItem={deleteItem}
        />

        {/* 사용자 데이터 테이블 */}
        {user?.role === 'admin' && (
          <LoadTable 
            title="사용자 관리"
            endpoint="/api/admin/users"
            type="user"
            columns={["ID", "사용자명", "이메일", "권한", "관리"]}
            renderRow={(item) => (
              <tr id={`user-${item.id}`} key={item.id} className="border-b transition-opacity hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3">{item.username}</td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.role}</td>
                <td className="px-4 py-3">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={item.role === 'admin'}
                    onClick={() => item.role !== 'admin' && deleteItem(item.id, 'user')}
                  >
                    {item.role === 'admin' ? '보호됨' : '삭제'}
                  </Button>
                </td>
              </tr>
            )}
            deleteItem={deleteItem}
          />
        )}
      </div>
    </div>
  );
}

// 데이터 로드 및 표시 컴포넌트
function LoadTable({ 
  title, 
  endpoint, 
  type, 
  columns, 
  renderRow,
  deleteItem 
}: { 
  title: string; 
  endpoint: string; 
  type: string;
  columns: string[];
  renderRow: (item: any) => React.ReactNode;
  deleteItem: (id: number, type: string) => void;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type}`);
        }
        const responseData = await response.json();
        setData(responseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        toast({
          title: "데이터 로드 실패",
          description: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [endpoint, type, toast]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="p-8 text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-gray-500 text-sm">총 {data.length}개 항목</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium text-gray-600">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function UserManagementTable({ onDeleteClick }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 사용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include" // 쿠키 포함
      });

      if (!response.ok) {
        throw new Error("관리자 권한이 필요합니다");
      }

      const data = await response.json();
      console.log("API에서 가져온 사용자 데이터:", data);
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("사용자 데이터 로딩 실패:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className="py-8 text-center">사용자 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">오류: {error}</div>;
  }

  if (users.length === 0) {
    return <div className="py-8 text-center">등록된 사용자가 없습니다.</div>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">번호</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">사용자명</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">전화번호</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">이메일</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">권한</th>
            <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-4 px-4 text-sm text-gray-800">{user.id}</td>
              <td className="py-4 px-4 text-sm font-medium text-gray-800">
                {user.username}
              </td>
              <td className="py-4 px-4 text-sm text-gray-800">
                {user.phone || '전화번호 없음'}
              </td>
              <td className="py-4 px-4 text-sm text-gray-800">
                {user.email || '-'}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.role === 'admin' ? '관리자' : '일반사용자'}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={user.id === 1}
                  onClick={() => onDeleteClick && onDeleteClick(user.id, user.username)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function UserDebugInfo() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 데이터 로드
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }
      
      const data = await response.json();
      setUserData(data);
      console.log("로드된 사용자 데이터:", data);
    } catch (err) {
      setError(err.message || "데이터 로드 중 오류가 발생했습니다.");
      console.error("데이터 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mt-4">
      <h2 className="text-lg font-semibold mb-2">사용자 데이터 디버그</h2>
      
      <div className="mb-4">
        <Button 
          onClick={fetchUserData} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-1"
        >
          {loading ? "로딩 중..." : "사용자 데이터 가져오기"}
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {userData && (
        <div>
          <h3 className="font-medium mb-2">사용자 데이터 ({userData.length}명)</h3>
          <div className="grid gap-4">
            {userData.map(user => (
              <div key={user.id} className="p-3 border rounded-md bg-white">
                <h4 className="font-semibold mb-1">ID: {user.id} | {user.username}</h4>
                <p className="text-sm text-gray-600 mb-1">이메일: {user.email || "-"}</p>
                <p className="text-sm text-gray-600 mb-1">전화번호: {user.phone || "전화번호 없음"}</p>
                <p className="text-sm text-gray-600">역할: {user.role}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <details>
                    <summary>모든 필드 보기</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto text-xs">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
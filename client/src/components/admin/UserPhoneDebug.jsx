import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function UserPhoneDebug() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/users", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('사용자 API 응답 데이터:', data);
      setUserData(data);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-4">사용자 데이터 디버깅</h2>
      
      <Button 
        onClick={fetchUserData}
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? "로딩 중..." : "사용자 데이터 가져오기"}
      </Button>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">
          오류: {error}
        </div>
      )}
      
      {userData && (
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">사용자 데이터 ({userData.length}명)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-left">ID</th>
                  <th className="p-2 border text-left">필드 이름</th>
                  <th className="p-2 border text-left">값</th>
                </tr>
              </thead>
              <tbody>
                {userData.map((user, userIndex) => (
                  Object.entries(user).map(([key, value], i) => (
                    <tr key={`${userIndex}-${key}`} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      {i === 0 ? (
                        <td className="p-2 border" rowSpan={Object.keys(user).length}>
                          {user.id}
                        </td>
                      ) : null}
                      <td className="p-2 border font-medium">{key}</td>
                      <td className="p-2 border">{value?.toString() || '-'}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
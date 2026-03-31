import { Loader2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export const AdminTabWrapper = ({ 
  isLoading, 
  isError, 
  error, 
  isEmpty, 
  emptyMessage, 
  onRetry, 
  children 
}: {
  isLoading: boolean;
  isError: boolean;
  error: any;
  isEmpty: boolean;
  emptyMessage: string;
  onRetry: () => void;
  children: React.ReactNode;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
        <p className="text-sm font-medium text-gray-400 animate-pulse">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError) {
    const is401 = error?.message?.includes("401") || error?.status === 401;
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-8 my-6 text-center max-w-2xl mx-auto shadow-sm">
        <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-red-900 font-bold text-lg mb-2">
          {is401 ? "인증 세션이 만료되었습니다" : "오류가 발생했습니다"}
        </h3>
        <p className="text-red-700/80 mb-6 leading-relaxed">
          {is401 ? "보안을 위해 다시 로그인해 주세요." : (error?.message || "데이터를 가져오는 중 예상치 못한 오류가 발생했습니다.")}
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => window.location.reload()}>시스템 재시작</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onRetry}>다시 로드</Button>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-24 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-gray-100">
          <Plus className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
        <p className="text-gray-400 text-xs mt-1">새로운 항목을 등록하여 리스트를 채워주세요.</p>
      </div>
    );
  }

  return <div id="admin-tab-content" className="animate-in fade-in slide-in-from-bottom-2 duration-500">{children}</div>;
};

export function useAdminQuery<T>(queryKey: any[], options: { enabled?: boolean } = {}) {
  return useQuery<T[]>({
    queryKey,
    queryFn: getQueryFn({ on401: "throw" }),
    select: (data: any) => {
      if (Array.isArray(data)) return data as T[];
      if (data && typeof data === 'object' && Array.isArray(data.properties)) {
        return data.properties as T[];
      }
      return [] as T[];
    },
    ...options
  });
}

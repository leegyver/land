import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  customUrl?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, customUrl }) =>
  async ({ queryKey }) => {
    // customUrl이 제공되면 그것을 사용, 아니면 queryKey
    let url = customUrl || (queryKey[0] as string);
    
    // 두 번째 queryKey가 파라미터 객체인 경우 URL 쿼리 파라미터로 변환
    if (queryKey.length > 1 && typeof queryKey[1] === 'object') {
      const params = new URLSearchParams();
      Object.entries(queryKey[1] as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      url = queryString ? `${url}?${queryString}` : url;
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30초 — 너무 길면 페이지 이동 시 빈 화면 원인
      retry: (failureCount, error: any) => {
        // 401(인증), 403(권한), 404(없음) 에러는 다시 시도해도 실패할 가능성이 높으므로 즉시 중단
        if (error?.message?.includes("401") || error?.message?.includes("403") || error?.message?.includes("404")) {
          return false;
        }
        // 그 외 에러(네트워크, 500 등)는 최대 1회만 재시도
        return failureCount < 1;
      },
      gcTime: 10 * 60 * 1000, // 10분 동안 비활성 캐시 유지
      refetchOnMount: true, // 페이지 이동 시 마운트될 때 반드시 데이터 재요청
    },
    mutations: {
      retry: false,
    },
  },
});

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
    const url = customUrl || (queryKey[0] as string);
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
      retry: false,
      cacheTime: 10 * 60 * 1000, // 10분 동안 비활성 캐시 유지
      // 성능 향상을 위한 옵션
      keepPreviousData: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: false,
    },
  },
});

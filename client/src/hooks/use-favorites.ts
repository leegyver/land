import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useFavoriteIds() {
  const { user } = useAuth();

  return useQuery<number[]>({
    queryKey: ["/api/favorites/ids"],
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

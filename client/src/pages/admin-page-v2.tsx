import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatKoreanPrice, safeFormatDate } from "@/lib/formatter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Property, News, User, Banner, NewsletterSubscription, Post, Notification } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw, Eye, Sparkles, ShieldCheck, CheckCircle, MessageSquare, Bell, FileSpreadsheet } from "lucide-react";
import { DragDropContext } from "react-beautiful-dnd";
import { ImportFromSheetModal } from "@/components/admin/ImportFromSheetModal";
import CrawlerManager from "@/components/admin/CrawlerManager";
import { BannerColumn } from "@/components/admin/BannerColumn";
import { SmartPagination } from "@/components/admin/SmartPagination";
import { PropertyTab } from "@/components/admin/tabs/PropertyTab";
import { NewsTab } from "@/components/admin/tabs/NewsTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { CommunityTab } from "@/components/admin/tabs/CommunityTab";
import { NewsletterTab } from "@/components/admin/tabs/NewsletterTab";
import { NotificationTab } from "@/components/admin/tabs/NotificationTab";
import { DraggablePropertyTab } from "@/components/admin/tabs/DraggablePropertyTab";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect logic in useEffect
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "admin" && user.role !== "realtor"))) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 선택된 항목 관리
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedNewsletterSubscriptions, setSelectedNewsletterSubscriptions] = useState<number[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

  // 삭제 확인 대화 상자 상태
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentDeleteType, setCurrentDeleteType] = useState<'properties' | 'news' | 'users' | 'newsletter' | 'posts' | null>(null);

  // 개별 삭제 확인 대화 상자 상태
  const [isIndividualDeleteOpen, setIsIndividualDeleteOpen] = useState(false);
  const [individualDeleteId, setIndividualDeleteId] = useState<number | null>(null);
  const [individualDeleteType, setIndividualDeleteType] = useState<'property' | 'news' | 'user' | 'post' | null>(null);

  // 데이터 로드를 위한 쿼리 매개변수
  const [skipCache, setSkipCache] = useState(false);

  // 필터링 상태 (초기값은 "all"로 모든 항목을 표시)
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterDealType, setFilterDealType] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [adminPropertiesPage, setAdminPropertiesPage] = useState(1); // 관리자 매물 페이징 상태 추가
  const [adminNewsPage, setAdminNewsPage] = useState(1);
  const [adminUsersPage, setAdminUsersPage] = useState(1);
  const [adminNewsletterPage, setAdminNewsletterPage] = useState(1);
  const [adminPostsPage, setAdminPostsPage] = useState(1);
  const [excludeInternal, setExcludeInternal] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 공인중개사 승급 모달 상태
  const [isRealtorModalOpen, setIsRealtorModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [realtorInfo, setRealtorInfo] = useState({
    businessName: "",
    realtorName: "",
    realtorPhone: "",
    realtorPhoto: "",
    realtorAddress: "",
    realtorLicenseNo: ""
  });

  // 탭 상태 저장을 위한 로직 (새로고침 해도 유지되도록)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("adminActiveTab");
    if (user?.role === "realtor") return "properties"; // Force for realtor
    return saved || "properties";
  });

  useEffect(() => {
    if (user && user.role === "realtor" && activeTab !== "properties") {
      setActiveTab("properties");
    }
  }, [user, activeTab]);

  const handleTabChange = (value: string) => {
    if (user?.role === "realtor" && value !== "properties") return;
    setActiveTab(value);
    localStorage.setItem("adminActiveTab", value);
  };

  // 필터 옵션 - 부동산 등록 폼과 동일하게 설정
  const propertyTypes = [
    { value: "토지", label: "토지" },
    { value: "단독", label: "단독" },
    { value: "근린", label: "근린" },
    { value: "아파트", label: "아파트" },
    { value: "다세대", label: "다세대" },
    { value: "연립", label: "연립" },
    { value: "원투룸", label: "원투룸" },
    { value: "다가구", label: "다가구" },
    { value: "오피스텔", label: "오피스텔" },
    { value: "기타", label: "기타" },
  ];

  const dealTypes = [
    { value: "매매", label: "매매" },
    { value: "전세", label: "전세" },
    { value: "월세", label: "월세" },
    { value: "완료", label: "완료" },
    { value: "보류중", label: "보류중" },
  ];

  // 지역 필터 - 제공된 정확한 위치 목록 사용
  const districts = [
    { value: "강화읍 갑곳리", label: "강화읍 갑곳리" },
    { value: "강화읍 관청리", label: "강화읍 관청리" },
    { value: "강화읍 국화리", label: "강화읍 국화리" },
    { value: "강화읍 남산리", label: "강화읍 남산리" },
    { value: "강화읍 대산리", label: "강화읍 대산리" },
    { value: "강화읍 신문리", label: "강화읍 신문리" },
    { value: "강화읍 옥림리", label: "강화읍 옥림리" },
    { value: "강화읍 용정리", label: "강화읍 용정리" },
    { value: "강화읍 월곳리", label: "강화읍 월곳리" },
    { value: "교동면 고구리", label: "교동면 고구리" },
    { value: "교동면 난정리", label: "교동면 난정리" },
    { value: "교동면 대룡리", label: "교동면 대룡리" },
    { value: "교동면 동산리", label: "교동면 동산리" },
    { value: "교동면 무학리", label: "교동면 무학리" },
    { value: "교동면 봉소리", label: "교동면 봉소리" },
    { value: "교동면 삼선리", label: "교동면 삼선리" },
    { value: "교동면 상용리", label: "교동면 상용리" },
    { value: "교동면 서한리", label: "교동면 서한리" },
    { value: "교동면 양갑리", label: "교동면 양갑리" },
    { value: "교동면 읍내리", label: "교동면 읍내리" },
    { value: "교동면 인사리", label: "교동면 인사리" },
    { value: "교동면 지석리", label: "교동면 지석리" },
    { value: "길상면 길직리", label: "길상면 길직리" },
    { value: "길상면 동검리", label: "길상면 동검리" },
    { value: "길상면 선두리", label: "길상면 선두리" },
    { value: "길상면 온수리", label: "길상면 온수리" },
    { value: "길상면 장흥리", label: "길상면 장흥리" },
    { value: "길상면 초지리", label: "길상면 초지리" },
    { value: "내가면 고천리", label: "내가면 고천리" },
    { value: "내가면 구하리", label: "내가면 구하리" },
    { value: "내가면 오상리", label: "내가면 오상리" },
    { value: "내가면 외포리", label: "내가면 외포리" },
    { value: "내가면 황청리", label: "내가면 황청리" },
    { value: "불은면 고능리", label: "불은면 고능리" },
    { value: "불은면 넙성리", label: "불은면 넙성리" },
    { value: "불은면 덕성리", label: "불은면 덕성리" },
    { value: "불은면 두운리", label: "불은면 두운리" },
    { value: "불은면 삼동암리", label: "불은면 삼동암리" },
    { value: "불은면 삼성리", label: "불은면 삼성리" },
    { value: "불은면 신현리", label: "불은면 신현리" },
    { value: "불은면 오두리", label: "불은면 오두리" },
    { value: "삼산면 매음리", label: "삼산면 매음리" },
    { value: "삼산면 미법리", label: "삼산면 미법리" },
    { value: "삼산면 상리", label: "삼산면 상리" },
    { value: "삼산면 서검리", label: "삼산면 서검리" },
    { value: "삼산면 석모리", label: "삼산면 석모리" },
    { value: "삼산면 석포리", label: "삼산면 석포리" },
    { value: "삼산면 하리", label: "삼산면 하리" },
    { value: "서도면 말도리", label: "서도면 말도리" },
    { value: "서도면 볼음도리", label: "서도면 볼음도리" },
    { value: "서도면 아차도리", label: "서도면 아차도리" },
    { value: "서도면 주문도리", label: "서도면 주문도리" },
    { value: "선원면 금월리", label: "선원면 금월리" },
    { value: "선원면 냉정리", label: "선원면 냉정리" },
    { value: "선원면 선행리", label: "선원면 선행리" },
    { value: "선원면 신정리", label: "선원면 신정리" },
    { value: "선원면 연리", label: "선원면 연리" },
    { value: "선원면 지산리", label: "선원면 지산리" },
    { value: "선원면 창리", label: "선원면 창리" },
    { value: "송해면 당산리", label: "송해면 당산리" },
    { value: "송해면 상도리", label: "송해면 상도리" },
    { value: "송해면 솔정리", label: "송해면 솔정리" },
    { value: "송해면 숭뢰리", label: "송해면 숭뢰리" },
    { value: "송해면 신당리", label: "송해면 신당리" },
    { value: "송해면 양오리", label: "송해면 양오리" },
    { value: "송해면 하도리", label: "송해면 하도리" },
    { value: "양도면 건평리", label: "양도면 건평리" },
    { value: "양도면 길정리", label: "양도면 길정리" },
    { value: "양도면 능내리", label: "양도면 능내리" },
    { value: "양도면 도장리", label: "양도면 도장리" },
    { value: "양도면 삼흥리", label: "양도면 삼흥리" },
    { value: "양도면 인산리", label: "양도면 인산리" },
    { value: "양도면 조산리", label: "양도면 조산리" },
    { value: "양도면 하일리", label: "양도면 하일리" },
    { value: "양사면 교산리", label: "양사면 교산리" },
    { value: "양사면 덕하리", label: "양사면 덕하리" },
    { value: "양사면 북성리", label: "양사면 북성리" },
    { value: "양사면 인화리", label: "양사면 인화리" },
    { value: "양사면 철산리", label: "양사면 철산리" },
    { value: "하점면 망월리", label: "하점면 망월리" },
    { value: "하점면 부근리", label: "하점면 부근리" },
    { value: "하점면 삼거리", label: "하점면 삼거리" },
    { value: "하점면 신봉리", label: "하점면 신봉리" },
    { value: "하점면 신삼리", label: "하점면 신삼리" },
    { value: "하점면 이강리", label: "하점면 이강리" },
    { value: "하점면 장정리", label: "하점면 장정리" },
    { value: "하점면 창후리", label: "하점면 창후리" },
    { value: "화도면 내리", label: "화도면 내리" },
    { value: "화도면 덕포리", label: "화도면 덕포리" },
    { value: "화도면 동막리", label: "화도면 동막리" },
    { value: "화도면 문산리", label: "화도면 문산리" },
    { value: "화도면 사기리", label: "화도면 사기리" },
    { value: "화도면 상방리", label: "화도면 상방리" },
    { value: "화도면 여차리", label: "화도면 여차리" },
    { value: "화도면 장화리", label: "화도면 장화리" },
    { value: "화도면 흥왕리", label: "화도면 흥왕리" },
    { value: "기타지역", label: "기타지역" }
  ];

  // 최신 부동산 유형 및 거래 유형 배열
  const propertyTypeArray = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  const dealTypeArray = ["매매", "전세", "월세", "단기임대", "완료", "보류중"];

  // 데이터 로드 - 관리자용 모든 매물 조회 (페이징 적용)
  const {
    data: adminSearchResponse,
    isLoading: isLoadingProperties,
    refetch: refetchProperties
  } = useQuery<{ properties: Property[], total: number, totalPages: number, currentPage: number }>({
    queryKey: ["/api/admin/properties", adminPropertiesPage, filterType, filterDistrict, filterDealType, filterAgent, skipCache],
    queryFn: async () => {
      const url = `/api/admin/properties?page=${adminPropertiesPage}&limit=20&type=${filterType}&district=${filterDistrict}&dealType=${filterDealType}&agent=${filterAgent}${skipCache ? '&skipCache=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admin properties");
      return res.json();
    }
  });

  const properties = adminSearchResponse?.properties || [];
  const totalProperties = adminSearchResponse?.total || 0;
  const totalPropertyPages = adminSearchResponse?.totalPages || 1;

  const {
    data: news,
    isLoading: isLoadingNews,
    refetch: refetchNews
  } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // 필터링된 부동산 목록 (백엔드에서 이미 처리됨)
  const filteredProperties = properties;

  // 담당중개사 목록 추출 (현재 페이지 기준)
  const agentNames = Array.from(new Set(properties?.map(p => p.agentName).filter(Boolean) || []));

  const {
    data: users,
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 추천 매물 데이터 조회
  const {
    data: featuredProperties,
    isLoading: isLoadingFeatured,
    refetch: refetchFeatured
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 뉴스레터 구독자 데이터 조회
  const {
    data: newsletterSubscriptions,
    isLoading: isLoadingNewsletter,
    refetch: refetchNewsletter
  } = useQuery<NewsletterSubscription[]>({
    queryKey: ["/api/admin/newsletter/subscriptions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 급매물 데이터 조회
  const {
    data: urgentProperties,
    isLoading: isLoadingUrgent,
    refetch: refetchUrgent
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/urgent"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 흥정 매물 데이터 조회
  const {
    data: negotiableProperties,
    isLoading: isLoadingNegotiable,
    refetch: refetchNegotiable
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/negotiable"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 장기투자 매물 데이터 조회
  const {
    data: longTermProperties,
    isLoading: isLoadingLongTerm,
    refetch: refetchLongTerm
  } = useQuery<Property[]>({
    queryKey: ["/api/properties/long-term"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  // 데이터 로드 시 선택 초기화
  useEffect(() => {
    setSelectedProperties([]);
  }, [properties]);

  useEffect(() => {
    setSelectedNews([]);
  }, [news]);

  useEffect(() => {
    setSelectedUsers([]);
  }, [users]);

  useEffect(() => {
    setSelectedNewsletterSubscriptions([]);
  }, [newsletterSubscriptions]);

  // 커뮤니티 게시글 데이터 조회
  const {
    data: posts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin"
  });

  const adminPostsPageItems = posts ? posts.slice((adminPostsPage - 1) * ITEMS_PER_PAGE, adminPostsPage * ITEMS_PER_PAGE) : [];
  const totalPostPages = Math.ceil((posts?.length || 0) / ITEMS_PER_PAGE);

  useEffect(() => {
    setSelectedPosts([]);
  }, [posts]);

  // 알림 데이터 조회
  const {
    data: notificationData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications
  } = useQuery<{ notifications: Notification[], unreadCount: number }>({
    queryKey: ["/api/admin/notifications"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user?.role === "admin",
    refetchInterval: 30000 // 30초마다 갱신
  });

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  // 알림 읽음 처리 뮤테이션
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    }
  });

  // 모든 알림 읽음 처리 뮤테이션
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "모든 알림 읽음 처리", description: "모든 알림이 읽음 상태로 변경되었습니다." });
    }
  });

  // 알림 삭제 뮤테이션
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "알림 삭제", description: "알림이 삭제되었습니다." });
    }
  });

  // 단일 커뮤니티 게시글 삭제 뮤테이션
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/posts/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "게시글 삭제 성공",
        description: "게시글이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "게시글 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 단일 부동산 삭제 뮤테이션
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 삭제 성공",
        description: "부동산이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 단일 뉴스 삭제 뮤테이션
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/news/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "뉴스 삭제 성공",
        description: "뉴스가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 단일 사용자 삭제 뮤테이션
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "사용자 삭제 성공",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "사용자 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 추천 매물 순서 변경 뮤테이션
  const updatePropertyOrderMutation = useMutation({
    mutationFn: async ({ propertyId, displayOrder }: { propertyId: number; displayOrder: number }) => {
      const res = await apiRequest("PUT", `/api/properties/${propertyId}/order`, { displayOrder });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "순서 변경 성공",
        description: "매물 순서가 변경되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "순서 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 뉴스레터 구독 삭제 뮤테이션
  const deleteNewsletterSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/newsletter/subscriptions/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/subscriptions"] });
      toast({
        title: "구독 정보 삭제 성공",
        description: "구독 정보가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "구독 정보 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 매물 노출 상태 토글 뮤테이션
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ propertyId, isVisible }: { propertyId: number; isVisible: boolean }) => {
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/visibility`, { isVisible });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
      toast({
        title: "노출 상태 변경 성공",
        description: "매물 노출 상태가 변경되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "노출 상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 매물 추천 상태 토글 뮤테이션
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ propertyId, featured }: { propertyId: number; featured: boolean }) => {
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/featured`, { featured });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
      toast({
        title: "추천 상태 변경 성공",
        description: "매물 추천 상태가 변경되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "추천 상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 급매물 토글 뮤테이션
  const toggleUrgentMutation = useMutation({
    mutationFn: async ({ propertyId, isUrgent }: { propertyId: number; isUrgent: boolean }) => {
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/urgent`, { isUrgent });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/urgent"] });
      toast({ title: "급매물 상태 변경 성공", description: "상태가 변경되었습니다." });
    },
  });

  // 흥정 매물 토글 뮤테이션
  const toggleNegotiableMutation = useMutation({
    mutationFn: async ({ propertyId, isNegotiable }: { propertyId: number; isNegotiable: boolean }) => {
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/negotiable`, { isNegotiable });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/negotiable"] });
      toast({ title: "흥정 매물 상태 변경 성공", description: "상태가 변경되었습니다." });
    },
  });

  // 장기투자 매물 토글 뮤테이션
  const toggleLongTermMutation = useMutation({
    mutationFn: async ({ propertyId, isLongTerm }: { propertyId: number; isLongTerm: boolean }) => {
      const res = await apiRequest("PATCH", `/api/properties/${propertyId}/long-term`, { isLongTerm });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/long-term"] });
      toast({ title: "장기투자 상태 변경 성공", description: "상태가 변경되었습니다." });
    },
  });

  // 사용자 역할 변경 뮤테이션
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role, realtorInfo }: { userId: number; role: string; realtorInfo?: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role, realtorInfo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsRealtorModalOpen(false);
      setTargetUser(null);
      toast({
        title: "사용자 권한 변경 성공",
        description: "사용자의 역할이 성공적으로 변경되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "권한 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 급매물 순서 변경 뮤테이션
  const updateUrgentOrderMutation = useMutation({
    mutationFn: async ({ propertyId, urgentOrder }: { propertyId: number; urgentOrder: number }) => {
      const res = await apiRequest("PUT", `/api/properties/${propertyId}/urgent-order`, { urgentOrder });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/urgent"] });
    },
  });

  // 흥정 매물 순서 변경 뮤테이션
  const updateNegotiableOrderMutation = useMutation({
    mutationFn: async ({ propertyId, negotiableOrder }: { propertyId: number; negotiableOrder: number }) => {
      const res = await apiRequest("PUT", `/api/properties/${propertyId}/negotiable-order`, { negotiableOrder });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/negotiable"] });
    },
  });

  // 장기투자 매물 순서 변경 뮤테이션
  const updateLongTermOrderMutation = useMutation({
    mutationFn: async ({ propertyId, longTermOrder }: { propertyId: number; longTermOrder: number }) => {
      const res = await apiRequest("PUT", `/api/properties/${propertyId}/long-term-order`, { longTermOrder });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/long-term"] });
    },
  });

  // 추천 매물 드래그앤드롭 핸들러
  const handleDragEnd = (result: any) => {
    if (!result.destination || !featuredProperties) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // 배열 재정렬
    const reorderedProperties = Array.from(featuredProperties);
    const [movedProperty] = reorderedProperties.splice(sourceIndex, 1);
    reorderedProperties.splice(destinationIndex, 0, movedProperty);

    // 모든 매물의 displayOrder를 새로운 인덱스로 업데이트
    reorderedProperties.forEach((property, index) => {
      if (property.displayOrder !== index) {
        updatePropertyOrderMutation.mutate({
          propertyId: property.id,
          displayOrder: index
        });
      }
    });
  };

  // 일반 매물 드래그앤드롭 핸들러
  const handleAllPropertiesDragEnd = (result: any) => {
    if (!result.destination || !properties) return;

    // 필터가 활성화되어 있으면 드래그 차단
    if (filterType !== 'all' || filterDistrict !== 'all' || filterDealType !== 'all' || filterAgent !== 'all') {
      toast({
        title: "순서 변경 불가",
        description: "필터를 모두 '전체'로 설정한 후 순서를 변경해주세요.",
        variant: "destructive",
      });
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // 배열 재정렬
    const reorderedProperties = Array.from(properties);
    const [movedProperty] = reorderedProperties.splice(sourceIndex, 1);
    reorderedProperties.splice(destinationIndex, 0, movedProperty);

    // Optimistic update: 즉시 캐시 업데이트 (객체 구조로 변경)
    if (adminSearchResponse) {
      queryClient.setQueryData(["/api/admin/properties", adminPropertiesPage, skipCache], {
        ...adminSearchResponse,
        properties: reorderedProperties
      });
    }

    // 모든 매물의 displayOrder를 새로운 인덱스로 업데이트
    reorderedProperties.forEach((property, index) => {
      if (property.displayOrder !== index) {
        updatePropertyOrderMutation.mutate({
          propertyId: property.id,
          displayOrder: index
        });
      }
    });
  };

  const handleUrgentDragEnd = (result: any) => {
    if (!result.destination || !urgentProperties) return;
    const items = Array.from(urgentProperties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      updateUrgentOrderMutation.mutate({ propertyId: item.id, urgentOrder: index });
    });

    // Optimistic UI update could be added here
    queryClient.setQueryData(["/api/properties/urgent"], items);
  };

  const handleLongTermDragEnd = (result: any) => {
    if (!result.destination || !longTermProperties) return;
    const items = Array.from(longTermProperties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      updateLongTermOrderMutation.mutate({ propertyId: item.id, longTermOrder: index });
    });

    // Optimistic UI update could be added here
    queryClient.setQueryData(["/api/properties/long-term"], items);
  };

  const handleNegotiableDragEnd = (result: any) => {
    if (!result.destination || !negotiableProperties) return;
    const items = Array.from(negotiableProperties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      updateNegotiableOrderMutation.mutate({ propertyId: item.id, negotiableOrder: index });
    });

    queryClient.setQueryData(["/api/properties/negotiable"], items);
  };

  // 개별 삭제 핸들러 함수들
  const handleIndividualDelete = (id: number, type: 'property' | 'news' | 'user' | 'post') => {
    setIndividualDeleteId(id);
    setIndividualDeleteType(type);
    setIsIndividualDeleteOpen(true);
  };

  const confirmIndividualDelete = () => {
    if (individualDeleteId && individualDeleteType) {
      switch (individualDeleteType) {
        case 'property':
          deletePropertyMutation.mutate(individualDeleteId);
          break;
        case 'news':
          deleteNewsMutation.mutate(individualDeleteId);
          break;
        case 'user':
          deleteUserMutation.mutate(individualDeleteId);
          break;
        case 'post':
          deletePostMutation.mutate(individualDeleteId);
          break;
        case 'newsletter' as any:
          deleteNewsletterSubscriptionMutation.mutate(individualDeleteId);
          break;
      }
    }
    setIsIndividualDeleteOpen(false);
    setIndividualDeleteId(null);
    setIndividualDeleteType(null);
  };

  // 일괄 삭제 뮤테이션
  const batchDeleteMutation = useMutation({
    mutationFn: async ({ type, ids }: { type: 'properties' | 'news' | 'users' | 'posts', ids: number[] }) => {
      console.log(`일괄 삭제 요청: type=${type}, ids=`, ids);
      if (type === 'posts') {
        await Promise.all(ids.map(id => apiRequest("DELETE", `/api/posts/${id}`)));
        return { success: true };
      }
      const endpoint = `/api/admin/batch-delete/${type}`;
      const res = await apiRequest("POST", endpoint, { ids });
      return res;
    },
    onSuccess: () => {
      if (currentDeleteType === 'properties') {
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      } else if (currentDeleteType === 'news') {
        queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      } else if (currentDeleteType === 'users') {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      } else if (currentDeleteType === 'posts') {
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      }

      // 선택 초기화
      if (currentDeleteType === 'properties') {
        setSelectedProperties([]);
      } else if (currentDeleteType === 'news') {
        setSelectedNews([]);
      } else if (currentDeleteType === 'users') {
        setSelectedUsers([]);
      } else if (currentDeleteType === 'posts') {
        setSelectedPosts([]);
      }

      toast({
        title: "일괄 삭제 성공",
        description: "선택한 항목이 성공적으로 삭제되었습니다.",
      });

      // 모달 닫기
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "일괄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });

      // 모달 닫기
      setIsDeleteAlertOpen(false);
      setCurrentDeleteType(null);
    },
  });

  // 뉴스 업데이트 뮤테이션
  const updateNewsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/news/update");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "뉴스 업데이트 성공",
        description: "뉴스가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 다중 선택 핸들러
  const handleSelectProperty = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, id]);
    } else {
      setSelectedProperties(selectedProperties.filter(propId => propId !== id));
    }
  };

  const handleSelectNews = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNews([...selectedNews, id]);
    } else {
      setSelectedNews(selectedNews.filter(newsId => newsId !== id));
    }
  };

  const handleSelectUser = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, id]);
    } else {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    }
  };

  const handleSelectPost = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, id]);
    } else {
      setSelectedPosts(selectedPosts.filter(postId => postId !== id));
    }
  };

  const getRowClass = (index: number) => {
    return index % 2 === 0 ? "bg-white" : "bg-slate-50";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signup': return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case 'post': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'property_inquiry': return <PhoneCall className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // 전체 선택 핸들러
  const handleSelectAllProperties = (checked: boolean) => {
    if (checked && filteredProperties.length > 0) {
      setSelectedProperties(filteredProperties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectAllNews = (checked: boolean) => {
    if (checked && news) {
      setSelectedNews(news.map(n => n.id));
    } else {
      setSelectedNews([]);
    }
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked && users) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectAllPosts = (checked: boolean) => {
    if (checked && adminPostsPageItems) {
      const currentPageIds = adminPostsPageItems.map(p => p.id);
      const newSelections = Array.from(new Set([...selectedPosts, ...currentPageIds]));
      setSelectedPosts(newSelections);
    } else if (adminPostsPageItems) {
      const currentPageIds = adminPostsPageItems.map(p => p.id);
      setSelectedPosts(selectedPosts.filter(id => !currentPageIds.includes(id)));
    }
  };

  // 삭제 확인 모달 열기
  const openDeleteConfirm = (type: 'properties' | 'news' | 'users' | 'newsletter' | 'posts') => {
    setCurrentDeleteType(type);
    setIsDeleteAlertOpen(true);
  };

  // 일괄 삭제 실행
  const handleBatchDelete = () => {
    if (!currentDeleteType) return;

    console.log(`handleBatchDelete 호출: currentDeleteType=${currentDeleteType}`);
    console.log(`selectedProperties:`, selectedProperties);

    switch (currentDeleteType) {
      case 'properties':
        if (selectedProperties.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 부동산을 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        console.log(`삭제할 부동산 IDs: ${selectedProperties.join(', ')}`);
        batchDeleteMutation.mutate({ type: 'properties', ids: [...selectedProperties] });
        break;

      case 'news':
        if (selectedNews.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 뉴스를 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteMutation.mutate({ type: 'news', ids: selectedNews });
        break;

      case 'users':
        if (selectedUsers.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 사용자를 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteMutation.mutate({ type: 'users', ids: selectedUsers });
        break;

      case 'posts':
        if (selectedPosts.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 게시글을 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteMutation.mutate({ type: 'posts', ids: selectedPosts });
        break;

      case 'newsletter':
        if (selectedNewsletterSubscriptions.length === 0) {
          toast({
            title: "선택된 항목 없음",
            description: "삭제할 구독 정보를 선택해주세요.",
            variant: "destructive",
          });
          return;
        }
        batchDeleteMutation.mutate({ type: 'newsletter' as any, ids: selectedNewsletterSubscriptions });
        break;
    }
  };

  // 페이지 렌더링 시 재로드
  useEffect(() => {
    if (skipCache) {
      refetchProperties();
      refetchNews();
      refetchUsers();
      // Newsletter refetch will be handled by its own query
      setSkipCache(false);
    }
  }, [skipCache, refetchProperties, refetchNews, refetchUsers]);

  const handleRefreshClick = () => {
    setSkipCache(true);
  };

  // Early return removed to keep hooks alive (V15 Radical Simplification)

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">관리자 페이지</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            홈으로
          </Button>
        </div>
      </div>

      <div className="mb-4 flex justify-end items-center gap-2">
        <Button variant="outline" onClick={handleRefreshClick}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <TabsList className={`flex w-max md:grid md:w-full ${user?.role === 'admin' ? 'md:grid-cols-5' : 'md:grid-cols-1'} bg-gray-100 p-1 h-auto min-w-full border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-8`}>
            <TabsTrigger
              value="properties"
              className={`whitespace-nowrap px-4 py-3 font-bold text-lg ${activeTab === 'properties' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'} transition-all`}
            >
              매물 관리 (등록/수정)
            </TabsTrigger>
            {user?.role === 'admin' && (
              <>
                <TabsTrigger value="urgent" className="whitespace-nowrap px-4">급매물</TabsTrigger>
                <TabsTrigger value="negotiable" className="whitespace-nowrap px-4">흥정매물</TabsTrigger>
                <TabsTrigger value="long-term" className="whitespace-nowrap px-4">장기투자</TabsTrigger>
                <TabsTrigger value="featured" className="whitespace-nowrap px-4">추천매물</TabsTrigger>
                <TabsTrigger value="banners" className="whitespace-nowrap px-4">배너관리</TabsTrigger>
                <TabsTrigger value="news" className="whitespace-nowrap px-4">뉴스관리</TabsTrigger>
                <TabsTrigger value="community" className="whitespace-nowrap px-4">커뮤니티관리</TabsTrigger>
                <TabsTrigger value="users" className="whitespace-nowrap px-4">사용자관리</TabsTrigger>
                <TabsTrigger value="newsletter" className="whitespace-nowrap px-4">뉴스레터</TabsTrigger>
                <TabsTrigger value="crawler" className="whitespace-nowrap px-4">네이버수집</TabsTrigger>
                <TabsTrigger value="notifications" className="relative whitespace-nowrap px-4">
                  알림
                  {unreadCount > 0 && (
                    <span className="ml-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* 부동산 탭 */}
        <TabsContent value="properties">
          <PropertyTab
            user={user}
            selectedProperties={selectedProperties}
            setSelectedProperties={setSelectedProperties}
            isLoadingProperties={isLoadingProperties}
            filteredProperties={filteredProperties}
            filterType={filterType}
            setFilterType={setFilterType}
            filterDistrict={filterDistrict}
            setFilterDistrict={setFilterDistrict}
            filterDealType={filterDealType}
            setFilterDealType={setFilterDealType}
            filterAgent={filterAgent}
            setFilterAgent={setFilterAgent}
            propertyTypes={propertyTypes}
            districts={districts}
            dealTypes={dealTypes}
            agentNames={agentNames as string[]}
            handleAllPropertiesDragEnd={handleAllPropertiesDragEnd}
            handleSelectAllProperties={handleSelectAllProperties}
            handleSelectProperty={handleSelectProperty}
            toggleUrgentMutation={toggleUrgentMutation}
            toggleNegotiableMutation={toggleNegotiableMutation}
            toggleLongTermMutation={toggleLongTermMutation}
            toggleFeaturedMutation={toggleFeaturedMutation}
            toggleVisibilityMutation={toggleVisibilityMutation}
            handleIndividualDelete={handleIndividualDelete}
            openDeleteConfirm={openDeleteConfirm}
            setIsImportModalOpen={setIsImportModalOpen}
            adminPropertiesPage={adminPropertiesPage}
            setAdminPropertiesPage={setAdminPropertiesPage}
            totalPropertyPages={totalPropertyPages}
            SmartPagination={SmartPagination}
          />
        </TabsContent>

        {user?.role === 'admin' ? (
          <>
            <TabsContent value="urgent">
              <DraggablePropertyTab
                title="급매물 순서 관리"
                description="지정된 급매물 리스트입니다. (드래그로 위치 조정 가능)"
                isLoading={isLoadingUrgent}
                properties={urgentProperties || []}
                handleDragEnd={handleUrgentDragEnd}
                onExclude={(p) => toggleUrgentMutation.mutate({ propertyId: p.id, isUrgent: false })}
                excludeConfirmMessage="이 매물을 급매물 목록에서 제외하시겠습니까?"
                droppableId="urgent-list"
              />
            </TabsContent>

            <TabsContent value="negotiable">
              <DraggablePropertyTab
                title="흥정 매물 관리"
                description="지정된 흥정 매물 리스트입니다. (드래그로 위치 조정 가능)"
                isLoading={isLoadingNegotiable}
                properties={negotiableProperties || []}
                handleDragEnd={handleNegotiableDragEnd}
                onExclude={(p) => toggleNegotiableMutation.mutate({ propertyId: p.id, isNegotiable: false })}
                excludeConfirmMessage="이 매물을 흥정 매물 목록에서 제외하시겠습니까?"
                droppableId="negotiable-list"
              />
            </TabsContent>

            <TabsContent value="long-term">
              <DraggablePropertyTab
                title="장기투자 매물 관리"
                description="지정된 장기투자 매물 리스트입니다. (드래그로 위치 조정 가능)"
                isLoading={isLoadingLongTerm}
                properties={longTermProperties || []}
                handleDragEnd={handleLongTermDragEnd}
                onExclude={(p) => toggleLongTermMutation.mutate({ propertyId: p.id, isLongTerm: false })}
                excludeConfirmMessage="이 매물을 장기투자 목록에서 제외하시겠습니까?"
                droppableId="long-term-list"
              />
            </TabsContent>

            <TabsContent value="featured">
              <DraggablePropertyTab
                title="추천 매물 관리"
                description="지정된 추천 매물 리스트입니다. (드래그로 위치 조정 가능)"
                isLoading={isLoadingFeatured}
                properties={featuredProperties || []}
                handleDragEnd={handleDragEnd}
                onExclude={(p) => toggleFeaturedMutation.mutate({ propertyId: p.id, featured: false })}
                excludeConfirmMessage="이 매물을 추천 목록에서 제외하시겠습니까?"
                droppableId="featured-properties"
              />
            </TabsContent>

            <TabsContent value="banners">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">메인 배너 관리</h2>
                  <p className="text-gray-500 text-sm">
                    메인 페이지 지도 상단에 표시되는 배너를 관리합니다. (권장 사이즈: 1000x500, 2:1 비율)
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <BannerColumn location="left" title="왼쪽 슬라이더" />
                  <BannerColumn location="right" title="오른쪽 슬라이더" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="news">
              <NewsTab
                news={news}
                isLoadingNews={isLoadingNews}
                selectedNews={selectedNews}
                setSelectedNews={setSelectedNews}
                handleSelectAllNews={handleSelectAllNews}
                handleSelectNews={handleSelectNews}
                openDeleteConfirm={openDeleteConfirm}
                updateNewsMutation={updateNewsMutation}
                handleIndividualDelete={handleIndividualDelete}
                adminNewsPage={adminNewsPage}
                setAdminNewsPage={setAdminNewsPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
              />
            </TabsContent>

            <TabsContent value="users">
              <UsersTab
                users={users}
                isLoadingUsers={isLoadingUsers}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                handleSelectAllUsers={handleSelectAllUsers}
                handleSelectUser={handleSelectUser}
                openDeleteConfirm={openDeleteConfirm}
                handleIndividualDelete={handleIndividualDelete}
                adminUsersPage={adminUsersPage}
                setAdminUsersPage={setAdminUsersPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                setIsRealtorModalOpen={setIsRealtorModalOpen}
                setTargetUser={setTargetUser}
                setRealtorInfo={setRealtorInfo}
              />
            </TabsContent>

            <TabsContent value="community">
              <CommunityTab
                isLoadingPosts={isLoadingPosts}
                selectedPosts={selectedPosts}
                setSelectedPosts={setSelectedPosts}
                handleSelectAllPosts={handleSelectAllPosts}
                handleSelectPost={handleSelectPost}
                openDeleteConfirm={openDeleteConfirm}
                adminPostsPageItems={adminPostsPageItems}
                safeFormatDate={safeFormatDate}
                handleIndividualDelete={handleIndividualDelete}
                totalPostPages={totalPostPages}
                adminPostsPage={adminPostsPage}
                setAdminPostsPage={setAdminPostsPage}
              />
            </TabsContent>

            <TabsContent value="newsletter">
              <NewsletterTab
                isLoadingNewsletter={isLoadingNewsletter}
                newsletterSubscriptions={newsletterSubscriptions}
                selectedNewsletterSubscriptions={selectedNewsletterSubscriptions}
                setSelectedNewsletterSubscriptions={setSelectedNewsletterSubscriptions}
                openDeleteConfirm={openDeleteConfirm}
                adminNewsletterPage={adminNewsletterPage}
                setAdminNewsletterPage={setAdminNewsletterPage}
                ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                safeFormatDate={safeFormatDate}
                setIndividualDeleteId={setIndividualDeleteId}
                setIndividualDeleteType={setIndividualDeleteType}
                setIsIndividualDeleteOpen={setIsIndividualDeleteOpen}
              />
            </TabsContent>

            <TabsContent value="crawler">
              <CrawlerManager />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationTab
                notifications={notifications}
                unreadCount={unreadCount}
                isLoadingNotifications={isLoadingNotifications}
                refetchNotifications={refetchNotifications}
                markAllAsReadMutation={markAllAsReadMutation}
                markAsReadMutation={markAsReadMutation}
                deleteNotificationMutation={deleteNotificationMutation}
                safeFormatDate={safeFormatDate}
              />
            </TabsContent>
          </>
        ) : null}
      </Tabs>

      {/* 개별 삭제 확인 대화 상자 */}
      <AlertDialog
        open={isIndividualDeleteOpen}
        onOpenChange={setIsIndividualDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {individualDeleteType === 'property' && '이 부동산을 삭제하시겠습니까?'}
              {individualDeleteType === 'news' && '이 뉴스를 삭제하시겠습니까?'}
              {individualDeleteType === 'user' && '이 사용자를 삭제하시겠습니까?'}
              {individualDeleteType === 'newsletter' as any && '이 구독 정보를 삭제하시겠습니까?'}
              <br />
              삭제된 데이터는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsIndividualDeleteOpen(false);
              setIndividualDeleteId(null);
              setIndividualDeleteType(null);
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmIndividualDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 일괄 삭제 확인 대화 상자 */}
      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {currentDeleteType === 'properties' && `선택한 ${selectedProperties.length}개의 부동산을 삭제합니다.`}
              {currentDeleteType === 'news' && `선택한 ${selectedNews.length}개의 뉴스를 삭제합니다.`}
              {currentDeleteType === 'users' && `선택한 ${selectedUsers.length}개의 사용자를 삭제합니다.`}
              {currentDeleteType === 'newsletter' && `선택한 ${selectedNewsletterSubscriptions.length}개의 구독 정보를 삭제합니다.`}
              <br />
              이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportFromSheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* 공인중개사 승인/수정 모달 */}
      <Dialog open={isRealtorModalOpen} onOpenChange={setIsRealtorModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <DialogHeader className="bg-slate-900 -mx-6 -mt-6 p-6 mb-2">
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              공인중개사 권한 설정
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {targetUser?.username}님을 공인중개사로 승인하고 비즈니스 정보를 입력합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName" className="font-bold text-slate-700">부동산 상호명</Label>
              <Input
                id="businessName"
                placeholder="예: 이가이버 공인중개사사무소"
                value={realtorInfo.businessName}
                onChange={(e) => setRealtorInfo({ ...realtorInfo, businessName: e.target.value })}
                className="border-2 border-slate-200 focus:border-slate-900 transition-all font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="realtorName" className="font-bold text-slate-700">공인중개사 성명</Label>
              <Input
                id="realtorName"
                placeholder="실명을 입력해주세요"
                value={realtorInfo.realtorName}
                onChange={(e) => setRealtorInfo({ ...realtorInfo, realtorName: e.target.value })}
                className="border-2 border-slate-200 focus:border-slate-900 transition-all font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="realtorPhone" className="font-bold text-slate-700">대표 연락처</Label>
              <Input
                id="realtorPhone"
                placeholder="예: 010-0000-0000"
                value={realtorInfo.realtorPhone}
                onChange={(e) => setRealtorInfo({ ...realtorInfo, realtorPhone: e.target.value })}
                className="border-2 border-slate-200 focus:border-slate-900 transition-all font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-slate-700">프로필 사진</Label>
              <div className="flex items-center gap-4">
                {/* 미리보기 원형 */}
                <div className="w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                  {realtorInfo.realtorPhoto ? (
                    <img src={realtorInfo.realtorPhoto} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-slate-400">
                      {(realtorInfo.realtorName || '?').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {/* 파일 업로드 버튼 */}
                  <label
                    htmlFor="realtorPhotoFile"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors w-fit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    이미지 선택
                  </label>
                  <input
                    id="realtorPhotoFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('photo', file);
                      try {
                        const res = await fetch('/api/upload/profile', { method: 'POST', body: formData, credentials: 'include' });
                        const data = await res.json();
                        if (data.url) {
                          setRealtorInfo({ ...realtorInfo, realtorPhoto: data.url });
                        } else {
                          toast({ title: '업로드 실패', description: data.error || '오류가 발생했습니다.', variant: 'destructive' });
                        }
                      } catch {
                        toast({ title: '업로드 실패', description: '네트워크 오류', variant: 'destructive' });
                      }
                    }}
                  />
                  {/* URL 직접 입력도 유지 */}
                  <Input
                    placeholder="또는 이미지 URL 직접 입력"
                    value={realtorInfo.realtorPhoto}
                    onChange={(e) => setRealtorInfo({ ...realtorInfo, realtorPhoto: e.target.value })}
                    className="border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="realtorAddress" className="font-bold text-slate-700">사무소 주소</Label>
              <Input
                id="realtorAddress"
                placeholder="예: 인천광역시 강화군 강화읍..."
                value={realtorInfo.realtorAddress}
                onChange={(e) => setRealtorInfo({ ...realtorInfo, realtorAddress: e.target.value })}
                className="border-2 border-slate-200 focus:border-slate-900 transition-all font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="realtorLicenseNo" className="font-bold text-slate-700">등록번호 (중개업등록증)</Label>
              <Input
                id="realtorLicenseNo"
                placeholder="예: 20230001"
                value={realtorInfo.realtorLicenseNo}
                onChange={(e) => setRealtorInfo({ ...realtorInfo, realtorLicenseNo: e.target.value })}
                className="border-2 border-slate-200 focus:border-slate-900 transition-all font-medium"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            {targetUser?.role === 'realtor' && (
              <Button
                variant="outline"
                className="font-bold border-2 border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => {
                  if (confirm('중개사 권한을 해제하고 일반 회원으로 변경하시겠습니까?')) {
                    updateUserRoleMutation.mutate({ userId: targetUser!.id, role: 'user' });
                  }
                }}
              >
                권한 해제
              </Button>
            )}
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] active:translate-y-1 active:shadow-none transition-all ml-auto"
              onClick={() => {
                if (!realtorInfo.businessName || !realtorInfo.realtorName || !realtorInfo.realtorPhone) {
                  toast({ title: "입력 오류", description: "모든 정보를 입력해주세요.", variant: "destructive" });
                  return;
                }
                updateUserRoleMutation.mutate({
                  userId: targetUser!.id,
                  role: 'realtor',
                  realtorInfo
                });
              }}
              disabled={updateUserRoleMutation.isPending}
            >
              {updateUserRoleMutation.isPending ? "처리 중..." : (targetUser?.role === 'realtor' ? "정보 수정" : "승인 완료")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Guard overlay handled at JSX level */}
      {(isLoading || !user || (user.role !== "admin" && user.role !== "realtor")) && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-slate-500">권한 확인 및 데이터 연결 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
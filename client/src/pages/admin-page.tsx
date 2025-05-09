import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Property, User, News, insertPropertySchema } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2, Home, Plus, Trash2, Edit, Check } from "lucide-react";

// 부동산 등록 폼 스키마 확장 (유효성 검사 추가)
const propertyFormSchema = insertPropertySchema.extend({
  price: z
    .string()
    .min(1, "가격은 필수 입력 항목입니다")
    .refine((val) => !isNaN(parseInt(val)), {
      message: "가격은 숫자 형식이어야 합니다",
    }),
  size: z
    .string()
    .min(1, "면적은 필수 입력 항목입니다")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "면적은 숫자 형식이어야 합니다",
    }),
  bedrooms: z
    .number()
    .min(0, "침실 수는 0 이상이어야 합니다"),
  bathrooms: z
    .number()
    .min(0, "욕실 수는 0 이상이어야 합니다"),
  featured: z
    .boolean()
    .optional()
    .default(false),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("properties");
  const [openPropertyDialog, setOpenPropertyDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | false>(false);
  const [isDeletingUser, setIsDeletingUser] = useState<number | false>(false);
  const [isDeletingNews, setIsDeletingNews] = useState<number | false>(false);

  // 부동산 목록 조회
  const {
    data: properties,
    isLoading: isLoadingProperties,
    error: propertiesError,
  } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // 사용자 목록 조회 (관리자만)
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: currentUser?.role === "admin",
  });
  
  // 뉴스 목록 조회
  const {
    data: news,
    isLoading: isLoadingNews,
    error: newsError,
  } = useQuery<News[]>({
    queryKey: ["/api/news"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // 부동산 등록/수정 폼
  const propertyForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "아파트",
      price: "",
      address: "",
      city: "서울",
      district: "강남구",
      size: "",
      bedrooms: 0,
      bathrooms: 0,
      imageUrl: "",
      agentId: 1,
      featured: false,
    },
  });

  // 부동산 생성 뮤테이션
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      const res = await apiRequest("POST", "/api/properties", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "부동산 등록에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 등록 성공",
        description: "새로운 부동산이 등록되었습니다.",
      });
      setOpenPropertyDialog(false);
      propertyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부동산 수정 뮤테이션
  const updatePropertyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: PropertyFormValues;
    }) => {
      const res = await apiRequest("PATCH", `/api/properties/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "부동산 수정에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 수정 성공",
        description: "부동산 정보가 수정되었습니다.",
      });
      setOpenPropertyDialog(false);
      setEditingProperty(null);
      propertyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 부동산 삭제 뮤테이션
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeleting(id);
      const res = await apiRequest("DELETE", `/api/properties/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "부동산 삭제에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "부동산 삭제 성공",
        description: "부동산이 삭제되었습니다.",
      });
      setIsDeleting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "부동산 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });
  
  // 사용자 삭제 뮤테이션
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeletingUser(id);
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "사용자 삭제에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "사용자 삭제 성공",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
      setIsDeletingUser(false);
    },
    onError: (error: Error) => {
      toast({
        title: "사용자 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeletingUser(false);
    },
  });

  // 뉴스 삭제 뮤테이션
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsDeletingNews(id);
      const res = await apiRequest("DELETE", `/api/news/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "뉴스 삭제에 실패했습니다");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "뉴스 삭제 성공",
        description: "뉴스가 성공적으로 삭제되었습니다.",
      });
      setIsDeletingNews(false);
    },
    onError: (error: Error) => {
      toast({
        title: "뉴스 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsDeletingNews(false);
    },
  });

  // 부동산 폼 제출 핸들러
  const onPropertySubmit = (data: PropertyFormValues) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  // 부동산 수정 열기
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    
    // 폼 값 설정
    propertyForm.reset({
      ...property,
      price: property.price.toString(),
      size: property.size.toString(),
    });
    
    setOpenPropertyDialog(true);
  };

  // 부동산 삭제 핸들러
  const handleDeleteProperty = (id: number) => {
    if (confirm("정말로 이 부동산을 삭제하시겠습니까?")) {
      deletePropertyMutation.mutate(id);
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleCloseDialog = () => {
    setOpenPropertyDialog(false);
    setEditingProperty(null);
    propertyForm.reset();
  };

  // 새 부동산 추가 핸들러
  const handleAddProperty = () => {
    setEditingProperty(null);
    propertyForm.reset({
      title: "",
      description: "",
      type: "아파트",
      price: "",
      address: "",
      city: "서울",
      district: "강남구",
      size: "",
      bedrooms: 0,
      bathrooms: 0,
      imageUrl: "",
      agentId: 1,
      featured: false,
    });
    setOpenPropertyDialog(true);
  };

  // 로딩 상태 표시
  if (isLoadingProperties) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 오류 상태 표시
  if (propertiesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">오류가 발생했습니다: {propertiesError.message}</p>
        <Button variant="default" onClick={() => window.location.reload()}>
          다시 시도
        </Button>
      </div>
    );
  }

  const propertyTypes = ["아파트", "주택", "빌라", "오피스텔", "펜트하우스"];
  const districts = [
    "강남구", "서초구", "송파구", "강동구", "광진구", "성동구", "용산구", "마포구",
    "서대문구", "은평구", "종로구", "중구", "동대문구", "성북구", "강북구", "도봉구",
    "노원구", "중랑구", "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구"
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">관리자 패널</h1>
          <Breadcrumb className="mt-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                  홈
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>관리자 패널</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            <span className="font-bold">{currentUser?.username}</span> ({currentUser?.role})
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">부동산 관리</TabsTrigger>
          <TabsTrigger value="users" disabled={currentUser?.role !== "admin"}>
            사용자 관리
          </TabsTrigger>
        </TabsList>

        {/* 부동산 관리 탭 */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>부동산 목록</CardTitle>
                  <CardDescription>
                    등록된 부동산 매물 목록을 관리합니다.
                  </CardDescription>
                </div>
                <Button onClick={handleAddProperty}>
                  <Plus className="h-4 w-4 mr-2" />
                  부동산 등록
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>총 {properties?.length || 0}개의 부동산 매물</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>정보</TableHead>
                    <TableHead>특징</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties?.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{property.title}</TableCell>
                      <TableCell>{property.type}</TableCell>
                      <TableCell>{property.district}</TableCell>
                      <TableCell>{parseInt(property.price).toLocaleString()}원</TableCell>
                      <TableCell>{property.bedrooms}침실 {property.bathrooms}욕실 {property.size}㎡</TableCell>
                      <TableCell>
                        {property.featured && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            추천
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditProperty(property)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled={isDeleting === property.id}
                          >
                            {isDeleting === property.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 부동산 등록/수정 다이얼로그 */}
          <Dialog open={openPropertyDialog} onOpenChange={setOpenPropertyDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProperty ? "부동산 수정" : "새 부동산 등록"}</DialogTitle>
                <DialogDescription>
                  {editingProperty
                    ? "부동산 정보를 수정하세요"
                    : "새로운 부동산 매물을 등록하세요"}
                </DialogDescription>
              </DialogHeader>

              <Form {...propertyForm}>
                <form
                  onSubmit={propertyForm.handleSubmit(onPropertySubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>제목</FormLabel>
                            <FormControl>
                              <Input placeholder="부동산 제목" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>유형</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="부동산 유형 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {propertyTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={propertyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>설명</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="부동산에 대한 상세 설명"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>가격</FormLabel>
                            <FormControl>
                              <Input placeholder="가격 (원)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>면적 (㎡)</FormLabel>
                            <FormControl>
                              <Input placeholder="면적" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>침실 수</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>욕실 수</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>도시</FormLabel>
                            <FormControl>
                              <Input placeholder="도시 (예: 서울)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>지역구</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="지역구 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {districts.map((district) => (
                                  <SelectItem key={district} value={district}>
                                    {district}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={propertyForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>주소</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="상세 주소 (예: 강남구 테헤란로 152)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={propertyForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이미지 URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="이미지 URL (외부 이미지 링크)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="agentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>담당 중개사 ID</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={propertyForm.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value || false}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>추천 매물</FormLabel>
                              <FormDescription>
                                이 매물을 추천 매물로 표시합니다.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createPropertyMutation.isPending ||
                        updatePropertyMutation.isPending
                      }
                    >
                      {(createPropertyMutation.isPending ||
                        updatePropertyMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingProperty ? "수정" : "등록"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 사용자 관리 탭 (관리자만 접근 가능) */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>
                등록된 사용자 목록을 관리합니다. (관리자 전용)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersError ? (
                <div className="py-8 text-center">
                  <p className="text-red-500">
                    사용자 목록을 불러오는 중 오류가 발생했습니다:{" "}
                    {usersError.message}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>총 {users?.length || 0}명의 사용자</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>사용자명</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </div>
                        </TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell className="text-right">
                          {/* 현재 로그인한 관리자 자신이 아닌 경우에만 삭제 버튼 표시 */}
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`정말로 사용자 "${user.username}"를 탈퇴시키겠습니까?`)) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={isDeletingUser === user.id}
                            >
                              {isDeletingUser === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              탈퇴
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
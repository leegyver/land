import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PropertyInquiry } from "@shared/schema";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PropertyInquiryBoardProps {
  propertyId: number;
}

// 문의 작성 폼 스키마
const inquiryFormSchema = z.object({
  title: z.string().min(2, "제목은 2자 이상이어야 합니다.").max(100, "제목은 100자 이하여야 합니다."),
  content: z.string().min(5, "내용은 5자 이상이어야 합니다.").max(1000, "내용은 1000자 이하여야 합니다."),
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

// 답변 작성 폼 스키마
const replyFormSchema = z.object({
  content: z.string().min(5, "내용은 5자 이상이어야 합니다.").max(500, "내용은 500자 이하여야 합니다."),
});

type ReplyFormValues = z.infer<typeof replyFormSchema>;

const PropertyInquiryBoard = ({ propertyId }: PropertyInquiryBoardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("view");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  
  // 문의글 목록 조회
  const { 
    data: inquiries, 
    isLoading: inquiriesLoading,
    refetch: refetchInquiries
  } = useQuery<PropertyInquiry[]>({
    queryKey: [`/api/properties/${propertyId}/inquiries`],
    enabled: !!propertyId && !!user,
  });
  
  // 문의글 작성을 위한 폼
  const inquiryForm = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      title: "",
      content: ""
    }
  });
  
  // 답변 작성을 위한 폼
  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: ""
    }
  });
  
  // 문의글 작성 뮤테이션
  const inquiryMutation = useMutation({
    mutationFn: (values: InquiryFormValues) => {
      return apiRequest("POST", `/api/properties/${propertyId}/inquiries`, {
        ...values,
        propertyId,
        userId: user?.id,
        isReply: false,
        parentId: null
      });
    },
    onSuccess: () => {
      toast({
        title: "문의가 등록되었습니다",
        description: "부동산 담당자가 확인 후 답변드리겠습니다.",
      });
      inquiryForm.reset();
      setActiveTab("view");
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/inquiries`] });
    },
    onError: (error) => {
      toast({
        title: "문의 등록 실패",
        description: "문의 등록 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      console.error("Inquiry submission error:", error);
    }
  });
  
  // 답변 작성 뮤테이션
  const replyMutation = useMutation({
    mutationFn: (values: ReplyFormValues) => {
      return apiRequest("POST", `/api/properties/${propertyId}/inquiries`, {
        title: "답변: " + (inquiries?.find(i => i.id === replyToId)?.title || "문의에 대한 답변"),
        content: values.content,
        propertyId,
        userId: user?.id,
        isReply: true,
        parentId: replyToId
      });
    },
    onSuccess: () => {
      toast({
        title: "답변이 등록되었습니다",
      });
      replyForm.reset();
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/inquiries`] });
    },
    onError: (error) => {
      toast({
        title: "답변 등록 실패",
        description: "답변 등록 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      console.error("Reply submission error:", error);
    }
  });
  
  // 문의글 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: (inquiryId: number) => {
      return apiRequest("DELETE", `/api/properties/${propertyId}/inquiries/${inquiryId}`);
    },
    onSuccess: () => {
      toast({
        title: "삭제되었습니다",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/inquiries`] });
    },
    onError: (error) => {
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    }
  });
  
  // 문의글 제출 핸들러
  const onInquirySubmit = (data: InquiryFormValues) => {
    inquiryMutation.mutate(data);
  };
  
  // 답변 제출 핸들러
  const onReplySubmit = (data: ReplyFormValues) => {
    replyMutation.mutate(data);
  };
  
  // 답변 작성 모드로 전환하는 핸들러
  const handleReply = (inquiryId: number) => {
    setReplyToId(inquiryId);
    replyForm.reset();
  };
  
  // 문의글 삭제 핸들러
  const handleDelete = (inquiryId: number) => {
    if (window.confirm("정말로 이 글을 삭제하시겠습니까?")) {
      deleteMutation.mutate(inquiryId);
    }
  };
  
  // 사용자 권한 체크 (본인이 작성한 글이거나 관리자인 경우)
  const canManageInquiry = (inquiry: PropertyInquiry) => {
    return user?.id === inquiry.userId || user?.role === "admin";
  };
  
  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">문의 게시판을 보시려면 로그인이 필요합니다.</p>
        <Button asChild>
          <a href="/auth">로그인하기</a>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">문의 목록</TabsTrigger>
          <TabsTrigger value="write">문의 작성</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view" className="py-4">
          {inquiriesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : inquiries && inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.map(inquiry => (
                <div key={inquiry.id} className={`border rounded-lg p-4 ${inquiry.isReply ? 'ml-8 bg-muted/20' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{inquiry.title}</h4>
                    {inquiry.isReply && <MessageCircle size={16} className="text-primary" />}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{inquiry.content}</p>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>작성자: {user?.username || "사용자"}</span>
                    <span>{inquiry.createdAt ? formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true, locale: ko }) : ""}</span>
                  </div>
                  
                  {canManageInquiry(inquiry) && (
                    <div className="flex justify-end gap-2 mt-4">
                      {!inquiry.isReply && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReply(inquiry.id)}
                        >
                          답변
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(inquiry.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">아직 문의글이 없습니다.</p>
            </div>
          )}
          
          {replyToId && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-4">답변 작성</h3>
                <Form {...replyForm}>
                  <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="space-y-4">
                    <FormField
                      control={replyForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>답변 내용</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="답변 내용을 작성해주세요"
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setReplyToId(null)}
                      >
                        취소
                      </Button>
                      <Button 
                        type="submit"
                        disabled={replyMutation.isPending}
                      >
                        {replyMutation.isPending ? "제출 중..." : "답변 등록"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="write" className="py-4">
          <Form {...inquiryForm}>
            <form onSubmit={inquiryForm.handleSubmit(onInquirySubmit)} className="space-y-4">
              <FormField
                control={inquiryForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="문의 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={inquiryForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="문의 내용을 상세히 작성해주세요"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={inquiryMutation.isPending}
              >
                {inquiryMutation.isPending ? "제출 중..." : "문의 등록"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyInquiryBoard;
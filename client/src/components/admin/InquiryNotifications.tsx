import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageCircle, Eye, CheckCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface UnreadInquiry {
  id: number;
  propertyId: number;
  userId: number;
  title: string;
  content: string;
  isReply: boolean;
  parentId?: number;
  isReadByAdmin: boolean;
  createdAt: string;
  authorUsername?: string;
  propertyTitle?: string;
}

const InquiryNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<UnreadInquiry | null>(null);

  // 미읽은 문의글 수 조회
  const { data: unreadCount = 0 } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/inquiries/unread/count"],
    refetchInterval: 30000, // 30초마다 자동 새로고침
  });

  // 미읽은 문의글 목록 조회
  const { data: unreadInquiries = [], isLoading } = useQuery<UnreadInquiry[]>({
    queryKey: ["/api/admin/inquiries/unread"],
    enabled: isOpen,
  });

  // 개별 문의글 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: (inquiryId: number) => 
      apiRequest("PUT", `/api/admin/inquiries/${inquiryId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries/unread/count"] });
      toast({
        title: "읽음 처리 완료",
        description: "문의글을 읽음 처리했습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "읽음 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  // 전체 문의글 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/admin/inquiries/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries/unread/count"] });
      toast({
        title: "전체 읽음 처리 완료",
        description: "모든 문의글을 읽음 처리했습니다.",
      });
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "전체 읽음 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const handleInquiryClick = (inquiry: UnreadInquiry) => {
    setSelectedInquiry(inquiry);
    // 클릭 시 자동으로 읽음 처리
    if (!inquiry.isReadByAdmin) {
      markAsReadMutation.mutate(inquiry.id);
    }
  };

  const goToProperty = (propertyId: number) => {
    window.open(`/properties/${propertyId}`, '_blank');
  };

  return (
    <>
      {/* 알림 버튼 */}
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4 mr-2" />
        문의 알림
        {unreadCount.count > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </Badge>
        )}
      </Button>

      {/* 알림 목록 다이얼로그 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                새로운 매물 문의 ({unreadCount.count}개)
              </div>
              {unreadInquiries.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  전체 읽음
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">로딩 중...</div>
              </div>
            ) : unreadInquiries.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">새로운 문의가 없습니다.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {unreadInquiries.map((inquiry) => (
                  <Card 
                    key={inquiry.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleInquiryClick(inquiry)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium line-clamp-1">
                            {inquiry.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{inquiry.authorUsername}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>{format(new Date(inquiry.createdAt), "M월 d일 HH:mm", { locale: ko })}</span>
                            {inquiry.isReply && (
                              <>
                                <Separator orientation="vertical" className="h-3" />
                                <Badge variant="secondary" className="text-xs">답글</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToProperty(inquiry.propertyId);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground mb-2">
                        매물: {inquiry.propertyTitle}
                      </div>
                      <div className="text-sm line-clamp-2">
                        {inquiry.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 문의글 상세 보기 다이얼로그 */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {selectedInquiry.title}
                {selectedInquiry.isReply && (
                  <Badge variant="secondary">답글</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>작성자: {selectedInquiry.authorUsername}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>{format(new Date(selectedInquiry.createdAt), "yyyy년 M월 d일 HH:mm", { locale: ko })}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToProperty(selectedInquiry.propertyId)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  매물 보기
                </Button>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium mb-2">매물 정보</div>
                <div className="text-sm text-muted-foreground">
                  {selectedInquiry.propertyTitle}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">문의 내용</div>
                <div className="text-sm whitespace-pre-wrap">
                  {selectedInquiry.content}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                >
                  닫기
                </Button>
                <Button
                  onClick={() => goToProperty(selectedInquiry.propertyId)}
                >
                  매물에서 답변하기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default InquiryNotifications;
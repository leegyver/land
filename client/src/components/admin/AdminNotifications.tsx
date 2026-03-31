import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, MessageCircle, CheckCheck, ExternalLink, UserPlus, Mail, Home, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface AdminNotification {
  id: number;
  type: string;
  relatedId: number | null;
  title: string;
  content: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
}

const AdminNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const prevUnreadCountRef = useRef<number>(0);

  // 알림 목록 및 미읽음 개수 조회
  const { data: { notifications = [], unreadCount = 0 } = {}, isLoading } = useQuery<{ notifications: AdminNotification[], unreadCount: number }>({
    queryKey: ["/api/admin/notifications"],
    refetchInterval: 5000, // 5초마다 자동 새로고침(실시간 알림 효과)
  });

  // 미읽음 개수가 증가하면 즉각 토스트 표시
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      const newNotifications = unreadCount - prevUnreadCountRef.current;
      toast({
        title: "새로운 알림",
        description: `${newNotifications}개의 새로운 관리자 알림이 도착했습니다.`,
      });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, toast]);

  // 개별 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/admin/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    }
  });

  // 전체 알림 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "읽음 처리 완료", description: "모든 알림을 읽음 처리했습니다." });
    }
  });

  // 알림 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      setSelectedNotification(null);
      toast({ title: "삭제 완료", description: "알림이 삭제되었습니다." });
    }
  });

  const safeFormat = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "날짜 오류";
      return format(d, formatStr, { locale: ko });
    } catch (e) {
      return "날짜 오류";
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "user_registration": return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "newsletter": return <Mail className="h-5 w-5 text-green-500" />;
      case "property_inquiry": return <Home className="h-5 w-5 text-amber-500" />;
      case "inquiry":
      default: return <MessageCircle className="h-5 w-5 text-purple-500" />;
    }
  };

  const goToRelatedPage = (notification: AdminNotification) => {
    if (notification.type === "community_post" && notification.relatedId) {
      setLocation(`/community/${notification.relatedId}`);
      setIsOpen(false);
      setSelectedNotification(null);
    } else if (notification.type === "property_inquiry" && notification.relatedId) {
      setLocation(`/properties/${notification.relatedId}`);
      setIsOpen(false);
      setSelectedNotification(null);
    }
  };

  const handleTitleClick = (e: React.MouseEvent, notification: AdminNotification) => {
    e.stopPropagation();
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.type === "community_post" || notification.type === "property_inquiry") {
      goToRelatedPage(notification);
    } else {
      setSelectedNotification(notification);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4 mr-2" />
        새로운 알림
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 알림 목록 다이얼로그 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                관리자 알림 센터
                <Badge variant="secondary" className="ml-2">{unreadCount} 미확인</Badge>
              </div>
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  모두 읽음
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoading ? (
              <div className="flex justify-center p-8 text-muted-foreground">로딩 중...</div>
            ) : notifications.length === 0 ? (
              <div className="flex justify-center p-8 text-muted-foreground">알림이 없습니다.</div>
            ) : (
              <div className="space-y-3 mt-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 items-center">
                          {getIconForType(notification.type)}
                          <div>
                            <CardTitle 
                              className={`text-sm hover:underline cursor-pointer ${!notification.isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}
                              onClick={(e) => handleTitleClick(e, notification)}
                            >
                              {notification.title}
                            </CardTitle>
                            <div className="text-xs text-muted-foreground mt-1">
                              {safeFormat(notification.createdAt, "yyyy.MM.dd HH:mm")}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    {notification.content && (
                      <CardContent className="px-4 pb-4 pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2 ml-8">
                          {notification.content}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 알림 상세 보기 다이얼로그 */}
      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getIconForType(selectedNotification.type)}
                {selectedNotification.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="text-xs text-muted-foreground px-1">
                {safeFormat(selectedNotification.createdAt, "yyyy년 M월 d일 a h시 mm분")}
              </div>

              {selectedNotification.content && (
                <div className="p-4 bg-muted/40 border-l-2 border-primary/20 rounded-r-lg">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedNotification.content}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedNotification(null)}>닫기</Button>
                <Button 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(selectedNotification.id)}
                >
                  삭제하기
                </Button>
                {(selectedNotification.type === "community_post" || selectedNotification.type === "property_inquiry") && (
                  <Button onClick={() => goToRelatedPage(selectedNotification)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    해당 글로 이동
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AdminNotifications;
import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AdminStatsTab from '@/components/admin/tabs/AdminStatsTab';

export default function AdminStatsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // 관리자 권한 확인
  if (!user || (!['admin', 'master'].includes(user.role as string))) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <p className="text-slate-500 mb-4">관리자 권한이 필요합니다.</p>
        <Button onClick={() => setLocation('/admin')}>관리자 홈으로 이동</Button>
      </div>
    );
  }

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    try {
      await apiRequest('POST', '/api/admin/clear-cache').catch(() => {});
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/admin/stats');
        },
      });
      toast({
        title: '통계 새로고침 완료',
        description: '최신 통계 데이터가 성공적으로 반영되었습니다.',
      });
    } catch (error: any) {
      toast({
        title: '새로고침 실패',
        description: error.message || '통계 데이터를 새로고침하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen pb-20 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin?tab=properties')}
              className="text-slate-600 hover:text-slate-900 -ml-2 h-8 px-2 flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              관리자 대시보드로 돌아가기
            </Button>
            <span className="text-gray-300">|</span>
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs">
              Stats Center
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            방문자 및 사이트 통계 분석실
          </h1>
          <p className="text-slate-500 max-w-xl text-sm">
            실시간 방문 트래픽, 인기 매물 열람 수치, 유입 키워드 및 뉴스레터 구독 현황을 종합 분석합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="default"
            className="rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            onClick={handleRefreshStats}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '통계 집계 중...' : '통계 새로고침'}
          </Button>
          <Button
            variant="default"
            className="rounded-xl shadow-sm flex items-center gap-1.5"
            onClick={() => setLocation('/admin?tab=properties')}
          >
            매물 관리로 이동
          </Button>
        </div>
      </div>

      {/* Main Stats Component */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-4 md:p-8">
        <AdminStatsTab />
      </div>
    </div>
  );
}

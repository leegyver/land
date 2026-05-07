import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, ShieldCheck, BarChart4 } from "lucide-react";

export default function AdminConfigTab() {
  const { toast } = useToast();
  const [gaId, setGaId] = useState("");

  const { data: configs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/config"],
  });

  useEffect(() => {
    if (configs) {
      const gaConfig = configs.find(c => c.key === "ga_id");
      if (gaConfig) setGaId(gaConfig.value);
    }
  }, [configs]);

  const mutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/admin/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site/config"] });
      toast({
        title: "설정 저장 완료",
        description: "사이트 설정이 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveGa = () => {
    mutation.mutate({ key: "ga_id", value: gaId });
  };

  if (isLoading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BarChart4 className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">마케팅 및 분석 설정</CardTitle>
          </div>
          <CardDescription>구글 애널리틱스 등 외부 분석 도구를 연결하여 더 정밀한 통계를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ga_id" className="text-sm font-bold text-slate-700">Google Analytics (GA4) 측정 ID</Label>
              <div className="flex gap-3">
                <Input 
                  id="ga_id" 
                  placeholder="G-XXXXXXXXXX" 
                  value={gaId} 
                  onChange={(e) => setGaId(e.target.value)}
                  className="rounded-xl border-slate-200 focus:ring-primary focus:border-primary h-12"
                />
                <Button 
                  onClick={handleSaveGa} 
                  disabled={mutation.isPending}
                  className="rounded-xl h-12 px-8 font-bold flex items-center gap-2"
                >
                  {mutation.isPending ? "저장 중..." : (
                    <>
                      <Save className="w-4 h-4" />
                      설정 저장
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                GA4 관리자 페이지의 [데이터 스트림]에서 확인한 측정 ID를 입력해 주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">데이터 보안 알림</CardTitle>
          </div>
          <CardDescription>사이트 통계 데이터는 관리자만 열람할 수 있도록 보호되고 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <ul className="space-y-3 text-sm text-slate-600 font-medium list-disc pl-5">
              <li>자체 통계는 방문자의 IP 주소를 기반으로 고유 방문자 수를 계산합니다.</li>
              <li>개인 정보 보호를 위해 민감한 브라우저 정보는 저장하지 않습니다.</li>
              <li>구글 애널리틱스를 연동하면 더 정교한 유입 경로 및 이탈률 분석이 가능합니다.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

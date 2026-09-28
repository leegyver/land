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
  const [gaPropertyId, setGaPropertyId] = useState("521353539");
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [naverSite, setNaverSite] = useState("https://leegyver.com");

  const { data: configs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/config"],
  });

  useEffect(() => {
    if (configs) {
      const gaConfig = configs.find(c => c.key === "ga_id");
      if (gaConfig) setGaId(gaConfig.value);

      const propConfig = configs.find(c => c.key === "ga4_property_id");
      if (propConfig) setGaPropertyId(propConfig.value);

      const saConfig = configs.find(c => c.key === "google_service_account_json");
      if (saConfig) setServiceAccountJson(saConfig.value);

      const naverConfig = configs.find(c => c.key === "naver_advisor_site");
      if (naverConfig) setNaverSite(naverConfig.value);
    }
  }, [configs]);

  const mutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/admin/config", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/ga4"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/search-console"] });
      toast({
        title: "설정 저장 완료",
        description: `${variables.key} 설정이 성공적으로 업데이트되었습니다.`,
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

  const handleSaveGaProperty = () => {
    mutation.mutate({ key: "ga4_property_id", value: gaPropertyId });
  };

  const handleSaveServiceAccount = () => {
    mutation.mutate({ key: "google_service_account_json", value: serviceAccountJson });
  };

  const handleSaveNaverSite = () => {
    mutation.mutate({ key: "naver_advisor_site", value: naverSite });
  };

  if (isLoading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 구글 통계 및 분석 연동 카드 */}
      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BarChart4 className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Google Analytics 4 & Search Console 연동</CardTitle>
          </div>
          <CardDescription>
            구글 애널리틱스 및 구글 서치 콘솔 공식 API를 연동하여 실제 순방문자, 포털 유입, 검색 키워드를 조회합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          {/* GA4 측정 ID */}
          <div className="space-y-2">
            <Label htmlFor="ga_id" className="text-sm font-bold text-slate-700">GA4 웹 스트림 측정 ID (추적 태그)</Label>
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
                className="rounded-xl h-12 px-6 font-bold shrink-0 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> 저장
              </Button>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              방문자 브라우저에서 구글 통계를 수집하는 측정 ID입니다. (예: G-15PCT2VRHS)
            </p>
          </div>

          {/* GA4 속성 ID */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="ga4_property_id" className="text-sm font-bold text-slate-700">GA4 속성 ID (Property ID)</Label>
            <div className="flex gap-3">
              <Input 
                id="ga4_property_id" 
                placeholder="예: 521353539" 
                value={gaPropertyId} 
                onChange={(e) => setGaPropertyId(e.target.value)}
                className="rounded-xl border-slate-200 focus:ring-primary focus:border-primary h-12"
              />
              <Button 
                onClick={handleSaveGaProperty} 
                disabled={mutation.isPending}
                className="rounded-xl h-12 px-6 font-bold shrink-0 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> 저장
              </Button>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              구글 애널리틱스 콘솔 URL에 표시되는 9자리 속성 ID입니다. (현재: 521353539)
            </p>
          </div>

          {/* Google 서비스 계정 비공개 키 JSON */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="service_account_json" className="text-sm font-bold text-slate-700">
              Google Cloud 서비스 계정 키 (JSON)
            </Label>
            <textarea
              id="service_account_json"
              placeholder='Google Cloud Console에서 다운로드한 서비스 계정 JSON 키 파일의 내용을 여기에 붙여넣으세요. {"type": "service_account", ...}'
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              rows={4}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400">
                서비스 계정 이메일을 GA4 및 서치 콘솔의 [사용자 추가]에서 &apos;뷰어&apos;로 등록하면 자동으로 통계가 동기화됩니다.
              </p>
              <Button 
                onClick={handleSaveServiceAccount} 
                disabled={mutation.isPending}
                className="rounded-xl h-10 px-6 font-bold shrink-0 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> 키 저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 네이버 서치어드바이저 연동 카드 */}
      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <div className="w-5 h-5 rounded-md bg-emerald-600 text-white text-xs font-black flex items-center justify-center">N</div>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">네이버 서치어드바이저 (웹마스터도구) 연동</CardTitle>
          </div>
          <CardDescription>
            네이버 검색 결과 노출수, 클릭수, 사이트 수집 최적화 상태를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="naver_site" className="text-sm font-bold text-slate-700">등록 사이트 URL</Label>
            <div className="flex gap-3">
              <Input 
                id="naver_site" 
                placeholder="https://leegyver.com" 
                value={naverSite} 
                onChange={(e) => setNaverSite(e.target.value)}
                className="rounded-xl border-slate-200 focus:ring-primary focus:border-primary h-12"
              />
              <Button 
                onClick={handleSaveNaverSite} 
                disabled={mutation.isPending}
                className="rounded-xl h-12 px-6 font-bold shrink-0 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> 저장
              </Button>
            </div>
            <div className="pt-2">
              <a 
                href={`https://searchadvisor.naver.com/console/site/summary?site=${encodeURIComponent(naverSite)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                네이버 서치어드바이저 사이트 관리 콘솔 바로가기 &rarr;
              </a>
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

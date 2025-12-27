import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportFromSheetModal({ isOpen, onClose }: ImportFromSheetModalProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [range, setRange] = useState("Sheet1!A2:Z");
  const [filterDate, setFilterDate] = useState("");

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; apiKey: string; range: string; filterDate?: string }) => {
      const res = await apiRequest("POST", "/api/admin/import-from-sheet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "데이터 가져오기 성공",
          description: `${data.count}개의 매물 데이터를 가져왔습니다.`,
        });
        
        // 성공 후 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
        
        // 모달 닫기
        onClose();
      } else {
        toast({
          title: "데이터 가져오기 실패",
          description: data.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "데이터 가져오기 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spreadsheetId || !apiKey) {
      toast({
        title: "필수 정보 누락",
        description: "스프레드시트 ID와 API 키는 필수입니다.",
        variant: "destructive",
      });
      return;
    }
    
    importMutation.mutate({ 
      spreadsheetId, 
      apiKey, 
      range,
      filterDate: filterDate || undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>구글 스프레드시트에서 데이터 가져오기</DialogTitle>
            <DialogDescription>
              구글 스프레드시트에서 부동산 매물 데이터를 직접 가져옵니다. 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="spreadsheetId" className="text-right">
                스프레드시트 ID
              </Label>
              <Input
                id="spreadsheetId"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="col-span-3"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                Google API 키
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-3"
                type="password"
                placeholder="AIzaSyD..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="range" className="text-right">
                데이터 범위
              </Label>
              <Input
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="col-span-3"
                placeholder="Sheet1!A2:AN"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filterDate" className="text-right">
                날짜 필터 (선택)
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="col-span-4">
              <DialogDescription className="text-xs">
                <p className="mt-2 font-semibold">날짜 필터:</p>
                <p>A열의 날짜와 비교하여 선택된 날짜 이후의 데이터만 가져옵니다. (형식: YYYY-MM-DD)</p>
                <p className="mt-2 font-semibold">시트 포맷 안내 (필수 필드):</p>
                <p>A:날짜, AT:제목, AU:설명, Y:유형, AE:가격, C:주소, B:지역, J:면적, P:방개수, Q:욕실개수</p>
                <p className="mt-1 font-semibold">건물 정보 (선택):</p>
                <p>S:층수, T:총층, U:방향, AB:승강기(true/false), AC:주차, V:난방방식, X:사용승인일</p>
                <p>G:건물명, H:동호수, J:공급면적, M:전용면적, O:평형</p>
                <p className="mt-1 font-semibold">토지/금액/연락처 (선택):</p>
                <p>D:지목, E:용도지역, AD:거래종류, AG:보증금, AH:월세, AI:관리비</p>
                <p>AJ:소유자, AK:소유자전화, AL:임차인, AM:임차인전화, AN:의뢰인, AO:의뢰인전화</p>
                <p className="mt-1 font-semibold">추가 정보 (선택):</p>
                <p>AP:특이사항, AQ:공동중개(true/false), AR:매물설명, AS:비공개메모, BA:유튜브URL</p>
                <p className="mt-1">
                  유형(Y열): 토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션
                </p>
              </DialogDescription>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={importMutation.isPending}
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={importMutation.isPending || !spreadsheetId || !apiKey}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가져오는 중...
                </>
              ) : (
                "데이터 가져오기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
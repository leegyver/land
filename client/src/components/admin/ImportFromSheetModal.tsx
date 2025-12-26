import { useState, useEffect } from "react";
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
import { Loader2, Calendar, FileSpreadsheet, Key, Table2 } from "lucide-react";

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID || "1JZaBTQ3RSy9yUSd0fRSd2nLMDraQ03h5pxlDP_5NWYk";
const DEFAULT_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyB6B62pmwCPKr_a_HaP14L8NtbzrRHuyj0";

export function ImportFromSheetModal({ isOpen, onClose }: ImportFromSheetModalProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [range, setRange] = useState("Sheet1!A2:AN");
  const [filterDate, setFilterDate] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
      setApiKey(DEFAULT_API_KEY);
    }
  }, [isOpen]);

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; apiKey: string; range: string; filterDate?: string }) => {
      const res = await apiRequest("POST", "/api/admin/import-from-sheet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const message = data.skipped 
          ? `${data.count}개의 매물 데이터를 가져왔습니다. (${data.skipped}개 행 스킵됨)`
          : `${data.count}개의 매물 데이터를 가져왔습니다.`;
        
        toast({
          title: "데이터 가져오기 성공",
          description: message,
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>구글 스프레드시트에서 데이터 가져오기</DialogTitle>
            <DialogDescription>
              구글 스프레드시트에서 부동산 매물 데이터를 직접 가져옵니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheetId" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                스프레드시트 ID
              </Label>
              <Input
                id="spreadsheetId"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                data-testid="input-spreadsheet-id"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Google API 키
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="AIzaSyD..."
                data-testid="input-api-key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="range" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                데이터 범위
              </Label>
              <Input
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Sheet1!A2:AN"
                data-testid="input-range"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                입력일 필터 (C열 기준)
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                data-testid="input-filter-date"
              />
              <p className="text-xs text-muted-foreground">
                설정한 날짜 이후에 입력된 데이터만 가져옵니다. (C열의 날짜 기준)
              </p>
            </div>
            
            <details className="text-xs text-muted-foreground border rounded-md p-2">
              <summary className="cursor-pointer font-medium">시트 포맷 안내 (클릭하여 펼치기)</summary>
              <div className="mt-2 space-y-1">
                <p>A:제목, B:설명, C:입력일, D:유형, E:가격, F:주소, G:지역, H:면적...</p>
                <p>유형: 토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션</p>
              </div>
            </details>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={importMutation.isPending}
              data-testid="button-cancel-import"
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={importMutation.isPending || !spreadsheetId || !apiKey}
              data-testid="button-submit-import"
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
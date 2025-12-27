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
import { Loader2, FileSpreadsheet, Calendar, Table2, Info, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DuplicateItem {
  rowIndex: number;
  address: string;
  existingPropertyId: number;
  existingPropertyTitle: string;
  sheetName: string;
}

const DEFAULT_SPREADSHEET_ID = "1sfbhHTcrJOanlbzQbYgWC9KleLzyewsbtwYb_oE_0iQ";

const SHEET_NAMES: Record<number, string> = {
  1: "토지",
  2: "주택",
  3: "아파트외",
  4: "상가외"
};

export function ImportFromSheetModal({ isOpen, onClose }: ImportFromSheetModalProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [filterDate, setFilterDate] = useState("");
  const [selectedSheets, setSelectedSheets] = useState<number[]>([1, 2, 3, 4]);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [skipAddresses, setSkipAddresses] = useState<string[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const handleSheetToggle = (sheetNum: number) => {
    setSelectedSheets(prev => 
      prev.includes(sheetNum) 
        ? prev.filter(n => n !== sheetNum)
        : [...prev, sheetNum].sort((a, b) => a - b)
    );
  };

  const checkDuplicatesMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; ranges: string[]; filterDate: string }) => {
      const res = await apiRequest("POST", "/api/admin/check-sheet-duplicates", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.duplicates && data.duplicates.length > 0) {
        setDuplicates(data.duplicates);
        setSkipAddresses(data.duplicates.map((d: DuplicateItem) => d.address));
        setShowDuplicates(true);
      } else {
        proceedWithImport([]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "중복 확인 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; ranges: string[]; filterDate: string; skipAddresses: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/import-from-sheet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "데이터 가져오기 성공",
          description: `${data.count}개의 매물 데이터를 가져왔습니다.${skipAddresses.length > 0 ? ` (${skipAddresses.length}개 중복 건너뜀)` : ''}`,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
        
        handleClose();
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

  const handleClose = () => {
    setDuplicates([]);
    setSkipAddresses([]);
    setShowDuplicates(false);
    onClose();
  };

  const proceedWithImport = (addressesToSkip: string[]) => {
    const ranges = selectedSheets
      .filter(num => SHEET_NAMES[num])
      .map(num => `${SHEET_NAMES[num]}!A2:BA`);
    
    importMutation.mutate({ 
      spreadsheetId, 
      ranges,
      filterDate,
      skipAddresses: addressesToSkip
    });
  };

  const handleDuplicateToggle = (address: string) => {
    setSkipAddresses(prev => 
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spreadsheetId) {
      toast({
        title: "필수 정보 누락",
        description: "스프레드시트 ID는 필수입니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSheets.length === 0) {
      toast({
        title: "시트 선택 필요",
        description: "최소 하나의 시트를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (!filterDate) {
      toast({
        title: "날짜 선택 필요",
        description: "날짜를 반드시 선택해주세요. 선택한 날짜 이후의 데이터만 가져옵니다.",
        variant: "destructive",
      });
      return;
    }
    
    const ranges = selectedSheets
      .filter(num => SHEET_NAMES[num])
      .map(num => `${SHEET_NAMES[num]}!A2:BA`);
    
    checkDuplicatesMutation.mutate({ spreadsheetId, ranges, filterDate });
  };

  const handleImportWithSkip = () => {
    proceedWithImport(skipAddresses);
    setShowDuplicates(false);
  };

  const handleImportAll = () => {
    setSkipAddresses([]);
    proceedWithImport([]);
    setShowDuplicates(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showDuplicates ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                중복 매물 발견
              </DialogTitle>
              <DialogDescription>
                {duplicates.length}개의 중복 매물이 발견되었습니다. 건너뛸 매물을 선택하세요.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSkipAddresses(duplicates.map(d => d.address))}
                  data-testid="button-select-all-skip"
                >
                  모두 건너뛰기
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSkipAddresses([])}
                  data-testid="button-deselect-all-skip"
                >
                  모두 가져오기
                </Button>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                <div className="space-y-3">
                  {duplicates.map((dup, idx) => (
                    <div 
                      key={`${dup.sheetName}-${dup.rowIndex}`} 
                      className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                    >
                      <Checkbox
                        id={`dup-${idx}`}
                        checked={skipAddresses.includes(dup.address)}
                        onCheckedChange={() => handleDuplicateToggle(dup.address)}
                        data-testid={`checkbox-duplicate-${idx}`}
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">
                          {dup.sheetName} - 행 {dup.rowIndex}: {dup.address}
                        </div>
                        <div className="text-muted-foreground">
                          기존 매물: {dup.existingPropertyTitle} (ID: {dup.existingPropertyId})
                        </div>
                        <div className={`text-xs mt-1 ${skipAddresses.includes(dup.address) ? 'text-amber-600' : 'text-green-600'}`}>
                          {skipAddresses.includes(dup.address) ? '건너뜀' : '가져올 예정'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDuplicates(false)}
                disabled={importMutation.isPending}
              >
                이전으로
              </Button>
              <Button 
                type="button"
                variant="secondary"
                onClick={handleImportAll}
                disabled={importMutation.isPending}
                data-testid="button-import-all"
              >
                모두 가져오기
              </Button>
              <Button 
                type="button"
                onClick={handleImportWithSkip}
                disabled={importMutation.isPending}
                data-testid="button-import-skip"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가져오는 중...
                  </>
                ) : (
                  `${skipAddresses.length}개 건너뛰고 가져오기`
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                구글 스프레드시트에서 데이터 가져오기
              </DialogTitle>
              <DialogDescription>
                구글 스프레드시트에서 부동산 매물 데이터를 직접 가져옵니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="spreadsheetId" className="flex items-center gap-2">
                  <Table2 className="w-4 h-4" />
                  스프레드시트 ID
                </Label>
                <Input
                  id="spreadsheetId"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="스프레드시트 ID"
                  className="w-full"
                  data-testid="input-spreadsheet-id"
                />
                <p className="text-xs text-muted-foreground">기본값이 설정되어 있습니다.</p>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Table2 className="w-4 h-4" />
                  가져올 시트 선택
                </Label>
                <div className="flex flex-wrap gap-4 pt-2">
                  {[1, 2, 3, 4].map((sheetNum) => (
                    <div key={sheetNum} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sheet-${sheetNum}`}
                        checked={selectedSheets.includes(sheetNum)}
                        onCheckedChange={() => handleSheetToggle(sheetNum)}
                        data-testid={`checkbox-sheet-${sheetNum}`}
                      />
                      <Label htmlFor={`sheet-${sheetNum}`} className="cursor-pointer">
                        {SHEET_NAMES[sheetNum]} (Sheet{sheetNum})
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">선택한 시트에서 데이터를 가져옵니다 (기본: 1~4번 시트 모두).</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filterDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  날짜 필터 <span className="text-red-500">*필수</span>
                </Label>
                <Input
                  id="filterDate"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={`w-full ${!filterDate ? 'border-red-300' : ''}`}
                  data-testid="input-filter-date"
                  required
                />
                <p className="text-xs text-muted-foreground">A열의 날짜와 비교하여 선택된 날짜 이후의 데이터만 가져옵니다.</p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">중복 매물 확인</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  가져오기 전에 C열(주소)을 기존 매물과 비교하여 중복 매물을 확인합니다. 중복이 발견되면 건너뛸 매물을 선택할 수 있습니다.
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 space-y-3 text-sm">
                <p className="font-semibold text-base">시트 열 매핑 안내</p>
                
                <div>
                  <p className="font-medium text-primary">필수 필드</p>
                  <p className="text-muted-foreground">
                    A: 날짜 | B: 지역 | C: 주소 | Y: 유형 | AE: 가격 | AT: 제목 | AU: 설명
                  </p>
                  <p className="text-muted-foreground">
                    J: 면적(m2) | P: 방개수 | Q: 욕실개수
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-primary">위치/건물 정보</p>
                  <p className="text-muted-foreground">
                    G: 건물명 | H: 동호수 | M: 전용면적 | O: 평형
                  </p>
                  <p className="text-muted-foreground">
                    S: 층수 | T: 총층 | U: 방향 | V: 난방방식 | X: 사용승인일
                  </p>
                  <p className="text-muted-foreground">
                    AB: 승강기("유"=체크) | AC: 주차
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-primary">토지/금액 정보</p>
                  <p className="text-muted-foreground">
                    D: 지목 | E: 용도지역 | AD: 거래종류 | AF: 전세금 | AG: 보증금
                  </p>
                  <p className="text-muted-foreground">
                    AH: 월세 | AI: 관리비
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-primary">연락처 정보</p>
                  <p className="text-muted-foreground">
                    AJ: 소유자 | AK: 소유자전화 | AL: 임차인 | AM: 임차인전화
                  </p>
                  <p className="text-muted-foreground">
                    AN: 의뢰인 | AO: 의뢰인전화
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-primary">추가 정보</p>
                  <p className="text-muted-foreground">
                    AP: 특이사항 | AQ: 담당중개사 | AR: 매물설명
                  </p>
                  <p className="text-muted-foreground">
                    AS: 비공개메모 | AV-AZ: 이미지1~5 | BA: 유튜브URL
                  </p>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="font-medium">유형 값 (Y열)</p>
                  <p className="text-muted-foreground">
                    토지, 단독, 근린, 아파트, 다세대, 연립, 원투룸, 다가구, 오피스텔, 기타
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                disabled={checkDuplicatesMutation.isPending || importMutation.isPending}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button 
                type="submit"
                disabled={checkDuplicatesMutation.isPending || importMutation.isPending || !spreadsheetId || selectedSheets.length === 0}
                data-testid="button-import"
              >
                {checkDuplicatesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    중복 확인 중...
                  </>
                ) : (
                  "데이터 가져오기"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

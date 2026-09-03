import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminTabWrapper, useAdminQuery } from "../AdminShared";
import { PROPERTY_TYPES, DEAL_TYPES, DISTRICTS } from "@/lib/admin-constants";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Trash2, Edit, Eye, Plus, FileSpreadsheet, AlertCircle, GripVertical, CheckCircle, ExternalLink } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface AdminPropertyTabProps {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

type SortCategory = "all" | "featured" | "urgent" | "negotiable" | "longTerm";

export default function AdminPropertyTab({ properties, isLoading, isError, error, refetch }: AdminPropertyTabProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "master";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Sorting Mode
  const [sortCategory, setSortCategory] = useState<SortCategory>("all");
  
  // Limit Config State
  const [limitInput, setLimitInput] = useState<string>("");

  // Filters (Only active when sortCategory is "all")
  const [filterType, setFilterType] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterDealType, setFilterDealType] = useState("all");
  const [filterAgent, setFilterAgent] = useState("all");

  const filteredProperties = useMemo(() => {
    let list = properties;

    if (sortCategory === "all") {
      list = properties.filter(p => {
        if (filterType !== "all" && p.type !== filterType) return false;
        if (filterDistrict !== "all" && p.district !== filterDistrict) return false;
        if (filterAgent !== "all" && p.agentName !== filterAgent) return false;
        
        if (filterDealType !== "all" && p.dealType) {
          try {
            const dealTypesArray = Array.isArray(p.dealType) ? p.dealType : [String(p.dealType)];
            if (!dealTypesArray.some(type => String(type).includes(filterDealType))) return false;
          } catch (e) {
            console.error("DealType filtering error:", e);
            return false;
          }
        }
        return true;
      });
      // Sort newest first by default in "all" view
      list = list.sort((a, b) => b.id - a.id);
    } else {
      switch (sortCategory) {
        case "featured":
          list = properties.filter(p => p.featured).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          break;
        case "urgent":
          list = properties.filter(p => p.isUrgent).sort((a, b) => (a.urgentOrder || 0) - (b.urgentOrder || 0));
          break;
        case "negotiable":
          list = properties.filter(p => p.isNegotiable).sort((a, b) => (a.negotiableOrder || 0) - (b.negotiableOrder || 0));
          break;
        case "longTerm":
          list = properties.filter(p => p.isLongTerm).sort((a, b) => (a.longTermOrder || 0) - (b.longTermOrder || 0));
          break;
      }
    }

    return list;
  }, [properties, filterType, filterDistrict, filterDealType, filterAgent, sortCategory]);

  const agentNames = useMemo(() => 
    Array.from(new Set(properties.map(p => p.agentName).filter(Boolean))),
  [properties]);

  // Pagination Logic
  const itemsPerPage = 20;
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem('adminPropertyPage');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('adminPropertyPage', page.toString());
  }, [page]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredProperties.slice(start, start + itemsPerPage);
  }, [filteredProperties, page]);

  // Reset page to 1 when filters change, but skip the first render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [filterType, filterDistrict, filterDealType, filterAgent, sortCategory]);

  const isFiltered = filterType !== "all" || filterDistrict !== "all" || filterDealType !== "all" || filterAgent !== "all";
  const dragDisabled = sortCategory === "all";

  // Fetch configs
  const { data: configs } = useAdminQuery<any>(["/api/admin/config"], { enabled: isAdmin });

  // Update limit input when sortCategory changes
  useEffect(() => {
    if (configs) {
      const keyMap: Record<string, string> = {
        all: "home_latest_limit",
        featured: "home_featured_limit",
        urgent: "home_urgent_limit",
        negotiable: "home_negotiable_limit",
        longTerm: "home_long_term_limit",
      };
      const key = keyMap[sortCategory] || "home_latest_limit";
      const conf = configs.find((c: any) => c.key === key);
      setLimitInput(conf ? conf.value : "4");
      setLimitInput(conf ? conf.value : "4");
    }
  }, [sortCategory, configs]);

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: any }) => {
      await apiRequest("PATCH", `/api/properties/${id}/${field}`, { [field]: value });
    },
    onMutate: async ({ id, field, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/admin/properties"] });

      // Snapshot the previous state (find exact match of cache array)
      const queryParams = { skipCache: false };
      const cacheKey = ["/api/admin/properties", queryParams];
      const previousProperties = queryClient.getQueryData(cacheKey);

      // Optimistically update the cache
      if (previousProperties) {
        queryClient.setQueryData(cacheKey, (old: any) => {
          if (!old) return old;
          return old.map((p: any) => {
            if (p.id === id) {
              const propField = field === 'visibility' ? 'isVisible' : 
                                field === 'long-term' ? 'isLongTerm' :
                                field === 'urgent' ? 'isUrgent' :
                                field === 'negotiable' ? 'isNegotiable' : field;
              return { ...p, [propField]: value };
            }
            return p;
          });
        });
      }

      return { previousProperties, cacheKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(context.cacheKey, context.previousProperties);
      }
      toast({ title: "상태 변경 실패", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      // Eagerly fetch the new properties data using predicate to match substring query strings
      queryClient.refetchQueries({ 
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/properties'),
        type: 'all'
      });
    }
  });

  const configMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("POST", "/api/admin/config", { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/urgent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/negotiable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/long-term"] });
      toast({ title: "설정 완료", description: "메인페이지 노출 개수가 변경되었습니다." });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order, category }: { id: number; order: number; category: SortCategory }) => {
      if (category === "featured") {
        await apiRequest("PUT", `/api/properties/${id}/order`, { displayOrder: order });
      } else if (category === "urgent") {
        await apiRequest("PUT", `/api/properties/${id}/urgent-order`, { urgentOrder: order });
      } else if (category === "negotiable") {
        await apiRequest("PUT", `/api/properties/${id}/negotiable-order`, { negotiableOrder: order });
      } else if (category === "longTerm") {
        await apiRequest("PUT", `/api/properties/${id}/long-term-order`, { longTermOrder: order });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      // Invalidate frontend queries to immediately reflect changes on homepage using predicate wrapper
      queryClient.refetchQueries({ 
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/properties'),
        type: 'all'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      toast({ title: "매물 삭제", description: "매물이 성공적으로 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      queryClient.refetchQueries({ 
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/properties'),
        type: 'all'
      });
    },
    onError: (err: Error) => {
      toast({ title: "삭제 실패", description: err.message, variant: "destructive" });
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm("정말로 이 매물을 삭제하시겠습니까? 이 작업은 복구할 수 없습니다.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || dragDisabled) return;
    const startIndex = (page - 1) * itemsPerPage + result.source.index;
    const endIndex = (page - 1) * itemsPerPage + result.destination.index;

    const items = Array.from(filteredProperties);
    const [reorderedItem] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, reorderedItem);
    
    items.forEach((item, idx) => {
      let isOrderChanged = false;
      if (sortCategory === "featured" && item.displayOrder !== idx) isOrderChanged = true;
      if (sortCategory === "urgent" && item.urgentOrder !== idx) isOrderChanged = true;
      if (sortCategory === "negotiable" && item.negotiableOrder !== idx) isOrderChanged = true;
      if (sortCategory === "longTerm" && item.longTermOrder !== idx) isOrderChanged = true;
      
      if (isOrderChanged) {
        updateOrderMutation.mutate({ id: item.id, order: idx, category: sortCategory });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6">
        {/* Sort Controls */}
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">홈페이지 테마별 진열 순서 관리</h3>
               <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">메인 탭 노출과 연동</span>
             </div>
             <p className="text-[11px] text-slate-400 mb-3">메인 화면의 최근매물, 초급매물 및 추천 매물에 노출되는 순서를 관리합니다.</p>
             <div className="flex flex-wrap gap-2">
               <Button variant={sortCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSortCategory("all")} className={sortCategory === "all" ? "bg-slate-800 font-bold" : "text-xs font-medium"}>전체(최근등록순)</Button>
               <Button variant={sortCategory === "urgent" ? "default" : "outline"} size="sm" onClick={() => setSortCategory("urgent")} className={sortCategory === "urgent" ? "bg-red-600 hover:bg-red-700 text-white border-none font-bold shadow-sm" : "border-red-200 text-red-600 text-xs"}>🔥 초급매물 탭</Button>
               <Button variant={sortCategory === "featured" ? "default" : "outline"} size="sm" onClick={() => setSortCategory("featured")} className={sortCategory === "featured" ? "bg-orange-500 hover:bg-orange-600 text-white border-none font-bold shadow-sm" : "border-orange-200 text-orange-600 text-xs"}>⭐ 추천매물</Button>
               <Button variant={sortCategory === "negotiable" ? "default" : "outline"} size="sm" onClick={() => setSortCategory("negotiable")} className={sortCategory === "negotiable" ? "bg-blue-600 hover:bg-blue-700 text-white border-none font-bold shadow-sm" : "border-blue-200 text-blue-600 text-xs"}>🤝 가격협의</Button>
               <Button variant={sortCategory === "longTerm" ? "default" : "outline"} size="sm" onClick={() => setSortCategory("longTerm")} className={sortCategory === "longTerm" ? "bg-purple-600 hover:bg-purple-700 text-white border-none font-bold shadow-sm" : "border-purple-200 text-purple-600 text-xs"}>📈 장기투자</Button>
             </div>
             {true && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">메인페이지 노출 개수:</span>
                  <Input 
                    type="number" 
                    min="1" max="20" 
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-16 h-8 text-sm px-2 text-center" 
                  />
                  <Button 
                    size="sm" 
                    className="h-8"
                    disabled={configMutation.isPending}
                    onClick={() => {
                      const keyMap: Record<string, string> = {
                        all: "home_latest_limit",
                        featured: "home_featured_limit",
                        urgent: "home_urgent_limit",
                        negotiable: "home_negotiable_limit",
                        longTerm: "home_long_term_limit",
                      };
                      const key = keyMap[sortCategory] || "home_latest_limit";
                      if (key) {
                        configMutation.mutate({ key, value: limitInput });
                      }
                    }}
                  >저장</Button>
                </div>
             )}
          </div>
        )}

        {/* Text Filters (Disabled if actively sorting a category) */}
        <div className={`flex-1 grid grid-cols-2 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 transition-opacity ${sortCategory !== "all" ? "opacity-30 pointer-events-none" : ""}`}>
          <div className={isAdmin ? "md:col-span-4" : "md:col-span-3"}><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">상세 검색 (전체보기 전용)</h3></div>
          <FilterSelect label="유형" value={filterType} onChange={setFilterType} options={[{value: "all", label: "모든 유형"}, ...PROPERTY_TYPES]} />
          <FilterSelect label="지역" value={filterDistrict} onChange={setFilterDistrict} options={[{value: "all", label: "모든 지역"}, ...DISTRICTS.map(d => ({value: d, label: d}))]} />
          <FilterSelect label="거래" value={filterDealType} onChange={setFilterDealType} options={[{value: "all", label: "모든 거래"}, ...DEAL_TYPES]} />
          {isAdmin && (
            <FilterSelect label="중개사" value={filterAgent} onChange={setFilterAgent} options={[{value: "all", label: "모든 중개사"}, ...agentNames.map(n => ({value: n, label: n}))]} />
          )}
        </div>
      </div>

      <AdminTabWrapper isLoading={isLoading} isError={isError} error={error} isEmpty={properties.length === 0} emptyMessage="매물이 없습니다." onRetry={refetch}>
        <div id="admin-list-top" className="scroll-mt-20 border rounded-xl overflow-hidden bg-white shadow-sm">
          {sortCategory !== "all" && (
            <div className="bg-primary/5 text-primary px-4 py-3 text-sm font-bold border-b border-primary/10 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> 현재 [{
                sortCategory === 'urgent' ? '🔥 초급매물' :
                sortCategory === 'featured' ? '⭐ 추천매물' :
                sortCategory === 'negotiable' ? '🤝 가격협의' : '📈 장기투자'
              }] 정렬 모드입니다. 드래그하여 홈페이지 노출 순서를 변경하세요.
            </div>
          )}
          {sortCategory === "all" && isFiltered && (
            <div className="bg-amber-50 text-amber-800 px-4 py-2 text-xs font-medium border-b border-amber-100 flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> 필터 활성화 중입니다.
            </div>
          )}
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  {!dragDisabled && <TableHead className="w-10 text-center cursor-help" title="드래그하여 순서 변경">순서</TableHead>}
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.length > 0 && selectedIds.length === filteredProperties.length} onCheckedChange={(v) => setSelectedIds(v ? filteredProperties.map(p => p.id) : [])} />
                  </TableHead>
                  <TableHead>매물 정보</TableHead>
                  <TableHead className="hidden md:table-cell">상세 주소</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>뱃지 컨트롤</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <Droppable droppableId="properties" isDropDisabled={dragDisabled}>
                {(provided) => (
                  <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                    {paginatedProperties.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">해당 조건의 매물이 없습니다.</TableCell></TableRow>
                    ) : paginatedProperties.map((p, idx) => (
                      <Draggable key={p.id} draggableId={p.id.toString()} index={idx} isDragDisabled={dragDisabled}>
                        {(provided, snapshot) => (
                          <TableRow ref={provided.innerRef} {...provided.draggableProps} className={`${snapshot.isDragging ? 'bg-primary/5 shadow-md border border-primary/20' : 'hover:bg-slate-50/50'} group transition-colors`}>
                            {!dragDisabled && (
                              <TableCell {...provided.dragHandleProps} className="text-slate-300 hover:text-primary transition-colors cursor-grab">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-5 w-5" />
                                  <span className="text-xs font-bold text-slate-400">TOP {(page - 1) * itemsPerPage + idx + 1}</span>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={(v) => setSelectedIds(v ? [...selectedIds, p.id] : selectedIds.filter(id => id !== p.id))} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <a href={`/properties/${p.id}`} target="_blank" className="h-12 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border block relative group/preview">
                                  {p.imageUrls?.[0] ? <img src={p.imageUrls[0]} className="w-full h-full object-cover transition-transform group-hover/preview:scale-110" /> : <Eye className="h-4 w-4 m-auto text-slate-300 mt-4" />}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="h-4 w-4 text-white" />
                                  </div>
                                </a>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-[350px]" title={p.title}>{p.title}</div>
                                  <div className="text-[10px] text-slate-400 md:hidden">{p.district} • {p.type}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-600">
                              <span className="font-medium text-slate-800">[{p.district}]</span> {p.address}
                            </TableCell>
                            <TableCell className="font-bold text-primary text-sm whitespace-nowrap">
                              {formatPrice(p.price)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[130px]">
                                <StatusBadge active={p.isVisible} label="노출" onClick={() => toggleMutation.mutate({ id: p.id, field: 'visibility', value: !p.isVisible })} />
                                <StatusBadge active={p.isUrgent} label="초급매" color="red" onClick={() => toggleMutation.mutate({ id: p.id, field: 'urgent', value: !p.isUrgent })} />
                                <StatusBadge active={p.featured} label="추천" color="purple" onClick={() => toggleMutation.mutate({ id: p.id, field: 'featured', value: !p.featured })} />
                                <StatusBadge active={p.isNegotiable} label="협의" color="blue" onClick={() => toggleMutation.mutate({ id: p.id, field: 'negotiable', value: !p.isNegotiable })} />
                                <StatusBadge active={p.isLongTerm} label="장기" color="orange" onClick={() => toggleMutation.mutate({ id: p.id, field: 'long-term', value: !p.isLongTerm })} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="미리보기" asChild><a href={`/properties/${p.id}`} target="_blank"><Eye className="h-4 w-4 text-blue-500" /></a></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="수정" asChild><a href={`/admin/properties/edit/${p.id}`}><Edit className="h-4 w-4 text-slate-500" /></a></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending} className="h-8 w-8 text-red-400 hover:text-red-500" title="삭제"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => { setPage(p => Math.max(1, p - 1)); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} 
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNum = page - 2 + i;
                    if (page <= 2) pageNum = i + 1;
                    else if (page >= totalPages - 1) pageNum = totalPages - 4 + i;
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            isActive={page === pageNum} 
                            onClick={() => { setPage(pageNum); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => { setPage(p => Math.min(totalPages, p + 1)); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} 
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </AdminTabWrapper>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-1.5 flex-1 min-w-[150px]">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200"><SelectValue /></SelectTrigger>
        <SelectContent className="rounded-xl">
          {options.map((o: any) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function StatusBadge({ active, label, onClick, color = "green" }: any) {
  const colors: any = {
    green: active ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200",
    purple: active ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200",
    red: active ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200",
    blue: active ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200",
    orange: active ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
  };
  return (
    <button onClick={onClick} className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${colors[color]}`}>
      {label}
    </button>
  );
}

function formatPrice(price: any) {
  if (!price) return '0원';
  
  // 이미 문자열 포맷팅이 된 경우 바이패스
  if (typeof price === 'string' && (price.includes('억') || price.includes('만'))) {
    return price;
  }
  
  // 문자열에서 숫자만 추출
  const numPrice = Number(typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price);
  if (isNaN(numPrice) || numPrice === 0) return '0원';
  
  // 한국어 단위 변환 헬퍼 (ex: 3500 -> 3천5백)
  const formatMan = (manVal: number) => {
    if (manVal === 0) return '';
    let res = '';
    const cheon = Math.floor(manVal / 1000);
    const baek = Math.floor((manVal % 1000) / 100);
    const rest = manVal % 100;
    
    if (cheon > 0) res += `${cheon}천`;
    if (baek > 0) res += `${baek}백`;
    if (rest > 0) res += rest.toString();
    
    return res;
  };
  
  // DB 값이 '원' 단위라고 가정 (1,000,000 이상이면 원 단위 계산)
  if (numPrice >= 100000000) { // 1억 이상
    const eok = Math.floor(numPrice / 100000000);
    const remainder = numPrice % 100000000;
    
    if (remainder === 0) return `${eok}억원`;
    
    const man = Math.floor(remainder / 10000);
    if (man === 0) return `${eok}억원`;
    
    return `${eok}억 ${formatMan(man)}만원`;
  } else if (numPrice >= 10000) { // 1억 미만 1만 이상
    const man = Math.floor(numPrice / 10000);
    return `${formatMan(man)}만원`;
  }
  
  return `${numPrice.toLocaleString()}원`;
}

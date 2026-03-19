import React from "react";
import {
    Loader2,
    Trash2,
    Plus,
    FileSpreadsheet,
    GripVertical,
    Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Property, User } from "@shared/schema";
import { formatKoreanPrice } from "@/lib/formatter";

interface PropertyTabProps {
    user: User | null;
    selectedProperties: number[];
    setSelectedProperties: (ids: number[]) => void;
    isLoadingProperties: boolean;
    filteredProperties: Property[];
    filterType: string;
    setFilterType: (value: string) => void;
    filterDistrict: string;
    setFilterDistrict: (value: string) => void;
    filterDealType: string;
    setFilterDealType: (value: string) => void;
    filterAgent: string;
    setFilterAgent: (value: string) => void;
    propertyTypes: { value: string; label: string }[];
    districts: { value: string; label: string }[];
    dealTypes: { value: string; label: string }[];
    agentNames: string[];
    handleAllPropertiesDragEnd: (result: any) => void;
    handleSelectAllProperties: (checked: boolean) => void;
    handleSelectProperty: (id: number, checked: boolean) => void;
    toggleUrgentMutation: any;
    toggleNegotiableMutation: any;
    toggleLongTermMutation: any;
    toggleFeaturedMutation: any;
    toggleVisibilityMutation: any;
    handleIndividualDelete: (id: number, type: 'property') => void;
    openDeleteConfirm: (type: 'properties') => void;
    setIsImportModalOpen: (open: boolean) => void;
    adminPropertiesPage: number;
    setAdminPropertiesPage: (page: number) => void;
    totalPropertyPages: number;
    SmartPagination: React.ComponentType<{
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }>;
}

export const PropertyTab: React.FC<PropertyTabProps> = ({
    user,
    selectedProperties,
    isLoadingProperties,
    filteredProperties,
    filterType,
    setFilterType,
    filterDistrict,
    setFilterDistrict,
    filterDealType,
    setFilterDealType,
    filterAgent,
    setFilterAgent,
    propertyTypes,
    districts,
    dealTypes,
    agentNames,
    handleAllPropertiesDragEnd,
    handleSelectAllProperties,
    handleSelectProperty,
    toggleUrgentMutation,
    toggleNegotiableMutation,
    toggleLongTermMutation,
    toggleFeaturedMutation,
    toggleVisibilityMutation,
    handleIndividualDelete,
    openDeleteConfirm,
    setIsImportModalOpen,
    adminPropertiesPage,
    setAdminPropertiesPage,
    totalPropertyPages,
    SmartPagination
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold">부동산 관리</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {selectedProperties.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm('properties')} className="flex-1 sm:flex-none">
                            <Trash2 className="h-4 w-4 mr-1" />
                            삭제 ({selectedProperties.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-50 flex-1 sm:flex-none" onClick={() => setIsImportModalOpen(true)}>
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        스프레드시트
                    </Button>
                    <a href="/admin/properties/new" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md inline-flex items-center text-sm font-medium flex-1 sm:flex-none justify-center">
                        <Plus className="h-4 w-4 mr-1" />
                        신규 등록
                    </a>
                </div>
            </div>

            {/* 필터 UI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">유형</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="모든 유형" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">모든 유형</SelectItem>
                            {propertyTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">지역</label>
                    <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="모든 지역" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">모든 지역</SelectItem>
                            {districts.map((district) => (
                                <SelectItem key={district.value} value={district.value}>{district.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">거래</label>
                    <Select value={filterDealType} onValueChange={setFilterDealType}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="전체" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">모든 거래 유형</SelectItem>
                            {dealTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">중개사</label>
                    <Select value={filterAgent} onValueChange={setFilterAgent}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="전체" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 중개사</SelectItem>
                            {agentNames.map((name: string) => (
                                <SelectItem key={name} value={name || ""}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoadingProperties ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto rounded-md border">
                        {(filterType === 'all' && filterDistrict === 'all' && filterDealType === 'all' && filterAgent === 'all') ? (
                            <DragDropContext onDragEnd={handleAllPropertiesDragEnd}>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]"><GripVertical className="h-4 w-4 text-gray-400" /></TableHead>
                                            <TableHead className="w-[40px]"><Checkbox checked={selectedProperties.length === (filteredProperties?.length || 0)} onCheckedChange={handleSelectAllProperties} /></TableHead>
                                            <TableHead className="w-[60px]">ID</TableHead>
                                            <TableHead className="min-w-[200px]">매물명/이미지</TableHead>
                                            <TableHead className="w-[100px]">유형</TableHead>
                                            <TableHead className="w-[150px]">가격</TableHead>
                                            {user?.role === 'admin' && (
                                                <>
                                                    <TableHead className="w-[40px] px-1 text-center">급</TableHead>
                                                    <TableHead className="w-[40px] px-1 text-center">흥</TableHead>
                                                    <TableHead className="w-[40px] px-1 text-center">장</TableHead>
                                                    <TableHead className="w-[40px] px-1 text-center">추</TableHead>
                                                </>
                                            )}
                                            <TableHead className="w-[80px]">노출</TableHead>
                                            <TableHead className="w-[100px]">작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <Droppable droppableId="all-properties">
                                        {(provided) => (
                                            <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                                {!filteredProperties || filteredProperties.length === 0 ? (
                                                    <TableRow><TableCell colSpan={12} className="text-center py-8">결과가 없습니다.</TableCell></TableRow>
                                                ) : (
                                                    filteredProperties.slice(0, 50).map((property, index) => (
                                                        <Draggable key={property.id} draggableId={property.id.toString()} index={index}>
                                                            {(provided) => (
                                                                <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                                                    <TableCell {...provided.dragHandleProps}><GripVertical className="h-4 w-4 text-gray-400" /></TableCell>
                                                                    <TableCell><Checkbox checked={selectedProperties.includes(property.id)} onCheckedChange={(c) => handleSelectProperty(property.id, c === true)} /></TableCell>
                                                                    <TableCell className="text-xs">{property.id}</TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-2">
                                                                            {property.imageUrls?.[0] && <img src={property.imageUrls[0]} className="w-12 h-8 object-cover rounded" alt="" />}
                                                                            <span className="font-medium truncate max-w-[150px]">{property.title}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">{property.type}</TableCell>
                                                                    <TableCell className="text-xs font-bold text-blue-600">
                                                                        {Number(property.price) > 0 ? formatKoreanPrice(property.price) :
                                                                            (Number(property.deposit) || Number(property.depositAmount)) > 0 ? `보 ${formatKoreanPrice(property.deposit || property.depositAmount)}${Number(property.monthlyRent) > 0 ? ` / 월 ${formatKoreanPrice(property.monthlyRent)}` : ''}` :
                                                                                Number(property.monthlyRent) > 0 ? `월 ${formatKoreanPrice(property.monthlyRent)}` : '-'}
                                                                    </TableCell>
                                                                    {user?.role === 'admin' && (
                                                                        <>
                                                                            <TableCell className="text-center"><Checkbox checked={property.isUrgent} onCheckedChange={(c) => toggleUrgentMutation.mutate({ propertyId: property.id, isUrgent: c === true })} /></TableCell>
                                                                            <TableCell className="text-center"><Checkbox checked={property.isNegotiable} onCheckedChange={(c) => toggleNegotiableMutation.mutate({ propertyId: property.id, isNegotiable: c === true })} /></TableCell>
                                                                            <TableCell className="text-center"><Checkbox checked={property.isLongTerm} onCheckedChange={(c) => toggleLongTermMutation.mutate({ propertyId: property.id, isLongTerm: c === true })} /></TableCell>
                                                                            <TableCell className="text-center"><Checkbox checked={property.featured} onCheckedChange={(c) => toggleFeaturedMutation.mutate({ propertyId: property.id, featured: c === true })} /></TableCell>
                                                                        </>
                                                                    )}
                                                                    <TableCell>
                                                                        <Button size="sm" variant={property.isVisible ? "default" : "outline"} className="h-7 px-2 text-[10px]" onClick={() => toggleVisibilityMutation.mutate({ propertyId: property.id, isVisible: !property.isVisible })}>
                                                                            {property.isVisible ? "노출" : "숨김"}
                                                                        </Button>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-1">
                                                                            <a href={`/admin/properties/edit/${property.id}`} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit className="h-4 w-4" /></a>
                                                                            <button onClick={() => handleIndividualDelete(property.id, 'property')} className="p-1.5 hover:bg-gray-100 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                )}
                                                {provided.placeholder}
                                            </TableBody>
                                        )}
                                    </Droppable>
                                </Table>
                            </DragDropContext>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]"><Checkbox checked={selectedProperties.length === (filteredProperties?.length || 0)} onCheckedChange={handleSelectAllProperties} /></TableHead>
                                        <TableHead className="w-[80px]">ID</TableHead>
                                        <TableHead>매물명/가격</TableHead>
                                        <TableHead className="w-[100px]">유형</TableHead>
                                        {user?.role === 'admin' && (
                                            <>
                                                <TableHead className="w-[40px] px-1 text-center">급</TableHead>
                                                <TableHead className="w-[40px] px-1 text-center">흥</TableHead>
                                                <TableHead className="w-[40px] px-1 text-center">장</TableHead>
                                                <TableHead className="w-[40px] px-1 text-center">추</TableHead>
                                            </>
                                        )}
                                        <TableHead className="w-[120px]">작업</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!filteredProperties || filteredProperties.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} className="text-center py-8">결과가 없습니다.</TableCell></TableRow>
                                    ) : (
                                        filteredProperties.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell><Checkbox checked={selectedProperties.includes(p.id)} onCheckedChange={(c) => handleSelectProperty(p.id, c === true)} /></TableCell>
                                                <TableCell className="text-xs">{p.id}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {p.imageUrl && <img src={p.imageUrl} className="w-12 h-8 object-cover rounded" alt="" />}
                                                        <div>
                                                            <div className="font-medium text-sm">{p.title}</div>
                                                            <div className="text-xs font-bold text-blue-600">
                                                                {Number(p.price) > 0 ? formatKoreanPrice(p.price) :
                                                                    (Number(p.deposit) || Number(p.depositAmount)) > 0 ? `보 ${formatKoreanPrice(p.deposit || p.depositAmount)}${Number(p.monthlyRent) > 0 ? ` / 월 ${formatKoreanPrice(p.monthlyRent)}` : ''}` :
                                                                        Number(p.monthlyRent) > 0 ? `월 ${formatKoreanPrice(p.monthlyRent)}` : '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">{p.type}</TableCell>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <TableCell className="text-center"><Checkbox checked={p.isUrgent} onCheckedChange={(c) => toggleUrgentMutation.mutate({ propertyId: p.id, isUrgent: c === true })} /></TableCell>
                                                        <TableCell className="text-center"><Checkbox checked={p.isNegotiable} onCheckedChange={(c) => toggleNegotiableMutation.mutate({ propertyId: p.id, isNegotiable: c === true })} /></TableCell>
                                                        <TableCell className="text-center"><Checkbox checked={p.isLongTerm} onCheckedChange={(c) => toggleLongTermMutation.mutate({ propertyId: p.id, isLongTerm: c === true })} /></TableCell>
                                                        <TableCell className="text-center"><Checkbox checked={p.featured} onCheckedChange={(c) => toggleFeaturedMutation.mutate({ propertyId: p.id, featured: c === true })} /></TableCell>
                                                    </>
                                                )}
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <a href={`/admin/properties/edit/${p.id}`} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit className="h-4 w-4" /></a>
                                                        <button onClick={() => handleIndividualDelete(p.id, 'property')} className="p-1.5 hover:bg-gray-100 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {filteredProperties?.map((p) => (
                            <div key={p.id} className="bg-white border rounded-lg p-3 shadow-sm border-l-4 border-l-blue-500">
                                <div className="flex gap-3">
                                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                        {p.imageUrls?.[0] ? <img src={p.imageUrls[0]} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400 text-[10px]">No Img</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold text-slate-400">#{p.id}</span>
                                            <Checkbox checked={selectedProperties.includes(p.id)} onCheckedChange={(c) => handleSelectProperty(p.id, c === true)} />
                                        </div>
                                        <h4 className="font-bold text-sm truncate">{p.title}</h4>
                                        <div className="text-xs font-bold text-red-500 mt-1">{formatKoreanPrice(p.price)}</div>
                                        <div className="flex gap-2 mt-2">
                                            <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1" asChild><a href={`/admin/properties/edit/${p.id}`}>수정</a></Button>
                                            <Button size="sm" variant="ghost" className="text-[10px] h-7 text-red-500 border border-red-200" onClick={() => handleIndividualDelete(p.id, 'property')}>삭제</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPropertyPages > 1 && (
                        <div className="mt-8 flex justify-center pt-4 border-t">
                            <SmartPagination
                                currentPage={adminPropertiesPage}
                                totalPages={totalPropertyPages}
                                onPageChange={setAdminPropertiesPage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

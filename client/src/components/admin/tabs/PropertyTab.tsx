import React from "react";
import {
    Loader2,
    Trash2,
    Plus,
    FileSpreadsheet,
    GripVertical,
    Edit,
    Zap
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
import { Badge } from "@/components/ui/badge";
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

                    {/* Mobile View: Luxe Card Layout */}
                    <div className="md:hidden space-y-4">
                        {filteredProperties?.map((p) => (
                            <div
                                key={p.id}
                                className="luxe-card relative bg-white border border-slate-200"
                            >
                                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                                    {p.imageUrls && (p.imageUrls as string[]).length > 0 ? (
                                        <img
                                            src={(p.imageUrls as string[])[0]}
                                            alt={p.title}
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                            <div className="text-sm font-medium">NO IMAGE</div>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <Badge className="bg-slate-900/80 text-white border-none luxe-badge">
                                            ID {p.id}
                                        </Badge>
                                        {p.isUrgent && (
                                            <Badge className="bg-amber-500 text-white border-none luxe-badge">
                                                URGENT
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Checkbox
                                            checked={selectedProperties.includes(p.id)}
                                            onCheckedChange={(checked) => handleSelectProperty(p.id, checked === true)}
                                            className="h-6 w-6 border-2 border-white bg-white/20 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </div>

                                    {!p.isVisible && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <Badge variant="outline" className="text-white border-white border-2 px-4 py-1.5 font-bold tracking-widest luxe-badge bg-transparent">
                                                PRIVATE LISTING
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="border-slate-200 text-slate-600 luxe-badge lowercase">
                                            {p.type} / {p.dealType}
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-400">{p.district}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3 truncate">
                                        {p.title}
                                    </h3>
                                    <div className="text-xl font-extrabold text-primary mb-5">
                                        {formatKoreanPrice(p.price)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="w-full h-11 border-slate-200 hover:bg-slate-50 font-bold"
                                            onClick={() => window.location.href = `/admin/properties/edit/${p.id}`}
                                        >
                                            편집하기
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full h-11 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                                            onClick={() => handleIndividualDelete(p.id, 'property')}
                                        >
                                            삭제
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {
                        totalPropertyPages > 1 && (
                            <div className="mt-8 flex justify-center pt-4 border-t">
                                <SmartPagination
                                    currentPage={adminPropertiesPage}
                                    totalPages={totalPropertyPages}
                                    onPageChange={setAdminPropertiesPage}
                                />
                            </div>
                        )
                    }
                </div >
            )}
        </div >
    );
};

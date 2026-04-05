import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

// 커스텀 탭 컴포넌트 임포트
import { PropertyFormData } from "@/components/admin/property-form/types";
import { BasicInfoTab } from "@/components/admin/property-form/BasicInfoTab";
import { DetailInfoTab } from "@/components/admin/property-form/DetailInfoTab";
import { LandInfoTab } from "@/components/admin/property-form/LandInfoTab";
import { PriceInfoTab } from "@/components/admin/property-form/PriceInfoTab";
import { ContactInfoTab } from "@/components/admin/property-form/ContactInfoTab";
import { AdditionalInfoTab } from "@/components/admin/property-form/AdditionalInfoTab";

// 기본 이미지 경로 (public 폴더에서 제공)
const defaultPropertyImage = "/uploads/default-property.png";

function PropertyFormContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const params = useParams<{ id?: string }>();
    const [, setLocation] = useLocation();
    const isEditMode = !!params.id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);

    // 이미지 업로드 관련 상태
    const [uploadedImages, setUploadedImages] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [featuredImageIndex, setFeaturedImageIndex] = useState(0);

    // 기본 이미지 가져오기
    const getDefaultImageForPropertyType = (type?: string) => {
        return defaultPropertyImage;
    };

    // 폼 상태 설정
    const [formData, setFormData] = useState<PropertyFormData>({
        title: "",
        description: "",
        type: "주택",
        price: "",
        address: "",
        city: "인천", // city 필드에 기본값 지정
        district: "기타지역", // 기본값 설정
        size: "",
        bedrooms: 0,
        bathrooms: 0,
        imageUrls: [], // 다중 이미지 저장용 배열
        agentId: 4, // 기본 에이전트 ID 설정 (정현우 중개사)
        featured: false,
        isLongTerm: false,

        // 위치 정보
        buildingName: "",
        unitNumber: "",

        // 면적 정보
        supplyArea: "",
        privateArea: "",
        areaSize: "",

        // 건물 정보
        floor: "",
        totalFloors: 0, // 숫자로 초기화
        floorLevel: "", // 층수표시 (고/중/저)
        direction: "",
        elevator: false,
        parking: "",
        heatingSystem: "",
        approvalDate: "",

        // 토지 정보
        landType: "", // 지목
        zoneType: "", // 용도지역

        // 금액 정보
        dealType: ["매매"],
        deposit: "",
        depositAmount: "", // 추가된 필드
        monthlyRent: "",
        maintenanceFee: "",

        // 연락처 정보
        ownerName: "",
        ownerPhone: "",
        tenantName: "",
        tenantPhone: "",
        clientName: "",
        clientPhone: "",

        // 추가 정보
        specialNote: "",
        coListing: false,
        agentName: "이가이버 공인중개사", // 담당중개사 이름 (기본값)
        privateNote: "",
        youtubeUrl: "", // 유튜브 영상 URL
        featuredImageIndex: 0, // 대표 이미지 인덱스 추가
        ownerId: null, // 소유자 ID (중개사 ID) 추가
        isActive: true, // 활성 상태 추가
        isSold: false, // 매각 여부 추가
        isVisible: true, // 노출 여부 추가
    });

    // 편집 모드일 경우 기존 데이터 로드
    useEffect(() => {
        if (isEditMode && params.id) {
            const fetchProperty = async () => {
                try {
                    setLoading(true);
                    console.log("부동산 ID:", params.id);
                    const response = await fetch(`/api/properties/${params.id}`);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log("불러온 부동산 데이터:", data);

                    // 단일 이미지 필드 제거 및 연결할 필드들 정리
                    const { imageUrl, ...restData } = data;

                    // 안전한 타입 변환을 위한 헬퍼 (string, number, 혹은 빈 문자열 보장)
                    const safeString = (val: any) => (val !== null && val !== undefined) ? String(val) : "";
                    const safeNumber = (val: any, defaultVal = 0) => {
                        const num = Number(val);
                        return isNaN(num) ? defaultVal : num;
                    };
                    const safeBoolean = (val: any) => Boolean(val);

                    // 데이터 유효성 검사 및 정규화
                    let normalizedDealType = ["매매"];
                    if (Array.isArray(data.dealType)) {
                        normalizedDealType = data.dealType;
                    } else if (typeof data.dealType === 'string' && data.dealType.trim() !== "") {
                        normalizedDealType = [data.dealType];
                    }

                    setFormData((prev) => ({
                        ...prev,
                        ...restData,
                        title: safeString(data.title),
                        address: safeString(data.address),
                        type: safeString(data.type) || "기타",
                        district: safeString(data.district) || "기타지역",
                        city: safeString(data.city) || "인천",
                        price: safeString(data.price),
                        size: safeString(data.size),
                        bedrooms: safeNumber(data.bedrooms),
                        bathrooms: safeNumber(data.bathrooms),

                        // 필수 필드 데이터 보완
                        agentId: safeNumber(data.agentId, 4), // 기본값 4 (정현우 중개사)
                        dealType: normalizedDealType,
                        deposit: safeString(data.deposit),
                        depositAmount: safeString(data.depositAmount),
                        monthlyRent: safeString(data.monthlyRent),
                        maintenanceFee: safeString(data.maintenanceFee),

                        elevator: safeBoolean(data.elevator),
                        coListing: safeBoolean(data.coListing),
                        featured: safeBoolean(data.featured),
                        isLongTerm: safeBoolean(data.isLongTerm),
                        isActive: data.isActive !== undefined ? safeBoolean(data.isActive) : true,
                        isSold: safeBoolean(data.isSold),
                        isVisible: data.isVisible !== undefined ? safeBoolean(data.isVisible) : true,

                        agentName: safeString(data.agentName) || (!safeBoolean(data.coListing) ? "이가이버 공인중개사" : ""),

                        // 건물/면적/위치 
                        buildingName: safeString(data.buildingName),
                        unitNumber: safeString(data.unitNumber),
                        supplyArea: safeString(data.supplyArea),
                        privateArea: safeString(data.privateArea),
                        areaSize: safeString(data.areaSize),

                        floor: safeString(data.floor),
                        totalFloors: safeNumber(data.totalFloors),
                        floorLevel: safeString(data.floorLevel),
                        direction: safeString(data.direction),
                        parking: safeString(data.parking),
                        heatingSystem: safeString(data.heatingSystem),
                        approvalDate: safeString(data.approvalDate),

                        // 토지
                        landType: safeString(data.landType),
                        zoneType: safeString(data.zoneType),

                        // 연락처 및 부가정보
                        ownerName: safeString(data.ownerName),
                        ownerPhone: safeString(data.ownerPhone),
                        tenantName: safeString(data.tenantName),
                        tenantPhone: safeString(data.tenantPhone),
                        clientName: safeString(data.clientName),
                        clientPhone: safeString(data.clientPhone),
                        specialNote: safeString(data.specialNote),
                        privateNote: safeString(data.privateNote),
                        youtubeUrl: safeString(data.youtubeUrl),

                        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
                        featuredImageIndex: safeNumber(data.featuredImageIndex)
                    }));

                    // 이미지 처리: 배열 먼저 확인하고, 없으면 단일 이미지 확인
                    let imageList: string[] = [];

                    if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
                        // 이미지 배열 사용
                        imageList = [...data.imageUrls];
                    } else if (data.imageUrl) {
                        // 단일 이미지가 있으면 배열에 추가
                        imageList = [data.imageUrl];
                    }

                    // 이미지 객체 배열로 변환
                    if (imageList.length > 0) {
                        const images = imageList.map((url, index) => ({
                            id: Date.now() + index,
                            url: url
                        }));
                        setUploadedImages(images);

                        // 대표 이미지 인덱스 설정
                        if (data.featuredImageIndex !== undefined && data.featuredImageIndex !== null) {
                            setFeaturedImageIndex(Number(data.featuredImageIndex));
                        } else if (data.imageUrl) {
                            const representativeIndex = imageList.findIndex(url => url === data.imageUrl);
                            if (representativeIndex !== -1) {
                                setFeaturedImageIndex(representativeIndex);
                            }
                        }

                        // 폼 데이터의 imageUrls도 업데이트
                        setFormData(prev => ({
                            ...prev,
                            imageUrls: imageList
                        }));
                    }
                } catch (error) {
                    console.error("부동산 정보 로드 오류:", error);
                    toast({
                        title: "오류",
                        description: "부동산 정보를 불러오는 중 오류가 발생했습니다",
                        variant: "destructive",
                    });
                    setLocation("/admin");
                } finally {
                    setLoading(false);
                }
            };

            fetchProperty();
        } else {
            // 신규 등록 모드인 경우, 현재 사용자가 중개사라면 기본 정보 자동 설정
            if (user && user.role === 'realtor') {
                const anyUser = user as any;
                setFormData(prev => ({
                    ...prev,
                    agentName: anyUser.businessName || prev.agentName,
                    coListing: true,
                    ownerId: user.id
                }));
            }
            setLoading(false);
        }
    }, [isEditMode, params.id, toast, user, setLocation]);

    // 공통 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === "number") {
            setFormData(prev => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (name: keyof PropertyFormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: keyof PropertyFormData, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.address) {
            toast({
                title: "입력 오류",
                description: "필수 입력 필드를 모두 작성해주세요 (제목, 주소)",
                variant: "destructive",
            });

            // 오류 필드로 스크롤 및 포커스
            const firstEmptyField = !formData.title ? 'title' : 'address';
            const errorElement = document.querySelector(`[name="${firstEmptyField}"]`) as HTMLElement;
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                errorElement.focus();
            }
            return;
        }

        try {
            setSaving(true);

            // 서버에 맞게 데이터 타입 변환하기
            const submissionData: any = {
                ...formData,
                agentId: Number(formData.agentId) || 4, // 기본값 4 설정
                agent_id: Number(formData.agentId) || 4, // DB 호환
                totalFloors: Number(formData.totalFloors || 0),
                size: formData.size !== null && formData.size !== undefined && formData.size !== "" ? String(formData.size) : "0",
                bedrooms: Number(formData.bedrooms || 0),
                bathrooms: Number(formData.bathrooms || 0),
                featuredImageIndex: featuredImageIndex
            };

            // 이미지 전처리 로직 및 대표이미지 정렬
            if (!formData.imageUrls || formData.imageUrls.length === 0) {
                try {
                    const defaultImage = getDefaultImageForPropertyType(formData.type);
                    submissionData.imageUrls = [defaultImage];
                    submissionData.imageUrl = defaultImage;
                    submissionData.featuredImageIndex = 0;
                    console.log(`이미지가 없어 기본 이미지를 적용합니다. 유형: ${formData.type}, 이미지: ${defaultImage}`);
                } catch (error) {
                    console.error("기본 이미지 적용 중 오류 발생:", error);
                }
            } else if (formData.imageUrls && formData.imageUrls.length > 0) {
                // 대표 이미지를 무조건 배열의 0번째 인덱스로 переме(이동)합니다.
                let updatedImageUrls = [...formData.imageUrls];
                
                if (featuredImageIndex > 0 && featuredImageIndex < updatedImageUrls.length) {
                    const featuredImage = updatedImageUrls.splice(featuredImageIndex, 1)[0];
                    updatedImageUrls.unshift(featuredImage); // 배열 맨 앞에 추가
                }
                
                submissionData.imageUrls = updatedImageUrls;
                submissionData.imageUrl = updatedImageUrls[0];
                submissionData.featuredImageIndex = 0; // 프론트엔드/백엔드 모두 최우선 인덱스는 이제 항상 0입니다.
            }

            console.log("부동산 저장 요청 데이터:", submissionData);

            const url = isEditMode ? `/api/properties/${params.id}` : "/api/properties";
            const method = isEditMode ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                toast({
                    title: "성공",
                    description: isEditMode ? "부동산 정보가 수정되었습니다" : "부동산 정보가 등록되었습니다",
                });
                setLocation("/admin");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || "요청 처리 실패");
            }
        } catch (error: any) {
            console.error("부동산 저장 오류:", error);
            toast({
                title: "저장 실패",
                description: error.message || "부동산 정보를 저장하는 중 오류가 발생했습니다",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 자식 컴포넌트들에 전달할 공통 Props
    const commonProps = {
        formData,
        handleChange,
        handleSelectChange,
        handleCheckboxChange,
        setFormData,
    };

    return (
        <div className="container mx-auto p-4 md:p-6 mb-20 max-w-7xl">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b pb-4">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.history.back()}
                        className="mr-2 h-9 px-3 rounded-full hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        돌아가기
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-primary pl-4 hidden sm:block">
                        {isEditMode ? "부동산 정보 수정" : "새 부동산 등록"}
                    </h1>
                </div>

                {user?.role === 'realtor' && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 shadow-sm text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap">
                        <Sparkles className="h-4 w-4" />
                        공인중개사 모드
                    </Badge>
                )}
            </div>

            {user?.role === 'realtor' && (
                <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="py-4 px-6 flex items-start sm:items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full hidden sm:block shrink-0">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-blue-900 text-sm md:text-base font-semibold">
                                중개사님, 안녕하세요! 등록하시는 매물에는 중개사님의 비즈니스 정보가 자동으로 표시됩니다.
                            </p>
                            <p className="text-blue-700/80 text-xs mt-1">상세 정보는 '연락처' 및 '추가 정보' 탭에서 확인 및 수정 가능합니다.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-2">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="mb-6 grid grid-cols-2 lg:grid-cols-6 gap-2 bg-slate-100/50 p-1.5 rounded-xl h-auto">
                        <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 text-sm font-medium">기본 정보</TabsTrigger>
                        <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 text-sm font-medium">상세 정보</TabsTrigger>
                        <TabsTrigger value="land" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 text-sm font-medium">토지 정보</TabsTrigger>
                        <TabsTrigger value="price" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 text-sm font-medium">가격 정보</TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 text-sm font-medium">연락처</TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2.5 text-sm font-medium">추가 정보</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <BasicInfoTab
                            {...commonProps}
                            user={user}
                            uploadedImages={uploadedImages}
                            setUploadedImages={setUploadedImages}
                            isUploading={isUploading}
                            setIsUploading={setIsUploading}
                            featuredImageIndex={featuredImageIndex}
                            setFeaturedImageIndex={setFeaturedImageIndex}
                        />
                    </TabsContent>

                    <TabsContent value="details" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <DetailInfoTab {...commonProps} />
                    </TabsContent>

                    <TabsContent value="land" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <LandInfoTab {...commonProps} />
                    </TabsContent>

                    <TabsContent value="price" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <PriceInfoTab {...commonProps} />
                    </TabsContent>

                    <TabsContent value="contacts" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <ContactInfoTab {...commonProps} />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <AdditionalInfoTab {...commonProps} user={user} />
                    </TabsContent>
                </Tabs>

                <div className="sticky bottom-0 z-10 p-4 mt-12 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-slate-500 hidden md:block w-1/3">
                        <span className="text-red-500 font-bold mr-1">*</span>표시는 필수 입력 항목입니다.
                    </div>

                    <div className="flex w-full sm:w-auto justify-end gap-3 flex-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => window.history.back()}
                            className="flex-1 sm:flex-none border-slate-300 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-medium"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            size="lg"
                            className="flex-1 sm:flex-none bg-slate-900 hover:bg-primary text-white shadow-md hover:shadow-lg transition-all rounded-xl font-bold min-w-[140px]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    {isEditMode ? "수정 내역 저장" : "신규 매물 등록"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function PropertyForm() {
    return (
        <ErrorBoundary>
            <PropertyFormContent />
        </ErrorBoundary>
    );
}

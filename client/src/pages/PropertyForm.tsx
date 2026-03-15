import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save, Sparkles, ShieldCheck } from "lucide-react";
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
    });

    // 권한 확인 및 데이터 로드
    useEffect(() => {
        // 1. 인증 확인
        if (!user) {
            setLocation("/auth");
            return;
        }

        // 2. 권한 확인 (관리자 또는 중개사만 접근 가능)
        const isAdmin = user.role === "admin";
        const isRealtor = user.role === "realtor";

        if (!isAdmin && !isRealtor) {
            toast({
                title: "접근 권한 없음",
                description: "매물 등록 권한이 없습니다. 중개사 회원으로 가입해주세요.",
                variant: "destructive",
            });
            setLocation("/");
            return;
        }

        // 3. 중개사인 경우 관리자 승인 여부부터 확인 (신규 등록 시에만 체크)
        if (isRealtor && !isEditMode) {
            // 관리자가 승인한 상태라면 구독 상태 무관하게 통과
            if (user.businessLicenseStatus === "approved") {
                // 통과
            } else {
                if (user.subscriptionStatus !== "active" && (!user.subscriptionTier || user.subscriptionTier === "free")) {
                    toast({
                        title: "구독 필요",
                        description: "요금제 결제 후 관리자 승인을 받아주세요.",
                        variant: "destructive",
                    });
                    setLocation("/pricing");
                    return;
                }

                toast({
                    title: "승인 대기 중",
                    description: "관리자의 최종 승인 후 매물을 등록할 수 있습니다. 잠시만 기다려주세요.",
                });
                setLocation("/profile");
                return;
            }
        }

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
                    
                    // 수정 권한 확인 (본인 매물 또는 관리자)
                    if (!isAdmin && data.ownerId !== user.id && data.agentId !== user.id) {
                        toast({
                            title: "권한 없음",
                            description: "해당 매물을 수정할 권한이 없습니다.",
                            variant: "destructive"
                        });
                        setLocation("/admin");
                        return;
                    }

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

                        agentName: safeString(data.agentName) || (!safeBoolean(data.coListing) ? "이가이버 공인중개사" : ""),

                        // 건물/면적/위치 
                        buildingName: safeString(data.buildingName),
                        unitNumber: safeString(data.unitNumber),
                        supplyArea: safeString(data.supplyArea),
                        privateArea: safeString(data.privateArea),
                        areaSize: safeString(data.areaSize),

                        floor: safeString(data.floor),
                        totalFloors: safeNumber(data.totalFloors),
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

            // 이미지 전처리 로직
            if (!formData.imageUrls || formData.imageUrls.length === 0) {
                try {
                    const defaultImage = getDefaultImageForPropertyType(formData.type);
                    submissionData.imageUrls = [defaultImage];
                    submissionData.imageUrl = defaultImage;
                    console.log(`이미지가 없어 기본 이미지를 적용합니다. 유형: ${formData.type}, 이미지: ${defaultImage}`);
                } catch (error) {
                    console.error("기본 이미지 적용 중 오류 발생:", error);
                }
            } else if (formData.imageUrls && formData.imageUrls.length > 0 && featuredImageIndex >= 0) {
                submissionData.imageUrl = formData.imageUrls[featuredImageIndex] || formData.imageUrls[0];
            }

            console.log("부동산 저장 요청 데이터:", submissionData);

            const url = isEditMode ? `/api/properties/${params.id}` : "/api/properties";
            const method = isEditMode ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
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
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 border-b-2 border-slate-100 pb-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        onClick={() => setLocation("/admin")}
                        className="mr-4 h-12 w-12 rounded-full hover:bg-slate-100 border border-slate-200 shrink-0"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-700" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
                            Property <span className="text-primary">{isEditMode ? "Editor" : "Register"}</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">{isEditMode ? `ID: ${params.id} | EDITING` : "NEW LISTING"}</p>
                    </div>
                </div>

                {user?.role === 'realtor' && (
                    <Badge className="bg-slate-900 text-white border-none luxe-badge px-4 py-2 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        VERIFIED REALTOR MODE
                    </Badge>
                )}
            </div>

            {user?.role === 'realtor' && (
                <Card className="mb-8 luxe-card bg-slate-50 border-slate-200">
                    <CardContent className="py-5 px-6 flex items-center gap-4">
                        <div className="bg-slate-900 p-2.5 rounded-full shrink-0 shadow-lg">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-slate-900 text-sm md:text-base font-bold">
                                전문가 모드 활성화: 중개사님의 고정 정보가 자동으로 적용됩니다.
                            </p>
                            <p className="text-slate-500 text-xs mt-1 font-medium">관리자 전용 보안 연결이 활발하게 유지되고 있습니다.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 mb-24">
                <Tabs defaultValue="basic" className="w-full">
                    <div className="relative mb-8">
                        <TabsList className="admin-tab-list border-none shadow-none bg-transparent gap-2 p-0">
                            <TabsTrigger value="basic" className="admin-tab-trigger bg-slate-100 hover:bg-slate-200 border border-transparent data-[state=active]:border-slate-300">기본 정보</TabsTrigger>
                            <TabsTrigger value="price" className="admin-tab-trigger bg-slate-100 hover:bg-slate-200 border border-transparent data-[state=active]:border-slate-300">가격 정보</TabsTrigger>
                            <TabsTrigger value="detail" className="admin-tab-trigger bg-slate-100 hover:bg-slate-200 border border-transparent data-[state=active]:border-slate-300">상세 정보</TabsTrigger>
                            <TabsTrigger value="land" className="admin-tab-trigger bg-slate-100 hover:bg-slate-200 border border-transparent data-[state=active]:border-slate-300">대지/건물</TabsTrigger>
                            <TabsTrigger value="contact" className="admin-tab-trigger bg-slate-100 hover:bg-slate-200 border border-transparent data-[state=active]:border-slate-300">연락처</TabsTrigger>
                            <TabsTrigger value="additional" className="admin-tab-trigger bg-slate-100 hover:bg-slate-200 border border-transparent data-[state=active]:border-slate-300">기타</TabsTrigger>
                        </TabsList>
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
                    </div>

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
                            onClick={() => setLocation("/admin")}
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

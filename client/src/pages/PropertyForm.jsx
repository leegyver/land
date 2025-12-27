import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// 각 부동산 유형별 기본 이미지 경로 설정 (public 폴더에 있는 이미지)
const landDefaultImage = "/default-property-images/land.png";
const houseDefaultImage = "/default-property-images/house.png";
const apartmentDefaultImage = "/default-property-images/apartment.png";
const oneroomDefaultImage = "/default-property-images/oneroom.png";
const commercialDefaultImage = "/default-property-images/commercial.png";

function PropertyForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const isEditMode = !!params.id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // 부동산 유형별 기본 이미지 매핑
  const defaultPropertyImages = {
    '토지': landDefaultImage,
    '주택': houseDefaultImage,
    '아파트연립다세대': apartmentDefaultImage,
    '원투룸': oneroomDefaultImage,
    '상가공장창고펜션': commercialDefaultImage
  };

  // 부동산 유형에 맞는 기본 이미지 가져오기
  const getDefaultImageForPropertyType = (type) => {
    return defaultPropertyImages[type] || defaultPropertyImages['주택']; // 기본값은 주택 이미지
  };

  // 거래 유형 정의
  const dealTypeOptions = ["매매", "전세", "월세", "완료", "보류중"];
  const propertyTypeOptions = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];

  // 통합된 지역 목록 (읍면동리)
  const allLocations = [
    "강화읍 갑곳리",
    "강화읍 관청리",
    "강화읍 국화리",
    "강화읍 남산리",
    "강화읍 대산리",
    "강화읍 신문리",
    "강화읍 옥림리",
    "강화읍 용정리",
    "강화읍 월곳리",
    "교동면 고구리",
    "교동면 난정리",
    "교동면 대룡리",
    "교동면 동산리",
    "교동면 무학리",
    "교동면 봉소리",
    "교동면 삼선리",
    "교동면 상용리",
    "교동면 서한리",
    "교동면 양갑리",
    "교동면 읍내리",
    "교동면 인사리",
    "교동면 지석리",
    "길상면 길직리",
    "길상면 동검리",
    "길상면 선두리",
    "길상면 온수리",
    "길상면 장흥리",
    "길상면 초지리",
    "내가면 고천리",
    "내가면 구하리",
    "내가면 오상리",
    "내가면 외포리",
    "내가면 황청리",
    "불은면 고능리",
    "불은면 넙성리",
    "불은면 덕성리",
    "불은면 두운리",
    "불은면 삼동암리",
    "불은면 삼성리",
    "불은면 신현리",
    "불은면 오두리",
    "삼산면 매음리",
    "삼산면 미법리",
    "삼산면 상리",
    "삼산면 서검리",
    "삼산면 석모리",
    "삼산면 석포리",
    "삼산면 하리",
    "서도면 말도리",
    "서도면 볼음도리",
    "서도면 아차도리",
    "서도면 주문도리",
    "선원면 금월리",
    "선원면 냉정리",
    "선원면 선행리",
    "선원면 신정리",
    "선원면 연리",
    "선원면 지산리",
    "선원면 창리",
    "송해면 당산리",
    "송해면 상도리",
    "송해면 솔정리",
    "송해면 숭뢰리",
    "송해면 신당리",
    "송해면 양오리",
    "송해면 하도리",
    "양도면 건평리",
    "양도면 길정리",
    "양도면 능내리",
    "양도면 도장리",
    "양도면 삼흥리",
    "양도면 인산리",
    "양도면 조산리",
    "양도면 하일리",
    "양사면 교산리",
    "양사면 덕하리",
    "양사면 북성리",
    "양사면 인화리",
    "양사면 철산리",
    "하점면 망월리",
    "하점면 부근리",
    "하점면 삼거리",
    "하점면 신봉리",
    "하점면 신삼리",
    "하점면 이강리",
    "하점면 장정리",
    "하점면 창후리",
    "화도면 내리",
    "화도면 덕포리",
    "화도면 동막리",
    "화도면 문산리",
    "화도면 사기리",
    "화도면 상방리",
    "화도면 여차리",
    "화도면 장화리",
    "화도면 흥왕리",
    "기타지역"
  ];

  // 지목 옵션 목록
  const landTypeOptions = ["전", "답", "임", "대", "목", "잡", "창", "도", "장", "학", "주", "염", "과", "철", "제", "천", "구", "유", "양", "수", "공원", "체", "원", "종", "사", "묘", "광"];

  // 용도지역 옵션 목록
  const zoneTypeOptions = [
    "제1종전용주거", "제2종전용주거", "제1종일반주거", "제2종일반주거", "제3종일반주거", 
    "준주거", "중심상업", "일반상업", "근린상업", "유통상업", 
    "전용공업", "일반공업", "준공업", 
    "보전녹지", "생산녹지", "자연녹지", 
    "계획관리", "보전관리", "생산관리", 
    "농업보호", "농업진흥", "농림지역", "자연환경보전"
  ];

  // 폼 상태 설정
  const [formData, setFormData] = useState({
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
    // propertyDescription 필드 삭제
    privateNote: "",
    youtubeUrl: "", // 유튜브 영상 URL
    featuredImageIndex: 0, // 대표 이미지 인덱스 추가
  });

  // 이미지 업로드 관련 상태
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0); // 대표 이미지 인덱스 관리



  // 편집 모드일 경우 기존 데이터 로드
  useEffect(() => {
    if (isEditMode) {
      const fetchProperty = async () => {
        try {
          setLoading(true);
          console.log("부동산 ID:", params.id);
          const response = await fetch(`/api/properties/${params.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log("불러온 부동산 데이터:", data);
            // 단일 이미지 필드 제거 및 데이터 설정
            const { imageUrl, ...restData } = data;
            setFormData({
              ...restData,
              // 필수 필드 데이터 보완
              agentId: data.agentId || 4, // 기본값 4 (정현우 중개사)
              dealType: data.dealType || ["매매"],
              deposit: data.deposit ? data.deposit.toString() : "",
              depositAmount: data.depositAmount ? data.depositAmount.toString() : "",
              monthlyRent: data.monthlyRent ? data.monthlyRent.toString() : "",
              maintenanceFee: data.maintenanceFee ? data.maintenanceFee.toString() : "",
              imageUrls: data.imageUrls || [],
              elevator: Boolean(data.elevator),
              coListing: Boolean(data.coListing),
              featured: Boolean(data.featured),
            });

            // 이미지 처리: 배열 먼저 확인하고, 없으면 단일 이미지 확인
            let imageList = [];

            if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
              // 이미지 배열 사용
              imageList = [...data.imageUrls];
            } 
            else if (data.imageUrl) {
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
              // 단일 imageUrl이 있고 그 URL이 imageUrls 배열에 있으면 해당 인덱스를 대표 이미지로 설정
              if (data.imageUrl) {
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
          } else {
            toast({
              title: "오류", 
              description: "부동산 정보를 불러올 수 없습니다",
              variant: "destructive",
            });
            window.location.href = "/admin";
          }
        } catch (error) {
          console.error("부동산 정보 로드 오류:", error);
          toast({
            title: "오류",
            description: "부동산 정보를 불러오는 중 오류가 발생했습니다",
            variant: "destructive",
          });
          window.location.href = "/admin";
        } finally {
          setLoading(false);
        }
      };

      fetchProperty();
    }
  }, [isEditMode, params.id, toast]);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "number") {
      setFormData({ ...formData, [name]: value === "" ? "" : Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 셀렉트 필드 변경 핸들러
  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // 거래 유형 체크박스 핸들러
  const handleDealTypeChange = (type, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        dealType: [...formData.dealType, type],
      });
    } else {
      setFormData({
        ...formData,
        dealType: formData.dealType.filter(t => t !== type),
      });
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.address) {
      toast({
        title: "입력 오류",
        description: "필수 입력 필드를 모두 작성해주세요 (제목, 가격, 주소)",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // 서버에 맞게 데이터 타입 변환하기
      const submissionData = {
        ...formData,
        // 숫자 필드들 처리
        agentId: Number(formData.agentId) || 4, // 기본값 4 설정 (정현우 중개사)
        agent_id: Number(formData.agentId) || 4, // DB 컬럼명과 일치하도록 추가
        totalFloors: Number(formData.totalFloors || 0),
        // size는 서버에서 string으로 처리하므로 그대로 전송
        size: formData.size || "0",
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        featuredImageIndex: featuredImageIndex
      };

      // 이미지 처리: 이미지가 없을 경우 부동산 유형에 맞는 기본 이미지 설정
      if (!formData.imageUrls || formData.imageUrls.length === 0) {
        try {
          // 부동산 유형에 맞는 기본 이미지 가져오기
          const defaultImage = getDefaultImageForPropertyType(formData.type);

          // 기본 이미지를 배열과 단일 이미지 URL에 모두 설정
          submissionData.imageUrls = [defaultImage];
          submissionData.imageUrl = defaultImage;

          console.log(`이미지가 없어 기본 이미지를 적용합니다. 유형: ${formData.type}, 이미지: ${defaultImage}`);
        } catch (error) {
          console.error("기본 이미지 적용 중 오류 발생:", error);
        }
      }
      // 이미지가 있을 경우 대표 이미지 설정 (이전 버전 호환용)
      else if (formData.imageUrls && formData.imageUrls.length > 0 && featuredImageIndex >= 0) {
        submissionData.imageUrl = formData.imageUrls[featuredImageIndex] || formData.imageUrls[0];
      }

      // 디버깅용 로그
      console.log("부동산 수정 요청 데이터:", submissionData);

      const url = isEditMode 
        ? `/api/properties/${params.id}` 
        : "/api/properties";

      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "성공",
          description: isEditMode 
            ? "부동산 정보가 수정되었습니다" 
            : "부동산 정보가 등록되었습니다",
        });
        window.location.href = "/admin";
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "요청 처리 실패");
      }
    } catch (error) {
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.href = "/admin"}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "부동산 정보 수정" : "새 부동산 등록"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">기본 정보</TabsTrigger>
            <TabsTrigger value="details">상세 정보</TabsTrigger>
            <TabsTrigger value="land">토지 정보</TabsTrigger>
            <TabsTrigger value="price">가격 정보</TabsTrigger>
            <TabsTrigger value="contacts">연락처</TabsTrigger>
            <TabsTrigger value="notes">추가 정보</TabsTrigger>
          </TabsList>

          {/* 기본 정보 탭 */}
          <TabsContent value="basic">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>필수 정보</CardTitle>
                  <CardDescription>
                    부동산의 기본 정보를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">제목 *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">부동산 유형 *</Label>
                    <Select 
                      name="type" 
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypeOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">매매가 *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="text"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">주소 *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      placeholder="상세 주소를 입력하세요"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">지역 *</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => handleSelectChange("district", value)}
                    >
                      <SelectTrigger id="district">
                        <SelectValue placeholder="지역을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">면적(㎡) *</Label>
                    <Input
                      id="size"
                      name="size"
                      type="text"
                      value={formData.size || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          size: val
                        }));
                      }}
                      required
                    />
                  </div>

                  {/* 부동산 유형이 '토지'가 아닐 때만 방 개수와 화장실 개수 필드 표시 */}
                  {formData.type !== '토지' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">방 개수</Label>
                        <Input
                          id="bedrooms"
                          name="bedrooms"
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">화장실 개수</Label>
                        <Input
                          id="bathrooms"
                          name="bathrooms"
                          type="number"
                          min="0"
                          value={formData.bathrooms}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">유튜브 영상 URL (선택사항)</Label>
                    <Input
                      id="youtubeUrl"
                      name="youtubeUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.youtubeUrl || ""}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500">매물 소개 영상이 있다면 유튜브 URL을 입력하세요</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>추가 기본 정보</CardTitle>
                  <CardDescription>
                    상세 설명 및 중개사 정보를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>이미지 업로드 (최대 5장)</Label>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          별표(⭐) 버튼을 클릭하여 대표 이미지를 지정할 수 있습니다
                        </span>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="border rounded-md p-4 bg-gray-50">
                          <div className="flex items-center justify-center w-full">
                            <label 
                              htmlFor="imageUpload" 
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">클릭하여 업로드</span></p>
                                <p className="text-xs text-gray-500">PNG, JPG 또는 GIF (최대 10MB, 자동 압축됨)</p>
                              </div>
                              <input 
                                id="imageUpload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  if (uploadedImages.length >= 5) {
                                    toast({
                                      title: "최대 5장까지 업로드 가능합니다",
                                      variant: "destructive"
                                    });
                                    return;
                                  }

                                  const file = e.target.files[0];
                                  if (!file) return;

                                  setIsUploading(true);

                                  // 이미지 압축 함수
                                  const compressImage = (file) => {
                                    return new Promise((resolve) => {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const img = new Image();
                                        img.src = event.target.result;
                                        img.onload = () => {
                                          // 이미지 리사이징을 위한 캔버스 생성
                                          const canvas = document.createElement('canvas');
                                          // 최대 너비/높이 설정 (800px로 제한)
                                          const MAX_SIZE = 800;
                                          let width = img.width;
                                          let height = img.height;

                                          // 이미지 크기 조정
                                          if (width > height) {
                                            if (width > MAX_SIZE) {
                                              height *= MAX_SIZE / width;
                                              width = MAX_SIZE;
                                            }
                                          } else {
                                            if (height > MAX_SIZE) {
                                              width *= MAX_SIZE / height;
                                              height = MAX_SIZE;
                                            }
                                          }

                                          canvas.width = width;
                                          canvas.height = height;

                                          // 캔버스에 이미지 그리기
                                          const ctx = canvas.getContext('2d');
                                          ctx.drawImage(img, 0, 0, width, height);

                                          // 이미지 포맷 및 품질 설정 (0.7 = 70% 품질)
                                          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                          resolve(compressedDataUrl);
                                        };
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  };

                                  // 이미지 압축 실행
                                  compressImage(file).then(compressedDataUrl => {
                                    const newImage = {
                                      id: Date.now(), // 임시 ID
                                      url: compressedDataUrl,
                                      file: file
                                    };

                                    // 기존 이미지에 추가
                                    const updatedImages = [...uploadedImages, newImage];
                                    setUploadedImages(updatedImages);

                                    // 첫 번째 이미지일 경우 대표 이미지로 설정
                                    if (uploadedImages.length === 0) {
                                      setFeaturedImageIndex(0);
                                    }

                                    // formData의 imageUrls 업데이트
                                    setFormData(prev => ({
                                      ...prev,
                                      imageUrls: updatedImages.map(img => img.url)
                                    }));

                                    // 업로드 완료 상태로 변경
                                    setIsUploading(false);
                                  }).catch(error => {
                                    console.error("이미지 압축 중 오류:", error);
                                    setIsUploading(false);
                                    toast({
                                      title: "이미지 처리 실패",
                                      description: "이미지 업로드 중 오류가 발생했습니다.",
                                      variant: "destructive"
                                    });
                                  });

                                  // input 초기화
                                  e.target.value = '';
                                }}
                                disabled={isUploading || uploadedImages.length >= 5}
                              />
                            </label>
                          </div>
                        </div>

                        {/* 업로드된 이미지 미리보기 */}
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                            {uploadedImages.map((image, index) => (
                              <div key={image.id} className="relative group">
                                <img 
                                  src={image.url} 
                                  alt={`이미지 ${index + 1}`} 
                                  className="h-24 w-full object-cover rounded-md border"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                  <button
                                    type="button"
                                    className="p-1 bg-red-500 text-white rounded-full"
                                    onClick={() => {
                                      // 이미지 제거
                                      const updatedImages = uploadedImages.filter(img => img.id !== image.id);
                                      setUploadedImages(updatedImages);

                                      // formData 업데이트
                                      setFormData(prev => ({
                                        ...prev,
                                        imageUrls: updatedImages.map(img => img.url)
                                      }));

                                      // 대표 이미지 인덱스 조정
                                      if (featuredImageIndex >= updatedImages.length && updatedImages.length > 0) {
                                        setFeaturedImageIndex(0);
                                      }
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  {/* 대표 이미지 선택 버튼 */}
                                  <button
                                    type="button"
                                    className={`absolute bottom-1 right-1 p-1.5 text-white rounded-full ${
                                      index === featuredImageIndex 
                                        ? 'bg-green-500 ring-2 ring-white' 
                                        : 'bg-gray-500 bg-opacity-70 hover:bg-gray-500'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFeaturedImageIndex(index);
                                    }}
                                    title={index === featuredImageIndex ? "현재 대표 이미지입니다" : "대표 이미지로 설정"}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={index === featuredImageIndex ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={index === featuredImageIndex ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                  </button>
                                </div>
                                {/* 대표 이미지 표시 라벨 */}
                                {index === featuredImageIndex && (
                                  <span className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-tr-md rounded-bl-md font-medium">
                                    대표이미지
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 대표 이미지 URL 입력 필드는 제거됨 */}
                  </div>



                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox
                      id="featured"
                      name="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, featured: checked })
                      }
                    />
                    <Label htmlFor="featured">추천 매물로 등록</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 상세 정보 탭 */}
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>위치 정보</CardTitle>
                  <CardDescription>
                    건물 및 상세 위치 정보를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buildingName">건물명</Label>
                    <Input
                      id="buildingName"
                      name="buildingName"
                      value={formData.buildingName || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">동호수</Label>
                    <Input
                      id="unitNumber"
                      name="unitNumber"
                      value={formData.unitNumber || ""}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>면적 정보</CardTitle>
                  <CardDescription>
                    상세 면적 정보를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplyArea">공급(평)</Label>
                    <Input
                      id="supplyArea"
                      name="supplyArea"
                      type="text"
                      value={formData.supplyArea || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateArea">전용(평)</Label>
                    <Input
                      id="privateArea"
                      name="privateArea"
                      type="text"
                      value={formData.privateArea || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaSize">평형</Label>
                    <Input
                      id="areaSize"
                      name="areaSize"
                      value={formData.areaSize || ""}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>건물 정보</CardTitle>
                  <CardDescription>
                    건물에 대한 상세 정보를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="floor">층수</Label>
                      <Input
                        id="floor"
                        name="floor"
                        type="text"
                        value={formData.floor || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalFloors">총층</Label>
                      <Input
                        id="totalFloors"
                        name="totalFloors"
                        type="number"
                        value={formData.totalFloors || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direction">방향</Label>
                    <Input
                      id="direction"
                      name="direction"
                      value={formData.direction || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="elevator"
                      name="elevator"
                      checked={formData.elevator}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, elevator: checked })
                      }
                    />
                    <Label htmlFor="elevator">승강기 있음</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parking">주차</Label>
                    <Input
                      id="parking"
                      name="parking"
                      value={formData.parking || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heatingSystem">난방방식</Label>
                    <Input
                      id="heatingSystem"
                      name="heatingSystem"
                      value={formData.heatingSystem || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approvalDate">사용승인</Label>
                    <Input
                      id="approvalDate"
                      name="approvalDate"
                      value={formData.approvalDate || ""}
                      onChange={handleChange}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 토지 정보 탭 */}
          <TabsContent value="land">
            <Card>
              <CardHeader>
                <CardTitle>토지 정보</CardTitle>
                <CardDescription>
                  토지 관련 정보를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="landType">지목</Label>
                    <Select 
                      value={formData.landType} 
                      onValueChange={(value) => setFormData({...formData, landType: value})}
                    >
                      <SelectTrigger id="landType">
                        <SelectValue placeholder="지목 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="선택 안함">선택 안함</SelectItem>
                        {landTypeOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoneType">용도지역</Label>
                    <Select 
                      value={formData.zoneType} 
                      onValueChange={(value) => setFormData({...formData, zoneType: value})}
                    >
                      <SelectTrigger id="zoneType">
                        <SelectValue placeholder="용도지역 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="선택 안함">선택 안함</SelectItem>
                        {zoneTypeOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="price">
            <Card>
              <CardHeader>
                <CardTitle>거래 정보</CardTitle>
                <CardDescription>
                  거래 유형과 가격 정보를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">거래 유형</Label>
                  <div className="flex flex-wrap gap-4">
                    {dealTypeOptions.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dealType-${type}`}
                          checked={formData.dealType.includes(type)}
                          onCheckedChange={(checked) => 
                            handleDealTypeChange(type, checked)
                          }
                        />
                        <Label htmlFor={`dealType-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit">전세금</Label>
                    <Input
                      id="deposit"
                      name="deposit"
                      type="text"
                      value={formData.deposit || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depositAmount">보증금</Label>
                    <Input
                      id="depositAmount"
                      name="depositAmount"
                      type="text"
                      value={formData.depositAmount || ""}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRent">월세</Label>
                    <Input
                      id="monthlyRent"
                      name="monthlyRent"
                      type="text"
                      value={formData.monthlyRent || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceFee">관리비</Label>
                  <Input
                    id="maintenanceFee"
                    name="maintenanceFee"
                    type="text"
                    value={formData.maintenanceFee || ""}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 연락처 탭 */}
          <TabsContent value="contacts">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>소유자 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">소유자</Label>
                    <Input
                      id="ownerName"
                      name="ownerName"
                      value={formData.ownerName || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">소유자 전화</Label>
                    <Input
                      id="ownerPhone"
                      name="ownerPhone"
                      value={formData.ownerPhone || ""}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>임차인 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenantName">임차인</Label>
                    <Input
                      id="tenantName"
                      name="tenantName"
                      value={formData.tenantName || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenantPhone">임차인 전화</Label>
                    <Input
                      id="tenantPhone"
                      name="tenantPhone"
                      value={formData.tenantPhone || ""}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>의뢰인 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">의뢰인</Label>
                    <Input
                      id="clientName"
                      name="clientName"
                      value={formData.clientName || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">의뢰인 전화</Label>
                    <Input
                      id="clientPhone"
                      name="clientPhone"
                      value={formData.clientPhone || ""}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 추가 정보 탭 */}
          <TabsContent value="notes">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>추가 정보</CardTitle>
                  <CardDescription>
                    부동산 관련 메모와 추가 정보를 입력하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialNote">특이사항</Label>
                    <Textarea
                      id="specialNote"
                      name="specialNote"
                      value={formData.specialNote || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="coListing"
                      name="coListing"
                      checked={formData.coListing}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, coListing: checked })
                      }
                    />
                    <Label htmlFor="coListing">공동중개</Label>
                  </div>

                  {/* 매물설명 필드 삭제 요청에 따라 제거됨 */}

                  <div className="space-y-2">
                    <Label htmlFor="privateNote">비공개 메모</Label>
                    <Textarea
                      id="privateNote"
                      name="privateNote"
                      value={formData.privateNote || ""}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/admin")}
            className="mr-4"
          >
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "수정 완료" : "등록 완료"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PropertyForm;
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

function PropertyForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const isEditMode = !!params.id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  
  // 거래 유형 정의
  const dealTypeOptions = ["매매", "전세", "월세", "완료", "보류중"];
  const propertyTypeOptions = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  
  // 통합된 지역 목록 (읍면동리)
  const allLocations = [
    "강화군외",
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
    "길상면 길직리",
    "길상면 선두리",
    "길상면 온수리",
    "내가면 고천리",
    "내가면 구하리",
    "내가면 냉정리",
    "내가면 대항리",
    "내가면 덕성리",
    "내가면 외포리",
    "내가면 오상리",
    "내가면 장천리",
    "내가면 중앙관광지",
    "내가면 황청리",
    "삼산면 매음리",
    "삼산면 석모리",
    "삼산면 서검리",
    "삼산면 석산리",
    "삼산면 삼산북로",
    "삼산면 하리",
    "불은면 고능리",
    "불은면 두운리",
    "불은면 덕성리",
    "불은면 삼성리",
    "불은면 오두리",
    "불은면 창후리",
    "불은면 풍무로",
    "불은면 삼동암길",
    "서도면 주문도",
    "서도면 볼음도",
    "서도면 아차도",
    "서도면 말도",
    "서도면 수여도",
    "선원면 냉정리",
    "선원면 선원리",
    "선원면 신정리",
    "선원면 연리",
    "선원면 지산리",
    "송해면 상도리",
    "송해면 솔정리",
    "송해면 숭뢰리",
    "송해면 신당리",
    "송해면 양오리",
    "양도면 건평리",
    "양도면 도장리",
    "양도면 삼흥리",
    "양도면 인산리",
    "양사면 덕하리",
    "양사면 북성리",
    "양사면 인화리",
    "하점면 망원리",
    "하점면 봉천리",
    "하점면 부근리",
    "하점면 신봉리",
    "하점면 이강리",
    "하점면 장정리",
    "화도면 내리",
    "화도면 덕포리",
    "화도면 동막리",
    "화도면 문산리",
    "화도면 사기리",
    "화도면 장화리",
    "화도면 흥왕리"
  ];
  
  // 폼 상태 설정
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "주택",
    price: "",
    address: "",
    district: "강화읍 갑곳리", // 기본값 설정
    size: "",
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    imageUrls: [], // 다중 이미지 저장용 배열
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
    totalFloors: "",
    direction: "",
    elevator: false,
    parking: "",
    heatingSystem: "",
    approvalDate: "",
    
    // 금액 정보
    dealType: ["매매"],
    deposit: "",
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
    propertyDescription: "",
    privateNote: "",
  });
  
  // 이미지 업로드 관련 상태
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  

  
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
            // 데이터 설정
            setFormData({
              ...data,
              dealType: data.dealType || ["매매"],
              imageUrls: data.imageUrls || [],
              elevator: Boolean(data.elevator),
              coListing: Boolean(data.coListing),
              featured: Boolean(data.featured),
            });
            
            // 이미지가 있으면 이미지 미리보기에 추가
            if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
              const images = data.imageUrls.map((url, index) => ({
                id: Date.now() + index,
                url: url
              }));
              setUploadedImages(images);
            }
            // 단일 이미지가 있고 배열이 비어있으면 배열에도 추가
            else if (data.imageUrl && (!data.imageUrls || data.imageUrls.length === 0)) {
              setUploadedImages([{
                id: Date.now(),
                url: data.imageUrl
              }]);
              setFormData(prev => ({
                ...prev,
                imageUrls: [data.imageUrl]
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
    // city가 변경되면 district를 초기화
    if (name === "city") {
      setFormData({ 
        ...formData, 
        [name]: value,
        district: "" // 도시가 변경되면 지역 초기화
      });
    } else if (name === "district" && value === "강화군") {
      // 강화군이 선택되면 하위 지역(읍면동) 필드를 활성화하기 위한 준비
      setFormData({ 
        ...formData, 
        [name]: value,
        subdistrict: "" // 선택된 하위 지역 초기화
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
      
      // 디버깅용 로그
      console.log("부동산 수정 요청 데이터:", formData);
      
      const url = isEditMode 
        ? `/api/properties/${params.id}` 
        : "/api/properties";
      
      const method = isEditMode ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
                      placeholder={
                        formData.district === "강화군" && formData.subdistrict 
                          ? `${formData.city} ${formData.district} ${formData.subdistrict}` 
                          : formData.district 
                            ? `${formData.city} ${formData.district}` 
                            : "상세 주소를 입력하세요"
                      }
                    />
                  </div>
                  
                  <div className={`grid ${formData.district === "강화군" ? "grid-cols-3" : "grid-cols-2"} gap-4`}>
                    <div className="space-y-2">
                      <Label htmlFor="city">도시 *</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => handleSelectChange("city", value)}
                      >
                        <SelectTrigger id="city">
                          <SelectValue placeholder="도시를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {cityOptions.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">지역 *</Label>
                      <Select
                        value={formData.district}
                        onValueChange={(value) => handleSelectChange("district", value)}
                        disabled={!formData.city}
                      >
                        <SelectTrigger id="district">
                          <SelectValue placeholder="지역을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.city && districtOptions[formData.city]?.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.district === "강화군" && (
                      <div className="space-y-2">
                        <Label htmlFor="subdistrict">읍면동 *</Label>
                        <Select
                          value={formData.subdistrict}
                          onValueChange={(value) => handleSelectChange("subdistrict", value)}
                        >
                          <SelectTrigger id="subdistrict">
                            <SelectValue placeholder="읍면동을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {ganghwaSubdistrictOptions.map((subdistrict) => (
                              <SelectItem key={subdistrict} value={subdistrict}>
                                {subdistrict}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="size">면적(㎡) *</Label>
                    <Input
                      id="size"
                      name="size"
                      type="text"
                      value={formData.size}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
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
                      <Label>이미지 업로드 (최대 5장)</Label>
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
                                <p className="text-xs text-gray-500">PNG, JPG 또는 GIF (최대 10MB)</p>
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
                                    
                                    // formData의 imageUrls 업데이트
                                    setFormData(prev => ({
                                      ...prev,
                                      imageUrls: updatedImages.map(img => img.url)
                                    }));
                                    
                                    // 첫 번째 이미지는 대표 이미지로 설정
                                    if (updatedImages.length === 1) {
                                      setFormData(prev => ({
                                        ...prev,
                                        imageUrl: compressedDataUrl
                                      }));
                                    }
                                    
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
                                        imageUrls: updatedImages.map(img => img.url),
                                        // 첫 번째 이미지를 대표 이미지로 설정 (없으면 기본값)
                                        imageUrl: updatedImages.length > 0 
                                          ? updatedImages[0].url 
                                          : "https://images.unsplash.com/photo-1580587771525-78b9dba3b914"
                                      }));
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  {index === 0 && (
                                    <span className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 py-0.5 rounded-tr-md rounded-bl-md">
                                      대표
                                    </span>
                                  )}
                                </div>
                                {index === 0 && (
                                  <span className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 py-0.5 rounded-tr-md rounded-bl-md">
                                    대표
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">대표 이미지 URL (선택사항)</Label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="이미지를 업로드하거나 URL을 입력하세요"
                      />
                    </div>
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
                        type="text"
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
          
          {/* 가격 정보 탭 */}
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
                    <Label htmlFor="deposit">전세금/보증금</Label>
                    <Input
                      id="deposit"
                      name="deposit"
                      type="text"
                      value={formData.deposit || ""}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="propertyDescription">매물 설명</Label>
                    <Textarea
                      id="propertyDescription"
                      name="propertyDescription"
                      value={formData.propertyDescription || ""}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>
                  
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
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
  const [agents, setAgents] = useState([]);
  
  // 거래 유형 정의
  const dealTypeOptions = ["매매", "전세", "월세", "완료", "보류중"];
  const propertyTypeOptions = ["토지", "주택", "아파트연립다세대", "원투룸", "상가공장창고펜션"];
  
  // 폼 상태 설정
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "주택",
    price: "",
    address: "",
    city: "",
    district: "",
    size: "",
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    agentId: "",
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
  
  // 에이전트 목록 가져오기
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents");
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
          
          // 첫 번째 에이전트를 기본값으로 설정
          if (data.length > 0 && !isEditMode) {
            setFormData(prev => ({ ...prev, agentId: data[0].id }));
          }
        }
      } catch (error) {
        console.error("에이전트 로드 오류:", error);
      }
    };
    
    fetchAgents();
  }, [isEditMode]);
  
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
            setFormData({
              ...data,
              dealType: data.dealType || ["매매"],
              elevator: Boolean(data.elevator),
              coListing: Boolean(data.coListing),
              featured: Boolean(data.featured),
            });
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
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">도시 *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">지역 *</Label>
                      <Input
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                      />
                    </div>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">이미지 URL</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agentId">담당 중개사</Label>
                    <Select 
                      name="agentId" 
                      value={formData.agentId.toString()}
                      onValueChange={(value) => handleSelectChange("agentId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="중개사 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.name} ({agent.title})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
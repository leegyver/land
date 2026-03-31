import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PropertyFormProps } from "./types";
import { propertyTypeOptions, allLocations } from "./constants";

interface BasicInfoTabProps extends PropertyFormProps {
    user: any;
    uploadedImages: any[];
    setUploadedImages: React.Dispatch<React.SetStateAction<any[]>>;
    isUploading: boolean;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
    featuredImageIndex: number;
    setFeaturedImageIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
    formData,
    handleChange,
    handleSelectChange,
    handleCheckboxChange,
    setFormData,
    user,
    uploadedImages,
    setUploadedImages,
    isUploading,
    setIsUploading,
    featuredImageIndex,
    setFeaturedImageIndex,
}) => {
    const { toast } = useToast();

    const processAndUploadImage = (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const TARGET_RATIO = 16 / 9;
                    const MAX_WIDTH = 1200;
                    
                    let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
                    const imgRatio = img.width / img.height;

                    if (imgRatio > TARGET_RATIO) {
                        srcWidth = img.height * TARGET_RATIO;
                        srcX = (img.width - srcWidth) / 2;
                    } else if (imgRatio < TARGET_RATIO) {
                        srcHeight = img.width / TARGET_RATIO;
                        srcY = (img.height - srcHeight) / 2;
                    }

                    let destWidth = srcWidth;
                    let destHeight = srcHeight;
                    
                    if (destWidth > MAX_WIDTH) {
                        destWidth = MAX_WIDTH;
                        destHeight = MAX_WIDTH / TARGET_RATIO;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = destWidth;
                    canvas.height = destHeight;
                    const ctx = canvas.getContext('2d');
                    
                    if (ctx) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, destWidth, destHeight);
                        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, destWidth, destHeight);
                    }
                    
                    canvas.toBlob(async (blob) => {
                        if (!blob) {
                            reject(new Error("Canvas to Blob failed"));
                            return;
                        }
                        
                        const formData = new FormData();
                        formData.append("file", blob, file.name || "image.jpg");
                        
                        try {
                            const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData
                            });
                            
                            if (!res.ok) throw new Error("Upload failed");
                            const data = await res.json();
                            
                            resolve({
                                id: Date.now() + Math.random(),
                                url: data.url,
                                file: file
                            });
                        } catch (err) {
                            reject(err);
                        }
                    }, 'image/jpeg', 0.85);
                };
                img.onerror = () => reject(new Error("Image load failed"));
            };
            reader.onerror = () => reject(new Error("File read failed"));
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (files: File[]) => {
        if (uploadedImages.length >= 20) {
            toast({
                title: "최대 20장까지 업로드 가능합니다",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            const newImages = await Promise.all(files.map(file => processAndUploadImage(file)));
            const updatedImages = [...uploadedImages, ...newImages];

            if (updatedImages.length > 20) {
                toast({
                    title: "이미지는 최대 20장까지만 저장됩니다.",
                    description: `초과된 ${updatedImages.length - 20}장은 제외되었습니다.`,
                    variant: "destructive"
                });
                updatedImages.splice(20);
            }

            setUploadedImages(updatedImages);
            if (uploadedImages.length === 0 && newImages.length > 0) {
                setFeaturedImageIndex(0);
            }
            setFormData(prev => ({
                ...prev,
                imageUrls: updatedImages.map(img => img.url)
            }));
        } catch (error) {
            console.error("이미지 처리 중 오류:", error);
            toast({
                title: "이미지 처리 실패",
                description: "이미지 업로드 중 오류가 발생했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>필수 정보</CardTitle>
                    <CardDescription>부동산의 기본 정보를 입력하세요</CardDescription>
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
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">매매가</Label>
                        <Input
                            id="price"
                            name="price"
                            type="text"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="선택사항"
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
                                    <SelectItem key={location} value={location}>{location}</SelectItem>
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
                            onChange={handleChange}
                            required
                        />
                    </div>

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
                    <CardDescription>상세 설명 및 중개사 정보를 입력하세요</CardDescription>
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
                                <Label>이미지 업로드 (최대 20장, 드래그앤드롭 가능)</Label>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    별표(⭐) 버튼을 클릭하여 대표 이미지를 지정할 수 있습니다
                                </span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="border rounded-md p-4 bg-gray-50">
                                    <div className="flex items-center justify-center w-full">
                                        <div
                                            onClick={() => document.getElementById('imageUpload')?.click()}
                                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                        ${isUploading ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}
                      `}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.add('border-primary', 'bg-blue-50');
                                            }}
                                            onDragEnter={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.add('border-primary', 'bg-blue-50');
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
                                            }}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.remove('border-primary', 'bg-blue-50');

                                                // 1. 일반 로컬 파일 (PC에서 드래그)
                                                const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                                                if (files.length > 0) {
                                                    handleImageUpload(files);
                                                    return;
                                                }

                                                // 2. 온라인 이미지 타 탭에서 드래그 (예: 네이버 부동산)
                                                const htmlData = e.dataTransfer.getData('text/html');
                                                const urlData = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/uri-list');
                                                
                                                let extractedUrl = "";
                                                if (htmlData) {
                                                    const match = htmlData.match(/<img[^>]+src="?([^"\s]+)"?\s*/i);
                                                    if (match && match[1]) extractedUrl = match[1];
                                                }
                                                if (!extractedUrl && urlData) {
                                                    extractedUrl = urlData;
                                                }

                                                if (extractedUrl && extractedUrl.startsWith('http')) {
                                                    if (uploadedImages.length >= 20) {
                                                        toast({ title: "최대 20장까지 업로드 가능합니다", variant: "destructive" });
                                                        return;
                                                    }
                                                    
                                                    setIsUploading(true);
                                                    try {
                                                        const res = await fetch('/api/upload-url', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ url: extractedUrl })
                                                        });
                                                        
                                                        if (!res.ok) {
                                                            const errorData = await res.json().catch(() => ({}));
                                                            throw new Error(errorData.message || '온라인 이미지 업로드 실패');
                                                        }
                                                        
                                                        const data = await res.json();
                                                        
                                                        const newImage = {
                                                            id: Date.now() + Math.random(),
                                                            url: data.url,
                                                            file: null
                                                        };
                                                        
                                                        const updatedImages = [...uploadedImages, newImage];
                                                        setUploadedImages(updatedImages);
                                                        
                                                        if (uploadedImages.length === 0) {
                                                            setFeaturedImageIndex(0);
                                                        }
                                                        
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            imageUrls: updatedImages.map(img => img.url)
                                                        }));
                                                        
                                                        toast({ title: "온라인 이미지 추출 완료", description: "외부 식별 이미지를 성공적으로 가져왔습니다." });
                                                    } catch (error: any) {
                                                        console.error("온라인 이미지 업로드 중 오류:", error);
                                                        toast({ 
                                                            title: "이미지 추출 실패", 
                                                            description: "해당 사이트가 이미지 복사를 막아두었거나 엑세스가 거부되었습니다. 직접 다운로드 후 업로드해주세요.", 
                                                            variant: "destructive" 
                                                        });
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {isUploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
                                                        <p className="text-sm text-gray-500">이미지 처리 중...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">클릭 또는 드래그하여 업로드</span></p>
                                                        <p className="text-xs text-gray-500">여러 장 선택 가능 (최대 20장, 장당 10MB)</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                id="imageUpload"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = e.target.files ? Array.from(e.target.files) : [];
                                                    if (files.length > 0) handleImageUpload(files);
                                                    e.target.value = '';
                                                }}
                                                disabled={isUploading || uploadedImages.length >= 20}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {uploadedImages.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                        {uploadedImages.map((image, index) => (
                                            <div key={image.id} className="relative group">
                                                <img
                                                    src={image.url}
                                                    alt={`이미지 ${index + 1}`}
                                                    className={`h-24 w-full object-cover rounded-md border-2 ${featuredImageIndex === index ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-transparent'}`}
                                                />
                                                <div className="absolute top-1 right-1 flex space-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFeaturedImageIndex(index)}
                                                        className={`p-1 rounded-full ${featuredImageIndex === index ? 'bg-primary text-white' : 'bg-black bg-opacity-50 text-white hover:bg-primary'}`}
                                                        title="대표 이미지로 설정"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={featuredImageIndex === index ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="p-1 bg-red-500 text-white rounded-full"
                                                        onClick={() => {
                                                            const updatedImages = uploadedImages.filter(img => img.id !== image.id);
                                                            setUploadedImages(updatedImages);
                                                            setFormData(prev => ({ ...prev, imageUrls: updatedImages.map(img => img.url) }));
                                                            if (featuredImageIndex >= updatedImages.length && updatedImages.length > 0) setFeaturedImageIndex(0);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {index === featuredImageIndex && (
                                                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm z-10 pointer-events-none">
                                                        대표이미지
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {user?.role === 'admin' && (
                        <div className="flex flex-wrap gap-6 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => handleCheckboxChange("isActive", checked as boolean)}
                                />
                                <Label htmlFor="isActive" className="text-sm font-bold text-slate-700">활성 매물</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isVisible"
                                    name="isVisible"
                                    checked={formData.isVisible}
                                    onCheckedChange={(checked) => handleCheckboxChange("isVisible", checked as boolean)}
                                />
                                <Label htmlFor="isVisible" className="text-sm font-bold text-slate-700">홈페이지 노출</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isSold"
                                    name="isSold"
                                    checked={formData.isSold}
                                    onCheckedChange={(checked) => handleCheckboxChange("isSold", checked as boolean)}
                                />
                                <Label htmlFor="isSold" className="text-sm font-bold text-red-600">매각 완료</Label>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

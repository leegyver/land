import { Property } from "@shared/schema";

export interface PropertyFormData {
    title: string;
    description: string;
    type: string;
    price: string | number;
    address: string;
    city: string;
    district: string;
    size: string | number;
    bedrooms: number;
    bathrooms: number;
    imageUrls: string[];
    agentId: number;
    featured: boolean;
    isLongTerm: boolean;

    // 위치 정보
    buildingName: string;
    unitNumber: string;

    // 면적 정보
    supplyArea: string | number;
    privateArea: string | number;
    areaSize: string;

    // 건물 정보
    floor: string | number;
    totalFloors: number;
    direction: string;
    elevator: boolean;
    parking: string;
    heatingSystem: string;
    approvalDate: string;

    // 토지 정보
    landType: string;
    zoneType: string;

    // 금액 정보
    dealType: string[];
    deposit: string | number;
    depositAmount: string | number;
    monthlyRent: string | number;
    maintenanceFee: string | number;

    // 연락처 정보
    ownerName: string;
    ownerPhone: string;
    tenantName: string;
    tenantPhone: string;
    clientName: string;
    clientPhone: string;

    // 추가 정보
    specialNote: string;
    coListing: boolean;
    agentName: string;
    privateNote: string;
    youtubeUrl: string;
    featuredImageIndex: number;
    ownerId: number | null;
    isActive: boolean;
    isSold: boolean;
    isVisible: boolean;
}

export interface PropertyFormProps {
    formData: PropertyFormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (name: keyof PropertyFormData, value: string) => void;
    handleCheckboxChange: (name: keyof PropertyFormData, checked: boolean) => void;
    setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
}

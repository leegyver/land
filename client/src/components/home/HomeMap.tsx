import { useState } from 'react';
import { useLocation } from 'wouter';
import KakaoMap from '@/components/map/KakaoMap';
import { MapIcon, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const districts = [
  "전체",
  "강화읍",
  "교동면",
  "길상면",
  "내가면",
  "불은면",
  "삼산면",
  "서도면",
  "선원면",
  "송해면",
  "양도면",
  "양사면",
  "하점면",
  "화도면"
];

const HomeMap = () => {
  const [, setLocation] = useLocation();
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    if (value === "전체") {
      setLocation("/properties");
    } else {
      setLocation(`/properties?keyword=${encodeURIComponent(value)}`);
    }
  };

  return (
    <div className="relative">
      {/* 지도 제목 */}
      <div className="mb-3 flex items-center">
        <MapIcon className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-lg font-bold">지도로 부동산찾기</h2>
      </div>
      
      {/* 지도 높이 조절 - 모바일에서는 더 작은 크기 */}
      <div className="h-[18vh] md:h-[50vh] w-full rounded-lg overflow-hidden">
        <KakaoMap />
      </div>

      {/* 읍면 드롭다운 메뉴 */}
      <div className="mt-4 mb-2">
        <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
          <SelectTrigger className="w-full" data-testid="select-district">
            <SelectValue placeholder="읍면별 검색" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district} value={district} data-testid={`select-item-${district}`}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default HomeMap;
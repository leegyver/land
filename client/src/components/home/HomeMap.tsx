import KakaoMap from '@/components/map/KakaoMap';
import { MapIcon } from 'lucide-react';

const HomeMap = () => {
  return (
    <div className="relative">
      {/* 지도 제목 */}
      <div className="mb-3 flex items-center">
        <MapIcon className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-lg font-bold">지도로 부동산찾기</h2>
      </div>
      
      {/* 지도 높이 조절 */}
      <div className="h-[50vh] w-full rounded-lg overflow-hidden">
        <KakaoMap />
      </div>
    </div>
  );
};

export default HomeMap;
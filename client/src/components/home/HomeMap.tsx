import KakaoMap from '@/components/map/KakaoMap';

const HomeMap = () => {
  return (
    <div className="relative">
      {/* 지도 높이 조절 */}
      <div className="h-[50vh] w-full rounded-lg overflow-hidden">
        <KakaoMap />
      </div>
    </div>
  );
};

export default HomeMap;
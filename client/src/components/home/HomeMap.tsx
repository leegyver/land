import KakaoMap from '@/components/map/KakaoMap';

const HomeMap = () => {
  return (
    <section className="relative">
      {/* 지도를 전체 화면으로 사용 */}
      <div className="h-[60vh] w-full">
        <KakaoMap />
      </div>
    </section>
  );
};

export default HomeMap;
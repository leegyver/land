import { Link } from 'wouter';
import KakaoMap from '@/components/map/KakaoMap';

const HomeMap = () => {
  return (
    <section className="relative">
      {/* 지도를 배경으로 사용 */}
      <div className="h-[60vh] w-full">
        <KakaoMap />
      </div>
      
      {/* 오버레이 텍스트 및 버튼 */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark/40 to-transparent flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl bg-white/90 p-6 rounded-lg shadow-lg backdrop-blur-sm">
            <h1 className="text-primary text-4xl md:text-5xl font-bold mb-4">
              강화도 부동산의 새로운 기준
            </h1>
            <p className="text-dark text-xl mb-8">
              이가이버부동산과 함께 강화군 최고의 매물을 만나보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/properties" className="bg-primary hover:bg-secondary text-white font-bold py-3 px-6 rounded-lg text-center transition-colors block">
                매물 보기
              </Link>
              <Link href="/contact" className="bg-dark hover:bg-dark/80 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors block">
                상담 신청
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeMap;
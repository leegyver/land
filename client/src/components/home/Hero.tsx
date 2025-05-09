import { Link } from "wouter";

const Hero = () => {
  return (
    <section className="relative">
      <div 
        className="w-full h-[60vh] bg-cover bg-center" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
          backgroundPosition: "center"
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-r from-dark/70 to-dark/30 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">
              당신의 꿈의 집을 찾아드립니다
            </h1>
            <p className="text-white text-xl mb-8">
              신뢰할 수 있는 부동산 파트너와 함께 최고의 매물을 만나보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/properties" className="bg-primary hover:bg-secondary text-white font-bold py-3 px-6 rounded-lg text-center transition-colors block">
                매물 보기
              </Link>
              <Link href="/contact" className="bg-white hover:bg-gray-light text-primary font-bold py-3 px-6 rounded-lg text-center transition-colors block">
                상담 신청
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

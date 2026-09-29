import { Link } from "wouter";
import { Wrench, Building, Home, ShieldCheck, ArrowRight, Phone, CheckCircle, Sparkles, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TotalCareSection() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs sm:text-sm font-bold mb-2.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>신규 서비스 오픈 | 공인중개사 직영 시설관리</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              중개부터 수리·관리까지 원스톱!<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
                이가이버 부동산 토탈케어
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl font-light">
              멀리 계신 원룸·상가 건물주님의 시설 고민부터, 전원주택 긴급 집수리와 세컨하우스 안심 구독까지 해결사 이가이버가 직접 책임 시공합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/total-care">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20">
                세부 금액표 & 온라인 접수 <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <a
              href="tel:010-4787-3120"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">출장전화</span> 010-4787-3120
            </a>
          </div>
        </div>

        {/* 4 Core Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: 원룸/다가구 */}
          <Link href="/total-care" className="group">
            <div className="h-full bg-slate-800/80 hover:bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-11 h-11 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-orange-500/40 text-orange-400 text-[10px] mb-1 font-bold">임대인 강력추천</Badge>
                <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                  원룸 · 다가구 유지보수
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  세입자의 잦은 시설 민원 접수 대행부터 퇴거 시 원상복구 점검 및 즉시 리페어.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-xs text-orange-400 font-bold flex justify-between items-center">
                  <span>월 정기 / 원상복구</span>
                  <span className="text-white text-[11px] font-normal">호실당 월 1.5만원~</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: 상가/건물 */}
          <Link href="/total-care" className="group">
            <div className="h-full bg-slate-800/80 hover:bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[10px] mb-1 font-bold">건물 가치 상승</Badge>
                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                  상가 · 꼬마빌딩 유지보수
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  옥상 우레탄 방수 점검, 계단 조명, 강화도 펜션 주말 긴급 설비 트러블 케어.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-xs text-blue-400 font-bold flex justify-between items-center">
                  <span>정기 순회 종합점검</span>
                  <span className="text-white text-[11px] font-normal">월 15만 ~ 30만원</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 3: 생활 집수리 */}
          <Link href="/total-care" className="group">
            <div className="h-full bg-slate-800/80 hover:bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] mb-1 font-bold">강화 전지역 신속출장</Badge>
                <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                  일반 주택 · 생활 집수리
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  수전 교체, 변기/배관 막힘, LED 조명, 도어락, 미세방충망, 데크 오일스테인.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-xs text-emerald-400 font-bold flex justify-between items-center">
                  <span>정찰제 단가표 공시</span>
                  <span className="text-white text-[11px] font-normal">수전 4만~/조명 2.5만~</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 4: 세컨하우스 안심구독 */}
          <Link href="/total-care" className="group">
            <div className="h-full bg-slate-800/80 hover:bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-[10px] mb-1 font-bold">주말주택 소유주 필수</Badge>
                <h3 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors">
                  세컨하우스 안심 구독 케어
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  비어있는 별장의 한파 동파 방지, 실내 환기 및 통수 점검, 카카오톡 사진 리포트.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-xs text-purple-400 font-bold flex justify-between items-center">
                  <span>월 1~2회 정기 방문</span>
                  <span className="text-white text-[11px] font-normal">월 10만 ~ 18만원</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom Micro Banner */}
        <div className="mt-8 bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>하청 없는 100% 대표 책임시공:</strong> 공인중개사이자 수리 전문가인 이가이버가 직접 진단하고 정직하게 수리합니다.
            </span>
          </div>
          <Link href="/total-care#apply-form" className="text-orange-400 font-bold hover:underline shrink-0 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            사진 찍어 무료 견적 접수하기 ➡️
          </Link>
        </div>
      </div>
    </section>
  );
}

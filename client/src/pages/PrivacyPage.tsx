import { Helmet } from "react-helmet";
import PageTransition from "@/components/layout/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <PageTransition>
      <Helmet>
        <title>개인정보처리방침 - 이가이버부동산</title>
        <meta name="description" content="이가이버부동산 개인정보처리방침입니다." />
      </Helmet>

      <div className="bg-slate-50 min-h-screen py-12 md:py-20 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-slate-500 mb-8">
            <Link href="/">
              <a className="hover:text-emerald-600 transition-colors">홈</a>
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 font-medium">개인정보처리방침</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              개인정보처리방침
            </h1>
            <p className="text-slate-600">안전하고 소중하게 고객님의 정보를 관리합니다.</p>
          </div>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh] md:h-[70vh] p-6 md:p-10">
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
                  <h2>1. 수집하는 개인정보 항목</h2>
                  <p>회사는 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>수집항목 : 이름, 이메일 주소, 전화번호, 접속 IP 정보 등</li>
                    <li>수집방법 : 홈페이지(고객 문의, 상담 게시판, 뉴스레터 신청 등)</li>
                  </ul>

                  <h2>2. 개인정보의 수집 및 이용 목적</h2>
                  <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>고객 문의에 대한 답변 및 상담 내용 유지</li>
                    <li>신규 매물 안내 및 마케팅 정보 전달(뉴스레터 구독자에 한함)</li>
                    <li>서비스 이용 통계 및 분석</li>
                  </ul>

                  <h2>3. 개인정보의 보유 및 이용기간</h2>
                  <p>
                    원칙적으로, 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
                  </p>

                  <h2>4. 개인정보의 파기절차 및 방법</h2>
                  <p>
                    이용자의 개인정보는 원칙적으로 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때 지체없이 파기됩니다. (전자적 파일 형태는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제)
                  </p>

                  <h2>5. 개인정보 보호책임자</h2>
                  <ul className="list-none pl-0 space-y-2 bg-slate-100 p-4 rounded-xl mt-4">
                    <li><strong>책임자 :</strong> 이민호</li>
                    <li><strong>소속/직위 :</strong> 이가이버랜드 대표</li>
                    <li><strong>연락처 :</strong> 032-934-3120, 9551304@naver.com</li>
                  </ul>

                  <div className="mt-12 p-6 bg-slate-50 rounded-2xl text-sm text-slate-500 text-center">
                    본 방침은 2026년 8월 8일부터 적용됩니다.
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

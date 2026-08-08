import { Helmet } from "react-helmet";
import PageTransition from "@/components/layout/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function TermsPage() {
  return (
    <PageTransition>
      <Helmet>
        <title>서비스 이용약관 - 이가이버부동산</title>
        <meta name="description" content="이가이버부동산 서비스 이용약관입니다." />
      </Helmet>

      <div className="bg-slate-50 min-h-screen py-12 md:py-20 pt-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-slate-500 mb-8">
            <Link href="/">
              <a className="hover:text-emerald-600 transition-colors">홈</a>
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 font-medium">서비스 이용약관</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              서비스 이용약관
            </h1>
            <p className="text-slate-600">이가이버부동산 서비스를 이용해 주셔서 감사합니다.</p>
          </div>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh] md:h-[70vh] p-6 md:p-10">
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
                  <h2>제1조 (목적)</h2>
                  <p>
                    본 약관은 "이가이버부동산(이가이버랜드)"(이하 '회사'라 합니다)가 제공하는 부동산 정보 및 관련 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>

                  <h2>제2조 (용어의 정의)</h2>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>'서비스'란 회사가 운영하는 웹사이트 및 애플리케이션을 통해 이용자에게 제공하는 모든 서비스를 의미합니다.</li>
                    <li>'이용자'란 회사의 서비스에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                  </ol>

                  <h2>제3조 (약관의 효력 및 변경)</h2>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                    <li>회사는 관련 법령을 위배하지 않는 범위 내에서 약관을 개정할 수 있으며, 개정 시에는 적용 일자 및 개정 사유를 명시하여 사전 공지합니다.</li>
                  </ol>

                  <h2>제4조 (서비스의 제공 및 중단)</h2>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>회사는 부동산 매물 정보 제공, 커뮤니티 게시판 등 다양한 서비스를 제공합니다.</li>
                    <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                  </ol>

                  <h2>제5조 (책임 제한)</h2>
                  <p>
                    회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법률에 특별한 규정이 없는 한 책임을 지지 않습니다. 등록된 매물 정보는 참고용이며, 실제 거래 시 당사자 간의 확인이 필요합니다.
                  </p>

                  <div className="mt-12 p-6 bg-slate-50 rounded-2xl text-sm text-slate-500 text-center">
                    본 약관은 2026년 8월 8일부터 적용됩니다.
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

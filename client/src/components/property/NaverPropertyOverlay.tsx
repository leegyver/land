import { Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone, MessageSquare, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface NaverPropertyOverlayProps {
    property: Property & { atclNo?: string };
}

const NaverPropertyOverlay = ({ property }: NaverPropertyOverlayProps) => {
    const [, setLocation] = useLocation();
    const { user } = useAuth();

    const handleInquiry = () => {
        // Navigate to contact page with pre-filled info
        const params = new URLSearchParams({
            tab: 'inquiry',
            atclNo: property.atclNo || '',
            title: property.title || '네이버 매물 문의',
            source: 'naver'
        });
        setLocation(`/contact?${params.toString()}`);
    };

    const handleCall = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const phoneNumber = "010-4787-3120";

        if (isMobile) {
            window.location.href = `tel:${phoneNumber}`;
        } else {
            alert(`전화상담 번호: ${phoneNumber}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center pb-20">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-slate-900 mb-2 break-keep">
                    이가이버의 확인이 필요한 매물입니다
                </h1>

                <div className="space-y-4 mb-8">
                    <p className="text-slate-600 leading-relaxed text-sm break-keep">
                        선택하신 매물은 <b>네이버 부동산 공동중개 매물</b>로,<br />
                        세부 정보 확인을 위해 <b>별도의 절차</b>가 필요합니다.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-xs text-slate-500 space-y-2">
                        <p>• 해당 매물의 정확한 위치 및 상세 정보는 <b>이가이버 부동산</b>을 통해 확인하실 수 있습니다.</p>
                        <p>• 아래 버튼을 통해 문의 주시면 신속하게 안내해 드리겠습니다.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                        onClick={handleInquiry}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        간편 문의하기 (정보 자동입력)
                    </Button>

                    <Button
                        className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-black shadow-lg"
                        onClick={handleCall}
                    >
                        <Phone className="w-4 h-4 mr-2" />
                        전화 상담 바로가기
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full h-12 text-slate-500 hover:text-slate-900 hover:bg-slate-100 mt-2"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        이전 페이지로 돌아가기
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NaverPropertyOverlay;

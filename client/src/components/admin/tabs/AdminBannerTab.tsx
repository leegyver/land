import { BannerColumn } from "../BannerColumn";

export default function AdminBannerTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">메인 홈페이지 배너 관리</h3>
        <p className="text-sm text-slate-500">홈페이지 메인 화면 양측에 노출되는 세로형 배너 이미지를 관리합니다. 드래그 앤 드롭으로 표시 순서를 자유롭게 변경할 수 있습니다.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <BannerColumn location="left" title="좌측 윙 배너 관리" />
        <BannerColumn location="right" title="우측 윙 배너 관리" />
      </div>
    </div>
  );
}

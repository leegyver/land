// 사이트 전역 설정
export const siteConfig = {
  siteName: "이가이버 부동산",
  siteTitle: "이가이버 부동산",
  siteDescription: "강화도 부동산 중개 서비스",
  contactEmail: "contact@ganghwaestate.com",
  copyrightYear: new Date().getFullYear(),
  defaultImageUrl: "https://www.ganghwa.go.kr/images/kr/sub/sub0305_img01.jpg"
};

// 브라우저 환경에서 전역 사이트 이름 설정
if (typeof window !== 'undefined') {
  (window as any).siteName = siteConfig.siteName;
}

export interface Review {
    id: number;
    author: string;
    location: string;
    date: string;
    rating: number;
    content: string;
    transactionType: "매매" | "전세" | "월세";
    transactionAmount?: string; // e.g., "3억 5천만원"
    imageUrl?: string;
    badge: "거래완료" | "상담후기";
}

export const reviews: Review[] = [
    {
        id: 1,
        author: "김철수",
        location: "강화읍 남산리",
        date: "2024.01.15",
        rating: 5,
        content: "사장님께서 너무 친절하게 설명해주셔서 믿고 거래했습니다. 강화도 지리에 대해서도 잘 아셔서 많은 도움이 되었습니다. 강력 추천합니다!",
        transactionType: "매매",
        transactionAmount: "4억 2천만원",
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1073&q=80",
        badge: "거래완료"
    },
    {
        id: 2,
        author: "이영희",
        location: "길상면 온수리",
        date: "2023.12.20",
        rating: 5,
        content: "전원주택 부지를 찾고 있었는데, 제가 원하는 조건에 딱 맞는 땅을 찾아주셨어요. 복잡한 서류 문제도 깔끔하게 해결해주셔서 감사합니다.",
        transactionType: "매매",
        transactionAmount: "2억 8천만원",
        imageUrl: "https://images.unsplash.com/photo-1599809272520-279778c79805?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        badge: "거래완료"
    },
    {
        id: 3,
        author: "박민수",
        location: "화도면 상방리",
        date: "2023.11.05",
        rating: 4.5,
        content: "주말농장용 작은 땅을 구하고 있었는데, 소액 매물임에도 불구하고 정말 성심성의껏 안내해주셨습니다. 덕분에 좋은 주말농장이 생겼네요.",
        transactionType: "매매",
        transactionAmount: "8,500만원",
        imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80",
        badge: "거래완료"
    },
    {
        id: 4,
        author: "최지혜",
        location: "송해면 솔정리",
        date: "2023.10.12",
        rating: 5,
        content: "부모님 귀촌하실 집을 알아보다가 방문하게 되었습니다. 노인분들이 살기 편한 구조의 집들만 골라서 보여주시는 센스에 감동했습니다.",
        transactionType: "전세",
        transactionAmount: "1억 5천만원",
        imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        badge: "거래완료"
    },
    {
        id: 5,
        author: "정우성",
        location: "내가면 외포리",
        date: "2023.09.28",
        rating: 5,
        content: "상가 자리가 필요해서 여러 부동산을 다녀봤지만 여기가 제일 좋았습니다. 상권 분석까지 꼼꼼하게 해주셔서 확신을 가지고 계약했습니다.",
        transactionType: "월세",
        transactionAmount: "보증금 2000 / 월 120",
        badge: "거래완료"
    },
    {
        id: 6,
        author: "강수진",
        location: "불은면 삼성리",
        date: "2023.09.15",
        rating: 5,
        content: "처음 방문했을 때부터 계약 마무리까지 정말 프로페셔널하셨습니다. 강화도 부동산은 무조건 이가이버 추천 드려요!",
        transactionType: "매매",
        transactionAmount: "5억 5천만원",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        badge: "거래완료"
    }
];

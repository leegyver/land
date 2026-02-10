
// Tarot Card Data & Logic

export interface TarotCard {
    id: number;
    name: string;
    nameKr: string;
    image: string; // Placeholder or path
    keywords: string[];
    meaningBuy: string; // Meaning for "Buying"
    meaningRent: string; // Meaning for "Rent/Living"
    meaningInvest: string; // Meaning for "Investment"
}

export const MAJOR_ARCANA: TarotCard[] = [
    {
        id: 0,
        name: "The Fool",
        nameKr: "바보",
        image: "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg",
        keywords: ["시작", "모험", "낙관", "무계획"],
        meaningBuy: "새로운 곳에서의 시작은 좋으나, 계약 조건을 꼼꼼히 따져보세요. 너무 즉흥적인 결정은 위험할 수 있습니다.",
        meaningRent: "마음이 끌리는 대로 선택해도 좋습니다. 자유로운 생활이 예상됩니다.",
        meaningInvest: "대박 아니면 쪽박일 수 있는 모험적인 투자입니다. 여유 자금으로만 접근하세요."
    },
    {
        id: 1,
        name: "The Magician",
        nameKr: "마법사",
        image: "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
        keywords: ["창조", "능력", "실행", "달변"],
        meaningBuy: "원하는 조건대로 집을 꾸미거나 리모델링하기에 최적입니다. 당신의 능력을 발휘할 공간입니다.",
        meaningRent: "집주인이나 중개인과의 협상이 잘 풀릴 것입니다.",
        meaningInvest: "적극적으로 움직이면 좋은 결과를 얻을 수 있는 시기입니다."
    },
    {
        id: 2,
        name: "The High Priestess",
        nameKr: "여사제",
        image: "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg",
        keywords: ["직관", "비밀", "지혜", "신중"],
        meaningBuy: "서두르지 말고 문서를 꼼꼼히 검토하세요. 겉으로 보이지 않는 하자나 조건이 있을 수 있습니다.",
        meaningRent: "조용하고 사생활이 보호되는 집을 구하게 됩니다.",
        meaningInvest: "지금은 관망할 때입니다. 정보를 더 수집하고 공부하세요."
    },
    {
        id: 3,
        name: "The Empress",
        nameKr: "여황제",
        image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg",
        keywords: ["풍요", "편안함", "성취", "아름다움"],
        meaningBuy: "매우 길한 카드입니다! 편안하고 풍요로운 보금자리가 될 것입니다.",
        meaningRent: "인테리어가 아름답거나 살기 좋은 환경의 집입니다.",
        meaningInvest: "장기적으로 큰 이익을 가져다 줄 알짜배기 매물입니다."
    },
    {
        id: 4,
        name: "The Emperor",
        nameKr: "황제",
        image: "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg",
        keywords: ["안정", "권위", "구조", "규칙"],
        meaningBuy: "기반이 튼튼하고 구조가 좋은 집입니다. 자산 가치가 안정적으로 유지될 것입니다.",
        meaningRent: "관리 시스템이 잘 되어 있거나 치안이 좋은 곳입니다.",
        meaningInvest: "보수적이고 안정적인 투자처입니다. 확실한 수익이 예상됩니다."
    },
    {
        id: 10,
        name: "Wheel of Fortune",
        nameKr: "운명의 수레바퀴",
        image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg",
        keywords: ["변화", "운명", "전환점", "기회"],
        meaningBuy: "이사는 당신의 인생에 큰 전환점이 될 것입니다. 운의 흐름이 바뀌는 시기입니다.",
        meaningRent: "예상치 못한 기회로 좋은 집을 얻게 됩니다.",
        meaningInvest: "시세 차익이나 호재가 예상되는 타이밍입니다."
    },
    {
        id: 16,
        name: "The Tower",
        nameKr: "탑",
        image: "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
        keywords: ["붕괴", "충격", "갑작스러운 변화", "재난"],
        meaningBuy: "계약 파기나 건물의 하자에 주의하세요. 돌다리도 두들겨 보고 건너야 합니다.",
        meaningRent: "갑작스럽게 이사를 가야 할 수도 있습니다. 계약서를 잘 확인하세요.",
        meaningInvest: "지금은 투자를 피하는 것이 상책입니다. 손해를 볼 위험이 큽니다."
    },
    {
        id: 19,
        name: "The Sun",
        nameKr: "태양",
        image: "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg",
        keywords: ["성공", "활력", "기쁨", "명확함"],
        meaningBuy: "채광이 좋고 밝은 기운이 넘치는 집입니다. 모든 일이 술술 풀릴 것입니다.",
        meaningRent: "이웃이나 주변 환경이 매우 쾌적하고 만족스럽습니다.",
        meaningInvest: "매우 긍정적입니다. 밝은 미래가 보장된 투자처입니다."
    }
];

export const drawOneCard = (): TarotCard => {
    const index = Math.floor(Math.random() * MAJOR_ARCANA.length);
    return MAJOR_ARCANA[index];
};

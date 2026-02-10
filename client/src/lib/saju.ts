
import {
    calculateFourPillars,
    BirthInfo,
    FourPillarsDetail,
    HEAVENLY_STEMS,
    EARTHLY_BRANCHES,
    FIVE_ELEMENTS,
    HeavenlyStem,
    EarthlyBranch,
    FiveElement,
    YinYang,
    getHeavenlyStemElement,
    getEarthlyBranchElement
} from 'manseryeok';
import { Lunar } from 'lunar-javascript';

// --- Extended Types & Interfaces ---

export interface SajuData extends FourPillarsDetail {
    // Basic Info
    birthDate: Date;
    birthTimeStr?: string;
    isLunar: boolean;

    // Analysis
    dominantElement: FiveElement;
    lackingElement?: FiveElement;

    // Advanced Analysis (Ten Gods / Shipseong)
    tenGods: {
        yearStem: TenGod;
        yearBranch: TenGod;
        monthStem: TenGod;
        monthBranch: TenGod;
        dayStem: '비견(Friend)'; // Day Master is always Friend (Self)
        dayBranch: TenGod;
        timeStem?: TenGod;
        timeBranch?: TenGod;
    };

    // 12 Stages of Life (Sibiwunseong)
    twelveStages: {
        year: TwelveStage;
        month: TwelveStage;
        day: TwelveStage;
        time?: TwelveStage;
    };

    // Divine/Evil Spirits (Sinsal) - Simplified for MVP
    spirits: string[];
}

export type TenGod =
    '비견(Friend)' | '겁재(Rob Wealth)' |
    '식신(Eating God)' | '상관(Hurting Officer)' |
    '편재(Indirect Wealth)' | '정재(Direct Wealth)' |
    '편관(Seven Killings)' | '정관(Direct Officer)' |
    '편인(Indirect Resource)' | '정인(Direct Resource)';

export type TwelveStage =
    '장생' | '목욕' | '관대' | '건록' |
    '제왕' | '쇠' | '병' | '사' |
    '묘' | '절' | '태' | '양';

// --- Helper Functions for Advanced Logic ---

// 1. Ten Gods (Shipseong) Calculation
// Based on the relationship between Day Stem (Self) and other Stems/Branches
const calculateTenGod = (dayMaster: HeavenlyStem, target: HeavenlyStem | EarthlyBranch): TenGod => {
    const dayElement = getHeavenlyStemElement(dayMaster);
    const dayYinYangIndex = HEAVENLY_STEMS.indexOf(dayMaster) % 2; // 0: Yang, 1: Yin

    let targetElement: FiveElement;
    let targetYinYangIndex: number; // 0: Yang, 1: Yin

    // Identify Target Element & YinYang
    if (HEAVENLY_STEMS.includes(target as HeavenlyStem)) {
        targetElement = getHeavenlyStemElement(target as HeavenlyStem);
        targetYinYangIndex = HEAVENLY_STEMS.indexOf(target as HeavenlyStem) % 2;
    } else {
        targetElement = getEarthlyBranchElement(target as EarthlyBranch);
        // Earthly Branch YinYang implies its main hidden stem's polarity usually
        // Simplified mapping for Yin/Yang of Branches:
        // Yang: Ja, In, Jin, O, Sin, Sul (Indices: 0, 2, 4, 6, 8, 10 - Wait, standard order?)
        // Standard Order: Ja(Yang), Chuk(Yin), In(Yang), Myo(Yin)...
        // Index 0(Ja) -> Yang, 1(Chuk) -> Yin...
        targetYinYangIndex = EARTHLY_BRANCHES.indexOf(target as EarthlyBranch) % 2;

        // CORRECTION: In Saju, certain branches treat Yin/Yang differently for Ten Gods (Fire/Water swap for body vs use)
        // But for standard Ten Gods, we often follow the element's polarity.
        // Let's stick to standard index-based parity for MVP.
        // Ja(Rat): Water(+), Chuk(Ox): Earth(-), In(Tiger): Wood(+), Myo(Rabbit): Wood(-)...
        // Exceptions often exist (e.g. Sa(Snake) is Fire(-) in body but Fire(+) in function).
        // Let's use standard index parity: Even=Yang(+), Odd=Yin(-)
        // BUT wait, HEAVENLY_STEMS: Gap(0) is Yang.
        // EARTHLY_BRANCHES: Ja(0) is Yang.
        // So Parity matches.
    }

    const isSameYinYang = dayYinYangIndex === targetYinYangIndex;

    // Relationship Logic
    // Same Element
    if (dayElement === targetElement) {
        return isSameYinYang ? '비견(Friend)' : '겁재(Rob Wealth)';
    }

    // Day Generates Target (Output)
    if (GENERATING_CYCLE[dayElement] === targetElement) {
        return isSameYinYang ? '식신(Eating God)' : '상관(Hurting Officer)';
    }

    // Target Generates Day (Resource)
    if (GENERATING_CYCLE[targetElement] === dayElement) {
        return isSameYinYang ? '편인(Indirect Resource)' : '정인(Direct Resource)';
    }

    // Day Controls Target (Wealth)
    if (CONTROLLING_CYCLE[dayElement] === targetElement) {
        return isSameYinYang ? '편재(Indirect Wealth)' : '정재(Direct Wealth)';
    }

    // Target Controls Day (Officer/Ghost)
    if (CONTROLLING_CYCLE[targetElement] === dayElement) {
        return isSameYinYang ? '편관(Seven Killings)' : '정관(Direct Officer)';
    }

    return '비견(Friend)'; // Fallback
};

const GENERATING_CYCLE: Record<FiveElement, FiveElement> = {
    '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
};

const CONTROLLING_CYCLE: Record<FiveElement, FiveElement> = {
    '목': '토', '토': '수', '수': '화', '화': '금', '금': '목'
};


// 2. Twelve Stages of Life (Sibiwunseong)
// Relationship between Day Stem and Earthly Branches
const calculateTwelveStage = (dayStem: HeavenlyStem, branch: EarthlyBranch): TwelveStage => {
    // Simplified lookup table or logic
    // Start index for 'JangSaeng' (Long Life) for each Stem
    // Gap(Wood+): Hae(亥) -> Index 11
    // Eul(Wood-): O(午) -> Index 6 (Reversed cycle for Yin stems?) -> complex.

    // Let's implement a lookup map for simplicity and accuracy.
    // Key: Stem, Value: Array of 12 stages starting from Ja(子) index 0

    // Ideally we'd calculate this, but a map is safer for MVP.
    const STAGE_MAP: Record<HeavenlyStem, TwelveStage[]> = {
        '갑': ['목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양', '장생'], // Ja, Chuk, In...
        '을': ['병', '쇠', '제왕', '건록', '관대', '목욕', '장생', '양', '태', '절', '묘', '사'],
        '병': ['태', '양', '장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절'],
        '정': ['절', '묘', '사', '병', '쇠', '제왕', '건록', '관대', '목욕', '장생', '양', '태'],
        '무': ['태', '양', '장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절'], // Same as Byeong(Fire)
        '기': ['절', '묘', '사', '병', '쇠', '제왕', '건록', '관대', '목욕', '장생', '양', '태'], // Same as Jeong(Fire)
        '경': ['사', '묘', '절', '태', '양', '장생', '목욕', '관대', '건록', '제왕', '쇠', '병'],
        '신': ['장생', '양', '태', '절', '묘', '사', '병', '쇠', '제왕', '건록', '관대', '목욕'],
        '임': ['제왕', '쇠', '병', '사', '묘', '절', '태', '양', '장생', '목욕', '관대', '건록'],
        '계': ['건록', '관대', '목욕', '장생', '양', '태', '절', '묘', '사', '병', '쇠', '제왕']
    };

    const branchIndex = EARTHLY_BRANCHES.indexOf(branch);
    return STAGE_MAP[dayStem][branchIndex];
};


// 3. Spirits (Sinsal) - Simple implementation of major ones
const calculateSpirits = (dayBranch: EarthlyBranch, targetBranch: EarthlyBranch): string[] => {
    const list: string[] = [];
    const dayIdx = EARTHLY_BRANCHES.indexOf(dayBranch);
    const targetIdx = EARTHLY_BRANCHES.indexOf(targetBranch);

    // Yeokma (Travel Star): In, Sin, Sa, Hae relative to day branch triplet
    // Triplet (Samhap): 
    // In-O-Sul (Fire) -> Next start: Sin -> Yeokma
    // Sa-Yu-Chuk (Metal) -> Next start: Hae -> Yeokma
    // Sin-Ja-Jin (Water) -> Next start: In -> Yeokma
    // Hae-Myo-Mi (Wood) -> Next start: Sa -> Yeokma

    const yeokmaMap: Record<number, EarthlyBranch> = {
        2: '신', 6: '신', 10: '신', // In, O, Sul -> Sin
        5: '해', 9: '해', 1: '해',  // Sa, Yu, Chuk -> Hae
        8: '인', 0: '인', 4: '인',  // Sin, Ja, Jin -> In
        11: '사', 3: '사', 7: '사'  // Hae, Myo, Mi -> Sa
    };

    if (yeokmaMap[dayIdx] === targetBranch) list.push('역마살(Travel)');

    // Dohwa (Peach Blossom): Ja, O, Myo, Yu relative to day branch triplet
    // In-O-Sul -> Myo
    // Sa-Yu-Chuk -> O
    // Sin-Ja-Jin -> Yu
    // Hae-Myo-Mi -> Ja
    const dohwaMap: Record<number, EarthlyBranch> = {
        2: '묘', 6: '묘', 10: '묘',
        5: '오', 9: '오', 1: '오',
        8: '유', 0: '유', 4: '유',
        11: '자', 3: '자', 7: '자'
    };
    if (dohwaMap[dayIdx] === targetBranch) list.push('도화살(Attraction)');

    return list;
};


// --- Main Calculation Function ---

export const calculateSaju = (inputDate: Date, birthTimeStr?: string, isLunar: boolean = false): SajuData => {
    let birthDate = inputDate;

    // 음력 -> 양력 변환 로직
    if (isLunar) {
        try {
            const lunarDate = Lunar.fromYmd(inputDate.getFullYear(), inputDate.getMonth() + 1, inputDate.getDate());
            const solarDate = lunarDate.getSolar();
            birthDate = new Date(solarDate.getYear(), solarDate.getMonth() - 1, solarDate.getDay());
            console.log(`[Saju] Lunar Conversion: ${inputDate.toISOString().split('T')[0]} (Lunar) -> ${birthDate.toISOString().split('T')[0]} (Solar)`);
        } catch (e) {
            console.error("[Saju] Failed to convert Lunar date:", e);
            // Fallback: use input date as is (or handle error appropriately)
        }
    }

    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    let hour = 12; // Default
    let minute = 0;

    if (birthTimeStr) {
        [hour, minute] = birthTimeStr.split(':').map(Number);
    }

    const birthInfo: BirthInfo = { year, month, day, hour, minute };

    // Core Calculation from Library
    const fourPillars = calculateFourPillars(birthInfo);

    // Advanced Analysis
    const dayStem = fourPillars.day.heavenlyStem;
    const dayBranch = fourPillars.day.earthlyBranch;

    // Ten Gods
    const tenGods = {
        yearStem: calculateTenGod(dayStem, fourPillars.year.heavenlyStem),
        yearBranch: calculateTenGod(dayStem, fourPillars.year.earthlyBranch),
        monthStem: calculateTenGod(dayStem, fourPillars.month.heavenlyStem),
        monthBranch: calculateTenGod(dayStem, fourPillars.month.earthlyBranch),
        dayStem: '비견(Friend)' as const,
        dayBranch: calculateTenGod(dayStem, dayBranch),
        timeStem: fourPillars.hour ? calculateTenGod(dayStem, fourPillars.hour.heavenlyStem) : undefined,
        timeBranch: fourPillars.hour ? calculateTenGod(dayStem, fourPillars.hour.earthlyBranch) : undefined,
    };

    // Twelve Stages
    const twelveStages = {
        year: calculateTwelveStage(dayStem, fourPillars.year.earthlyBranch),
        month: calculateTwelveStage(dayStem, fourPillars.month.earthlyBranch),
        day: calculateTwelveStage(dayStem, dayBranch),
        time: fourPillars.hour ? calculateTwelveStage(dayStem, fourPillars.hour.earthlyBranch) : undefined
    };

    // Spirits (Check all branches against Day Branch)
    const spirits: string[] = [
        ...calculateSpirits(dayBranch, fourPillars.year.earthlyBranch),
        ...calculateSpirits(dayBranch, fourPillars.month.earthlyBranch),
        ...calculateSpirits(dayBranch, dayBranch), // Usually self-check isn't counted or is specific
        ...(fourPillars.hour ? calculateSpirits(dayBranch, fourPillars.hour.earthlyBranch) : [])
    ];
    const uniqueSpirits = Array.from(new Set(spirits));


    // Dominant Element Logic (Enhanced with library data)
    const counts: Record<FiveElement, number> = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };

    const countElement = (stem: HeavenlyStem, branch: EarthlyBranch, weight: number = 1) => {
        counts[getHeavenlyStemElement(stem)] += weight;
        counts[getEarthlyBranchElement(branch)] += weight;
    };

    countElement(fourPillars.year.heavenlyStem, fourPillars.year.earthlyBranch, 1);
    countElement(fourPillars.month.heavenlyStem, fourPillars.month.earthlyBranch, 1.5); // Month branch weighted
    countElement(fourPillars.day.heavenlyStem, fourPillars.day.earthlyBranch, 1);

    // Check if hour exists (library might return default/null if logic allows, but interface says Pillar)
    // manseryeok library always returns hour pillar even if default.
    countElement(fourPillars.hour.heavenlyStem, fourPillars.hour.earthlyBranch, 1);

    let dominant: FiveElement = '토';
    let maxVal = -1;
    let minVal = 999;
    let lacking: FiveElement | undefined = undefined;

    (Object.keys(counts) as FiveElement[]).forEach(el => {
        if (counts[el] > maxVal) {
            maxVal = counts[el];
            dominant = el;
        }
        if (counts[el] < minVal) {
            minVal = counts[el];
            lacking = el;
        }
        if (counts[el] === 0) lacking = el;
    });


    return {
        ...fourPillars,
        birthDate,
        birthTimeStr,
        isLunar,
        dominantElement: dominant,
        lackingElement: lacking,
        tenGods,
        twelveStages,
        spirits: uniqueSpirits
    };
};


export const getCompatibilityScore = (saju: SajuData, propertyFeatures: {
    id: number,
    direction?: string | null,
    floor?: number | null
}): {
    score: number,
    comment: string,
    luckyDirection?: string,
    details?: {
        investment: { style: string, advice: string },
        styling: { colors: string, tip: string },
        location: string
    }
} => {
    let score = 70;
    const myElement = saju.dominantElement;
    const lacking = saju.lackingElement;
    const comments: string[] = [];

    const directionMap: Record<string, FiveElement> = {
        '남향': '화', '남': '화', 'South': '화',
        '동향': '목', '동': '목', 'East': '목',
        '서향': '금', '서': '금', 'West': '금',
        '북향': '수', '북': '수', 'North': '수',
        '남동향': '목', 'South-East': '목',
        '남서향': '토', 'South-West': '토'
    };

    let propElement: FiveElement | null = null;
    if (propertyFeatures.direction) {
        const dirKey = Object.keys(directionMap).find(k => propertyFeatures.direction?.includes(k));
        if (dirKey) propElement = directionMap[dirKey];
    }

    const generating: Record<FiveElement, FiveElement> = {
        '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
    };

    if (propElement) {
        if (lacking === propElement) {
            score += 20;
            comments.push(`부족한 ${propElement} 기운을 채워주는 방향입니다.`);
        } else if (generating[myElement] === propElement) {
            score += 10;
            comments.push("나의 기운을 설기하여 투자 흐름이 좋은 방향입니다.");
        } else if (generating[propElement] === myElement) {
            score += 15;
            comments.push("집이 나를 도와주는 편안한 방향입니다.");
        } else {
            comments.push("무난한 방향입니다.");
        }
    } else {
        comments.push("방향 정보가 없습니다.");
    }

    if (propertyFeatures.floor) {
        const floorLastDigit = propertyFeatures.floor % 10;
        let floorElement: FiveElement = '토';
        if ([1, 6].includes(floorLastDigit)) floorElement = '수';
        else if ([2, 7].includes(floorLastDigit)) floorElement = '화';
        else if ([3, 8].includes(floorLastDigit)) floorElement = '목';
        else if ([4, 9].includes(floorLastDigit)) floorElement = '금';

        if (lacking === floorElement) {
            score += 5;
            comments.push(`${propertyFeatures.floor}층은 부족한 기운을 보완합니다.`);
        }
    }

    const wealthElement = CONTROLLING_CYCLE[myElement];
    if (propElement === wealthElement) {
        score += 5;
        comments.push("재물운(재성)을 불러오는 방향입니다! 💰");
    }

    // --- Enhanced Detailed Advice ---
    const coreTenGod = saju.tenGods.dayBranch.split('(')[0].trim();
    const investmentAdvice = (REAL_ESTATE_TIPS as any)[coreTenGod] || { style: '안정적인 투자', advice: '주관을 가지고 신중하게 결정하세요.' };

    // Use lacking element for styling if exists, otherwise dominant
    const targetElement = lacking || myElement;
    const stylingAdvice = LUCKY_STYLING[targetElement] || { colors: '화이트, 내추럴', tip: '깔끔한 분위기를 유지하세요.' };

    // Find major spirit and get location advice
    const majorSpirit = saju.spirits.length > 0 ? saju.spirits[0].split('(')[0].trim() : '귀인';
    const locationAdvice = SHINSAL_REAL_ESTATE[majorSpirit] || '안정적이고 편안한 주거 환경을 추천합니다.';

    return {
        score: Math.min(100, Math.max(0, score)),
        comment: comments.join(' '),
        luckyDirection: lacking ? Object.keys(directionMap).find(key => directionMap[key] === lacking) : undefined,
        details: {
            investment: investmentAdvice,
            styling: stylingAdvice,
            location: locationAdvice
        }
    };
};
import { REAL_ESTATE_TIPS, LUCKY_STYLING, SHINSAL_REAL_ESTATE } from './saju_desc';

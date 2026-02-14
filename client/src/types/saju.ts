
import { FourPillarsDetail, FiveElement } from 'manseryeok';

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
    provider?: string | null;
}

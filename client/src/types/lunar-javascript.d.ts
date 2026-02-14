declare module 'lunar-javascript' {
    export class Lunar {
        static fromYmd(year: number, month: number, day: number): Lunar;
        getSolar(): Solar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getYearGan(): string;
        getMonthGan(): string;
        getDayGan(): string;
        getTimeGan(): string;
        getYearInGanZhi(): string;
        getMonthInGanZhi(): string;
        getDayInGanZhi(): string;
    }

    export class Solar {
        static fromYmd(year: number, month: number, day: number): Solar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }
}

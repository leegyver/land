
import { format } from "date-fns";

/**
 * 숫자를 한국식 화폐 단위로 포맷팅합니다.
 * 예: 150000000 -> 1억 5000만원
 * 예: 700000000 -> 7억원
 * 예: 78000000 -> 7800만원
 */
/**
 * 다양한 형식의 가격 입력(숫자, 쉼표, '억', '천', '만' 등 한글 표기)을 '원' 단위 숫자 문자열로 변환합니다.
 * 예: "350,000,000" -> "350000000"
 * 예: "3억 5천" -> "350000000"
 * 예: "3.5억" -> "350000000"
 * 예: "3억 5000만" -> "350000000"
 * 예: "7800만" -> "78000000"
 */
export const parseKoreanPriceToWon = (input: string | number | null | undefined): string => {
    if (input === null || input === undefined) return '';
    const str = String(input).trim().replace(/,/g, '');
    if (!str) return '';

    // 순수 숫자 문자열인 경우 그대로 반환
    if (/^\d+$/.test(str)) {
        return str;
    }

    let totalWon = 0;
    let matched = false;

    // 1. 억 단위 매칭 (소수점 포함 예: 3.5억, 3억)
    const ukMatch = str.match(/([\d.]+)\s*억/);
    if (ukMatch) {
        matched = true;
        totalWon += Math.round(parseFloat(ukMatch[1]) * 100000000);
    }

    // 2. 천만 단위 매칭 (예: 3억 5천, 5천만)
    const cheonMatch = str.match(/(\d+)\s*천(?:\s*만(?:원)?)?/);
    if (cheonMatch) {
        matched = true;
        totalWon += parseInt(cheonMatch[1], 10) * 10000000;
    }

    // 3. 만원 단위 매칭 (예: 5000만, 5000만원, 3억 5000만원)
    const manMatch = str.match(/(\d+)\s*만(?:원)?/);
    if (manMatch) {
        matched = true;
        totalWon += parseInt(manMatch[1], 10) * 10000;
    }

    // 4. 원 단위 매칭 (예: 5000원)
    const wonMatch = str.match(/(\d+)\s*원$/);
    if (wonMatch) {
        matched = true;
        totalWon += parseInt(wonMatch[1], 10);
    }

    if (matched && totalWon > 0) {
        return String(totalWon);
    }

    // 매칭되지 않는 경우 숫자만 추출
    const digitsOnly = str.replace(/[^\d]/g, '');
    return digitsOnly || '';
};

/**
 * 숫자를 한국식 화폐 단위로 포맷팅합니다.
 * 예: 150000000 -> 1억 5,000만원
 * 예: 700000000 -> 7억원
 * 예: 78000000 -> 7,800만원
 */
export const formatKoreanPrice = (price: string | number | null | undefined): string => {
    if (price === null || price === undefined || price === '') return '';
    const parsed = parseKoreanPriceToWon(price);
    const numPrice = Number(parsed);
    if (isNaN(numPrice) || numPrice === 0) return '';

    const billion = 100000000; // 1억
    const tenThousand = 10000; // 1만

    if (numPrice >= billion) {
        const uk = Math.floor(numPrice / billion);
        const rest = numPrice % billion;

        if (rest === 0) {
            return `${uk}억원`;
        }

        // 나머지가 있으면 만원 단위로 계산
        const man = Math.floor(rest / tenThousand);
        if (man > 0) {
            return `${uk}억 ${man.toLocaleString()}만원`;
        } else {
            return `${uk}억원`;
        }
    } else if (numPrice >= tenThousand) {
        const man = Math.floor(numPrice / tenThousand);
        return `${man.toLocaleString()}만원`;
    }

    return numPrice.toLocaleString() + '원';
};

/**
 * 날짜 문자열을 안전하게 포맷팅합니다.
 */
export const safeFormatDate = (dateStr: string | Date | null | undefined, includeTime = false) => {
    if (!dateStr) return "-";
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return "-";
        return includeTime ? format(date, "yyyy-MM-dd HH:mm") : format(date, "yyyy-MM-dd");
    } catch (e) {
        return "-";
    }
};

/**
 * 경매 및 부동산 가격을 한국어 단위 및 원화 콤마로 보기 쉽게 변환합니다.
 * 예: "350000000" -> { korean: "3억 5,000만원", won: "350,000,000원", full: "3억 5,000만원 (350,000,000원)", rawWon: 350000000 }
 */
export const formatPriceDisplay = (price: string | number | null | undefined) => {
    if (!price && price !== 0) return { korean: "-", won: "-", full: "-", rawWon: 0 };
    const wonStr = parseKoreanPriceToWon(price);
    const numWon = Number(wonStr);
    if (isNaN(numWon) || numWon <= 0) {
        const cleanStr = String(price).trim();
        return { korean: cleanStr || "-", won: cleanStr || "-", full: cleanStr || "-", rawWon: 0 };
    }
    const korean = formatKoreanPrice(numWon);
    const won = `${numWon.toLocaleString()}원`;
    return {
        korean,
        won,
        rawWon: numWon,
        full: `${korean} (${won})`
    };
};

/**
 * 감정평가액 대비 최저입찰가 할인율(%)을 정확히 계산합니다.
 */
export const calculateAuctionDiscountRate = (
    appraisalPrice: string | number | null | undefined,
    minimumPrice: string | number | null | undefined,
    fallbackRate?: number | null
): number => {
    const appWon = Number(parseKoreanPriceToWon(appraisalPrice));
    const minWon = Number(parseKoreanPriceToWon(minimumPrice));

    if (appWon > 0 && minWon > 0 && minWon < appWon) {
        return Math.round(((appWon - minWon) / appWon) * 100);
    }

    if (typeof fallbackRate === "number" && fallbackRate > 0) {
        return fallbackRate;
    }

    return 0;
};

/**
 * 최저입찰가 대비 입찰보증금 비율(%)을 계산합니다.
 * 일반 매물: 통상 최저입찰가의 10%
 * 특별매각조건 / 재매각 매물: 20% (또는 드물게 30%)
 */
export const calculateAuctionDepositRate = (
    minimumPrice: string | number | null | undefined,
    deposit: string | number | null | undefined
): { rate: number; isSpecial: boolean; label: string } => {
    const minWon = Number(parseKoreanPriceToWon(minimumPrice));
    const depWon = Number(parseKoreanPriceToWon(deposit));

    if (minWon > 0 && depWon > 0) {
        const rate = Math.round((depWon / minWon) * 100);
        // 15% 이상인 경우 특별매각조건(20% 또는 30%)으로 분류
        if (rate >= 15) {
            return {
                rate,
                isSpecial: true,
                label: `특별매각조건 (${rate}%)`
            };
        }
        return {
            rate: rate || 10,
            isSpecial: false,
            label: `일반 (${rate || 10}%)`
        };
    }

    return {
        rate: 10,
        isSpecial: false,
        label: "일반 (10%)"
    };
};

/**
 * 토지/건물 면적을 ㎡와 평(pyeong) 단위로 모두 보기 쉽게 변환합니다.
 * 1평 = 3.305785㎡ (1㎡ = 0.3025평)
 */
export interface FormattedArea {
    sqmText: string;      // 예: "7,241㎡"
    pyeongText: string;   // 예: "약 2,190.4평"
    fullText: string;     // 예: "7,241㎡ (약 2,190.4평)"
    rawText: string;
}

export const formatAreaDisplay = (rawArea: string | number | null | undefined): FormattedArea => {
    if (rawArea === null || rawArea === undefined) {
        return { sqmText: "", pyeongText: "", fullText: "상세 권리분석서 참조", rawText: "" };
    }

    const str = String(rawArea).trim();
    if (!str || str === "-") {
        return { sqmText: "", pyeongText: "", fullText: "상세 권리분석서 참조", rawText: str };
    }

    const hasPyeong = /평/.test(str);
    const hasSqm = /㎡|m²|m2/i.test(str);

    // 1. 이미 평과 ㎡가 모두 들어있는 경우 (예: "7,241㎡ (2,190평)", "450평 (1487㎡)")
    if (hasPyeong && hasSqm) {
        const sqmMatch = str.match(/([\d,.]+)\s*(?:㎡|m²|m2)/i);
        const pyeongMatch = str.match(/([\d,.]+)\s*평/);

        const sqmVal = sqmMatch ? parseFloat(sqmMatch[1].replace(/,/g, '')) : null;
        const pyeongVal = pyeongMatch ? parseFloat(pyeongMatch[1].replace(/,/g, '')) : null;

        const sqmText = sqmVal !== null && !isNaN(sqmVal)
            ? `${sqmVal.toLocaleString()}㎡`
            : (sqmMatch ? `${sqmMatch[1]}㎡` : "");

        const pyeongText = pyeongVal !== null && !isNaN(pyeongVal)
            ? `약 ${pyeongVal.toLocaleString()}평`
            : (pyeongMatch ? `약 ${pyeongMatch[1]}평` : "");

        return {
            sqmText: sqmText || str,
            pyeongText: pyeongText,
            fullText: sqmText && pyeongText ? `${sqmText} (${pyeongText})` : str,
            rawText: str
        };
    }

    // 2. 평 단위만 있는 경우 (예: "450평", "150 평", "약 150평")
    if (hasPyeong && !hasSqm) {
        const pyeongMatch = str.match(/([\d,.]+)\s*평/);
        if (pyeongMatch) {
            const pyeongNum = parseFloat(pyeongMatch[1].replace(/,/g, ''));
            if (!isNaN(pyeongNum) && pyeongNum > 0) {
                // 1평 = 3.305785㎡
                const calculatedSqm = Math.round(pyeongNum * 3.305785 * 10) / 10;
                const sqmText = `${calculatedSqm.toLocaleString()}㎡`;
                const pyeongText = `약 ${pyeongNum.toLocaleString()}평`;
                return {
                    sqmText,
                    pyeongText,
                    fullText: `${sqmText} (${pyeongText})`,
                    rawText: str
                };
            }
        }
    }

    // 3. ㎡ 단위이거나 순수 숫자인 경우 (예: "7241", "3511.19", "495.87㎡", "495.87m2")
    const numMatch = str.match(/([\d,.]+)/);
    if (numMatch) {
        const sqmNum = parseFloat(numMatch[1].replace(/,/g, ''));
        if (!isNaN(sqmNum) && sqmNum > 0) {
            // 1㎡ = 0.3025평
            const calculatedPyeong = Math.round(sqmNum * 0.3025 * 10) / 10;
            const sqmText = `${sqmNum.toLocaleString()}㎡`;
            const pyeongText = `약 ${calculatedPyeong.toLocaleString()}평`;
            return {
                sqmText,
                pyeongText,
                fullText: `${sqmText} (${pyeongText})`,
                rawText: str
            };
        }
    }

    return {
        sqmText: str,
        pyeongText: "",
        fullText: str,
        rawText: str
    };
};


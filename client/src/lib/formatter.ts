
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

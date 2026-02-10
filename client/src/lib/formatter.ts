
/**
 * 숫자를 한국식 화폐 단위로 포맷팅합니다.
 * 예: 150000000 -> 1억 5000만원
 * 예: 700000000 -> 7억원
 * 예: 78000000 -> 7800만원
 */
export const formatKoreanPrice = (price: string | number | null | undefined): string => {
    if (price === null || price === undefined || price === '') return '';
    const numPrice = Number(price);
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
            // 1억 이상인데 나머지가 만원 미만인 경우는 거의 없겠지만 처리
            return `${uk}억원`;
        }
    } else if (numPrice >= tenThousand) {
        const man = Math.floor(numPrice / tenThousand);
        return `${man.toLocaleString()}만원`;
    }

    return numPrice.toLocaleString() + '원';
};

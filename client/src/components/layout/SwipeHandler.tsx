
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { PAGE_ORDER } from '@/constants/navigation';

const SWIPE_THRESHOLD = 50; // 최소 스와이프 거리 (px)
const MAX_SWIPE_TIME = 500; // 최대 스와이프 시간 (ms)

interface SwipeHandlerProps {
    children?: React.ReactNode;
}

export const SwipeHandler: React.FC<SwipeHandlerProps> = ({ children }) => {
    const [location, setLocation] = useLocation();
    const [touchStart, setTouchStart] = useState<{ x: number, y: number, time: number } | null>(null);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            // 폼, 맵, 캐러셀 등 내부 스크롤/스와이프가 필요한 요소에서는 글로벌 스와이프 방지
            const target = e.target as HTMLElement;
            if (
                target.closest('.embla') || // 캐러셀 (shadcn/carousel -> embla)
                target.closest('[class*="map"]') || // 지도 (클래스명에 map 포함)
                target.closest('input') || // 입력 필드
                target.closest('textarea') ||
                target.closest('button') || // 버튼 클릭 시 오작동 방지
                target.closest('[data-no-swipe]') // 명시적 스와이프 방지 태그
            ) {
                return;
            }

            setTouchStart({
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            });
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart) return;

            const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            };

            const deltaX = touchEnd.x - touchStart.x;
            const deltaY = touchEnd.y - touchStart.y;
            const deltaTime = touchEnd.time - touchStart.time;

            // 초기화
            setTouchStart(null);

            // 시간 제한 체크 (너무 느린 스와이프는 무시)
            if (deltaTime > MAX_SWIPE_TIME) return;

            // 수직 스크롤 의도가 강하면 무시 (Y축 이동이 X축 이동보다 크면 스크롤로 간주)
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;

            // 최소 거리 체크
            if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

            // 현재 페이지 인덱스 찾기
            // (쿼리 파라미터 제외하고 순수 경로만 비교)
            const currentPath = location.split('?')[0];

            // 상세 페이지 등은 순서에 없으므로 스와이프 네비게이션 동작 안함
            // 혹은 상세 페이지에서는 '목록으로' 등의 동작을 커스텀 할 수 있음 (여기서는 제외)
            const currentIndex = PAGE_ORDER.indexOf(currentPath);

            if (currentIndex === -1) return;

            // 스와이프 방향 판별
            if (deltaX > 0) {
                // 오른쪽으로 스와이프 (Previous Page) -> 손가락을 오른쪽으로 밈
                if (currentIndex > 0) {
                    setLocation(PAGE_ORDER[currentIndex - 1]);
                }
            } else {
                // 왼쪽으로 스와이프 (Next Page) -> 손가락을 왼쪽으로 밈
                if (currentIndex < PAGE_ORDER.length - 1) {
                    setLocation(PAGE_ORDER[currentIndex + 1]);
                }
            }
        };

        // 전역 이벤트 리스너 등록
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [location, setLocation, touchStart]);

    return <>{children}</>;
};

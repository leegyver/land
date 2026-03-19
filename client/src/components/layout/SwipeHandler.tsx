
import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { PAGE_ORDER } from '@/constants/navigation';

const SWIPE_THRESHOLD = 50; // 최소 스와이프 거리 (px)

interface SwipeHandlerProps {
    children?: React.ReactNode;
}

export const SwipeHandler: React.FC<SwipeHandlerProps> = ({ children }) => {
    const [location, setLocation] = useLocation();
    // useRef로 변경: state로 관리하면 터치할 때마다 리렌더 + 이벤트 리스너 재등록 발생
    const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);

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

            touchStartRef.current = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchStart = touchStartRef.current;
            if (!touchStart) return;

            const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            };

            const deltaX = touchEnd.x - touchStart.x;
            const deltaY = touchEnd.y - touchStart.y;

            // 초기화
            touchStartRef.current = null;

            // 수직 스크롤 의도가 강하면 무시 (Y축 이동이 X축 이동보다 크면 스크롤로 간주)
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;

            // 화면 너비의 50% 이상 드래그 해야 동작
            const screenWidth = window.innerWidth;
            const threshold = screenWidth * 0.5;

            if (Math.abs(deltaX) < threshold) return;

            // 현재 페이지 인덱스 찾기
            const currentPath = location.split('?')[0];
            const currentIndex = PAGE_ORDER.indexOf(currentPath);

            if (currentIndex === -1) return;

            // 스와이프 방향 판별
            if (deltaX > 0) {
                // 오른쪽으로 스와이프 (Previous Page)
                if (currentIndex > 0) {
                    setLocation(PAGE_ORDER[currentIndex - 1]);
                }
            } else {
                // 왼쪽으로 스와이프 (Next Page)
                if (currentIndex < PAGE_ORDER.length - 1) {
                    setLocation(PAGE_ORDER[currentIndex + 1]);
                }
            }
        };

        // 전역 이벤트 리스너 등록
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [location, setLocation]); // touchStart 제거: useRef로 관리하므로 불필요

    return <>{children}</>;
};


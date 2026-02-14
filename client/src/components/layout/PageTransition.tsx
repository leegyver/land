import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { PAGE_ORDER } from '@/constants/navigation';

interface PageTransitionProps {
    children: React.ReactNode;
}

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        zIndex: 1 // 들어오는 페이지가 위로
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0, // 나가는 페이지는 뒤로
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

const transition = {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    const [location] = useLocation();
    const [direction, setDirection] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);

    // 현재 인덱스 찾기
    // 쿼리 파라미터 제외하고 비교
    const currentPath = location.split('?')[0];
    const currentIndex = PAGE_ORDER.indexOf(currentPath);

    useEffect(() => {
        if (currentIndex !== -1) {
            if (currentIndex > prevIndex) {
                setDirection(1);
            } else if (currentIndex < prevIndex) {
                setDirection(-1);
            } else {
                setDirection(0);
            }
            setPrevIndex(currentIndex);
        } else {
            setDirection(0);
        }
    }, [currentIndex, prevIndex]);

    // 키 값은 전체 location을 사용 (쿼리 파라미터 변경 시에도 반응할지 여부 결정 필요)
    // 여기서는 페이지 전환 간에만 애니메이션 하려면 currentPath 사용 권장
    // 하지만 같은 페이지 내 필터링도 애니메이션 하려면 location 사용.
    // 사용자는 "페이지 넘김"을 원했으므로 currentPath가 적절해 보임.
    // 상세페이지 진입 등은 별도 처리 안하면 기본 페이드가 될 것임. 

    return (
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
                key={currentPath} // 경로가 바뀔 때만 애니메이션
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full flex-grow"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

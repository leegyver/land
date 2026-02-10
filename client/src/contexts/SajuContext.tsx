
import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateSaju, SajuData } from '@/lib/saju';
import { useAuth } from '@/hooks/use-auth';

interface SajuContextType {
    userBirthDate: Date | null;
    userBirthTime: string | null; // "HH:MM"
    isLunar: boolean; // Added
    sajuData: SajuData | null;
    saveUserSaju: (date: Date, time: string, isLunar: boolean) => void;
    clearUserSaju: () => void;
    isModalOpen: boolean;
    openSajuModal: () => void;
    closeSajuModal: () => void;
}

const SajuContext = createContext<SajuContextType | undefined>(undefined);

export const useSaju = () => {
    const context = useContext(SajuContext);
    if (!context) {
        throw new Error('useSaju must be used within a SajuProvider');
    }
    return context;
};

export const SajuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userBirthDate, setUserBirthDate] = useState<Date | null>(null);
    const [userBirthTime, setUserBirthTime] = useState<string | null>(null);
    const [isLunar, setIsLunar] = useState<boolean>(false);
    const [sajuData, setSajuData] = useState<SajuData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load from local storage on mount
    // Load from local storage or User Profile on mount/update
    const { user } = useAuth();

    useEffect(() => {
        // 1. Try to get from User Profile first
        if (user && user.birthDate) {
            const date = new Date(user.birthDate);
            setUserBirthDate(date);
            if (user.birthTime) setUserBirthTime(user.birthTime);
            // TODO: user profile needs isLunar field.
            const userIsLunar = (user as any).isLunar || false;
            setIsLunar(userIsLunar);

            const data = calculateSaju(date, user.birthTime || undefined, userIsLunar);
            setSajuData(data);
            return;
        }

        // 2. Fallback to Local Storage
        const storedDate = localStorage.getItem('saju_birthDate');
        const storedTime = localStorage.getItem('saju_birthTime');
        const storedIsLunar = localStorage.getItem('saju_isLunar') === 'true';

        if (storedDate) {
            const date = new Date(storedDate);
            setUserBirthDate(date);
            if (storedTime) setUserBirthTime(storedTime);
            setIsLunar(storedIsLunar);

            const data = calculateSaju(date, storedTime || undefined, storedIsLunar);
            setSajuData(data);
        }
    }, [user]);

    const saveUserSaju = (date: Date, time: string, isLunar: boolean) => {
        setUserBirthDate(date);
        setUserBirthTime(time);
        setIsLunar(isLunar);

        // Save to local storage
        localStorage.setItem('saju_birthDate', date.toISOString());
        if (time) localStorage.setItem('saju_birthTime', time);
        localStorage.setItem('saju_isLunar', String(isLunar));

        const data = calculateSaju(date, time, isLunar);
        setSajuData(data);
    };

    const clearUserSaju = () => {
        setUserBirthDate(null);
        setUserBirthTime(null);
        setSajuData(null);
        localStorage.removeItem('saju_birthDate');
        localStorage.removeItem('saju_birthTime');
        localStorage.removeItem('saju_isLunar');
    };

    const openSajuModal = () => setIsModalOpen(true);
    const closeSajuModal = () => setIsModalOpen(false);

    return (
        <SajuContext.Provider
            value={{
                userBirthDate,
                userBirthTime,
                isLunar,
                sajuData,
                saveUserSaju,
                clearUserSaju,
                isModalOpen,
                openSajuModal,
                closeSajuModal
            }}
        >
            {children}
        </SajuContext.Provider>
    );
};

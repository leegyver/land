
import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateSaju, SajuData } from '@/lib/saju';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface SajuContextType {
    userBirthDate: Date | null;
    userBirthTime: string | null; // "HH:MM"
    isLunar: boolean; // Added
    sajuData: SajuData | null;
    saveUserSaju: (date: Date, time: string, isLunar: boolean) => Promise<void>;
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

        // 2. Guest users (unauthenticated) should not have sajuData
        setUserBirthDate(null);
        setUserBirthTime(null);
        setIsLunar(false);
        setSajuData(null);
    }, [user]);

    const saveUserSaju = async (date: Date, time: string, isLunar: boolean) => {
        setUserBirthDate(date);
        setUserBirthTime(time);
        setIsLunar(isLunar);

        // Save to local storage (as backup/temporary)
        localStorage.setItem('saju_birthDate', date.toISOString());
        if (time) localStorage.setItem('saju_birthTime', time);
        localStorage.setItem('saju_isLunar', String(isLunar));

        const data = calculateSaju(date, time, isLunar);
        setSajuData(data);

        // Save to User Profile if logged in
        if (user) {
            try {
                await apiRequest("PATCH", "/api/users/profile", {
                    birthDate: date.toISOString().split('T')[0],
                    birthTime: time,
                    isLunar: isLunar
                });
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            } catch (error) {
                console.error("Failed to update user profile:", error);
            }
        }
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

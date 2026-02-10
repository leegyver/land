
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { drawOneCard, TarotCard } from '@/lib/tarot';

interface TarotModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle?: string;
    type?: 'buy' | 'rent' | 'invest'; // Context of question
}

const TarotModal: React.FC<TarotModalProps> = ({ isOpen, onClose, propertyTitle, type = 'buy' }) => {
    const [card, setCard] = useState<TarotCard | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleDraw = () => {
        const drawn = drawOneCard();
        setCard(drawn);
        setTimeout(() => setIsFlipped(true), 100);
    };

    const handleReset = () => {
        setCard(null);
        setIsFlipped(false);
    };

    const getMeaning = (card: TarotCard) => {
        switch (type) {
            case 'rent': return card.meaningRent;
            case 'invest': return card.meaningInvest;
            default: return card.meaningBuy;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] flex flex-col items-center">
                <DialogHeader>
                    <DialogTitle className="text-center">부동산 타로점</DialogTitle>
                    <DialogDescription className="text-center">
                        {propertyTitle ? `"${propertyTitle}"` : "이 매물"}에 대한 조언을 구해보세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-6 perspective-1000 w-48 h-80 relative cursor-pointer" onClick={!card ? handleDraw : undefined}>
                    {!card ? (
                        <div className="w-full h-full bg-slate-800 rounded-lg shadow-xl flex items-center justify-center border-4 border-slate-600 hover:scale-105 transition-transform">
                            <span className="text-slate-400 font-serif text-4xl">?</span>
                        </div>
                    ) : (
                        <div className={`w-full h-full transition-all duration-700 transform ${isFlipped ? 'rotate-y-0' : 'rotate-y-180'} relative transform-style-3d`}>
                            <div className="absolute w-full h-full bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 flex flex-col">
                                <img src={card.image} alt={card.name} className="w-full h-48 object-cover object-top" />
                                <div className="p-4 bg-white flex-1 flex flex-col items-center text-center">
                                    <h3 className="font-bold text-lg text-slate-800">{card.nameKr}</h3>
                                    <p className="text-xs text-slate-500 mb-2">{card.name}</p>
                                    <p className="text-sm font-medium text-slate-700 leading-snug">
                                        {getMeaning(card)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {!card ? (
                        <Button onClick={handleDraw} className="w-full bg-purple-600 hover:bg-purple-700">카드 뽑기</Button>
                    ) : (
                        <Button onClick={handleReset} variant="outline" className="w-full">다시 뽑기</Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TarotModal;

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PopupData {
  id: number;
  title: string;
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
}

export default function GlobalPopups() {
  const { data: popups = [] } = useQuery<PopupData[]>({
    queryKey: ['/api/popups/active'],
  });

  const [visiblePopups, setVisiblePopups] = useState<PopupData[]>([]);

  useEffect(() => {
    if (popups.length > 0) {
      const newVisible = popups.filter(popup => {
        const hiddenUntil = localStorage.getItem(`hide_popup_${popup.id}`);
        if (hiddenUntil && new Date().getTime() < parseInt(hiddenUntil)) {
          return false;
        }
        return true;
      });
      setVisiblePopups(newVisible);
    }
  }, [popups]);

  const handleClose = (id: number) => {
    setVisiblePopups(prev => prev.filter(p => p.id !== id));
  };

  const handleHideForToday = (id: number) => {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0); // Next midnight
    localStorage.setItem(`hide_popup_${id}`, tomorrow.getTime().toString());
    handleClose(id);
  };

  if (visiblePopups.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-3 sm:p-4 landscape:p-2 pt-safe pb-safe pl-safe pr-safe overflow-y-auto">
      {visiblePopups.map((popup, index) => (
        <div 
          key={popup.id}
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-w-sm w-full max-h-[85vh] landscape:max-h-[92vh] relative animate-in fade-in zoom-in duration-300 my-auto"
          style={{ zIndex: 50 + index, animationDelay: `${index * 150}ms` }}
        >
          {/* Quick Close Button at top-right */}
          <button
            onClick={() => handleClose(popup.id)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors touch-manipulation"
            aria-label="팝업 닫기"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {popup.linkUrl ? (
              <a href={popup.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                {popup.imageUrl && (
                  <img 
                    src={popup.imageUrl} 
                    alt={popup.title || "공지 팝업"} 
                    className="w-full h-auto object-cover max-h-[45vh] landscape:max-h-[30vh]" 
                  />
                )}
              </a>
            ) : (
              popup.imageUrl && (
                <img 
                  src={popup.imageUrl} 
                  alt={popup.title || "공지 팝업"} 
                  className="w-full h-auto object-cover max-h-[45vh] landscape:max-h-[30vh]" 
                />
              )
            )}
            
            {(popup.title || popup.content) && (
              <div className="p-3.5 sm:p-4 bg-white">
                {popup.title && <h3 className="font-extrabold text-base sm:text-lg mb-1.5 text-slate-900">{popup.title}</h3>}
                {popup.content && (
                  <div 
                    className="text-xs sm:text-sm text-slate-600 prose prose-sm max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: popup.content }} 
                  />
                )}
              </div>
            )}
          </div>

          {/* Bottom Fixed Action Buttons */}
          <div className="shrink-0 flex bg-slate-100 border-t border-slate-200 p-0 text-xs sm:text-sm">
            <button 
              onClick={() => handleHideForToday(popup.id)}
              className="flex-1 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-medium transition-colors touch-manipulation active:bg-slate-300"
            >
              오늘 하루 보지 않기
            </button>
            <div className="w-[1px] bg-slate-300" />
            <button 
              onClick={() => handleClose(popup.id)}
              className="flex-1 py-3 text-slate-900 hover:bg-slate-200 font-bold transition-colors touch-manipulation active:bg-slate-300"
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

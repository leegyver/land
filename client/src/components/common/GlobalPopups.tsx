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
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-20 px-4 gap-4 flex-wrap">
      {visiblePopups.map((popup, index) => (
        <div 
          key={popup.id}
          className="pointer-events-auto bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-w-sm w-full relative animate-in fade-in zoom-in duration-300"
          style={{ zIndex: 50 + index, animationDelay: `${index * 150}ms` }}
        >
          {popup.linkUrl ? (
            <a href={popup.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              {popup.imageUrl && (
                <img src={popup.imageUrl} alt={popup.title} className="w-full h-auto object-cover max-h-[60vh]" />
              )}
            </a>
          ) : (
            popup.imageUrl && (
              <img src={popup.imageUrl} alt={popup.title} className="w-full h-auto object-cover max-h-[60vh]" />
            )
          )}
          
          {(popup.title || popup.content) && (
            <div className="p-4 bg-white">
              {popup.title && <h3 className="font-bold text-lg mb-2">{popup.title}</h3>}
              {popup.content && (
                <div 
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: popup.content }} 
                />
              )}
            </div>
          )}

          <div className="flex bg-gray-100 border-t border-gray-200 p-0">
            <button 
              onClick={() => handleHideForToday(popup.id)}
              className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              오늘 하루 보지 않기
            </button>
            <div className="w-[1px] bg-gray-300"></div>
            <button 
              onClick={() => handleClose(popup.id)}
              className="flex-1 py-3 text-sm font-bold text-gray-800 hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

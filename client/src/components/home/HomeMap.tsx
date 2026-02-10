import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import KakaoMap from '@/components/map/KakaoMap';
import { MapIcon, Mic, MicOff, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const districts = [
    "전체",
    "강화읍",
    "교동면",
    "길상면",
    "내가면",
    "불은면",
    "삼산면",
    "서도면",
    "선원면",
    "송해면",
    "양도면",
    "양사면",
    "하점면",
    "화도면"
];

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

const HomeMap = () => {
    const [, setLocation] = useLocation();
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        // 음성 인식 지원 여부 및 초기화
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            setSpeechSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'ko-KR';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                setSearchKeyword(transcript);
                handleSearch(transcript);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    }, [isListening]);

    const handleSearch = (keyword: string) => {
        if (!keyword.trim()) return;
        setLocation(`/properties?keyword=${encodeURIComponent(keyword.trim())}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchKeyword);
    };

    const handleDistrictChange = (value: string) => {
        if (value === "전체") {
            setLocation("/properties");
        } else {
            setLocation(`/properties?keyword=${encodeURIComponent(value)}`);
        }
    };

    return (
        <div className="relative">
            {/* 지도 제목 */}
            <div className="mb-3 flex items-center">
                <MapIcon className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-bold">지도로 부동산찾기</h2>
            </div>

            {/* 지도 높이 조절 - 모바일에서는 더 작은 크기 */}
            <div className="h-[25vh] md:h-[50vh] w-full rounded-lg overflow-hidden bg-gray-100">
                <KakaoMap />
            </div>

            {/* 읍면별 검색 + 음성검색 통합 */}
            <div className="mt-3 space-y-2">
                {/* 읍면 드롭다운 */}
                <Select onValueChange={handleDistrictChange}>
                    <SelectTrigger className="w-full" data-testid="select-district">
                        <SelectValue placeholder="읍면별 검색" />
                    </SelectTrigger>
                    <SelectContent>
                        {districts.map((district) => (
                            <SelectItem key={district} value={district} data-testid={`select-item-${district}`}>
                                {district}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 음성검색 입력창 */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <button
                            type="submit"
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary p-2 transition-colors z-10"
                            aria-label="검색"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                        <Input
                            type="text"
                            placeholder="음성검색 또는 입력"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="pl-9 pr-10 h-9 text-sm"
                            data-testid="input-search-keyword"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (!speechSupported) {
                                    alert("음성 검색은 보안 연결(HTTPS) 환경이나 지원되는 브라우저(Chrome, Safari 등)에서만 사용 가능합니다.");
                                    return;
                                }
                                toggleListening();
                            }}
                            aria-label={isListening ? "음성인식 중지" : "음성으로 검색"}
                            title={!speechSupported ? "음성 검색 미지원" : (isListening ? "음성인식 중지" : "음성으로 검색")}
                            className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-7 w-7 z-10 ${isListening ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-primary"
                                }`}
                            data-testid="button-voice-search"
                        >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HomeMap;

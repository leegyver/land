import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Search } from "lucide-react";
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

const PropertySearch = () => {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
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

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.");
        } else if (event.error === 'no-speech') {
          // 침묵의 경우 별도 처리하지 않거나 가벼운 알림
        } else {
          alert("음성 인식 중 오류가 발생했습니다: " + event.error);
        }
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

    const searchParams = new URLSearchParams();
    searchParams.append("keyword", keyword.trim());

    setLocation(`/properties?${searchParams.toString()}`);
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
    <div className="bg-white p-4">
      {/* 읍면별 검색 드롭다운 */}
      <Select onValueChange={handleDistrictChange}>
        <SelectTrigger className="w-full mb-2" data-testid="select-district-home">
          <SelectValue placeholder="읍면별 검색" />
        </SelectTrigger>
        <SelectContent>
          {districts.map((district) => (
            <SelectItem key={district} value={district} data-testid={`select-item-home-${district}`}>
              {district}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 음성검색 입력창 */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="음성검색 또는 입력"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 pr-10 h-9 text-sm"
            data-testid="input-search-keyword"
          />
          {speechSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              aria-label={isListening ? "음성인식 중지" : "음성으로 검색"}
              title={isListening ? "음성인식 중지" : "음성으로 검색"}
              className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-7 w-7 ${isListening ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-primary"
                }`}
              data-testid="button-voice-search"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {isListening && (
          <div className="text-center text-xs text-red-500 animate-pulse mt-1 font-medium">
            🎤 목소리를 듣고 있습니다. 말씀해 주세요...
          </div>
        )}
      </form>
    </div>
  );
};

export default PropertySearch;

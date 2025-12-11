import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Search } from "lucide-react";

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
    
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", keyword.trim());
    
    setLocation(`/properties?${searchParams.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchKeyword);
  };

  return (
    <div className="bg-white p-6">
      <h2 className="text-2xl font-bold mb-4">매물 검색</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="검색어를 입력하거나 마이크를 눌러 음성으로 검색하세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10 pr-12"
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
              className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-2 ${
                isListening ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-primary"
              }`}
              data-testid="button-voice-search"
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
        </div>
        
        {isListening && (
          <div className="text-center text-sm text-red-500 animate-pulse">
            🎤 듣고 있습니다... 말씀해주세요
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-secondary text-white"
          data-testid="button-search"
        >
          <Search className="mr-2 h-4 w-4" />
          검색
        </Button>
      </form>
    </div>
  );
};

export default PropertySearch;

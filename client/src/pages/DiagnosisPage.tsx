import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

declare global {
    interface Window {
        kakao: any;
    }
}

export default function DiagnosisPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [kakaoStatus, setKakaoStatus] = useState("Checking...");
    const [envStatus, setEnvStatus] = useState<any>({});

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

    useEffect(() => {
        // 1. Check Environment
        const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
        const envCheck = {
            VITE_KAKAO_MAP_KEY: kakaoKey ? `Present (${kakaoKey.substring(0, 5)}...)` : "MISSING ❌",
            MODE: import.meta.env.MODE,
            BASE_URL: import.meta.env.BASE_URL
        };
        setEnvStatus(envCheck);
        addLog(`Environment checked: ${JSON.stringify(envCheck)}`);

        // 2. Check Kakao Script
        if (window.kakao && window.kakao.maps) {
            setKakaoStatus("Loaded ✅");
            addLog("window.kakao.maps is available");

            try {
                window.kakao.maps.load(() => {
                    addLog("Kakao Maps load callback fired success ✅");
                    // Try simulating an API call
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    addLog("Geocoder created successfully");
                });
            } catch (e) {
                setKakaoStatus("Error ❌");
                addLog(`Kakao init error: ${e}`);
            }
        } else {
            setKakaoStatus("Not Loaded ⚠️");
            addLog("window.kakao not found on mount");
        }
    }, []);

    const testMapRender = () => {
        if (!window.kakao || !window.kakao.maps) {
            alert("Kakao SDK not ready");
            return;
        }
        try {
            const container = document.getElementById("test-map");
            const options = {
                center: new window.kakao.maps.LatLng(33.450701, 126.570667),
                level: 3
            };
            const map = new window.kakao.maps.Map(container, options);
            addLog("Map created successfully ✅");
        } catch (e) {
            addLog(`Map creation failed ❌: ${e}`);
            alert(`Map Error: ${e}`);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold mb-4">🔧 시스템 진단 도구</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded bg-gray-50">
                    <h2 className="font-bold mb-2">1. 환경 변수</h2>
                    <pre className="text-xs bg-white p-2 rounded border">{JSON.stringify(envStatus, null, 2)}</pre>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                    <h2 className="font-bold mb-2">2. 카카오 맵 상태</h2>
                    <div className="text-lg font-bold">{kakaoStatus}</div>
                    <Button onClick={testMapRender} className="mt-2" size="sm">지도 강제 생성 테스트</Button>
                </div>
            </div>

            <div className="border rounded h-64 bg-gray-200 relative mb-4">
                <div id="test-map" className="w-full h-full"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
                    (지도 테스트 영역)
                </div>
            </div>

            <div className="p-4 border rounded bg-black text-green-400 font-mono text-sm h-64 overflow-y-auto">
                <h3 className="text-white border-b border-gray-700 pb-2 mb-2">📋 상세 로그</h3>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>

            <div className="text-center mt-8">
                <p className="text-gray-600 mb-2">이 페이지 결과를 개발자에게 보여주세요.</p>
            </div>
        </div>
    );
}

import React, { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Application Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 m-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <h1 className="text-xl font-bold text-red-800 mb-2">화면 로드 중 오류가 발생했습니다</h1>
                    <p className="text-red-600 mb-4">예기치 않은 시스템 오류로 인해 페이지를 표시할 수 없습니다.</p>
                    <div className="bg-white p-4 rounded border text-xs overflow-auto font-mono mb-6 text-red-900 max-h-60 border-red-100">
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => window.location.reload()} variant="default">
                            페이지 새로고침
                        </Button>
                        <Button onClick={() => window.location.href = '/admin'} variant="outline">
                            관리자 페이지 홈
                        </Button>
                        <Button onClick={() => window.location.href = '/'} variant="ghost">
                            메인 페이지로 이동
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

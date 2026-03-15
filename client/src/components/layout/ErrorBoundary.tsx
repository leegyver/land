import React, { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorKey: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorKey: "" };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Application Error:", error, errorInfo);
    }

    // 핵심: children(라우트)이 바뀌면 에러 상태를 리셋
    componentDidUpdate(prevProps: Props) {
        if (this.state.hasError && prevProps.children !== this.props.children) {
            this.setState({ hasError: false, error: null });
        }
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
                        <Button onClick={() => this.setState({ hasError: false, error: null })} variant="default">
                            다시 시도
                        </Button>
                        <Button onClick={() => window.location.href = '/'} variant="outline">
                            메인 페이지로 이동
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg text-center p-6">
                    <div className="text-accent-gold text-4xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-serif font-bold text-white mb-2">Reality Glitch Detected</h1>
                    <p className="text-slate-400 font-serif mb-6">The atmosphere is temporarily unstable.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                    >
                        Recalibrate System
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

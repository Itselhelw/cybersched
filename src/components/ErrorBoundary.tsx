'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a1a',
                    color: '#e0e0f0',
                    fontFamily: 'monospace',
                    padding: 32,
                }}>
                    <div style={{ textAlign: 'center', maxWidth: 480 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                        <h2 style={{ fontFamily: 'var(--font-display, monospace)', fontSize: 20, fontWeight: 900, color: '#ff3366', letterSpacing: 2, marginBottom: 12 }}>
                            SYSTEM ERROR
                        </h2>
                        <p style={{ fontSize: 13, color: '#a0a0c0', lineHeight: 1.6, marginBottom: 24 }}>
                            CyberSched encountered an unexpected error. Your data is safe in localStorage.
                        </p>
                        <pre style={{
                            background: '#12122a',
                            border: '1px solid #2a2a4a',
                            borderRadius: 8,
                            padding: 16,
                            fontSize: 11,
                            color: '#ff3366',
                            textAlign: 'left',
                            overflow: 'auto',
                            maxHeight: 120,
                            marginBottom: 24,
                        }}>
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            style={{
                                padding: '12px 32px',
                                borderRadius: 8,
                                border: '1px solid #00f5ff',
                                background: 'transparent',
                                color: '#00f5ff',
                                fontFamily: 'monospace',
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            RELOAD APP
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

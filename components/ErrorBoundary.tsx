import React from "react";
import { safeSentry } from "../services/sentry";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    safeSentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        } as Record<string, unknown>,
      },
    });
     
    console.error('[DTP] Error caught by boundary:', error?.message?.replace(/[\r\n]/g, ' ') ?? String(error));
  }
  render() {
    if (this.state.hasError) return <div style={{padding:40, color:"white", textAlign:"center", background:"#111", minHeight:"100vh"}}><h2>Something went wrong.</h2><button className="btn-primary" onClick={() => window.location.reload()}>Reload Page</button></div>;
    return this.props.children;
  }
}

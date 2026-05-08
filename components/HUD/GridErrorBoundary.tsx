import React, { Component, ReactNode } from 'react';
import { logger } from '../../utils/logger';

interface Props { children: ReactNode; onRestart?: () => void; }
interface State { hasError: boolean; error: Error | null; componentStack: string; }

export class GridErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[DTP] Grid render error:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack || '' });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, componentStack: '' });
    this.props.onRestart?.();
  };

  handleCopyDebug = async () => {
    const debugInfo = {
      error: this.state.error?.toString(),
      stack: this.state.componentStack,
      ua: navigator.userAgent,
      ts: Date.now()
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    } catch {
      logger.warn('Failed to copy debug info');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="dtp-crash-boundary" role="alert" aria-label="Game Error">
          <h3>Something went wrong</h3>
          <p className="dtp-crash-msg">{this.state.error?.message || 'Unknown render error'}</p>
          <div className="dtp-crash-actions">
            <button onClick={() => window.location.reload()} className="dtp-btn dtp-btn-primary">Reload Game</button>
            <button onClick={this.handleCopyDebug} className="dtp-btn dtp-btn-secondary">Copy Debug Info</button>
            <button onClick={this.handleRestart} className="dtp-btn dtp-btn-tertiary">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

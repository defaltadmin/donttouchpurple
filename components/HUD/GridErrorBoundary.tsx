import React, { Component, ReactNode } from 'react';
import { logger } from '../../utils/logger';
import { useTranslation } from '../../hooks/useTranslation';
import type { I18nKey } from '../../utils/i18n-keys';

interface Props { children: ReactNode; onRestart?: () => void; t: (key: I18nKey, params?: Record<string, string | number>) => string; }
interface State { hasError: boolean; error: Error | null; componentStack: string; }

class GridErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[DTP] Grid render error:', error?.message?.replace(/[\r\n]/g, ' ') ?? String(error));
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
          <h3>{this.props.t('error.something_wrong')}</h3>
          <p className="dtp-crash-msg">{this.state.error?.message || this.props.t('error.unknown_render')}</p>
          <div className="dtp-crash-actions">
            <button onClick={() => window.location.reload()} className="dtp-btn dtp-btn-primary">{this.props.t('error.reload_game')}</button>
            <button onClick={this.handleCopyDebug} className="dtp-btn dtp-btn-secondary">{this.props.t('error.copy_debug')}</button>
            <button onClick={this.handleRestart} className="dtp-btn dtp-btn-tertiary">{this.props.t('error.try_again')}</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function GridErrorBoundary({ children, onRestart }: { children: ReactNode; onRestart?: () => void }) {
  const { t } = useTranslation();
  return <GridErrorBoundaryInner t={t} onRestart={onRestart}>{children}</GridErrorBoundaryInner>;
}

import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; onRestart?: () => void; }
interface State { hasError: boolean; }

export class GridErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DTP] Grid render error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false });
    this.props.onRestart?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20, fontSize: 14, fontFamily: 'var(--font-ui)' }}>
          <p>🛟 Grid display error</p>
          <button className="btn-primary" onClick={this.handleRestart} style={{ marginTop: 12 }}>
            Restart Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

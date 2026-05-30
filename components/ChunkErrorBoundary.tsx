import React from "react";
import { safeSentry } from "../services/sentry";

interface Props { children: React.ReactNode; name: string }
interface State { hasError: boolean }

export class ChunkErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    safeSentry.captureException(error);
    console.error(`[DTP] Chunk load failed for ${this.props.name}:`, error);
  }
  render() {
    if (this.state.hasError) return (
      <div className="loading-placeholder" style={{ padding: 20, textAlign: "center" }}>
        <p style={{ color: "#e7deff", marginBottom: 8 }}>Failed to load {this.props.name}</p>
        <button className="dtp-btn dtp-btn-primary" style={{ fontSize: 14 }} onClick={() => this.setState({ hasError: false })}>
          Retry
        </button>
      </div>
    );
    return this.props.children;
  }
}

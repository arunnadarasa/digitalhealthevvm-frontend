import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: "2rem",
            margin: "1.5rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <h3 style={{ color: "var(--accent)", marginTop: 0 }}>Something went wrong</h3>
          <pre style={{ fontSize: "0.8rem", overflow: "auto", maxHeight: "200px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.message}
          </pre>
          <button type="button" className="btn" onClick={() => this.setState({ hasError: false, error: undefined })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // If Sentry is configured, report the error
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      import('@sentry/react').then(Sentry => {
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
      }).catch(() => {});
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '50vh', padding: '2rem', textAlign: 'center',
          backgroundColor: 'var(--bs-body-bg)', color: 'var(--bs-body-color)'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--bs-danger-bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--bs-danger)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--bs-body-color)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--bs-secondary-color)', marginBottom: 24, maxWidth: 400 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px', borderRadius: 980, border: 'none',
              backgroundColor: 'var(--bs-primary)', color: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 500
            }}
          >
            Refresh Page
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: 24, textAlign: 'left', maxWidth: 600, width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--bs-secondary-color)', fontSize: 12 }}>
                Error details
              </summary>
              <pre style={{
                marginTop: 8, padding: 16, backgroundColor: 'var(--bs-tertiary-bg)', borderRadius: 8,
                fontSize: 11, overflow: 'auto', maxHeight: 200, color: 'var(--bs-body-color)'
              }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

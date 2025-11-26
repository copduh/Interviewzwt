import React from 'react';

interface Props { children: React.ReactNode }
interface State { error: Error | null; info: any | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ error, info });
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-3xl bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold mb-2 text-destructive">Application Error</h2>
            <pre className="text-sm whitespace-pre-wrap">{error.message}</pre>
            <details className="mt-4 text-xs text-muted-foreground">
              <summary>Show component stack</summary>
              <pre className="whitespace-pre-wrap">{info?.componentStack}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

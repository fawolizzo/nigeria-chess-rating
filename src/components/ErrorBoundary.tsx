import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    logMessage(LogLevel.ERROR, 'ErrorBoundary', 'Uncaught component error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  // Reset error state when resetKey changes
  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <div className="bg-gray-100 p-4 rounded mb-4 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </pre>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="text-sm font-medium cursor-pointer text-blue-600">
                    View component stack
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto text-gray-700 max-h-60">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <p className="mb-4">
              Try refreshing the page or contact support if the problem
              persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-nigeria-green hover:bg-nigeria-green-dark text-white font-bold py-2 px-4 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logMessage(LogLevel.ERROR, 'DashboardErrorBoundary', 'Error caught:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    if (this.props.onReset) {
      this.props.onReset();
    }

    // Add a short delay to ensure state is reset before trying to render again
    setTimeout(() => {
      this.forceUpdate();
    }, 100);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-red-50 dark:bg-red-950/20 w-16 h-16 flex items-center justify-center rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Dashboard Error
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-2">
              There was a problem loading the dashboard. Please try again.
            </p>

            <div className="max-w-md mx-auto overflow-auto max-h-32 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left text-gray-700 dark:text-gray-300">
              {this.state.error?.toString()}
            </div>

            <Button
              onClick={this.handleReset}
              className="mt-4"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

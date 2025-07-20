import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Reset retry count and show permanent error
      this.setState({
        retryCount: 0
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          
          <h2 className="text-2xl font-bold text-error mb-4">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          {this.state.retryCount < (this.props.maxRetries || 3) ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Attempt {this.state.retryCount + 1} of {this.props.maxRetries || 3}
              </p>
              <Button onClick={this.handleRetry} variant="primary">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Maximum retry attempts reached
              </p>
              <div className="flex justify-center space-x-3">
                <Button onClick={this.handleReset} variant="secondary">
                  Reset
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="primary"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
                Error Details (Development)
              </summary>
              <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {this.state.error.stack}
                  </pre>
                </div>
                {this.state.errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// API Error Boundary specifically for API calls
export class ApiErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Only catch API-related errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('API') ||
        error.message.includes('Rate limit')) {
      return {
        hasError: true,
        error
      };
    }
    return {};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only handle API errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('API') ||
        error.message.includes('Rate limit')) {
      console.error('API ErrorBoundary caught an error:', error, errorInfo);
      
      this.setState({
        error,
        errorInfo
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🌐</span>
          </div>
          
          <h3 className="text-lg font-semibold text-warning mb-2">
            Network Error
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {this.state.error?.message.includes('Rate limit') 
              ? 'Too many requests. Please wait a moment.'
              : 'Failed to connect to the server. Please check your internet connection.'
            }
          </p>

          <Button onClick={this.handleRetry} variant="primary" size="sm">
            Retry
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };
} 
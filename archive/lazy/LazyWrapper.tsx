import React, { Suspense, Component, ReactNode } from 'react';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-error mb-2">Component Error</h3>
          <p className="text-sm text-gray-600 mb-4">
            Failed to load component. Please refresh the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="duo-btn-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = (
    <div className="p-6 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo mx-auto mb-4"></div>
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  ) 
}) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Preload function for critical components
export function preloadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): () => Promise<T> {
  let component: T | null = null;
  let promise: Promise<T> | null = null;

  return () => {
    if (component) {
      return Promise.resolve(component);
    }
    if (promise) {
      return promise;
    }
    
    promise = importFunc().then(module => {
      component = module.default;
      return component;
    });
    
    return promise;
  };
} 
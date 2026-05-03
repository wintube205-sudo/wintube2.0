import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4" dir="rtl">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-neutral-400 mb-6 text-sm">
              واجه التطبيق مشكلة. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.
            </p>
            <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-x-auto text-xs text-red-400 font-mono">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl w-full transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    useAppStore.getState().setModule("dashboard");
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">
              An unexpected error occurred. Please try again or return to the dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors",
                  "bg-gray-900 text-white hover:bg-gray-800"
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors",
                  "border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Async Error Boundary ────────────────────────────────────────────────────────────────
interface AsyncBoundaryProps {
  children: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
}

export function AsyncBoundary({
  children,
  loading,
  error,
  isLoading,
  isError,
}: AsyncBoundaryProps): ReactNode {
  if (isLoading) {
    return loading ?? <Skeleton />;
  }

  if (isError) {
    return (
      error ?? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-gray-600">Failed to load data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Reload page
          </button>
        </div>
      )
    );
  }

  return children;
}
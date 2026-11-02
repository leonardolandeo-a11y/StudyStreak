import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected interface error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <section role="alert" className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-100">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-400">This page could not be displayed. Reload the application to try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-sky-500 px-5 py-2 font-semibold text-slate-950 hover:bg-sky-400">Reload application</button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;

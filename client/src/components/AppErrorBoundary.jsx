import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("Unexpected application error", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4" dir="rtl">
          <section className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-8 text-center shadow-lg">
            <span className="material-symbols-outlined mb-4 text-5xl text-error" aria-hidden="true">error</span>
            <h1 className="mb-3 text-2xl font-black text-primary">אירעה תקלה בתצוגת האתר</h1>
            <p className="mb-6 text-on-surface-variant">אפשר לנסות לטעון מחדש את המסך.</p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-xl bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary/90"
            >
              נסה שוב
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

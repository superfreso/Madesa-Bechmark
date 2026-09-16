import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center max-w-md p-6">
            <h2 className="font-display font-semibold text-lg text-gray-900 mb-2">Algo salió mal</h2>
            <p className="text-sm text-gray-500 mb-4">La página encontró un error inesperado. Recarga para continuar.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-madesa-600 text-white text-sm font-medium hover:bg-madesa-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

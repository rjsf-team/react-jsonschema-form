import type { ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children: ReactNode;
}

type State =
  | {
      hasError: false;
      error: null;
    }
  | { hasError: true; error: Error };

interface Error {
  message: string;
  [key: string]: unknown;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Update state so the next render will show the fallback UI. */
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  /** You can render any custom fallback UI */
  render() {
    const { children } = this.props;
    const { error, hasError } = this.state;

    if (hasError) {
      return (
        <div className='alert alert-danger'>
          <p>The following error was encountered:</p>
          <pre>{error.message}</pre>
          <button type='button' className='btn' onClick={this.resetErrorBoundary}>
            Refresh Form
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

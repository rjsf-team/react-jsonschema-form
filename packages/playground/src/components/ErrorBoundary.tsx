import { Component, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State =
  | {
      hasError: false;
      error: null;
    }
  | { hasError: true; error: Error };

type Error = { message: string; [key: string]: unknown };

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Update state so the next render will show the fallback UI. */
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error };
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
          <button className='btn' onClick={this.resetErrorBoundary}>
            Refresh Form
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

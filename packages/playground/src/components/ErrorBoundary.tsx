import type { ReactNode } from 'react';
import { Component } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

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
  // oxlint-disable-next-line typescript/promise-function-async -- ReactNode's type includes Promise for async components; this render is always synchronous
  render() {
    const { children } = this.props;
    const { error, hasError } = this.state;

    if (hasError) {
      return (
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={this.resetErrorBoundary}>
              Refresh Form
            </Button>
          }
        >
          <p>The following error was encountered:</p>
          <pre>{error.message}</pre>
        </Alert>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

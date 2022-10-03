import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Update state so the next render will show the fallback UI. */
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  }

  /** You can render any custom fallback UI */
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger">
          <p>The following error was encountered:</p>
          <pre>{this.state.error.message}</pre>
          <button className="btn" onClick={this.resetErrorBoundary}>
            Refresh Form
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

import * as React from 'react';

interface IErrorBoundaryProps {
    children: React.ReactNode;
  }
  
  interface IErrorBoundaryState {
    hasError: boolean;
    error: string;
  }

export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // You can also log the error to an error reporting service
      this.setState ({ hasError: true, error: `${error.message} ${error.stack}` });
    }
    public static getDerivedStateFromError(error: Error) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true, error: `${error.message} ${error.stack}` };
    }
  
    constructor(props: IErrorBoundaryProps) {
      super(props);
      this.state = { hasError: false, error: '' };
    }
  
    public render() {
      if (this.state.hasError) {
        return <h1>${this.state.error}</h1>;
      }
  
      return this.props.children;
    }
  }
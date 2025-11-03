import React from 'react';
import { Box } from '@atlaskit/primitives';
import { xcss } from '@atlaskit/primitives';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box xcss={xcss({ padding: 'space.400' })}>
                    <h2 style={{ fontWeight: 'bold', margin: 0 }}>Something went wrong</h2>
                    <Box xcss={xcss({ marginTop: 'space.200' })}>
                        <p style={{ margin: 0 }}>{this.state.error?.message || 'An unexpected error occurred'}</p>
                    </Box>
                    <Box xcss={xcss({ marginTop: 'space.200' })}>
                        <p style={{ fontSize: '0.875rem', color: '#6B778C', margin: 0 }}>
                            Please refresh the page. If the problem persists, contact support.
                        </p>
                    </Box>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;


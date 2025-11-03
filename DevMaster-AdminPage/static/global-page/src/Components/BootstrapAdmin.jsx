import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@atlaskit/primitives';
import { xcss } from '@atlaskit/primitives';
import Lozenge from '@atlaskit/lozenge';

export const BootstrapAdmin = () => {
    const currentUser = useSelector((state) => state.epics.currentUser);
    const userRole = useSelector((state) => state.epics.userRole);

    // Don't render anything if user data isn't available or invalid
    if (!currentUser || !currentUser.accountId || !userRole) {
        return null;
    }

    // Show bootstrap message if user is admin
    // Only show this once - could add a flag to hide after user acknowledges
    if (userRole === 'Admin') {
        return (
            <Box xcss={xcss({ 
                padding: 'space.400', 
                marginBottom: 'space.400',
                backgroundColor: 'color.background.information',
                borderRadius: 'border.radius',
                borderLeft: '4px solid',
                borderColor: 'color.border.information'
            })}>
                <Box xcss={xcss({ marginBottom: 'space.200' })}>
                    <Lozenge appearance="success">Bootstrap Complete</Lozenge>
                </Box>
                <h3 style={{ fontWeight: 'bold', margin: 0 }}>Welcome, Admin!</h3>
                <Box xcss={xcss({ marginTop: 'space.100' })}>
                    <p style={{ margin: 0 }}>
                        You've been automatically assigned the Admin role as the first user of this app.
                        You can now manage user roles using the User Management section below.
                    </p>
                </Box>
            </Box>
        );
    }

    return null;
};


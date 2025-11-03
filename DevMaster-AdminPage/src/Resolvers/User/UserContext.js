import { requestJira, storage as forgeStorage } from '@forge/api';

export const UserContext = {
    getCurrentUser: async ({ context }) => {
        try {
            if (!context?.accountId) {
                throw new Error('No user context available');
            }

            // Fetch user details from JIRA
            const response = await requestJira(`/rest/api/3/user?accountId=${context.accountId}`);
            const userData = await response.json();

            return {
                accountId: context.accountId,
                displayName: userData.displayName,
                emailAddress: userData.emailAddress,
                avatarUrl: userData.avatarUrls?.['48x48'] || userData.avatarUrls?.['32x32'],
                active: userData.active
            };
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    },

    getUserRole: async ({ context }) => {
        try {
            if (!context?.accountId) {
                return 'Developer'; // Default role if no context
            }
            
            // Check if this is the first user (bootstrap admin)
            const roleKey = `UserRole_${context.accountId}`;
            const roleData = await forgeStorage.get(roleKey);
            
            if (roleData?.role) {
                return roleData.role;
            }
            
            // Bootstrap: Check if any admin exists
            const hasAdminKey = 'HasAdminUser';
            const hasAdmin = await forgeStorage.get(hasAdminKey);
            
            // If no admin exists, make this user the first admin
            if (!hasAdmin) {
                await forgeStorage.set(roleKey, {
                    role: 'Admin',
                    isBootstrap: true,
                    setAt: new Date().toISOString()
                });
                await forgeStorage.set(hasAdminKey, {
                    firstAdmin: context.accountId,
                    bootstrapAt: new Date().toISOString()
                });
                return 'Admin';
            }
            
            // Default to Developer if no role is set
            return 'Developer';
        } catch (error) {
            console.error('Error getting user role:', error);
            return 'Developer'; // Default role
        }
    },

    setUserRole: async ({ payload, context }) => {
        try {
            if (!context?.accountId) {
                throw new Error('No user context available');
            }
            
            // Only admins can set roles (check if requester is admin)
            const requesterRole = await UserContext.getUserRole({ context });
            
            if (requesterRole !== 'Admin') {
                throw new Error('Only admins can set user roles');
            }

            const roleKey = `UserRole_${payload.accountId}`;
            await forgeStorage.set(roleKey, { 
                role: payload.role,
                setBy: context.accountId,
                setAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('Error setting user role:', error);
            throw error;
        }
    },

    getAllUsers: async ({ context }) => {
        try {
            if (!context?.accountId) {
                throw new Error('No user context available');
            }
            
            // Only admins and managers can get all users
            const requesterRole = await UserContext.getUserRole({ context });
            
            if (!['Admin', 'Manager'].includes(requesterRole)) {
                throw new Error('Insufficient permissions');
            }

            // This would typically query JIRA for users in the site
            // For now, return an empty array - can be expanded later
            return [];
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
};


import { storage as forgeStorage } from '@forge/api';

/**
 * Bootstrap mechanism for user management
 * This ensures the first user of the app automatically becomes an admin
 */
export const Bootstrap = {
    /**
     * Initialize admin role for the first user
     * Returns true if this user was set as the bootstrap admin
     */
    initializeAdmin: async (accountId) => {
        try {
            if (!accountId) {
                return { isBootstrap: false, role: 'Developer' };
            }

            const roleKey = `UserRole_${accountId}`;
            const hasAdminKey = 'HasAdminUser';

            // Check if user already has a role
            const existingRole = await forgeStorage.get(roleKey);
            if (existingRole?.role) {
                return { isBootstrap: false, role: existingRole.role };
            }

            // Check if any admin exists
            const hasAdmin = await forgeStorage.get(hasAdminKey);

            // If no admin exists, make this user the first admin
            if (!hasAdmin) {
                await forgeStorage.set(roleKey, {
                    role: 'Admin',
                    isBootstrap: true,
                    setAt: new Date().toISOString()
                });
                await forgeStorage.set(hasAdminKey, {
                    firstAdmin: accountId,
                    bootstrapAt: new Date().toISOString()
                });
                
                // Add to user roles registry
                const userRolesRegistryKey = 'UserRolesRegistry';
                let accountIds = await forgeStorage.get(userRolesRegistryKey);
                if (!accountIds || !Array.isArray(accountIds)) {
                    accountIds = [];
                }
                if (!accountIds.includes(accountId)) {
                    accountIds.push(accountId);
                    await forgeStorage.set(userRolesRegistryKey, accountIds);
                }
                
                return { isBootstrap: true, role: 'Admin' };
            }

            // Default role - no admin created, user stays as Developer
            return { isBootstrap: false, role: 'Developer' };
        } catch (error) {
            console.error('Error initializing admin:', error);
            return { isBootstrap: false, role: 'Developer' };
        }
    },

    /**
     * Check if any admin user exists
     */
    hasAdmin: async () => {
        try {
            const hasAdminKey = 'HasAdminUser';
            const hasAdmin = await forgeStorage.get(hasAdminKey);
            return !!hasAdmin;
        } catch (error) {
            console.error('Error checking for admin:', error);
            return false;
        }
    },

    /**
     * Get bootstrap information
     */
    getBootstrapInfo: async () => {
        try {
            const hasAdminKey = 'HasAdminUser';
            const info = await forgeStorage.get(hasAdminKey);
            return info || null;
        } catch (error) {
            console.error('Error getting bootstrap info:', error);
            return null;
        }
    }
};


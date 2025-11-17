import { requestJira, storage as forgeStorage, route } from '@forge/api';

export const UserContext = {
    getCurrentUser: async ({ context }) => {
        try {
            if (!context?.accountId) {
                throw new Error('No user context available');
            }

            // Fetch user details from JIRA
            const response = await requestJira(route`/rest/api/3/user?accountId=${context.accountId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch user details: ${response.status} ${errorText}`);
            }
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

            // Try to fetch user details when setting role
            let userDetails = {};
            try {
                // The route template tag should handle URL encoding automatically
                const userResponse = await requestJira(route`/rest/api/3/user?accountId=${payload.accountId}`);
                if (userResponse.ok) {
                    const user = await userResponse.json();
                    userDetails = {
                        displayName: user.displayName,
                        emailAddress: user.emailAddress,
                        avatarUrl: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32']
                    };
                    console.log(`[setUserRole] Fetched user details for ${payload.accountId}:`, userDetails.displayName);
                } else {
                    console.warn(`[setUserRole] Failed to fetch user details for ${payload.accountId}:`, userResponse.status);
                }
            } catch (fetchError) {
                console.warn(`[setUserRole] Error fetching user details for ${payload.accountId}:`, fetchError.message || fetchError);
            }

            const roleKey = `UserRole_${payload.accountId}`;
            await forgeStorage.set(roleKey, { 
                role: payload.role,
                setBy: context.accountId,
                setAt: new Date().toISOString(),
                ...userDetails
            });

            // Update the registry of users with roles
            const userRolesRegistryKey = 'UserRolesRegistry';
            let accountIds = await forgeStorage.get(userRolesRegistryKey);
            if (!accountIds || !Array.isArray(accountIds)) {
                accountIds = [];
            }
            if (!accountIds.includes(payload.accountId)) {
                accountIds.push(payload.accountId);
                await forgeStorage.set(userRolesRegistryKey, accountIds);
            }

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
    },

    getAllUserRoles: async ({ context }) => {
        try {
            if (!context?.accountId) {
                throw new Error('No user context available');
            }
            
            // Only admins can get all user roles
            const requesterRole = await UserContext.getUserRole({ context });
            
            if (requesterRole !== 'Admin') {
                throw new Error('Only admins can view all user roles');
            }

            // In GDPR strict mode, we can't enumerate all users from Jira
            // Instead, we'll only return users who already have roles set in storage
            // We maintain a registry of accountIds who have roles
            const userRolesRegistryKey = 'UserRolesRegistry';
            let accountIds = await forgeStorage.get(userRolesRegistryKey);
            
            console.log('[getAllUserRoles] Registry from storage:', accountIds);
            
            if (!accountIds || !Array.isArray(accountIds)) {
                accountIds = [];
            }
            
            console.log('[getAllUserRoles] Initial accountIds count:', accountIds.length);
            
            // Try to discover users with roles by checking known sources
            const discoveredAccountIds = new Set(accountIds);
            
            // Check for bootstrap admin
            const hasAdminKey = 'HasAdminUser';
            const hasAdmin = await forgeStorage.get(hasAdminKey);
            if (hasAdmin?.firstAdmin) {
                discoveredAccountIds.add(hasAdmin.firstAdmin);
            }
            
            // Add current user if they have a role
            const currentUserRoleKey = `UserRole_${context.accountId}`;
            const currentUserRole = await forgeStorage.get(currentUserRoleKey);
            if (currentUserRole?.role) {
                discoveredAccountIds.add(context.accountId);
            }
            
            // Check roles we know about for "setBy" field - these are accountIds of admins who set roles
            // This helps us discover more users
            // Use a separate array to avoid iteration issues
            const accountIdsToCheck = Array.from(discoveredAccountIds);
            for (const accountId of accountIdsToCheck) {
                try {
                    const roleKey = `UserRole_${accountId}`;
                    const roleData = await forgeStorage.get(roleKey);
                    if (roleData?.setBy && !discoveredAccountIds.has(roleData.setBy)) {
                        // Check if this user also has a role
                        const setByRoleKey = `UserRole_${roleData.setBy}`;
                        const setByRoleData = await forgeStorage.get(setByRoleKey);
                        if (setByRoleData?.role) {
                            discoveredAccountIds.add(roleData.setBy);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking role for ${accountId}:`, error);
                }
            }
            
            // Convert back to array and save
            accountIds = Array.from(discoveredAccountIds);
            console.log('[getAllUserRoles] After discovery, accountIds count:', accountIds.length);
            if (accountIds.length > 0) {
                await forgeStorage.set(userRolesRegistryKey, accountIds);
            }
            
            console.log('[getAllUserRoles] Fetching user details for', accountIds.length, 'accountIds');
            
            // Fetch user details for each accountId and get their role
            // Process in batches to avoid rate limiting
            const batchSize = 5;
            const userRoles = [];
            
            for (let i = 0; i < accountIds.length; i += batchSize) {
                const batch = accountIds.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    batch.map(async (accountId) => {
                        try {
                            // Get role data first
                            const roleKey = `UserRole_${accountId}`;
                            const roleData = await forgeStorage.get(roleKey);
                            
                            console.log(`[getAllUserRoles] Checking ${accountId}:`, roleData ? 'has role data' : 'no role data', roleData?.role || 'no role');
                            
                            if (!roleData?.role) {
                                // No role data, skip this user
                                console.log(`[getAllUserRoles] Skipping ${accountId} - no role`);
                                return null;
                            }
                            
                            // Check if we have cached user details in role data
                            if (roleData.displayName && roleData.displayName !== accountId) {
                                console.log(`[getAllUserRoles] Using cached user details for ${accountId}:`, roleData.displayName);
                                return {
                                    accountId: accountId,
                                    displayName: roleData.displayName,
                                    emailAddress: roleData.emailAddress || null,
                                    avatarUrl: roleData.avatarUrl || null,
                                    role: roleData.role,
                                    setAt: roleData.setAt || null,
                                    setBy: roleData.setBy || null,
                                    isBootstrap: roleData.isBootstrap || false
                                };
                            }
                            
                            // Try to fetch user details from Jira
                            try {
                                // The route template tag should handle URL encoding automatically
                                const userResponse = await requestJira(route`/rest/api/3/user?accountId=${accountId}`);
                                console.log(`[getAllUserRoles] User API response for ${accountId}:`, userResponse.status, userResponse.ok);
                                
                                if (userResponse.ok) {
                                    const user = await userResponse.json();
                                    console.log(`[getAllUserRoles] Successfully fetched user ${accountId}:`, user.displayName);
                                    
                                    // Update role data with user details for caching
                                    const updatedRoleData = {
                                        ...roleData,
                                        displayName: user.displayName,
                                        emailAddress: user.emailAddress,
                                        avatarUrl: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32']
                                    };
                                    await forgeStorage.set(roleKey, updatedRoleData);
                                    
                                    return {
                                        accountId: user.accountId,
                                        displayName: user.displayName,
                                        emailAddress: user.emailAddress,
                                        avatarUrl: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32'],
                                        role: roleData.role,
                                        setAt: roleData.setAt || null,
                                        setBy: roleData.setBy || null,
                                        isBootstrap: roleData.isBootstrap || false
                                    };
                                } else {
                                    // Failed to fetch user details, but we have role data
                                    let errorText = '';
                                    try {
                                        errorText = await userResponse.text();
                                    } catch (e) {
                                        errorText = 'Could not read error response';
                                    }
                                    const errorMsg = `[getAllUserRoles] Failed to fetch user details for ${accountId}: ${userResponse.status} ${errorText}`;
                                    console.warn(errorMsg);
                                    
                                    // Try to use cached data if available, even if it's just accountId
                                    // This ensures we don't lose the role information
                                    return {
                                        accountId: accountId,
                                        displayName: roleData.displayName || accountId, // Use cached or accountId as fallback
                                        emailAddress: roleData.emailAddress || null,
                                        avatarUrl: roleData.avatarUrl || null,
                                        role: roleData.role,
                                        setAt: roleData.setAt || null,
                                        setBy: roleData.setBy || null,
                                        isBootstrap: roleData.isBootstrap || false,
                                        _fetchError: errorMsg // Include error for debugging
                                    };
                                }
                            } catch (fetchError) {
                                // Failed to fetch user details, but we have role data
                                console.warn(`[getAllUserRoles] Exception fetching user details for ${accountId}:`, fetchError.message || fetchError);
                                // Return user with minimal info
                                return {
                                    accountId: accountId,
                                    displayName: accountId, // Use accountId as fallback
                                    emailAddress: null,
                                    avatarUrl: null,
                                    role: roleData.role,
                                    setAt: roleData.setAt || null,
                                    setBy: roleData.setBy || null,
                                    isBootstrap: roleData.isBootstrap || false
                                };
                            }
                        } catch (error) {
                            console.error(`Error processing user ${accountId}:`, error);
                            return null;
                        }
                    })
                );
                
                userRoles.push(...batchResults.filter(result => result !== null));
                
                // Add a small delay between batches to avoid rate limiting
                if (i + batchSize < accountIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            // Filter out null values and sort by display name
            const filteredRoles = userRoles.filter(user => user !== null);
            console.log('[getAllUserRoles] Final filtered roles count:', filteredRoles.length);
            return filteredRoles.sort((a, b) => {
                // Sort by display name, handling cases where displayName might be accountId
                const nameA = a.displayName || a.accountId || '';
                const nameB = b.displayName || b.accountId || '';
                return nameA.localeCompare(nameB);
            });
        } catch (error) {
            console.error('Error getting all user roles:', error);
            throw error;
        }
    },

    rebuildUserRolesRegistry: async ({ payload, context }) => {
        try {
            if (!context?.accountId) {
                throw new Error('No user context available');
            }
            
            // Only admins can rebuild the registry
            const requesterRole = await UserContext.getUserRole({ context });
            if (requesterRole !== 'Admin') {
                throw new Error('Only admins can rebuild the registry');
            }

            const userRolesRegistryKey = 'UserRolesRegistry';
            
            // Ensure accountIds is always an array
            let accountIdsToCheck = [];
            if (payload?.accountIds) {
                if (Array.isArray(payload.accountIds)) {
                    accountIdsToCheck = payload.accountIds;
                } else {
                    console.warn('[rebuildUserRolesRegistry] accountIds is not an array:', typeof payload.accountIds, payload.accountIds);
                }
            }
            
            // Ensure userDetails is always an array
            const userDetailsArray = Array.isArray(payload?.userDetails) ? payload.userDetails : [];
            const userDetailsMap = new Map();
            
            // Create a map of accountId -> user details for quick lookup
            userDetailsArray.forEach(userDetail => {
                if (userDetail && userDetail.accountId) {
                    userDetailsMap.set(userDetail.accountId, {
                        displayName: userDetail.displayName,
                        emailAddress: userDetail.emailAddress,
                        avatarUrl: userDetail.avatarUrl
                    });
                }
            });
            
            console.log('[rebuildUserRolesRegistry] Processing', accountIdsToCheck.length, 'accountIds and', userDetailsMap.size, 'user details');
            
            const discoveredAccountIds = new Set();

            // Check each provided accountId to see if they have a role
            // Also update role data with user details if provided
            for (const accountId of accountIdsToCheck) {
                try {
                    const roleKey = `UserRole_${accountId}`;
                    const roleData = await forgeStorage.get(roleKey);
                    if (roleData?.role) {
                        discoveredAccountIds.add(accountId);
                        
                        // Update role data with user details if we have them
                        const userDetails = userDetailsMap.get(accountId);
                        if (userDetails && (userDetails.displayName || userDetails.emailAddress || userDetails.avatarUrl)) {
                            const updatedRoleData = {
                                ...roleData,
                                ...(userDetails.displayName && { displayName: userDetails.displayName }),
                                ...(userDetails.emailAddress && { emailAddress: userDetails.emailAddress }),
                                ...(userDetails.avatarUrl && { avatarUrl: userDetails.avatarUrl })
                            };
                            await forgeStorage.set(roleKey, updatedRoleData);
                            console.log(`[rebuildUserRolesRegistry] Updated user details for ${accountId}:`, userDetails.displayName);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking role for ${accountId}:`, error);
                }
            }

            // Also check for bootstrap admin and current user
            const hasAdminKey = 'HasAdminUser';
            const hasAdmin = await forgeStorage.get(hasAdminKey);
            if (hasAdmin?.firstAdmin) {
                discoveredAccountIds.add(hasAdmin.firstAdmin);
            }

            const currentUserRoleKey = `UserRole_${context.accountId}`;
            const currentUserRole = await forgeStorage.get(currentUserRoleKey);
            if (currentUserRole?.role) {
                discoveredAccountIds.add(context.accountId);
            }

            // Save the registry
            const accountIds = Array.from(discoveredAccountIds);
            await forgeStorage.set(userRolesRegistryKey, accountIds);

            return { success: true, count: accountIds.length };
        } catch (error) {
            console.error('Error rebuilding user roles registry:', error);
            throw error;
        }
    }
};


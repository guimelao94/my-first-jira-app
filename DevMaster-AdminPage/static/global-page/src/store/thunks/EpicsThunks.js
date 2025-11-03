import { invoke, requestJira } from "@forge/bridge";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAvailableEpics = createAsyncThunk('epics/fetchAvailable',async ()=>{
    const res = await requestJira(`/rest/api/3/search/jql?jql=issueType=Epic%20ORDER%20BY%20updated%20DESC&maxResults=1000&fields=*all`);

    const data = await res.json();

    return data.issues.map((item) => ({
        label: item.key,
        value: item.key
    }));
});

export const fetchSelectedEpics = createAsyncThunk('epics/fetchSelected',async (_, { getState })=>{
    try {
        const state = getState();
        const accountId = state.epics.currentUser?.accountId;
        // Use user-specific key if user is available
        const key = accountId ? 'Cards' : 'Cards';
        const res = await invoke('Storage.GetData', { 
            key, 
            useUserPrefix: !!accountId // Flag to use user-specific storage
        });
        // Ensure we always return an array
        if (Array.isArray(res)) {
            return res;
        }
        // If res is an object or other non-array value, return empty array
        return [];
    } catch (error) {
        console.error('Error fetching selected epics:', error);
        return [];
    }
});

export const fetchHolidays = createAsyncThunk('epics/fetchHolidays',async ()=>{
    try {
        const res = await invoke('Storage.GetData', { key: 'Holidays' });
        return res || [];
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return [];
    }
});

export const SaveSelectedEpics = createAsyncThunk('epics/SaveSelected',async (newArray, { getState })=>{    
    try {
        const state = getState();
        const accountId = state.epics.currentUser?.accountId;
        await invoke('Storage.SaveData', { 
            key: 'Cards', 
            value: newArray,
            useUserPrefix: !!accountId // Flag to use user-specific storage
        });
    } catch (error) {
        console.error('Error saving selected epics:', error);
        throw error;
    }
    return newArray;
});

export const ProcessEpic = createAsyncThunk('epics/Process',async (epicKey)=>{
    try {
        const res = await requestJira(`/rest/api/3/issue/${epicKey}`);
        const data = await res.json();

        if (data.fields?.issuetype?.name === "Epic") {
            const jql = await requestJira(`/rest/api/3/search/jql?jql=parent=${epicKey}&maxResults=1000&fields=*all`);
            const returnedData = await jql.json();

            return {
                EpicKey: epicKey,
                DueDate: data.fields.duedate,
                IssueType: data.fields.issuetype.name,
                Issues: returnedData.issues || [],
                Summary: data.fields.summary
            };
        }
        return null;
    } catch (error) {
        console.error(`Error processing epic ${epicKey}:`, error);
        throw error;
    }
});

export const updateEpicDueDate = createAsyncThunk('epics/updateDueDate', async ({ epicKey, dueDate }) => {
    try {
        const response = await requestJira(`/rest/api/3/issue/${epicKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: {
                    duedate: dueDate
                }
            })
        });

        if (!response.ok) {
            // Check for scope-related errors first
            if (response.status === 401) {
                const failureCategory = response.headers?.get('X-Failure-Category');
                if (failureCategory === 'FAILURE_CLIENT_SCOPE_CHECK') {
                    throw new Error('Permission denied: The app needs to be upgraded with write:jira-work scope. Please ask your Jira administrator to upgrade the app installation in Settings > Apps > Manage apps.');
                }
            }
            
            // Parse error response
            let errorMessage = 'Failed to update epic due date';
            try {
                const errorData = await response.json();
                errorMessage = errorData.errorMessages?.join(', ') || errorData.message || errorMessage;
            } catch {
                // If JSON parse fails, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        return { epicKey, dueDate };
    } catch (error) {
        console.error(`Error updating epic ${epicKey} due date:`, error);
        throw error;
    }
});

export const fetchEpicDetails = createAsyncThunk('epics/fetchDetails', async (epicKey) => {
    try {
        const res = await requestJira(`/rest/api/3/issue/${epicKey}?fields=summary,duedate,issuetype`);
        const data = await res.json();
        
        return {
            key: epicKey,
            summary: data.fields?.summary,
            dueDate: data.fields?.duedate,
            issueType: data.fields?.issuetype?.name
        };
    } catch (error) {
        console.error(`Error fetching epic details for ${epicKey}:`, error);
        throw error;
    }
});


// User management thunks
export const fetchCurrentUser = createAsyncThunk('user/fetchCurrent', async () => {
    try {
        // Try to get current user info directly from JIRA API
        // Use /myself endpoint which doesn't require accountId
        const response = await requestJira('/rest/api/3/myself');
        
        if (!response.ok) {
            throw new Error('Failed to fetch current user');
        }
        
        const userData = await response.json();

        return {
            accountId: userData.accountId,
            displayName: userData.displayName,
            emailAddress: userData.emailAddress,
            avatarUrl: userData.avatarUrls?.['48x48'] || userData.avatarUrls?.['32x32'],
            active: userData.active
        };
    } catch (error) {
        console.error('Error fetching current user:', error);
        // Don't return fallback - let the error propagate so component can handle it
        throw error;
    }
});

export const fetchUserRole = createAsyncThunk('user/fetchRole', async (_, { getState }) => {
    try {
        // Get accountId from state (should be set by fetchCurrentUser)
        const state = getState();
        const accountId = state.epics.currentUser?.accountId;
        
        if (!accountId) {
            return 'Developer';
        }
        
        // First, try to bootstrap (will only work if no admin exists)
        // Pass accountId in payload so resolver can use it
        const bootstrapResult = await invoke('Bootstrap.InitializeAdmin', { accountId });
        
        // If bootstrap created admin, return Admin
        if (bootstrapResult?.isBootstrap && bootstrapResult?.role === 'Admin') {
            return 'Admin';
        }
        
        // Otherwise, get role from storage
        const roleKey = `UserRole_${accountId}`;
        const roleData = await invoke('Storage.GetData', { 
            key: roleKey,
            useUserPrefix: false
        });
        
        return roleData?.role || 'Developer';
    } catch (error) {
        console.error('Error fetching user role:', error);
        return 'Developer'; // Default role
    }
});

export const updateUserRole = createAsyncThunk('user/updateRole', async ({ accountId, role }) => {
    try {
        await invoke('User.SetUserRole', { accountId, role });
        return { accountId, role };
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
});

export const fetchAllUsers = createAsyncThunk('user/fetchAll', async () => {
    try {
        // Fetch users from JIRA API - using user search endpoint
        const response = await requestJira('/rest/api/3/users/search?maxResults=1000');
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const users = await response.json();
        
        // Map to dropdown-friendly format
        return users.map((user) => ({
            label: user.displayName,
            value: user.accountId,
            accountId: user.accountId,
            emailAddress: user.emailAddress,
            avatarUrl: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32']
        })).sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw error;
    }
});

const pause = (duration) =>{
    return new Promise((resolve)=>{
        setTimeout(resolve,duration);
    })
};
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserRole, fetchAllUsers, fetchAllUserRoles, rebuildUserRolesRegistry } from '../store';
import { requestJira } from '@forge/bridge';
import { Box } from '@atlaskit/primitives';
import Button from '@atlaskit/button/new';
import Select from '@atlaskit/select';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { Inline, xcss } from '@atlaskit/primitives';
import Spinner from '@atlaskit/spinner';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Lozenge from '@atlaskit/lozenge';
import Avatar from '@atlaskit/avatar';

const ROLE_OPTIONS = [
    { label: 'Developer', value: 'Developer' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Admin', value: 'Admin' }
];

export const UserManagement = () => {
    const dispatch = useDispatch();
    const userRole = useSelector((state) => state.epics.userRole);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userRoles, setUserRoles] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isRebuilding, setIsRebuilding] = useState(false);
    const issues = useSelector((state) => state.epics.issues);

    // Only admins can access this
    if (userRole !== 'Admin') {
        return null;
    }

    // Fetch user roles on component mount
    useEffect(() => {
        const loadUserRoles = async () => {
            setIsLoadingRoles(true);
            try {
                const result = await dispatch(fetchAllUserRoles()).unwrap();
                setUserRoles(result || []);
            } catch (err) {
                console.error('Error fetching user roles:', err);
            } finally {
                setIsLoadingRoles(false);
            }
        };
        loadUserRoles();
    }, [dispatch]);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        setError(null);
        
        // Fetch users when modal opens
        if (users.length === 0) {
            setIsLoadingUsers(true);
            try {
                const result = await dispatch(fetchAllUsers()).unwrap();
                setUsers(result);
            } catch (err) {
                setError('Failed to load users. Please try again.');
                console.error('Error fetching users:', err);
            } finally {
                setIsLoadingUsers(false);
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setSelectedRole(null);
        setError(null);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !selectedRole) {
            setError('Please select both a user and a role');
            return;
        }

        setIsUpdating(true);
        setError(null);

        try {
            await dispatch(updateUserRole({
                accountId: selectedUser.value || selectedUser.accountId,
                role: selectedRole.value
            })).unwrap();
            handleCloseModal();
            
            // Refresh user roles after update
            const result = await dispatch(fetchAllUserRoles()).unwrap();
            setUserRoles(result || []);
        } catch (err) {
            setError(err.message || 'Failed to update user role');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRebuildRegistry = async () => {
        console.log('Rebuild Registry button clicked');
        setIsRebuilding(true);
        setError(null);
        try {
            // Collect all unique accountIds and user details from loaded issues
            const accountIds = new Set();
            const userDetailsMap = new Map(); // Map of accountId -> {displayName, emailAddress, avatarUrl}
            
            console.log('Issues available:', issues ? issues.length : 0);
            
            if (issues && Array.isArray(issues)) {
                issues.forEach((issue) => {
                    // Get accountIds and user details from worklogs
                    if (issue.fullWorklogs && Array.isArray(issue.fullWorklogs)) {
                        issue.fullWorklogs.forEach(worklog => {
                            const accountId = worklog.accountId || worklog.accountID;
                            if (accountId) {
                                accountIds.add(accountId);
                                // Try to get displayName from worklog if available
                                if (worklog.displayName && !userDetailsMap.has(accountId)) {
                                    userDetailsMap.set(accountId, {
                                        displayName: worklog.displayName,
                                        emailAddress: worklog.emailAddress || null,
                                        avatarUrl: worklog.avatarUrl || null
                                    });
                                }
                            }
                        });
                    }
                    
                    // Get accountId from developer assignment
                    if (issue.dev && issue.dev.AccountID) {
                        accountIds.add(issue.dev.AccountID);
                        if (issue.dev.FullName && !userDetailsMap.has(issue.dev.AccountID)) {
                            userDetailsMap.set(issue.dev.AccountID, {
                                displayName: issue.dev.FullName,
                                emailAddress: null,
                                avatarUrl: issue.dev.AvatarUrl || null
                            });
                        }
                    }
                    
                    // Get accountId from assignee
                    if (issue.assignee && issue.assignee.AccountID) {
                        accountIds.add(issue.assignee.AccountID);
                        if (issue.assignee.FullName && !userDetailsMap.has(issue.assignee.AccountID)) {
                            userDetailsMap.set(issue.assignee.AccountID, {
                                displayName: issue.assignee.FullName,
                                emailAddress: null,
                                avatarUrl: issue.assignee.AvatarUrl || null
                            });
                        }
                    }
                });
            }
            
            // Fetch user details from Jira API for accountIds we don't have details for
            const accountIdsArray = Array.from(accountIds);
            const accountIdsToFetch = accountIdsArray.filter(id => !userDetailsMap.has(id));
            
            console.log('Fetching user details for', accountIdsToFetch.length, 'accountIds');
            
            // Fetch user details in batches from frontend (where requestJira works)
            const batchSize = 5;
            for (let i = 0; i < accountIdsToFetch.length; i += batchSize) {
                const batch = accountIdsToFetch.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (accountId) => {
                        try {
                            const response = await requestJira(`/rest/api/3/user?accountId=${encodeURIComponent(accountId)}`);
                            if (response.ok) {
                                const user = await response.json();
                                userDetailsMap.set(accountId, {
                                    displayName: user.displayName,
                                    emailAddress: user.emailAddress || null,
                                    avatarUrl: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32'] || null
                                });
                                console.log(`Fetched user details for ${accountId}:`, user.displayName);
                            } else {
                                console.warn(`Failed to fetch user details for ${accountId}:`, response.status);
                            }
                        } catch (error) {
                            console.warn(`Error fetching user details for ${accountId}:`, error);
                        }
                    })
                );
                // Small delay between batches
                if (i + batchSize < accountIdsToFetch.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            console.log('Collected accountIds:', accountIdsArray.length, accountIdsArray);
            console.log('User details collected:', userDetailsMap.size);
            
            // Call rebuild function with collected accountIds and user details
            const userDetailsArray = accountIdsArray.map(id => ({
                accountId: id,
                ...(userDetailsMap.get(id) || {})
            }));
            
            const rebuildResult = await dispatch(rebuildUserRolesRegistry({
                accountIds: accountIdsArray,
                userDetails: userDetailsArray
            })).unwrap();
            console.log('Rebuild result:', rebuildResult);
            
            // Refresh user roles after rebuild
            const result = await dispatch(fetchAllUserRoles()).unwrap();
            console.log('Fetched user roles after rebuild:', result);
            setUserRoles(result || []);
        } catch (err) {
            console.error('Error rebuilding registry:', err);
            const errorMessage = err?.message || 'Failed to rebuild registry. Please try again.';
            setError(errorMessage);
            alert(`Error: ${errorMessage}`); // Temporary alert to see the error
        } finally {
            setIsRebuilding(false);
        }
    };

    const getRoleAppearance = (role) => {
        switch (role) {
            case 'Admin':
                return 'success';
            case 'Manager':
                return 'inprogress';
            case 'Developer':
            default:
                return 'default';
        }
    };

    return (
        <Box xcss={xcss({ padding: 'space.200', marginBottom: 'space.200' })}>
            <h3 style={{ margin: 0 }}>User Management</h3>
            <Box xcss={xcss({ marginTop: 'space.100' })}>
                <p style={{ margin: 0 }}>Manage user roles and permissions.</p>
            </Box>
            <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', gap: 'space.100', alignItems: 'center' })}>
                <Button appearance="primary" onClick={handleOpenModal}>
                    Assign User Role
                </Button>
                <Button 
                    appearance="default" 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRebuildRegistry();
                    }}
                    isDisabled={isRebuilding}
                    isLoading={isRebuilding}
                >
                    {isRebuilding ? 'Rebuilding...' : 'Rebuild Registry'}
                </Button>
            </Box>
            {error && !isModalOpen && (
                <Box xcss={xcss({ marginTop: 'space.200', padding: 'space.200', backgroundColor: '#FFEBE6', borderRadius: '3px', border: '1px solid #DE350B' })}>
                    <p style={{ margin: 0, color: '#DE350B' }}>{error}</p>
                </Box>
            )}

            {/* Current User Role Assignments */}
            <Box xcss={xcss({ marginTop: 'space.400' })}>
                <h3 style={{ margin: '0 0 16px 0' }}>Current User Role Assignments</h3>
                {isLoadingRoles ? (
                    <Box xcss={xcss({ display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                        <Spinner size="medium" />
                    </Box>
                ) : userRoles.length === 0 ? (
                    <Box xcss={xcss({ padding: 'space.200', textAlign: 'center', color: '#6B778C' })}>
                        <p>No user role assignments found.</p>
                    </Box>
                ) : (
                    <TableTree label="User Roles">
                        <Headers>
                            <Header width={200}>User</Header>
                            <Header width={150}>Role</Header>
                            <Header width={200}>Email</Header>
                            <Header width={150}>Set At</Header>
                        </Headers>
                        <Rows
                            items={userRoles}
                            render={(userRole) => (
                                <Row items={[]} hasChildren={false}>
                                    <Cell width={200}>
                                        <Inline space="space.100" alignBlock="center">
                                            {userRole.avatarUrl && (
                                                <Avatar src={userRole.avatarUrl} name={userRole.displayName} size="small" />
                                            )}
                                            <span>{userRole.displayName}</span>
                                        </Inline>
                                    </Cell>
                                    <Cell width={150}>
                                        <Lozenge appearance={getRoleAppearance(userRole.role)}>
                                            {userRole.role}
                                        </Lozenge>
                                        {userRole.isBootstrap && (
                                            <span style={{ fontSize: '10px', color: '#6B778C', marginLeft: '8px' }}>
                                                (Bootstrap)
                                            </span>
                                        )}
                                    </Cell>
                                    <Cell width={200}>
                                        {userRole.emailAddress || 'N/A'}
                                    </Cell>
                                    <Cell width={150}>
                                        {userRole.setAt ? new Date(userRole.setAt).toLocaleDateString() : 'N/A'}
                                    </Cell>
                                </Row>
                            )}
                        />
                    </TableTree>
                )}
            </Box>

            <ModalTransition>
                {isModalOpen && (
                    <Modal onClose={handleCloseModal} width="small">
                        <ModalHeader>
                            <ModalTitle>Assign User Role</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <Box xcss={xcss({ padding: 'space.200' })}>
                                <Box xcss={xcss({ marginBottom: 'space.200' })}>
                                    <label style={{ fontWeight: '500', display: 'block' }}>User:</label>
                                    {isLoadingUsers ? (
                                        <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'center' })}>
                                            <Spinner size="small" />
                                        </Box>
                                    ) : (
                                        <Select
                                            options={users}
                                            value={selectedUser}
                                            onChange={setSelectedUser}
                                            placeholder="Select a user"
                                            isDisabled={isUpdating}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            styles={{
                                                control: (provided) => ({
                                                    ...provided,
                                                    marginTop: '8px'
                                                }),
                                                menuPortal: (base) => ({
                                                    ...base,
                                                    zIndex: 9999
                                                })
                                            }}
                                        />
                                    )}
                                </Box>
                                <Box xcss={xcss({ marginBottom: 'space.200' })}>
                                    <label style={{ fontWeight: '500', display: 'block' }}>Role:</label>
                                    <Select
                                        options={ROLE_OPTIONS}
                                        value={selectedRole}
                                        onChange={setSelectedRole}
                                        placeholder="Select a role"
                                        isDisabled={isUpdating}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                marginTop: '8px'
                                            }),
                                            menuPortal: (base) => ({
                                                ...base,
                                                zIndex: 9999
                                            })
                                        }}
                                    />
                                </Box>
                                {error && (
                                    <Box xcss={xcss({ color: 'color.text.danger', marginTop: 'space.100' })}>
                                        <p style={{ margin: 0, color: '#DE350B' }}>{error}</p>
                                    </Box>
                                )}
                            </Box>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                appearance="subtle"
                                onClick={handleCloseModal}
                                isDisabled={isUpdating}
                            >
                                Cancel
                            </Button>
                            <Button
                                appearance="primary"
                                onClick={handleUpdateRole}
                                isLoading={isUpdating}
                            >
                                Update Role
                            </Button>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>
        </Box>
    );
};


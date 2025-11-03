import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserRole, fetchAllUsers } from '../store';
import { Box } from '@atlaskit/primitives';
import Button from '@atlaskit/button/new';
import Select from '@atlaskit/select';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import Inline, { xcss } from '@atlaskit/primitives';
import Spinner from '@atlaskit/spinner';

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

    // Only admins can access this
    if (userRole !== 'Admin') {
        return null;
    }

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
        } catch (err) {
            setError(err.message || 'Failed to update user role');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Box xcss={xcss({ padding: 'space.200', marginBottom: 'space.200' })}>
            <h3 style={{ margin: 0 }}>User Management</h3>
            <Box xcss={xcss({ marginTop: 'space.100' })}>
                <p style={{ margin: 0 }}>Manage user roles and permissions.</p>
            </Box>
            <Box xcss={xcss({ marginTop: 'space.200' })}>
                <Button appearance="primary" onClick={handleOpenModal}>
                    Assign User Role
                </Button>
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


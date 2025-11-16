import React, { memo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Grid } from '@atlaskit/primitives';
import { EpicCard } from './EpicCard/EpicCard';
import { UserManagement } from './UserManagement';
import { EpicList } from './EpicList';
import { BootstrapAdmin } from './BootstrapAdmin';
import { xcss } from '@atlaskit/primitives';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import Button from '@atlaskit/button/new';
import './EpicGridOverride.css';
import ResponsiveGrid from './ResponsiveGrid';

const RoleBasedView = () => {
    const userRole = useSelector((state) => state.epics.userRole);
    const currentUser = useSelector((state) => state.epics.currentUser);
    const isUserLoading = useSelector((state) => state.epics.isUserLoading);
    const data = useSelector((state) => state.epics.data);
    const loaded = useSelector((state) => state.epics.loaded);
    const selected = useSelector((state) => state.epics.Selected);
    const developers = useSelector((state) => state.epics.Developers);
    const [showAdminSection, setShowAdminSection] = useState(false);
    
    // Debug logging
    useEffect(() => {
        console.log('RoleBasedView state update:', {
            loaded,
            dataLength: data?.length || 0,
            dataExists: !!data,
            selectedLength: selected?.length || 0,
            developersLength: developers?.length || 0,
            allEpicsHaveDevelopers: data?.every(x => x.Developers != null) || false,
            data: data?.map(epic => ({
                key: epic.EpicKey,
                hasDevelopers: !!epic.Developers
            }))
        });
    }, [loaded, data, selected, developers]);

    const headerStyles = xcss({
        padding: 'space.300',
        borderBottom: '1px solid',
        borderColor: 'color.border'
    });

    // Show loading state while user is being fetched
    if (isUserLoading) {
        return (
            <Box xcss={xcss({ padding: 'space.400', textAlign: 'center' })}>
                <p>Loading user information...</p>
            </Box>
        );
    }

    // Ensure we have valid user data before rendering anything
    if (!currentUser || !currentUser.accountId) {
        return (
            <Box xcss={xcss({ padding: 'space.400', textAlign: 'center' })}>
                <p>Unable to load user information. Please refresh the page.</p>
            </Box>
        );
    }

    // Determine effective role (default to Developer if not set)
    const effectiveRole = userRole || 'Developer';

    return (
        <Box>
            {/* User Info Header */}
            <Box xcss={headerStyles}>
                <Box xcss={xcss({ display: 'flex', alignItems: 'center', gap: 'space.200' })}>
                    {currentUser?.avatarUrl && (
                        <img 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.displayName}
                            style={{ borderRadius: '50%', width: '32px', height: '32px' }}
                        />
                    )}
                    <Box>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{currentUser.displayName || 'User'}</p>
                        <Box xcss={xcss({ marginTop: 'space.050' })}>
                            <Lozenge appearance={effectiveRole === 'Admin' ? 'success' : effectiveRole === 'Manager' ? 'inprogress' : 'default'}>
                                {effectiveRole}
                            </Lozenge>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Admin Section Toggle */}
            {effectiveRole === 'Admin' && (
                <Box xcss={xcss({ padding: 'space.200' })}>
                    <Box xcss={xcss({ marginBottom: 'space.200' })}>
                        <Button 
                            appearance="subtle" 
                            onClick={() => setShowAdminSection(!showAdminSection)}
                        >
                            {showAdminSection ? 'Hide' : 'Show'} Admin Settings
                        </Button>
                    </Box>
                    {showAdminSection && (
                        <>
                            <BootstrapAdmin />
                            <UserManagement />
                        </>
                    )}                    

                    <Box xcss={xcss({ marginTop: 'space.400' })}>
                        <h2 style={{ fontWeight: 'bold', margin: 0 }}>Epic Selection</h2>
                        <Box xcss={xcss({ marginTop: 'space.200' })}>
                            <EpicList />
                        </Box>
                    </Box>


                    <div style={{ marginTop: '24px', width: '100%', maxWidth: '100%' }}>
                        <h2 style={{ fontWeight: 'bold', margin: 0 }}>All Epics</h2>
                        {console.log('RoleBasedView - All Epics render (before condition):', {
                            loaded,
                            dataLength: data?.length || 0,
                            dataExists: !!data,
                            dataType: typeof data,
                            isArray: Array.isArray(data),
                            data
                        })}
                        {!loaded ? (
                            <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                                <Spinner size="medium" />
                            </Box>
                        ) : loaded && data && Array.isArray(data) && data.length > 0 ? (
                            <Grid
                                id="epic-grid-all-epics"
                                className="epic-grid-container"
                                gap="space.200"
                                alignItems="start"
                                templateAreas={[
                                    'navigation navigation navigation navigation',
                                    'content content content content',
                                    'footer footer footer footer',
                                ]}
                            >                        
                                <Box style={{ gridArea: 'content',backgroundColor:'rgba(9, 30, 66, 0.06)',width:'max-content' }}>
                                    <ResponsiveGrid>
                                    {console.log('RoleBasedView - Rendering EpicCards, data:', data)}
                                    {console.log('RoleBasedView - First epic structure:', data[0] ? Object.keys(data[0]) : 'no data')}
                                    {data.map((epic) => {
                                        console.log('RoleBasedView - Rendering epic:', epic?.EpicKey, epic);
                                        if (!epic || !epic.EpicKey) {
                                            console.error('RoleBasedView - Invalid epic:', epic);
                                            return null;
                                        }
                                        return (
                                            <div key={epic.EpicKey} className="epic-card-wrapper" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'visible' }}>
                                                <EpicCard epicKey={epic.EpicKey} />
                                            </div>
                                        );
                                    })}
                                    </ResponsiveGrid>
                                </Box>
                            </Grid>
                        ) : (
                            <p>No epics selected</p>
                        )}
                    </div>
                </Box>
            )}

            {/* Manager View */}
            {effectiveRole === 'Manager' && (
                <Box xcss={xcss({ padding: 'space.200' })}>
                    <Box xcss={xcss({ marginBottom: 'space.400' })}>
                        <h2 style={{ fontWeight: 'bold', margin: 0 }}>Epic Selection</h2>
                        <Box xcss={xcss({ marginTop: 'space.200' })}>
                            <EpicList />
                        </Box>
                    </Box>
                    <Box xcss={xcss({ marginTop: 'space.400' })}>
                        <h2 style={{ fontWeight: 'bold', margin: 0 }}>Epic Overview</h2>
                        {!loaded ? (
                            <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                                <Spinner size="medium" />
                            </Box>
                        ) : loaded && data && Array.isArray(data) && data.length > 0 ? (
                            <div
                                id="epic-grid-manager"
                                className="epic-grid-container"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: '16px',
                                    width: '100%',
                                    maxWidth: '100%',
                                    marginTop: '16px',
                                    alignItems: 'start',
                                    boxSizing: 'border-box',
                                    overflow: 'visible',
                                    gridAutoFlow: 'row'
                                }}
                            >
                                {data.map((epic) => {
                                    if (!epic || !epic.EpicKey) {
                                        return null;
                                    }
                                    return (
                                        <div key={epic.EpicKey} className="epic-card-wrapper" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'visible' }}>
                                            <EpicCard epicKey={epic.EpicKey} />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>No epics selected</p>
                        )}
                    </Box>
                </Box>
            )}

            {/* Developer View */}
            {effectiveRole === 'Developer' && (
                <Box xcss={xcss({ padding: 'space.200' })}>
                    <Box xcss={xcss({ marginBottom: 'space.400' })}>
                        <h2 style={{ fontWeight: 'bold', margin: 0 }}>Epic Selection</h2>
                        <Box xcss={xcss({ marginTop: 'space.200' })}>
                            <EpicList />
                        </Box>
                    </Box>
                    <Box xcss={xcss({ marginTop: 'space.400' })}>
                        <h2 style={{ fontWeight: 'bold', margin: 0 }}>My Epics</h2>
                        {!loaded ? (
                            <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                                <Spinner size="medium" />
                            </Box>
                        ) : loaded && data && Array.isArray(data) && data.length > 0 ? (
                            <div
                                id="epic-grid-developer"
                                className="epic-grid-container"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: '16px',
                                    width: '100%',
                                    maxWidth: '100%',
                                    marginTop: '16px',
                                    alignItems: 'start',
                                    boxSizing: 'border-box',
                                    overflow: 'visible',
                                    gridAutoFlow: 'row'
                                }}
                            >
                                {data.map((epic) => {
                                    if (!epic || !epic.EpicKey) {
                                        return null;
                                    }
                                    return (
                                        <div key={epic.EpicKey} className="epic-card-wrapper" style={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'visible' }}>
                                            <EpicCard epicKey={epic.EpicKey} />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>No epics selected</p>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

RoleBasedView.displayName = 'RoleBasedView';

export default RoleBasedView;


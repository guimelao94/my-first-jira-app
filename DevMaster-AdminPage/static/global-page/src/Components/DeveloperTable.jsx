
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Button from '@atlaskit/button/new';
import Textfield from '@atlaskit/textfield';
import InlineEdit from '@atlaskit/inline-edit';
import { Box, xcss } from '@atlaskit/primitives';
import { useDispatch, useSelector } from 'react-redux';
import { setDevHours } from '../store/slices/epicSlice';
import { memo, useEffect, useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import Avatar, { AvatarItem } from '@atlaskit/avatar';

export const DeveloperTable = memo(function DeveloperTable() {
    const dispatch = useDispatch();
    const [devList, setDevList] = useState(null);
    const [unsaved, setUnsaved] = useState(null);
    
    // Optimized selectors - only subscribe to needed values
    const developers = useSelector((state) => state.epics.Developers);
    const saveDevCounter = useSelector((state) => state.epics.SaveDevCounter);
    const data = useSelector((state) => state.epics.data);
    const selected = useSelector((state) => state.epics.Selected);

    const onChange = useCallback((FullName, property, value) => {
        setDevList((prevList) => {
            if (!prevList) return prevList;
            return prevList.map((dev) =>
                dev.FullName === FullName ? { ...dev, [property]: value } : dev
            );
        });
        setUnsaved(true);
    }, []);

    const onSave = useCallback(async () => {
        if (!devList || !data) return;
        
        const localList = devList.map((dev) => {
            // Find developer in epic data to get AccountID
            const epicWithDev = data.find(epic => 
                epic.Developers?.some(z => z.FullName === dev.FullName)
            );
            
            if (epicWithDev) {
                const fullDev = epicWithDev.Developers.find(z => z.FullName === dev.FullName);
                if (fullDev?.AccountID) {
                    return { ...dev, AccountID: fullDev.AccountID };
                }
            }
            return dev;
        });

        await dispatch(setDevHours(localList));
        setUnsaved(false);
    }, [devList, data, dispatch]);

    const readViewContainerStyles = xcss({
        paddingBlock: 'space.100',
        paddingInline: 'space.075'
    });

    useEffect(() => {
        if (saveDevCounter > 0 && developers) {
            // Developers list is kept global/shared - not user-specific
            invoke('Storage.SaveData', { 
                key: 'DevelopersList', 
                value: developers,
                useUserPrefix: false // Keep shared
            });
        }
    }, [saveDevCounter, developers]);

    useEffect(() => {
        if (developers) {
            setDevList(developers);
        }
    }, [developers]);
    return (
        <>
            <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={200} >Developers</Header>
                    <Header width={120} >Available Hours</Header>
                    <Header width={120} >Meetings</Header>
                    <Header width={120} >Dev Hours</Header>
                </Headers>
                <Rows
                    items={devList}
                    render={({ FullName, ShortName, AvailableHours, Meetings, DevHours, AvatarUrl }) => (
                        <Row
                            items={[]}
                            hasChildren={false}
                            isDefaultExpanded
                        >
                            <Cell singleLine>
                                <AvatarItem
                                    avatar={<Avatar name={FullName} src={AvatarUrl} />}
                                    primaryText={ShortName}
                                />
                            </Cell>
                            <Cell>
                                <InlineEdit
                                    defaultValue={AvailableHours}
                                    editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                    readView={() => (
                                        <Box testId="read-view" xcss={readViewContainerStyles}>
                                            {AvailableHours === 0 ? '0' : AvailableHours}
                                        </Box>
                                    )}
                                    onConfirm={(value) => onChange(FullName, 'AvailableHours', value)}
                                />
                            </Cell>
                            <Cell>
                                <InlineEdit
                                    defaultValue={Meetings}
                                    editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                    readView={() => (
                                        <Box testId="read-view" xcss={readViewContainerStyles}>
                                            {Meetings === 0 ? '0' : Meetings}
                                        </Box>
                                    )}
                                    onConfirm={(value) => onChange(FullName, 'Meetings', value)}
                                />
                            </Cell>
                            <Cell>
                                <InlineEdit
                                    defaultValue={DevHours}
                                    editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                    readView={() => (
                                        <Box testId="read-view" xcss={readViewContainerStyles}>
                                            {DevHours === 0 ? '0' : DevHours}
                                        </Box>
                                    )}
                                    onConfirm={(value) => onChange(FullName, 'DevHours', value)}
                                />
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
            {unsaved && <Button style={{ float: 'right', marginTop: '10px', marginRight: '10px' }} appearance="primary" onClick={onSave}>Save</Button>}
        </>
    );
});

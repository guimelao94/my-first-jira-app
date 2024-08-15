
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Button from '@atlaskit/button/new';
import Textfield from '@atlaskit/textfield';
import InlineEdit from '@atlaskit/inline-edit';
import { Box } from '@atlaskit/primitives';
import { useDispatch, useSelector } from 'react-redux';
import { setDevHours } from '../store/slices/epicSlice';
import { memo, useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

export const DeveloperTable = memo(function DeveloperTable() {
    const dispatch = useDispatch();
    const [renderForce, ReRender] = useState(0);
    const [devList,setDevList] = useState(null);
    const [unsaved,setUnsaved] = useState(null);
    const { Developers, SaveDevCounter, Selected } = useSelector((state) => {
        return state.epics;
    })

    const onChange = (FullName,property,value) => {
        const updatedDevelopers = devList.map((dev, i) => 
            dev.FullName === FullName ? { ...dev, [property]: value } : dev
        );
        console.log(updatedDevelopers);
        
        setDevList(updatedDevelopers);
        setUnsaved(true);
        ReRender(renderForce + 1);
    }

    const onSave = async () =>{
        await dispatch(setDevHours(devList));
        setUnsaved(false);
    }

    console.log(Developers);
    useEffect(() => {
        if (SaveDevCounter > 0) {
            console.log(Developers);
            invoke('Storage.SaveData', { key: 'DevelopersList', value: Developers });
        }

    }, [SaveDevCounter])
    
    useEffect(()=>{
        setDevList(Developers);
    },[]);

    useEffect(() => {
        ReRender(renderForce + 1);
    }, [Selected])
    return (
        <>
            <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={145}>Developers</Header>
                    <Header width={120} >Available Hours</Header>
                    <Header width={120} >Meetings</Header>
                    <Header width={120} >Dev Hours</Header>
                </Headers>
                <Rows
                    items={devList}
                    render={({ FullName, ShortName, AvailableHours, Meetings, DevHours }) => (
                        <Row
                            items={[]}
                            hasChildren={false}
                            isDefaultExpanded
                        >
                            <Cell singleLine>
                                {ShortName}
                            </Cell>
                            <Cell>
                                <InlineEdit
                                    defaultValue={AvailableHours}
                                    editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                    readView={() => (
                                        <Box testId="read-view">
                                            {AvailableHours === 0 ? '0' : AvailableHours}
                                        </Box>
                                    )}
                                    onConfirm={(value)=>{onChange(FullName, 'AvailableHours',value)}}
                                />
                            </Cell>
                            <Cell>
                                <InlineEdit
                                    defaultValue={Meetings}
                                    editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                    readView={() => (
                                        <Box testId="read-view">
                                            {Meetings === 0 ? '0' : Meetings}
                                        </Box>
                                    )}
                                    onConfirm={(value)=>{onChange(FullName, 'Meetings',value)}}
                                />
                            </Cell>
                            <Cell>
                                <InlineEdit
                                    defaultValue={DevHours}
                                    editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                    readView={() => (
                                        <Box testId="read-view">
                                            {DevHours === 0 ? '0' : DevHours}
                                        </Box>
                                    )}
                                    onConfirm={(value)=>{onChange(FullName, 'DevHours',value)}}
                                />
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
            {unsaved && <Button style={{float:'right',marginTop:'10px',marginRight:'10px'}}  appearance="primary" onClick={onSave}>Save</Button>}
        </>
    );
});


import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Textfield from '@atlaskit/textfield';
import InlineEdit from '@atlaskit/inline-edit';
import { Box } from '@atlaskit/primitives';
import { useContext } from 'react';
import GlobalContext from '../context/GlobalContext';

export const DeveloperTable = ({ }) => {
    const {Developers} = useContext(GlobalContext);
    console.log(Developers.Available);
    
    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header width={145}>Developers</Header>
                <Header  width={120} >Available Hours</Header>
                <Header  width={120} >Meetings</Header>
                <Header  width={120} >Dev Hours</Header>
            </Headers>
            <Rows
                items={Developers.Available}
                render={({ FullName,ShortName, AvailableHours, Meetings, DevHours }) => (
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
                                        {AvailableHours === 0 ? '0':AvailableHours}
                                    </Box>
                                )}
                            onConfirm={(value) =>Developers.Dispatch({Type:'UPDATE-HOURS'},FullName,'AvailableHours',value)}
                            />
                        </Cell>
                        <Cell>
                            <InlineEdit
                                defaultValue={Meetings}
                                editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                readView={() => (
                                    <Box testId="read-view">
                                        {Meetings === 0 ? '0':Meetings}
                                    </Box>
                                )}
                                onConfirm={(value) => Developers.Dispatch({Type:'UPDATE-HOURS'},FullName,'Meetings',value)}
                            />
                        </Cell>
                        <Cell>
                            <InlineEdit
                                defaultValue={DevHours}
                                editView={({ errorMessage, ...fieldProps }) => <Textfield {...fieldProps} autoFocus />}
                                readView={() => (
                                    <Box testId="read-view">
                                        {DevHours === 0 ? '0':DevHours}
                                    </Box>
                                )}
                                onConfirm={(value) => Developers.Dispatch({Type:'UPDATE-HOURS'},FullName,'DevHours',value)}
                            />
                        </Cell>
                    </Row>
                )}
            />
        </TableTree>
    );
};
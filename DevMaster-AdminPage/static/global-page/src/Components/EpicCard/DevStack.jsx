import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { Inline, Stack, xcss } from '@atlaskit/primitives';
import Style from './DevStack.module.css';
import Lozenge from '@atlaskit/lozenge';
import { useSelector } from 'react-redux';
import { memo, useMemo } from 'react';

export const DevStack = memo(({ epicKey, showIssues }) => {
    const data = useSelector((state) => state.epics.data);
    const allDevStacksLoaded = useSelector((state) => state.epics.AllDevStacksLoaded);
    
    const epic = useMemo(() => {
        return data?.find(x => x.EpicKey === epicKey);
    }, [data, epicKey]);

    if(!allDevStacksLoaded || !epic?.DevStack) return null;

    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header className={Style.HeaderCell} width={145}>Totals</Header>
                {epic.DevStack.map((developer) => (
                    <Header key={developer.FullName} width={145} className={Style.HeaderCell}>
                        {developer.TotalHours.toFixed(2)}H
                    </Header>
                ))}
            </Headers>
            <Rows
                items={[
                    { Label: 'Days Worth of Work', Property: 'DaysWorth' },
                    { Label: 'Days available after prev release', Property: 'DaysAvailable' },
                    { Label: 'Day To Begin Dev Work', Property: 'StartDate' },
                    { Label: 'Due Date', Property: 'OnTrack' },
                    { Label: 'Done by', Property: 'DoneBy' },
                    { Label: 'Overflow Hours', Property: 'OverflowHours' },
                    { isDevRow: !showIssues, Label:'Developers', Property:'ShortName'}
                ]}
                render={({ Label, Property,isDevRow }) => (
                    !isDevRow ?  <Row
                        items={[]}
                        hasChildren={false}
                        isDefaultExpanded
                    >
                        <Cell className={Style.BodyLabel} width={145}>{Label}</Cell>
                        {epic.DevStack.map((developer) => (
                            <Cell key={developer.FullName} width={145} className={Style.BodyCell}>
                                <Inline>
                                    <span>{developer[Property]}</span>
                                </Inline>
                            </Cell>
                        ))}
                    </Row>
                    :
                    <Row
                        items={[]}
                        hasChildren={false}
                        isDefaultExpanded
                    >
                        <Cell className={Style.DevRow} width={145}>{Label}</Cell>
                        {epic.DevStack.map((developer) => (
                            <Cell key={developer.FullName} width={145} className={Style.DevRow}>
                                <Inline>
                                    <span>{developer[Property]}</span>
                                </Inline>
                            </Cell>
                        ))}
                    </Row>
                )}
                
            />
        </TableTree>
    );
});
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { Inline, Stack, xcss } from '@atlaskit/primitives';
import Style from './DevStack.module.css';
import Lozenge from '@atlaskit/lozenge';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { addWeekdays, getDifferenceInDays } from '../../Utils/DateTools';

export const DevStack = ({ epicKey,showIssues }) => {
    const epics = useSelector((state) => {
        return state.epics;
    })
    const Epic = epics.data.find(x=>x.EpicKey == epicKey);
    

    useEffect(()=>{
        console.log(epics);
    },[]);

    if(!epics.AllDevStacksLoaded) return;

    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header className={Style.HeaderCell} width={145}>Totals</Header>
                {Epic.DevStack && Epic.DevStack.map((developer) => (
                    <Header width={145} className={Style.HeaderCell}>
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
                        {Epic.DevStack && Epic.DevStack.map((developer) => (
                            <Cell width={145} className={Style.BodyCell}>
                                <Inline>
                                    <span style={{}}>{developer[Property]}</span>
                                </Inline>
                            </Cell>
                        ))
                        }
                    </Row>
                    :
                    <Row
                        items={[]}
                        hasChildren={false}
                        isDefaultExpanded
                    >
                        <Cell className={Style.DevRow} width={145}>{Label}</Cell>
                        {Epic.DevStack && Epic.DevStack.map((developer) => (
                            <Cell width={145} className={Style.DevRow}>
                                <Inline>
                                    <span style={{}}>{developer[Property]}</span>
                                </Inline>
                            </Cell>
                        ))
                        }
                    </Row>
                )}
                
            />
        </TableTree>
    );
}
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { Inline, Stack, xcss } from '@atlaskit/primitives';
import Style from './DevStack.module.css';
import Lozenge from '@atlaskit/lozenge';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { addWeekdays, getDifferenceInDays } from '../../Utils/DateTools';

export const DevStack = ({ epicKey }) => {
    const epics = useSelector((state) => {
        return state.epics;
    })
    const Epic = epics.data.find(x=>x.EpicKey == epicKey);

    useEffect(()=>{
        console.log(epics);
    },[]);
    const [devs, setDevStackData] = useState([
        {
            FullName: 'Guimel O Gonzalez',
            TotalHours: 20.5,
            DaysWorth: 12,
            DaysAvailable: 9,
            StartDate: '7/25/2024',
            OnTrack: 'On Track',
            DoneBy: '7/25/2024',
            OverflowHours: 7.5,
            EpicKey: 'DMA-2'
        },
        {
            FullName: 'Julius Cesar',
            TotalHours: 21,
            DaysWorth: 11,
            DaysAvailable: 7,
            StartDate: '7/24/2024',
            OnTrack: 'Off Track',
            DoneBy: '7/27/2024',
            OverflowHours: 2.5,
            EpicKey: 'DMA-2'
        }
    ]);
    if(!epics.AllDevStacksLoaded) return;

    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header className={Style.HeaderCell} width={145}>Totals</Header>
                {Epic.DevStack.map((developer) => (
                    <Header width={145} className={Style.HeaderCell}>
                        {developer.TotalHours}H
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
                    { Label: 'Overflow Hours', Property: 'OverflowHours' }
                ]}
                render={({ Label, Property }) => (
                    <Row
                        items={[]}
                        hasChildren={false}
                        isDefaultExpanded
                    >
                        <Cell className={Style.BodyLabel} width={145}>{Label}</Cell>
                        {Epic.DevStack.map((developer) => (
                            <Cell width={145} className={Style.BodyCell}>
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
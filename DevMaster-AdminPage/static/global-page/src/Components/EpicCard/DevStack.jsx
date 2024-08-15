import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { Inline, Stack, xcss } from '@atlaskit/primitives';
import Style from './DevStack.module.css';
import Lozenge from '@atlaskit/lozenge';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { addWeekdays, getDifferenceInDays } from '../../Utils/DateTools';

export const DevStack = ({ epicKey }) => {
    const epics = useSelector((state) => {
        return state.epics;
    })
    var currentEpic = epics.data.find(x => x.EpicKey == epicKey);
    var epicIndex = epics.data.findIndex(epic => epic.EpicKey === epicKey);
    var prevEpic = epicIndex === 0 ? null : epics.data[epicIndex - 1];

    var developers = currentEpic.Developers.map((d) => ({
        FullName: d.FullName,
        TotalHours: d.RemainingWork ? (d.RemainingWork / 3600) + (d.OverflowHours ? d.OverflowHours : 0) : 0,
        StartDate: epicIndex === 0 ? (new Date()).toLocaleDateString() : '',
        OverflowHours: d.OverflowTime ? d.OverflowTime / 3600 : 0,
        EpicKey: epicKey
    }));

    console.log(developers);

    developers = developers.map((d) => ({
        ...d,
        DaysWorth: d.TotalHours ? Math.ceil(d.TotalHours / (epics.Developers.find(z => z.FullName === d.FullName).DevHours / 5)) : 0,
    }));

    developers = developers.map((d) => ({
        ...d,
        DaysAvailable: epicIndex === 0 ? getDifferenceInDays(d.StartDate, currentEpic.DueDate) : '',
        DoneBy: addWeekdays(d.StartDate, d.DaysWorth)
    }));

    developers = developers.map((d) => ({
        ...d,
        OnTrack: epicIndex === 0 ? (new Date(d.DoneBy)) <= (new Date(currentEpic.DueDate)) ? 'On Track' : 'Off Track' : '',
    }));

    console.log(developers);
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
    return (
        <TableTree label="Automatically controlled row expansion">
            <Headers>
                <Header className={Style.HeaderCell} width={145}>Totals</Header>
                {developers.map((developer) => (
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
                        {developers.map((developer) => (
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
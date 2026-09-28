
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { useDispatch, useSelector } from 'react-redux';
import { memo, useEffect, useState,useCallback } from 'react';
import { invoke } from '@forge/bridge';
import TrashIcon from '@atlaskit/icon/glyph/trash'


import Button, { IconButton } from '@atlaskit/button/new';

import { TimeOffModal } from './TimeOffEntryModal';
import { setDevHours } from '../store/slices/epicSlice';

export const TimeOffTable = memo(function TimeOffTable({ readOnly = false }) {
    const dispatch = useDispatch();
    const [renderForce, ReRender] = useState(0);
    const [devList, setDevList] = useState([]);
    const [daysOff, setDaysOff] = useState([
        { Developer: 'Guimel O Gonzalez', Date: '2024-08-19' },
        { Developer: 'Julius Cesar', Date: '2024-08-24' }
    ]);
    const [unsaved, setUnsaved] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

    const { Developers, Selected } = useSelector((state) => {
        return state.epics;
    })

    console.log(Developers);

    const RemoveRecord = async (Dev,Date) =>{
        // Read the latest persisted list as the source of truth so we never write back a
        // stale/empty in-memory list (which would drop other developers' Time Off entries).
        const stored = await invoke('Storage.GetData', { key: 'DevelopersList', useUserPrefix: false });
        const storedList = Array.isArray(stored) ? stored : [];

        const byName = new Map();
        for (const d of storedList) {
            if (d && d.FullName) {
                byName.set(d.FullName, { ...d, TimeOff: Array.isArray(d.TimeOff) ? [...d.TimeOff] : [] });
            }
        }
        if (Array.isArray(devList)) {
            for (const d of devList) {
                if (d && d.FullName && !byName.has(d.FullName)) {
                    byName.set(d.FullName, { ...d, TimeOff: Array.isArray(d.TimeOff) ? [...d.TimeOff] : [] });
                }
            }
        }

        // Remove only the targeted date from the targeted developer.
        const target = byName.get(Dev);
        if (target) {
            target.TimeOff = target.TimeOff.filter(y => y !== Date);
        }

        const devs = Array.from(byName.values());
        await invoke('Storage.SaveData', { key: 'DevelopersList', value: devs, useUserPrefix: false });
        await dispatch(setDevHours(devs));
        setDevList(devs);
    }

    useEffect(() => {
        console.log('TimeOff Table');
        setDevList(Array.isArray(Developers) ? Developers : []);
    }, [Developers]);

    useEffect(() => {
        ReRender(renderForce + 1);
    }, [Selected])

    const mapTimeOff = (devs) => {
        if (!devs || !Array.isArray(devs)) return [];
        var values = [];
        for (let i1 = 0; i1 < devs.length; i1++) {
            const d = devs[i1];
            if (!d || !d.TimeOff || !Array.isArray(d.TimeOff)) continue;
            for (const t of d.TimeOff) {
                values.push({
                    Developer:d.FullName,
                    Date:t
                });
            }
        }
        return values;
    }
    return (
        <>
            <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={145}>Developer</Header>
                    <Header width={145}>Date</Header>
                    <Header width={100}><IconButton icon={TrashIcon} label="Remove Record" isDisabled /></Header>
                </Headers>
                <Rows
                    items={mapTimeOff((devList || []).filter(x=>x && x.TimeOff && x.TimeOff.length > 0))}
                    render={({ Developer, Date }) => (
                        <Row
                            items={[]}
                            hasChildren={false}
                            isDefaultExpanded
                        >
                            <Cell singleLine>
                                {Developer}
                            </Cell>
                            <Cell singleLine>
                                {Date}
                            </Cell>
                            <Cell singleLine>
                                {!readOnly && (
                                    <IconButton icon={TrashIcon} label="Remove Record" onClick={()=>{RemoveRecord(Developer,Date)}} />
                                )}
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
             {!readOnly && (
                 <>
                     <Button style={{float:'right',marginTop:'10px',marginRight:'10px'}}  appearance="primary" aria-haspopup="dialog" onClick={openModal}>Add Time Off</Button>
                     <TimeOffModal isOpen={isOpen} dispatch={dispatch} closeModal={closeModal} setDevList={setDevList}/>
                 </>
             )}
			
        </>
    );
});

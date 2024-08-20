
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { useDispatch, useSelector } from 'react-redux';
import { memo, useEffect, useState,useCallback } from 'react';
import { invoke } from '@forge/bridge';
import TrashIcon from '@atlaskit/icon/glyph/trash'


import Button, { IconButton } from '@atlaskit/button/new';

import { TimeOffModal } from './TimeOffEntryModal';
import { setDevHours } from '../store/slices/epicSlice';

export const TimeOffTable = memo(function TimeOffTable() {
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
        var devs = [...devList];

        for (let index = 0; index < devs.length; index++) {
            
            if (devs[index].FullName === Dev) {
                devs[index] = {
                    ...devs.find(x=>x.FullName === Dev),
                    TimeOff: devs.find(x=>x.FullName === Dev).TimeOff.filter(y=>y !== Date)
                };
            }
        }

        await invoke('Storage.SaveData', { key: 'DevelopersList', value: devs });
        console.log(devs);
        await dispatch(setDevHours(devs));
        setDevList(devs);

    }

    useEffect(() => {
        console.log('TimeOff Table');
        setDevList(Developers);
    }, []);

    useEffect(() => {
        ReRender(renderForce + 1);
    }, [Selected])

    const mapTimeOff = (devs) => {
        if (!devs) return [];
        var values = [];
        for (let i1 = 0; i1 < devs.length; i1++) {
            const d = devs[i1];
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
                    items={mapTimeOff(devList.filter(x=>x.TimeOff && x.TimeOff.length > 0))}
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
                                <IconButton icon={TrashIcon} label="Remove Record" onClick={()=>{RemoveRecord(Developer,Date)}} />
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
             <Button style={{float:'right',marginTop:'10px',marginRight:'10px'}}  appearance="primary" aria-haspopup="dialog" onClick={openModal}>Add Time Off</Button>

            <TimeOffModal isOpen={isOpen} dispatch={dispatch} closeModal={closeModal} setDevList={setDevList}/>
			
        </>
    );
});

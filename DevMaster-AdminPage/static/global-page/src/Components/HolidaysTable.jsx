
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { useDispatch, useSelector } from 'react-redux';
import { memo, useEffect, useState,useCallback } from 'react';
import { invoke } from '@forge/bridge';
import TrashIcon from '@atlaskit/icon/glyph/trash'


import Button, { IconButton } from '@atlaskit/button/new';

import { TimeOffModal } from './TimeOffEntryModal';
import { setDevHours } from '../store/slices/epicSlice';
import { HolidayEntryModal } from './HolidayEntryModal';
import { StringToDate } from '../Utils/ConversionTools';

export const HolidaysTable = memo(function HolidaysTable() {
    const dispatch = useDispatch();
    const [renderForce, ReRender] = useState(0);
    const [holidays, setHolidays] = useState([]);
    const [unsaved, setUnsaved] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const openModal = useCallback(() => setIsOpen(true), []);
	const closeModal = useCallback(() => setIsOpen(false), []);

    const {Holidays} = useSelector((state) => {
        return state.epics;
    })

    const RemoveRecord = async (Date) =>{
        var hdays = holidays.filter(x=>x !== Date);      
        console.log(hdays);
        await invoke('Storage.SaveData', { key: 'Holidays', value: hdays });
        setHolidays(hdays);
    }
    console.log(holidays);
    useEffect(() => {
        console.log(holidays);
        setHolidays([...Holidays].sort((a, b) => StringToDate(a) - StringToDate(b)));
    }, []);

    return (
        <>
            {Object.keys(holidays).length !== 0 && <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={145}>Holidays</Header>
                    <Header width={100}><IconButton icon={TrashIcon} label="Remove Record" isDisabled /></Header>
                </Headers>
                <Rows
                    items={holidays && holidays.map((val)=>({Date:val}))}
                    render={({ Date }) => (
                        <Row
                            items={[]}
                            hasChildren={false}
                            isDefaultExpanded
                        >
                            <Cell singleLine>
                                {Date}
                            </Cell>
                            <Cell singleLine>
                                <IconButton icon={TrashIcon} label="Remove Record" onClick={()=>{RemoveRecord(Date)}} />
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>}
             <Button style={{float:'right',marginTop:'10px',marginRight:'10px'}}  appearance="primary" aria-haspopup="dialog" onClick={openModal}>Add Holiday</Button>

            <HolidayEntryModal isOpen={isOpen} closeModal={closeModal} dispatch={dispatch} setHolidayList={setHolidays}/>
			
        </>
    );
});

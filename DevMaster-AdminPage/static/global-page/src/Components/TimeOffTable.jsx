
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { useDispatch, useSelector } from 'react-redux';
import { memo, useEffect, useState,useCallback } from 'react';
import { invoke } from '@forge/bridge';



import Button from '@atlaskit/button/new';

import { TimeOffModal } from './TimeOffEntryModal';

export const TimeOffTable = memo(function TimeOffTable() {
    const dispatch = useDispatch();
    const [renderForce, ReRender] = useState(0);
    const [devList, setDevList] = useState(null);
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

    useEffect(() => {
        console.log('TimeOff Table');
        setDevList(Developers);
    }, []);

    useEffect(() => {
        ReRender(renderForce + 1);
    }, [Selected])
    return (
        <>
            <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={145}>Developer</Header>
                    <Header width={145}>Date</Header>
                </Headers>
                <Rows
                    items={daysOff}
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
                        </Row>
                    )}
                />
            </TableTree>
             <Button style={{float:'right',marginTop:'10px',marginRight:'10px'}}  appearance="primary" aria-haspopup="dialog" onClick={openModal}>Add Time Off</Button>

            <TimeOffModal isOpen={isOpen} closeModal={closeModal} />
			
        </>
    );
});

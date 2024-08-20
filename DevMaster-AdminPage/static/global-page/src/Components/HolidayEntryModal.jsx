import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { Box, Inline, xcss } from '@atlaskit/primitives';
import Button, { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid } from '@atlaskit/primitives';
import { useSelector } from 'react-redux';
import Select from '@atlaskit/select';
import { DatePicker } from '@atlaskit/datetime-picker';
import { useState } from 'react';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import { invoke } from '@forge/bridge';
import { setHolidays } from '../store/slices/epicSlice';

export const HolidayEntryModal = ({ isOpen, closeModal,setHolidayList,dispatch }) => {

    const [newHoliday, setNewHoliday] = useState((new Date()).toISOString());
    const { Holidays } = useSelector((state) => {
        return state.epics;
    })


    const gridStyles = xcss({
        width: '100%',
    });

    const closeContainerStyles = xcss({
        gridArea: 'close',
    });

    const titleContainerStyles = xcss({
        gridArea: 'title',
    });

    const HandleSubmit = async () => {
        var holidays = [...(Object.keys(Holidays).length === 0 ? []:Holidays),newHoliday.substring(0, 10)];
        
        await invoke('Storage.SaveData', { key: 'Holidays', value: holidays });
        console.log(holidays);
        await dispatch(setHolidays(holidays));
        setHolidayList(holidays);
        closeModal();
    }

    return (
        <ModalTransition>
            {isOpen && (
                <Modal onClose={closeModal} width="small">
                    <ModalHeader>
                        <Grid gap="space.200" templateAreas={['title close']} xcss={gridStyles}>
                            <Flex xcss={closeContainerStyles} justifyContent="end">
                                <IconButton
                                    appearance="subtle"
                                    icon={CrossIcon}
                                    label="Close Modal"
                                    onClick={closeModal}
                                />
                            </Flex>
                            <Flex xcss={titleContainerStyles} justifyContent="start">
                                <ModalTitle>Add Holiday</ModalTitle>
                            </Flex>
                        </Grid>
                    </ModalHeader>
                    <ModalBody>
                        <Box xcss={xcss({ alignContent: 'center', marginLeft: 'auto', marginRight: 'auto', width: 'max-content', height: '100px' })}>
                            <Inline space={'space.200'}>                                
                                <DatePicker id="default-date-picker-example"
                                    onChange={(e) => { setNewHoliday(e) }}
                                    defaultValue={newHoliday}        
                                />
                            </Inline>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button appearance="subtle" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button appearance="primary" onClick={HandleSubmit}>
                            Add
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </ModalTransition>
    );
}
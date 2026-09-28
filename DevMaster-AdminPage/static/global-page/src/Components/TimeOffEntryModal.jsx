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
import { setDevHours } from '../store/slices/epicSlice';

export const TimeOffModal = ({ isOpen, closeModal,setDevList,dispatch }) => {

    const [offDate, setOffDate] = useState((new Date()).toISOString());
    const [offDev, setOffDev] = useState(null);

    const { Developers, Selected } = useSelector((state) => {
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
        // Require a developer selection before mutating anything.
        if (!offDev || !offDev.value) {
            closeModal();
            return;
        }

        const newDate = offDate.substring(0, 10);

        // Read the latest persisted list as the source of truth. In-memory `Developers`
        // can be empty/stale while a background refresh is running, and writing that
        // back would silently drop existing Time Off entries.
        const stored = await invoke('Storage.GetData', { key: 'DevelopersList', useUserPrefix: false });
        const storedList = Array.isArray(stored) ? stored : [];

        // Merge storage (authoritative) with any in-memory devs it might be missing.
        const byName = new Map();
        for (const d of storedList) {
            if (d && d.FullName) {
                byName.set(d.FullName, { ...d, TimeOff: Array.isArray(d.TimeOff) ? [...d.TimeOff] : [] });
            }
        }
        if (Array.isArray(Developers)) {
            for (const d of Developers) {
                if (d && d.FullName && !byName.has(d.FullName)) {
                    byName.set(d.FullName, { ...d, TimeOff: Array.isArray(d.TimeOff) ? [...d.TimeOff] : [] });
                }
            }
        }

        // Ensure the selected developer exists, then append the date (avoiding duplicates).
        if (!byName.has(offDev.value)) {
            byName.set(offDev.value, { FullName: offDev.value, TimeOff: [] });
        }
        const target = byName.get(offDev.value);
        if (!target.TimeOff.includes(newDate)) {
            target.TimeOff.push(newDate);
        }

        const devList = Array.from(byName.values());
        await invoke('Storage.SaveData', { key: 'DevelopersList', value: devList, useUserPrefix: false });
        await dispatch(setDevHours(devList));
        setDevList(devList);
        closeModal();
    }

    return (
        <ModalTransition>
            {isOpen && (
                <Modal onClose={closeModal} shouldScrollInViewport={true} height={200}>
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
                                <ModalTitle>Add Developer Time Off</ModalTitle>
                            </Flex>
                        </Grid>
                    </ModalHeader>
                    <ModalBody>
                        <Box xcss={xcss({ alignContent: 'center', marginLeft: 'auto', marginRight: 'auto', width: 'max-content', height: '100px' })}>
                            <Inline space={'space.200'}>
                                <Select
                                    inputId="single-select-example"
                                    className="single-select"
                                    classNamePrefix="react-select"
                                    width={200}
                                    options={
                                        Developers.map((d) => {
                                            console.log(d);
                                            return {
                                                label: (
                                                    <AvatarItem
                                                        avatar={<Avatar name={d.FullName} size="small" src={d.AvatarUrl} />}
                                                        primaryText={d.FullName}
                                                    />
                                                ),
                                                value: d.FullName
                                            };
                                        })}
                                    onChange={(e) => { setOffDev(e) }}
                                    placeholder="Choose a developer"
                                />
                                <DatePicker id="default-date-picker-example"
                                    onChange={(e) => { setOffDate(e) }}
                                    defaultValue={offDate}        
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
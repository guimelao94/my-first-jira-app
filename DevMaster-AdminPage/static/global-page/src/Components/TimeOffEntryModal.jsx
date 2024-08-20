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
        var devList = [...Developers];
        for (let index = 0; index < devList.length; index++) {
            
            // console.log(devList[index].FullName);
            // console.log(offDev);
            // console.log(offDate);
            if (devList[index].FullName === offDev.value) {
                if (!devList[index].TimeOff) {
                    devList[index] = {...devList[index],TimeOff:[offDate.substring(0, 10)]};
                }
                else{
                    devList[index] = {...devList[index],TimeOff:[...devList[index].TimeOff,offDate.substring(0, 10)]};
                }
            }

            if (!devList[index].TimeOff) {
                devList[index] = {...devList[index],TimeOff:[]};
            }
            // console.log(devList[index]);
        }
        await invoke('Storage.SaveData', { key: 'DevelopersList', value: devList });
        console.log(devList);
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
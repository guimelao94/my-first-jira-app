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

export const TimeOffModal = ({ isOpen, closeModal }) => {

    const [offDate, setOffDate] = useState(null);
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

    const HandleChange = async (e) => {
        console.log(e);
        setOffDev(e.value);
        //dispatch(SaveSelectedEpics((e.map((item) =>(item.value)))));
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
                                                        avatar={<Avatar name={d.FullName} src={d.AvatarUrl} />}
                                                        primaryText={d.FullName}
                                                    />
                                                ),
                                                value: d.FullName
                                            };
                                        })}
                                    onChange={HandleChange}
                                    placeholder="Choose a developer"
                                />
                                <DatePicker id="default-date-picker-example"
                                    onChange={(e) => { setOffDate(e) }}

                                />
                            </Inline>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button appearance="subtle" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button appearance="primary" onClick={closeModal}>
                            Add
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </ModalTransition>
    );
}
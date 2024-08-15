import React from 'react';
import { Modal, ModalBody, ModalTransition, ModalTitle, ModalFooter, ModalHeader, Button, TextArea, Inline, Textfield, User, xcss, Box } from '@forge/react';

export const AddOverflowModal = ({timeSpent,setTimeSpent,context,description,setDescription,closeModal,isOpen}) => {

    return(
        <ModalTransition>
                {isOpen && (
                    <Modal onClose={closeModal} width="small">
                        <ModalHeader>
                            <ModalTitle>Overflow Submission</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <Inline
                                space="space.050"
                            >
                                <Box xcss={xcss({ width: '40%', backgroundColor: 'black' })}>
                                    <Textfield
                                        appearance="standard"
                                        placeholder="1h 30m = 1.5"
                                        value={timeSpent}
                                        onChange={(e) => { setTimeSpent(e.target.value); }}
                                    />
                                </Box>

                                <Box
                                    xcss={xcss({ width: '60%', marginLeft: 'space.200', position: 'relative', bottom: '3%' })}>
                                    <User accountId={context.accountId} name="user" />
                                </Box>
                            </Inline>
                            <TextArea
                                id="area"
                                placeholder="Description"
                                name="area"
                                onChange={(e) => { setDescription(e.target.value); }}
                                value={description}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button appearance="subtle" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button appearance="primary" onClick={closeModal}>
                                Submit
                            </Button>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>
    );
}
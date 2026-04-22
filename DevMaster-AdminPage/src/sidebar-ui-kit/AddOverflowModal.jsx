import React from 'react';
import { Modal, ModalBody, ModalTransition, ModalTitle, ModalFooter, ModalHeader, Button, TextArea, Inline, Textfield, User, Select, xcss, Box, Text } from '@forge/react';

const overflowCategoryOptions = [
    { label: 'Unplanned Development', value: 'Unplanned Development' },
    { label: 'New Requirements', value: 'New Requirements' },
    { label: 'Bug Related', value: 'Bug Related' }
];

export const AddOverflowModal = ({timeSpent,setTimeSpent,context,description,setDescription,date,setDate,category,setCategory,validationMessage,closeModal,submitModal,isOpen}) => {
    const selectedCategoryOption = overflowCategoryOptions.find((option) => option.value === category) || null;

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
                                <Box xcss={xcss({ width: '40%' })}>
                                    <Textfield
                                        appearance="standard"
                                        placeholder="1h 30m = 1.5"
                                        value={timeSpent}
                                        onChange={(e) => { setTimeSpent(e.target.value); }}
                                    />
                                </Box>

                                <Box
                                    xcss={xcss({ width: '60%', marginLeft: 'space.200' })}>
                                    <User accountId={context.accountId} name="user" />
                                </Box>
                            </Inline>
                            <Box xcss={xcss({ marginTop: 'space.200', marginBottom: 'space.200' })}>
                                <Text>Date (YYYY-MM-DD):</Text>
                                <Textfield
                                    appearance="standard"
                                    placeholder="YYYY-MM-DD"
                                    value={date}
                                    onChange={(e) => { setDate(e.target.value); }}
                                />
                            </Box>
                            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                                <Text>Category:</Text>
                                <Select
                                    inputId="overflow-category"
                                    name="overflow-category"
                                    options={overflowCategoryOptions}
                                    value={selectedCategoryOption}
                                    placeholder="Select a category"
                                    isClearable={false}
                                    onChange={(option) => { setCategory(option?.value || ''); }}
                                />
                            </Box>
                            <TextArea
                                id="area"
                                placeholder="Description"
                                name="area"
                                onChange={(e) => { setDescription(e.target.value); }}
                                value={description}
                            />
                            {validationMessage && (
                                <Box xcss={xcss({ marginTop: 'space.200', color: 'color.text.danger' })}>
                                    <Text>{validationMessage}</Text>
                                </Box>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button appearance="subtle" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button appearance="primary" onClick={submitModal}>
                                Submit
                            </Button>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>
    );
}

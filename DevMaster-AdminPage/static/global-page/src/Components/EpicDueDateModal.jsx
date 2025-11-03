import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { Box, xcss } from '@atlaskit/primitives';
import Button, { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid } from '@atlaskit/primitives';
import Lozenge from '@atlaskit/lozenge';

export const EpicDueDateModal = ({ isOpen, closeModal, epicKey, epicSummary }) => {
    const gridStyles = xcss({
        width: '100%',
    });

    const closeContainerStyles = xcss({
        gridArea: 'close',
    });

    const titleContainerStyles = xcss({
        gridArea: 'title',
    });

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
                                <ModalTitle>Due Date Required</ModalTitle>
                            </Flex>
                        </Grid>
                    </ModalHeader>
                    <ModalBody>
                        <Box xcss={xcss({ padding: 'space.200' })}>
                            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                                <p>
                                    The epic <Lozenge appearance="new">{epicKey}</Lozenge> does not have a due date set.
                                </p>
                                {epicSummary && (
                                    <p style={{ marginTop: '8px', fontWeight: 'bold' }}>{epicSummary}</p>
                                )}
                                <p style={{ marginTop: '12px' }}>
                                    Please add a due date to this epic in JIRA before selecting it.
                                </p>
                            </Box>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            appearance="primary" 
                            onClick={closeModal}
                        >
                            OK
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </ModalTransition>
    );
};



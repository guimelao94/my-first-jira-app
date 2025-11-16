import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { Box, xcss } from '@atlaskit/primitives';
import Button, { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { Flex, Grid } from '@atlaskit/primitives';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Lozenge from '@atlaskit/lozenge';
import { convertToHours } from '../Utils/ConversionTools';
import { ViewIssueModal } from '@forge/jira-bridge';

export const TicketDetailsModal = ({ isOpen, closeModal, tickets, developerName, type }) => {
    const gridStyles = xcss({
        width: '100%',
    });

    const closeContainerStyles = xcss({
        gridArea: 'close',
    });

    const titleContainerStyles = xcss({
        gridArea: 'title',
    });

    if (!isOpen || !tickets || tickets.length === 0) {
        return null;
    }

    const totalHours = tickets.reduce((sum, ticket) => sum + (ticket.hours || 0), 0);

    return (
        <ModalTransition>
            {isOpen && (
                <Modal onClose={closeModal} width="large">
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
                                <ModalTitle>
                                    {type === 'timeSpent' ? 'Time Spent' : 'Overflow Hours'} - {developerName}
                                </ModalTitle>
                            </Flex>
                        </Grid>
                    </ModalHeader>
                    <ModalBody>
                        <Box xcss={xcss({ padding: 'space.200' })}>
                            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                                <p style={{ margin: 0 }}>
                                    Total: <strong>{totalHours.toFixed(2)}h</strong> across {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                                </p>
                            </Box>
                            <TableTree label="Tickets">
                                <Headers>
                                    <Header width={200}>Ticket</Header>
                                    <Header width={300}>Epic</Header>
                                    <Header width={150}>Hours</Header>
                                    <Header width={200}>Date</Header>
                                </Headers>
                                <Rows
                                    items={tickets}
                                    render={(ticket) => (
                                        <Row
                                            items={[]}
                                            hasChildren={false}
                                            isDefaultExpanded
                                        >
                                            <Cell width={200}>
                                                <Box 
                                                    xcss={xcss({ 
                                                        cursor: 'pointer',
                                                        color: 'color.link',
                                                        textDecoration: 'underline',
                                                        fontWeight: 'bold'
                                                    })}
                                                    onClick={() => {
                                                        const modal = new ViewIssueModal({
                                                            onClose: () => {
                                                                // Modal closed
                                                            },
                                                            context: {
                                                                issueKey: ticket.ticketNumber,
                                                            },
                                                        });
                                                        modal.open();
                                                    }}
                                                >
                                                    {ticket.ticketNumber}
                                                </Box>
                                            </Cell>
                                            <Cell width={300}>
                                                {ticket.epicKey || 'N/A'}
                                            </Cell>
                                            <Cell width={150}>
                                                <Lozenge appearance="default">
                                                    {ticket.hours.toFixed(2)}h
                                                </Lozenge>
                                            </Cell>
                                            <Cell width={200}>
                                                {ticket.date ? new Date(ticket.date).toLocaleDateString() : 'N/A'}
                                            </Cell>
                                        </Row>
                                    )}
                                />
                            </TableTree>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            appearance="primary" 
                            onClick={closeModal}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </ModalTransition>
    );
};


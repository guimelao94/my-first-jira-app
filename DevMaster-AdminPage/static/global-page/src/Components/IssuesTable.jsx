import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { convertToHours } from '../Utils/ConversionTools';
import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import './IssuesTable.css';
import Lozenge from '@atlaskit/lozenge';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import CheckIcon from '@atlaskit/icon/glyph/check'
import { ViewIssueModal } from '@forge/jira-bridge';

export const IssuesTable = ({ developers, issues, EpicKey }) => {
    console.log(developers);
    console.log(issues);
    const epics = useSelector((state) => {
        return state.epics;
    })
    const currentEpic = epics.data.find(x => x.EpicKey == EpicKey);
    const StackStyle = xcss({ textAlign: 'center' });
    const HeaderStyle = xcss({ justifyContent: 'center' });

    var viewIssueModal = null;

    const sumOverflowHours = (overflowTime, dev) => {
        console.log(overflowTime);
        console.log(dev);
        var time = overflowTime.filter(x => x.Developer.FullName == dev).reduce((total, item) => total + (item['TimeSpent'] || 0), 0)
        console.log(time);
        return time;
    }
    if (issues.some(z => z.ticketNumber == 'DMA-5')) {
        console.log(issues.filter(z => z.ticketNumber == 'DMA-5'));
        console.log(issues.filter(z => z.ticketNumber == 'DMA-5')[0].worklogs.find(x => x.Developer == 'Julius Cesar'));
    }

    useEffect(() => {
        console.log(currentEpic);
    }, [epics.AllDevStacksLoaded])

    return (
        <div style={{marginTop:"15px"}}>
            <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={160}>Ticket #</Header>
                    {developers.map((developer) => (
                        <Header width={145} className={currentEpic.DevStack && currentEpic.DevStack.some(d => d.FullName == developer.FullName && d.OnTrack == "Off Track") ? "DevOffTrack" : ""}>
                            {developer.ShortName}
                            <span style={{ marginLeft: '.3em' }}><Lozenge appearance="new">{convertToHours(developer.RemainingWork)}</Lozenge></span>
                        </Header>
                    ))}
                </Headers>
                <Rows
                    items={issues}
                    render={({ ticketNumber, dev, remainingTime, overflowTime, worklogs, idx, assignee, status, isCompleted }) => (
                        <Row
                            items={[]}
                            hasChildren={false}
                            isDefaultExpanded
                        >
                            <Cell>
                                <Inline>
                                    <AvatarItem
                                        avatar={<Avatar name={assignee.FullName} src={assignee.AvatarUrl} size='small' />}
                                        primaryText={ticketNumber}
                                        onClick={()=>{
                                            viewIssueModal = new ViewIssueModal({
                                                onClose: () => {
                                                  console.log('ViewIssueModal closed');
                                                },
                                                context: {
                                                  issueKey: ticketNumber,
                                                },
                                              });
                                              
                                              viewIssueModal.open();
                                        }}
                                    />
                                    {isCompleted &&
                                        <Box xcss={xcss({ color: 'color.text.success' })}>
                                            <CheckIcon label="" size="large" />
                                        </Box>
                                    }
                                </Inline>

                                <Lozenge appearance="success" isBold>{status}</Lozenge>
                            </Cell>
                            {developers.map((developer) => (
                                <Cell className={currentEpic.DevStack && currentEpic.DevStack.some(d => d.FullName == developer.FullName && d.OnTrack == "Off Track") ? "DevOffTrack" : ""}>
                                    <Inline>
                                        {developer.FullName == dev.FullName && <span style={{ paddingRight: '5px' }}><Lozenge appearance="new">{convertToHours(developer.FullName == dev.FullName ? remainingTime : 0)}</Lozenge></span>}
                                        {worklogs.some(x => x.Developer == developer.FullName) && <span style={{ paddingRight: '5px' }}><Lozenge style={{ paddingRight: '.5em' }}>{convertToHours(worklogs.length > 0 ? worklogs.find(x => x.Developer == developer.FullName)?.TimeSpent : 0)}</Lozenge></span>}
                                        {((overflowTime && overflowTime.length > 0 && overflowTime.some(x => x.Developer.FullName == developer.FullName))) && <span><Lozenge appearance="inprogress">{convertToHours(overflowTime && overflowTime.length > 0 && overflowTime.some(x => x.Developer.FullName == developer.FullName) ? sumOverflowHours(overflowTime, developer.FullName) : 0)}</Lozenge></span>}
                                    </Inline>
                                </Cell>

                            ))
                            }
                        </Row>
                    )}
                />
            </TableTree>
        </div>
    );
}
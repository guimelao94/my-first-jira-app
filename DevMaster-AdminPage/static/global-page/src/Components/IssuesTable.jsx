import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import { convertToHours } from '../Utils/ConversionTools';
import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import './IssuesTable.css';
import Lozenge from '@atlaskit/lozenge';
import { useSelector } from 'react-redux';
import { useEffect, memo, useMemo, useCallback } from 'react';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import CheckIcon from '@atlaskit/icon/glyph/check'
import { ViewIssueModal } from '@forge/jira-bridge';

export const IssuesTable = memo(({ developers, issues, EpicKey }) => {
    const data = useSelector((state) => state.epics.data);
    const allDevStacksLoaded = useSelector((state) => state.epics.AllDevStacksLoaded);
    
    const currentEpic = useMemo(() => {
        return data?.find(x => x.EpicKey === EpicKey);
    }, [data, EpicKey]);

    const sumOverflowHours = useCallback((overflowTime, dev) => {
        if (!overflowTime || !Array.isArray(overflowTime)) return 0;
        return overflowTime
            .filter(x => x.Developer?.FullName === dev)
            .reduce((total, item) => total + (item.TimeSpent || 0), 0);
    }, []);

    return (
        <div style={{marginTop:"15px"}}>
            <TableTree label="Automatically controlled row expansion">
                <Headers>
                    <Header width={160}>Ticket #</Header>
                    {developers?.map((developer) => (
                        <Header 
                            key={developer.FullName}
                            width={145} 
                            className={currentEpic?.DevStack?.some(d => d.FullName === developer.FullName && d.OnTrack === "Off Track") ? "DevOffTrack" : ""}
                        >
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
                                            const modal = new ViewIssueModal({
                                                onClose: () => {
                                                  // Modal closed
                                                },
                                                context: {
                                                  issueKey: ticketNumber,
                                                },
                                              });
                                              
                                            modal.open();
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
                                <Cell className={currentEpic?.DevStack?.some(d => d.FullName === developer.FullName && d.OnTrack === "Off Track") ? "DevOffTrack" : ""}>
                                    <Inline>
                                        {developer.FullName === dev.FullName && (
                                            <span style={{ paddingRight: '5px' }}>
                                                <Lozenge appearance="new">{convertToHours(remainingTime)}</Lozenge>
                                            </span>
                                        )}
                                        {worklogs?.some(x => x.Developer === developer.FullName) && (
                                            <span style={{ paddingRight: '5px' }}>
                                                <Lozenge style={{ paddingRight: '.5em' }}>
                                                    {convertToHours(worklogs.find(x => x.Developer === developer.FullName)?.TimeSpent || 0)}
                                                </Lozenge>
                                            </span>
                                        )}
                                        {overflowTime?.some(x => x.Developer?.FullName === developer.FullName) && (
                                            <span>
                                                <Lozenge appearance="inprogress">
                                                    {convertToHours(sumOverflowHours(overflowTime, developer.FullName))}
                                                </Lozenge>
                                            </span>
                                        )}
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
});
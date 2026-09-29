import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import { ViewIssueModal } from '@forge/jira-bridge';
import { convertToHours } from '../Utils/ConversionTools';

const blockStyles = xcss({
    marginBottom: 'space.200',
    border: '1px solid',
    borderColor: 'color.border',
    borderRadius: 'border.radius',
    backgroundColor: 'elevation.surface'
});

const headerStyles = xcss({
    padding: 'space.150',
    borderRadius: 'border.radius',
    backgroundColor: 'color.background.neutral',
    marginBottom: 'space.100'
});

const rowStyles = xcss({
    paddingBlock: 'space.100',
    paddingInline: 'space.150',
    borderTop: '1px solid',
    borderColor: 'color.border'
});

const ticketRowStyles = xcss({
    paddingBlock: 'space.050',
    paddingInline: 'space.100'
});

const openTicket = (ticketNumber) => {
    const modal = new ViewIssueModal({
        onClose: () => {},
        context: { issueKey: ticketNumber }
    });
    modal.open();
};

const TicketLink = ({ ticketNumber }) => (
    <span
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', color: '#0052CC', textDecoration: 'underline', fontWeight: 'bold' }}
        onClick={() => openTicket(ticketNumber)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') openTicket(ticketNumber);
        }}
    >
        {ticketNumber}
    </span>
);

export const PeerReviewSummary = memo(function PeerReviewSummary() {
    const data = useSelector((state) => state.epics.data);
    const loaded = useSelector((state) => state.epics.loaded);

    // Reviewer load (grouped by reviewer) + tickets missing a reviewer.
    const { reviewerGroups, missingByEpic, totalReviewSeconds } = useMemo(() => {
        const reviewers = new Map(); // accountId||name -> { name, avatarUrl, tickets: [] }
        const missing = new Map(); // epicKey -> { epicName, tickets: [] }
        let totalSeconds = 0;

        if (Array.isArray(data)) {
            for (const epic of data) {
                if (!epic || !Array.isArray(epic.Issues)) continue;

                for (const issue of epic.Issues) {
                    const estimate = issue?.peerReviewEstimate || 0;
                    const reviewer = issue?.peerReviewer;

                    // Only care about tickets that actually carry a peer-review estimate.
                    if (estimate <= 0) continue;
                    totalSeconds += estimate;

                    const ticket = {
                        ticketNumber: issue.ticketNumber,
                        epicKey: epic.EpicKey,
                        epicName: epic.Summary || epic.EpicKey,
                        seconds: estimate,
                        status: issue.status
                    };

                    if (reviewer && reviewer.FullName) {
                        const key = reviewer.AccountID || reviewer.FullName;
                        const entry = reviewers.get(key) || {
                            name: reviewer.FullName,
                            avatarUrl: reviewer.AvatarUrl,
                            tickets: []
                        };
                        entry.tickets.push(ticket);
                        reviewers.set(key, entry);
                    } else {
                        const entry = missing.get(epic.EpicKey) || {
                            epicName: epic.Summary || epic.EpicKey,
                            epicKey: epic.EpicKey,
                            tickets: []
                        };
                        entry.tickets.push(ticket);
                        missing.set(epic.EpicKey, entry);
                    }
                }
            }
        }

        const reviewerGroupsArr = Array.from(reviewers.values())
            .map((r) => ({
                ...r,
                tickets: r.tickets.sort((a, b) => b.seconds - a.seconds),
                totalSeconds: r.tickets.reduce((sum, t) => sum + t.seconds, 0),
                ticketCount: r.tickets.length
            }))
            .sort((a, b) => b.totalSeconds - a.totalSeconds);

        const missingArr = Array.from(missing.values())
            .map((e) => ({
                ...e,
                tickets: e.tickets.sort((a, b) => b.seconds - a.seconds),
                totalSeconds: e.tickets.reduce((sum, t) => sum + t.seconds, 0),
                ticketCount: e.tickets.length
            }))
            .sort((a, b) => b.totalSeconds - a.totalSeconds);

        return {
            reviewerGroups: reviewerGroupsArr,
            missingByEpic: missingArr,
            totalReviewSeconds: totalSeconds
        };
    }, [data]);

    const missingCount = useMemo(
        () => missingByEpic.reduce((sum, e) => sum + e.ticketCount, 0),
        [missingByEpic]
    );

    return (
        <div style={{ marginTop: '24px', width: '100%', maxWidth: '100%' }}>
            <Box xcss={xcss({ display: 'flex', alignItems: 'center', gap: 'space.150' })}>
                <h2 style={{ fontWeight: 'bold', margin: 0 }}>Peer Review Load</h2>
                {loaded && totalReviewSeconds > 0 && (
                    <Lozenge appearance="inprogress" isBold>
                        {convertToHours(totalReviewSeconds)} total
                    </Lozenge>
                )}
                {loaded && missingCount > 0 && (
                    <Lozenge appearance="removed" isBold>
                        {missingCount} missing reviewer
                    </Lozenge>
                )}
            </Box>
            <p style={{ margin: '4px 0 0 0', color: '#6B778C' }}>
                Peer-review time estimates (parsed from each ticket's Development Plan), grouped by the
                assigned Peer Review reviewer. Estimates are best-effort and may miss non-standard formats.
            </p>

            {!loaded ? (
                <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                    <Spinner size="medium" />
                </Box>
            ) : reviewerGroups.length === 0 && missingByEpic.length === 0 ? (
                <Box xcss={xcss({ marginTop: 'space.200', padding: 'space.200', textAlign: 'center' })}>
                    <p style={{ margin: 0, color: '#6B778C' }}>
                        No peer-review estimates found on the selected epics.
                    </p>
                </Box>
            ) : (
                <Box xcss={xcss({ marginTop: 'space.200' })}>
                    {/* Load per reviewer */}
                    {reviewerGroups.map((reviewer) => (
                        <Box key={reviewer.name} xcss={blockStyles}>
                            <Box xcss={headerStyles}>
                                <Inline space="space.150" alignBlock="center" spread="space-between">
                                    <AvatarItem
                                        avatar={<Avatar name={reviewer.name} src={reviewer.avatarUrl} size="small" />}
                                        primaryText={reviewer.name}
                                        secondaryText={`${reviewer.ticketCount} ticket${reviewer.ticketCount !== 1 ? 's' : ''} to review`}
                                    />
                                    <Lozenge appearance="inprogress" isBold>
                                        {convertToHours(reviewer.totalSeconds)}
                                    </Lozenge>
                                </Inline>
                            </Box>
                            <Stack space="space.050" xcss={xcss({ paddingBlock: 'space.100' })}>
                                {reviewer.tickets.map((ticket) => (
                                    <Box key={ticket.ticketNumber} xcss={ticketRowStyles}>
                                        <Inline space="space.100" alignBlock="center">
                                            <TicketLink ticketNumber={ticket.ticketNumber} />
                                            <Lozenge appearance="inprogress">{convertToHours(ticket.seconds)}</Lozenge>
                                            <span style={{ color: '#6B778C', fontSize: '12px' }}>{ticket.epicName}</span>
                                            {ticket.status && <Lozenge appearance="new">{ticket.status}</Lozenge>}
                                        </Inline>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    ))}

                    {/* Tickets missing a reviewer */}
                    {missingByEpic.length > 0 && (
                        <Box xcss={blockStyles}>
                            <Box xcss={xcss({ padding: 'space.150', backgroundColor: 'color.background.danger', marginBottom: 'space.100', borderRadius: 'border.radius' })}>
                                <Inline space="space.100" alignBlock="center" spread="space-between">
                                    <strong>Missing Peer Reviewer</strong>
                                    <Lozenge appearance="removed" isBold>
                                        {missingCount} ticket{missingCount !== 1 ? 's' : ''}
                                    </Lozenge>
                                </Inline>
                            </Box>
                            {missingByEpic.map((epic) => (
                                <Box key={epic.epicKey} xcss={rowStyles}>
                                    <Inline space="space.100" alignBlock="center">
                                        <strong>{epic.epicName}</strong>
                                        <span style={{ color: '#6B778C', fontSize: '12px' }}>{epic.epicKey}</span>
                                        <Lozenge appearance="inprogress">{convertToHours(epic.totalSeconds)}</Lozenge>
                                    </Inline>
                                    <Stack space="space.050" xcss={xcss({ marginTop: 'space.100' })}>
                                        {epic.tickets.map((ticket) => (
                                            <Box key={ticket.ticketNumber} xcss={ticketRowStyles}>
                                                <Inline space="space.100" alignBlock="center">
                                                    <TicketLink ticketNumber={ticket.ticketNumber} />
                                                    <Lozenge appearance="inprogress">{convertToHours(ticket.seconds)}</Lozenge>
                                                    {ticket.status && <Lozenge appearance="new">{ticket.status}</Lozenge>}
                                                </Inline>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </div>
    );
});

PeerReviewSummary.displayName = 'PeerReviewSummary';

export default PeerReviewSummary;

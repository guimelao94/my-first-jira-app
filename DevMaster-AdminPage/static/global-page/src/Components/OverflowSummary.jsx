import React, { memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Inline, Stack, xcss } from '@atlaskit/primitives';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import { ViewIssueModal } from '@forge/jira-bridge';
import { convertToHours } from '../Utils/ConversionTools';

// Flag tickets whose remaining time is negative beyond this threshold. A negative
// remaining time means time spent exceeded the estimate; if the developer had logged
// an overflow entry it would have cancelled the negative back toward zero. Tickets sitting
// below -0.9h therefore indicate a forgotten overflow entry. (-0.9h in seconds.)
const NEGATIVE_REMAINING_THRESHOLD_SECONDS = -0.9 * 3600;

const epicHeaderStyles = xcss({
    padding: 'space.150',
    borderRadius: 'border.radius',
    backgroundColor: 'color.background.neutral',
    marginBottom: 'space.100'
});

const devRowStyles = xcss({
    paddingBlock: 'space.100',
    paddingInline: 'space.150',
    borderTop: '1px solid',
    borderColor: 'color.border'
});

const ticketRowStyles = xcss({
    paddingBlock: 'space.050',
    paddingInline: 'space.100'
});

const epicBlockStyles = xcss({
    marginBottom: 'space.200',
    border: '1px solid',
    borderColor: 'color.border',
    borderRadius: 'border.radius',
    backgroundColor: 'elevation.surface'
});

const openTicket = (ticketNumber) => {
    const modal = new ViewIssueModal({
        onClose: () => {},
        context: { issueKey: ticketNumber }
    });
    modal.open();
};

const normalizeName = (name) => (name || '').trim().toLowerCase();

export const OverflowSummary = memo(function OverflowSummary({ filterByCurrentUser = false }) {
    const data = useSelector((state) => state.epics.data);
    const loaded = useSelector((state) => state.epics.loaded);
    const developers = useSelector((state) => state.epics.Developers);
    const currentUser = useSelector((state) => state.epics.currentUser);

    // Collapsed by default; expand on demand.
    const [expanded, setExpanded] = useState(false);

    // Map developer FullName -> avatar url for nicer display.
    const avatarByDev = useMemo(() => {
        const map = new Map();
        if (Array.isArray(developers)) {
            for (const dev of developers) {
                if (dev?.FullName) map.set(dev.FullName, dev.AvatarUrl);
            }
        }
        return map;
    }, [developers]);

    // Build epic -> developer -> tickets structure, filtered to tickets whose remaining
    // time is negative beyond -0.9h (i.e., likely missing an overflow entry).
    const epicGroups = useMemo(() => {
        if (!Array.isArray(data)) return [];

        const groups = [];

        for (const epic of data) {
            if (!epic || !Array.isArray(epic.Issues)) continue;

            const devMap = new Map(); // developerName -> [{ ticketNumber, remainingSeconds, status, avatarUrl }]

            for (const issue of epic.Issues) {
                const remainingSeconds = issue?.remainingTime;
                if (typeof remainingSeconds !== 'number') continue;
                if (remainingSeconds >= NEGATIVE_REMAINING_THRESHOLD_SECONDS) continue;

                // Attribute to the assigned developer (custom field), falling back to the Jira assignee.
                const devName =
                    issue?.dev?.FullName ||
                    issue?.assignee?.FullName ||
                    'Unassigned';
                const avatarUrl = avatarByDev.get(devName) || issue?.assignee?.AvatarUrl;

                // When scoped to a developer, only include tickets attributed to the current user.
                if (filterByCurrentUser) {
                    const myAccountId = currentUser?.accountId;
                    const myName = normalizeName(currentUser?.displayName);
                    const issueAccountId = issue?.dev?.AccountID;
                    const issueName = normalizeName(issue?.dev?.FullName || issue?.assignee?.FullName);
                    const isMine =
                        (myAccountId && issueAccountId && issueAccountId === myAccountId) ||
                        (myName && issueName && issueName === myName);
                    if (!isMine) continue;
                }

                const list = devMap.get(devName) || [];
                list.push({
                    ticketNumber: issue.ticketNumber,
                    remainingSeconds,
                    status: issue.status,
                    avatarUrl
                });
                devMap.set(devName, list);
            }

            if (devMap.size === 0) continue;

            const devGroups = Array.from(devMap.entries())
                .map(([developer, tickets]) => ({
                    developer,
                    avatarUrl: tickets.find((t) => t.avatarUrl)?.avatarUrl,
                    // Most negative first (largest deficit at the top).
                    tickets: tickets.sort((a, b) => a.remainingSeconds - b.remainingSeconds),
                    totalDeficitSeconds: tickets.reduce((sum, t) => sum + t.remainingSeconds, 0),
                    ticketCount: tickets.length
                }))
                .sort((a, b) => a.totalDeficitSeconds - b.totalDeficitSeconds);

            groups.push({
                epicKey: epic.EpicKey,
                epicName: epic.Summary || epic.EpicKey,
                devGroups,
                totalDeficitSeconds: devGroups.reduce((sum, d) => sum + d.totalDeficitSeconds, 0),
                ticketCount: devGroups.reduce((sum, d) => sum + d.ticketCount, 0)
            });
        }

        // Epics with the largest total deficit (most negative) first.
        return groups.sort((a, b) => a.totalDeficitSeconds - b.totalDeficitSeconds);
    }, [data, avatarByDev, filterByCurrentUser, currentUser]);

    const totalTickets = useMemo(
        () => epicGroups.reduce((sum, e) => sum + e.ticketCount, 0),
        [epicGroups]
    );

    return (
        <div style={{ marginTop: '24px', width: '100%', maxWidth: '100%' }}>
            <Box
                role="button"
                tabIndex={0}
                onClick={() => setExpanded((v) => !v)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v);
                }}
                xcss={xcss({ display: 'flex', alignItems: 'center', gap: 'space.150', cursor: 'pointer' })}
            >
                <span style={{ color: '#6B778C', fontSize: '12px', width: '12px', display: 'inline-block' }}>
                    {expanded ? '▾' : '▸'}
                </span>
                <h2 style={{ fontWeight: 'bold', margin: 0 }}>
                    {filterByCurrentUser ? 'My Missing Overflow' : 'Missing Overflow Review'}
                </h2>
                {loaded && totalTickets > 0 && (
                    <Lozenge appearance="removed" isBold>
                        {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                    </Lozenge>
                )}
            </Box>

            {expanded && (
            <>
            <p style={{ margin: '4px 0 0 0', color: '#6B778C' }}>
                {filterByCurrentUser
                    ? 'Your tickets with more than 0.9h of negative remaining time. A negative remaining time usually means an overflow entry was forgotten.'
                    : 'Tickets with more than 0.9h of negative remaining time, grouped by epic and developer. A negative remaining time usually means an overflow entry was forgotten.'}
            </p>

            {!loaded ? (
                <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                    <Spinner size="medium" />
                </Box>
            ) : epicGroups.length === 0 ? (
                <Box xcss={xcss({ marginTop: 'space.200', padding: 'space.200', textAlign: 'center' })}>
                    <p style={{ margin: 0, color: '#6B778C' }}>
                        No tickets with significant negative remaining time. You're all caught up.
                    </p>
                </Box>
            ) : (
                <Box xcss={xcss({ marginTop: 'space.200' })}>
                    {epicGroups.map((epic) => (
                        <Box key={epic.epicKey} xcss={epicBlockStyles}>
                            <Box xcss={epicHeaderStyles}>
                                <Inline space="space.150" alignBlock="center" spread="space-between">
                                    <Inline space="space.100" alignBlock="center">
                                        <strong>{epic.epicName}</strong>
                                        <span style={{ color: '#6B778C', fontSize: '12px' }}>{epic.epicKey}</span>
                                    </Inline>
                                    <Inline space="space.100" alignBlock="center">
                                        <Lozenge appearance="default">
                                            {epic.ticketCount} ticket{epic.ticketCount !== 1 ? 's' : ''}
                                        </Lozenge>
                                        <Lozenge appearance="removed" isBold>
                                            {convertToHours(epic.totalDeficitSeconds)} remaining
                                        </Lozenge>
                                    </Inline>
                                </Inline>
                            </Box>

                            {epic.devGroups.map((dev) => (
                                <Box key={dev.developer} xcss={devRowStyles}>
                                    <Inline space="space.150" alignBlock="center" spread="space-between">
                                        <AvatarItem
                                            avatar={<Avatar name={dev.developer} src={dev.avatarUrl} size="small" />}
                                            primaryText={dev.developer}
                                            secondaryText={`${dev.ticketCount} ticket${dev.ticketCount !== 1 ? 's' : ''} · ${convertToHours(dev.totalDeficitSeconds)} remaining`}
                                        />
                                    </Inline>

                                    <Stack space="space.050" xcss={xcss({ marginTop: 'space.100' })}>
                                        {dev.tickets.map((ticket) => (
                                            <Box key={ticket.ticketNumber} xcss={ticketRowStyles}>
                                                <Inline space="space.100" alignBlock="center">
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        style={{
                                                            cursor: 'pointer',
                                                            color: '#0052CC',
                                                            textDecoration: 'underline',
                                                            fontWeight: 'bold'
                                                        }}
                                                        onClick={() => openTicket(ticket.ticketNumber)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') openTicket(ticket.ticketNumber);
                                                        }}
                                                    >
                                                        {ticket.ticketNumber}
                                                    </span>
                                                    <Lozenge appearance="removed">
                                                        {convertToHours(ticket.remainingSeconds)} remaining
                                                    </Lozenge>
                                                    <span style={{ color: '#6B778C', fontSize: '12px' }}>
                                                        add {convertToHours(-ticket.remainingSeconds)} overflow
                                                    </span>
                                                    {ticket.status && (
                                                        <Lozenge appearance="new">{ticket.status}</Lozenge>
                                                    )}
                                                </Inline>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            )}
            </>
            )}
        </div>
    );
});

OverflowSummary.displayName = 'OverflowSummary';

export default OverflowSummary;

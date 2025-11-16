import React, { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box, Stack, xcss } from '@atlaskit/primitives';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Lozenge from '@atlaskit/lozenge';
import { convertToHours } from '../Utils/ConversionTools';
import { TicketDetailsModal } from './TicketDetailsModal';

// Helper function to check if a date is a weekend
const isWeekend = (date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
};

// Helper function to check if today is Monday
const isTodayMonday = () => {
    const today = new Date();
    return today.getDay() === 1; // 1 is Monday
};

// Helper function to get the previous business day (skipping weekends and holidays)
const getPreviousBusinessDay = (holidays = []) => {
    const today = new Date();
    let previousDay = new Date(today);
    previousDay.setDate(previousDay.getDate() - 1);
    
    // Keep going back until we find a business day (not weekend and not holiday)
    while (isWeekend(previousDay) || (holidays && holidays.includes(previousDay.toISOString().substring(0, 10)))) {
        previousDay.setDate(previousDay.getDate() - 1);
    }
    
    return previousDay;
};

// Helper function to get dates to include (Friday, Saturday, Sunday if Monday, otherwise just previous business day)
const getDatesToInclude = (holidays = []) => {
    const today = new Date();
    const dates = [];
    
    if (isTodayMonday()) {
        // If Monday, include Friday, Saturday, and Sunday
        const friday = new Date(today);
        friday.setDate(friday.getDate() - 3); // Friday (3 days before Monday)
        dates.push(friday);
        
        const saturday = new Date(today);
        saturday.setDate(saturday.getDate() - 2); // Saturday (2 days before Monday)
        dates.push(saturday);
        
        const sunday = new Date(today);
        sunday.setDate(sunday.getDate() - 1); // Sunday (1 day before Monday)
        dates.push(sunday);
    } else {
        // Otherwise, just the previous business day
        dates.push(getPreviousBusinessDay(holidays));
    }
    
    return dates;
};

// Helper function to check if a date is in the dates to include
const isIncludedDate = (dateString, holidays = []) => {
    if (!dateString) return false;
    
    // Handle both YYYY-MM-DD format (from Date field) and ISO string format (from TimeStamp)
    let worklogDate;
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format - parse directly
        const [year, month, day] = dateString.split('-').map(Number);
        worklogDate = new Date(year, month - 1, day);
    } else {
        // ISO string or other format
        worklogDate = new Date(dateString);
    }
    
    if (isNaN(worklogDate.getTime())) return false;
    
    const datesToInclude = getDatesToInclude(holidays);
    
    // Check if the worklog date matches any of the dates to include
    return datesToInclude.some(date => 
        worklogDate.getFullYear() === date.getFullYear() &&
        worklogDate.getMonth() === date.getMonth() &&
        worklogDate.getDate() === date.getDate()
    );
};

export const TotalRemainingTimePerDev = () => {
    const data = useSelector((state) => state.epics.data);
    const issues = useSelector((state) => state.epics.issues);
    const holidays = useSelector((state) => state.epics.Holidays);
    const allDevStacksLoaded = useSelector((state) => state.epics.AllDevStacksLoaded);
    const loaded = useSelector((state) => state.epics.loaded);
    
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null, // 'timeSpent' or 'overflow'
        developerAccountId: null,
        developerName: null,
    });

    // Aggregate remaining time per developer across all epics
    const devTotals = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }

        // Create a map to aggregate time per developer
        const devMap = new Map();

        // First, aggregate from epic developers (for remaining work and overflow)
        data.forEach((epic) => {
            if (!epic.Developers || !Array.isArray(epic.Developers)) {
                return;
            }

            epic.Developers.forEach((dev) => {
                if (!dev.FullName) {
                    return;
                }

                const existing = devMap.get(dev.FullName) || {
                    FullName: dev.FullName,
                    ShortName: dev.ShortName || '',
                    AccountID: dev.AccountID || '',
                    TotalRemainingWork: 0,
                    TotalOverflowTime: 0,
                    TotalTimeSpent: 0,
                    YesterdayTimeSpent: 0, // Time spent from previous business day's worklogs
                    YesterdayOverflowTime: 0, // Overflow time from previous business day
                };

                existing.TotalRemainingWork += dev.RemainingWork || 0;
                existing.TotalOverflowTime += dev.OverflowTime || 0;
                existing.TotalTimeSpent += dev.TimeSpent || 0;
                if (dev.AccountID && !existing.AccountID) {
                    existing.AccountID = dev.AccountID;
                }

                devMap.set(dev.FullName, existing);
            });
        });

        // Create a map by AccountID for faster lookup
        const devMapByAccountId = new Map();
        devMap.forEach((dev, fullName) => {
            if (dev.AccountID) {
                devMapByAccountId.set(dev.AccountID, dev);
            }
        });

        // Now, calculate yesterday's time spent and overflow from worklogs and overflowTime
        if (issues && Array.isArray(issues) && issues.length > 0) {
            issues.forEach((issue) => {
                // Calculate previous business day's time spent from worklogs
                if (issue.fullWorklogs && Array.isArray(issue.fullWorklogs)) {
                    // Filter worklogs from included dates (Friday, Saturday, Sunday if Monday, otherwise previous business day)
                    const previousBusinessDayWorklogs = issue.fullWorklogs.filter(worklog => 
                        isIncludedDate(worklog.created, holidays) || isIncludedDate(worklog.started, holidays)
                    );

                    // Aggregate by accountID
                    previousBusinessDayWorklogs.forEach(worklog => {
                        // Try both accountId and accountID (Jira API might use either)
                        const accountId = worklog.accountId || worklog.accountID;
                        if (!accountId) return;

                        // Find developer by accountID
                        const devEntry = devMapByAccountId.get(accountId);

                        if (devEntry) {
                            devEntry.YesterdayTimeSpent += worklog.timeSpentSeconds || 0;
                        }
                    });
                }

                // Calculate previous business day's overflow time
                if (issue.overflowTime && Array.isArray(issue.overflowTime)) {
                    issue.overflowTime.forEach(overflowItem => {
                        if (!overflowItem.Developer || !overflowItem.Developer.AccountID) return;

                        // Check if overflow Date or TimeStamp is from included dates
                        let overflowDateString = null;
                        if (overflowItem.Date) {
                            // Use Date field if available (new format)
                            overflowDateString = overflowItem.Date;
                        } else if (overflowItem.TimeStamp) {
                            // Fallback to TimeStamp for backward compatibility
                            const overflowDate = new Date(overflowItem.TimeStamp);
                            if (!isNaN(overflowDate.getTime())) {
                                overflowDateString = overflowDate.toISOString();
                            }
                        }

                        if (overflowDateString && isIncludedDate(overflowDateString, holidays)) {
                            // Find developer by accountID
                            const devEntry = devMapByAccountId.get(overflowItem.Developer.AccountID);

                            if (devEntry && overflowItem.TimeSpent) {
                                devEntry.YesterdayOverflowTime += overflowItem.TimeSpent || 0;
                            }
                        }
                    });
                }
            });
        }

        // Convert map to array and calculate hours
        return Array.from(devMap.values())
            .map((dev) => ({
                ...dev,
                RemainingHours: dev.TotalRemainingWork / 3600,
                YesterdayOverflowHours: dev.YesterdayOverflowTime / 3600,
                TimeSpentHours: dev.TotalTimeSpent / 3600,
                YesterdayTimeSpentHours: dev.YesterdayTimeSpent / 3600,
            }))
            .sort((a, b) => b.RemainingHours - a.RemainingHours); // Sort by remaining hours descending
    }, [data, issues, holidays]);

    // Get tickets for the selected developer and type
    const modalTickets = useMemo(() => {
        if (!modalState.isOpen || !modalState.developerAccountId || !issues || !Array.isArray(issues)) {
            return [];
        }

        const tickets = [];

        issues.forEach((issue) => {
            if (modalState.type === 'timeSpent') {
                // Get worklogs for this developer from included dates
                if (issue.fullWorklogs && Array.isArray(issue.fullWorklogs)) {
                    const relevantWorklogs = issue.fullWorklogs.filter(worklog => {
                        const accountId = worklog.accountId || worklog.accountID;
                        if (accountId !== modalState.developerAccountId) return false;
                        
                        return isIncludedDate(worklog.created, holidays) || isIncludedDate(worklog.started, holidays);
                    });

                    if (relevantWorklogs.length > 0) {
                        const totalSeconds = relevantWorklogs.reduce((sum, wl) => sum + (wl.timeSpentSeconds || 0), 0);
                        tickets.push({
                            ticketNumber: issue.ticketNumber,
                            epicKey: issue.EpicKey,
                            hours: totalSeconds / 3600,
                            date: relevantWorklogs[0].created || relevantWorklogs[0].started,
                        });
                    }
                }
            } else if (modalState.type === 'overflow') {
                // Get overflow entries for this developer from included dates
                if (issue.overflowTime && Array.isArray(issue.overflowTime)) {
                    const relevantOverflow = issue.overflowTime.filter(overflowItem => {
                        if (!overflowItem.Developer || overflowItem.Developer.AccountID !== modalState.developerAccountId) {
                            return false;
                        }
                        
                        // Check Date field first (new format), then TimeStamp (backward compatibility)
                        let overflowDateString = null;
                        if (overflowItem.Date) {
                            overflowDateString = overflowItem.Date;
                        } else if (overflowItem.TimeStamp) {
                            const overflowDate = new Date(overflowItem.TimeStamp);
                            if (!isNaN(overflowDate.getTime())) {
                                overflowDateString = overflowDate.toISOString();
                            }
                        }
                        
                        return overflowDateString && isIncludedDate(overflowDateString, holidays);
                    });

                    if (relevantOverflow.length > 0) {
                        const totalSeconds = relevantOverflow.reduce((sum, of) => sum + (of.TimeSpent || 0), 0);
                        // Use Date field if available, otherwise TimeStamp
                        const overflowDate = relevantOverflow[0].Date || relevantOverflow[0].TimeStamp;
                        tickets.push({
                            ticketNumber: issue.ticketNumber,
                            epicKey: issue.EpicKey,
                            hours: totalSeconds / 3600,
                            date: overflowDate,
                        });
                    }
                }
            }
        });

        return tickets.sort((a, b) => b.hours - a.hours); // Sort by hours descending
    }, [modalState, issues, holidays]);

    const handleOpenModal = useCallback((type, developerAccountId, developerName) => {
        setModalState({
            isOpen: true,
            type,
            developerAccountId,
            developerName,
        });
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalState({
            isOpen: false,
            type: null,
            developerAccountId: null,
            developerName: null,
        });
    }, []);

    // Don't render if data isn't loaded or no developers found
    if (!loaded || !allDevStacksLoaded || devTotals.length === 0) {
        return null;
    }

    const containerStyles = xcss({
        padding: 'space.200',
        marginTop: 'space.300',
        marginBottom: 'space.300',
        backgroundColor: 'color.background.neutral.subtle',
        borderRadius: 'border.radius',
        borderWidth: 'border.width',
        borderColor: 'color.border',
    });

    return (
        <Box xcss={containerStyles}>
            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                <h3 style={{ fontWeight: 'bold', margin: 0 }}>Total Remaining Time Per Developer</h3>
                <p style={{ margin: '0.5em 0 0 0', color: 'color.text.subtle', fontSize: '0.9em' }}>
                    Aggregated remaining time across all selected epics
                </p>
            </Box>
            <TableTree label="Total Remaining Time Per Developer">
                <Headers>
                    <Header width={200}>Developer</Header>
                    <Header width={150}>Remaining Hours</Header>
                    <Header width={150}>Time Spent (Last Business Day)</Header>
                    <Header width={150}>Overflow Hours (Last Business Day)</Header>
                </Headers>
                <Rows
                    items={devTotals}
                    render={(dev) => (
                        <Row
                            items={[]}
                            hasChildren={false}
                            isDefaultExpanded
                        >
                            <Cell width={200}>
                                <Box xcss={xcss({ fontWeight: 'medium' })}>
                                    {dev.ShortName || dev.FullName}
                                </Box>
                            </Cell>
                            <Cell width={150}>
                                <Lozenge appearance="new">
                                    {dev.RemainingHours.toFixed(2)}h
                                </Lozenge>
                            </Cell>
                            <Cell width={150}>
                                <Box 
                                    xcss={xcss({ cursor: 'pointer' })}
                                    onClick={() => dev.YesterdayTimeSpentHours > 0 && handleOpenModal('timeSpent', dev.AccountID, dev.ShortName || dev.FullName)}
                                >
                                    <Lozenge appearance="default">
                                        {dev.YesterdayTimeSpentHours.toFixed(2)}h
                                    </Lozenge>
                                </Box>
                            </Cell>
                            <Cell width={150}>
                                {dev.YesterdayOverflowHours > 0 ? (
                                    <Box 
                                        xcss={xcss({ cursor: 'pointer' })}
                                        onClick={() => handleOpenModal('overflow', dev.AccountID, dev.ShortName || dev.FullName)}
                                    >
                                        <Lozenge appearance="inprogress">
                                            {dev.YesterdayOverflowHours.toFixed(2)}h
                                        </Lozenge>
                                    </Box>
                                ) : (
                                    <span>0.00h</span>
                                )}
                            </Cell>
                        </Row>
                    )}
                />
            </TableTree>
            <TicketDetailsModal
                isOpen={modalState.isOpen}
                closeModal={handleCloseModal}
                tickets={modalTickets}
                developerName={modalState.developerName || ''}
                type={modalState.type}
            />
        </Box>
    );
};


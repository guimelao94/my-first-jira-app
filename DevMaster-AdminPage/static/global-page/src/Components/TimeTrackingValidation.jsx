import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Box, xcss } from '@atlaskit/primitives';
import TableTree, { Cell, Header, Headers, Row, Rows } from '@atlaskit/table-tree';
import Lozenge from '@atlaskit/lozenge';
import Button from '@atlaskit/button/new';
import Spinner from '@atlaskit/spinner';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import { Flex, Grid } from '@atlaskit/primitives';
import { IconButton } from '@atlaskit/button/new';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { requestJira } from '@forge/bridge';
import { ViewIssueModal } from '@forge/jira-bridge';
import './TimeTrackingValidation.css';

const TARGET_STATUSES = ["Analysis In Progress", "In Peer Review"];

export const TimeTrackingValidation = ({ filterByCurrentUser = false }) => {
    const issues = useSelector((state) => state.epics.issues);
    const data = useSelector((state) => state.epics.data);
    const loaded = useSelector((state) => state.epics.loaded);
    const currentUser = useSelector((state) => state.epics.currentUser);
    
    const [validationResults, setValidationResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedTickets, setExpandedTickets] = useState(new Set());
    const [processingStatus, setProcessingStatus] = useState({}); // Track status of each ticket being processed
    const [processedCount, setProcessedCount] = useState(0);
    const [selectedTicketDetails, setSelectedTicketDetails] = useState(null); // For showing validation details modal
    const [currentPage, setCurrentPage] = useState(1);
    const [groupByChangedBy, setGroupByChangedBy] = useState(false);
    const itemsPerPage = 10;

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // Get all tickets from selected epics
    const selectedEpicKeys = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return data.map(epic => epic.EpicKey).filter(Boolean);
    }, [data]);

    const ticketsInEpics = useMemo(() => {
        if (!issues || !Array.isArray(issues)) return [];
        return issues.filter(issue => 
            issue.EpicKey && selectedEpicKeys.includes(issue.EpicKey)
        );
    }, [issues, selectedEpicKeys]);

    // Helper function to delay execution
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Cache for changelog data to avoid refetching (useRef to persist across renders)
    const changelogCache = useRef(new Map());
    // Track in-flight requests to avoid duplicate concurrent requests
    const inFlightRequests = useRef(new Map());

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Fetch changelog for a ticket (only once per ticket, with caching)
    const fetchChangelog = useCallback(async (ticketKey, retryCount = 0) => {
        // Check cache first
        if (changelogCache.current.has(ticketKey)) {
            return changelogCache.current.get(ticketKey);
        }

        // Check if request is already in flight
        if (inFlightRequests.current.has(ticketKey)) {
            // Wait for the existing request to complete
            return inFlightRequests.current.get(ticketKey);
        }

        const maxRetries = 2; // Reduced retries
        const baseDelay = 1000;
        
        // Create the promise for this request
        const requestPromise = (async () => {
            try {
                // Request all results in one call (Jira allows up to 1000)
                const maxResults = 1000;
                const response = await requestJira(
                    `/rest/api/3/issue/${ticketKey}/changelog?startAt=0&maxResults=${maxResults}`
                );
                
                // Check response status
                if (!response.ok) {
                    if (response.status === 429 && retryCount < maxRetries) {
                        // Rate limited - wait and retry
                        const retryDelay = baseDelay * Math.pow(2, retryCount);
                        console.warn(`Rate limited for ${ticketKey}, retrying in ${retryDelay}ms...`);
                        await delay(retryDelay);
                        // Remove from in-flight and retry
                        inFlightRequests.current.delete(ticketKey);
                        return fetchChangelog(ticketKey, retryCount + 1);
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Check content type before parsing JSON
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    // If not JSON, try to read as text to get error details
                    try {
                        const text = await response.text();
                        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
                            throw new Error('Received HTML instead of JSON (likely rate limit page)');
                        }
                        throw new Error(`Unexpected content type: ${contentType}. Response: ${text.substring(0, 200)}`);
                    } catch (textError) {
                        throw textError;
                    }
                }
                
                // Parse JSON response
                const changelogData = await response.json();
                const allValues = changelogData.values || [];
                
                // Cache the results
                changelogCache.current.set(ticketKey, allValues);
                return allValues;
                
            } catch (error) {
                if (error.message.includes('429') && retryCount < maxRetries) {
                    const retryDelay = baseDelay * Math.pow(2, retryCount);
                    await delay(retryDelay);
                    // Remove from in-flight and retry
                    inFlightRequests.current.delete(ticketKey);
                    return fetchChangelog(ticketKey, retryCount + 1);
                }
                console.error(`Error fetching changelog for ${ticketKey}:`, error);
                // Cache empty array to avoid retrying failed requests
                changelogCache.current.set(ticketKey, []);
                return [];
            } finally {
                // Remove from in-flight requests
                inFlightRequests.current.delete(ticketKey);
            }
        })();

        // Store the promise in in-flight requests
        inFlightRequests.current.set(ticketKey, requestPromise);
        
        return requestPromise;
    }, []);

    // Parse time range from worklog description (e.g., "from 11:31 am - 12:00 pm" or "Worked from 8:06 pm - 9:24 pm")
    const parseTimeRangeFromDescription = (description, worklogDate) => {
        if (!description || typeof description !== 'string') return null;
        
        // Try to match patterns like:
        // "from 11:31 am - 12:00 pm"
        // "from 11:31 AM to 12:00 PM"
        // "Worked from 8:06 pm - 9:24 pm"
        // "Worked from 8:30 am to 9:15 am"
        // "Worked 8:39 am - 9:13 am" (without "from")
        // "Did peer review from 1:02 pm - 1:51 pm"
        const patterns = [
            /(?:worked\s+)?from\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i,
            /(?:worked\s+)?from\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s+to\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i,
            /worked\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i,
            /worked\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s+to\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i
        ];
        
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match) {
                try {
                    const startHour = parseInt(match[1], 10);
                    const startMinute = parseInt(match[2], 10);
                    const startPeriod = match[3].toLowerCase();
                    const endHour = parseInt(match[4], 10);
                    const endMinute = parseInt(match[5], 10);
                    const endPeriod = match[6].toLowerCase();
                    
                    // Convert to 24-hour format
                    let startHour24 = startHour;
                    if (startPeriod === 'pm' && startHour !== 12) startHour24 += 12;
                    if (startPeriod === 'am' && startHour === 12) startHour24 = 0;
                    
                    let endHour24 = endHour;
                    if (endPeriod === 'pm' && endHour !== 12) endHour24 += 12;
                    if (endPeriod === 'am' && endHour === 12) endHour24 = 0;
                    
                    // Create dates using the worklog date as the base
                    const worklogDateObj = new Date(worklogDate);
                    const startTime = new Date(worklogDateObj);
                    startTime.setHours(startHour24, startMinute, 0, 0);
                    
                    const endTime = new Date(worklogDateObj);
                    endTime.setHours(endHour24, endMinute, 0, 0);
                    
                    // Handle case where end time is next day (e.g., 11:30 pm - 12:15 am)
                    if (endTime < startTime) {
                        endTime.setDate(endTime.getDate() + 1);
                    }
                    
                    return { start: startTime, end: endTime };
                } catch (error) {
                    console.warn('Error parsing time range from description:', error, description);
                    return null;
                }
            }
        }
        
        return null;
    };

    // Check if time was tracked during a specific period
    const hasTimeTracked = (worklogs, startDate, endDate) => {
        if (!worklogs || !Array.isArray(worklogs) || worklogs.length === 0) return false;
        
        const periodStart = new Date(startDate);
        const periodEnd = endDate ? new Date(endDate) : new Date();
        
        // Add a larger buffer to account for timing precision and rounding differences
        // Use 10 minutes to be more lenient with edge cases
        const buffer = 10 * 60 * 1000; // 10 minutes in milliseconds
        const periodStartTime = periodStart.getTime() - buffer;
        const periodEndTime = periodEnd.getTime() + buffer;
        
        // Check each worklog to see if its work period overlaps with the status period
        return worklogs.some(worklog => {
            if (!worklog) return false;
            
            // Use started date (when work actually began) - this is more accurate than created
            // If started is not available, fall back to created
            const worklogStartStr = worklog.started || worklog.created;
            if (!worklogStartStr) return false;
            
            const worklogDate = new Date(worklogStartStr);
            if (isNaN(worklogDate.getTime())) return false;
            
            // First, try to parse time range from description if available
            if (worklog.comment) {
                const timeRange = parseTimeRangeFromDescription(worklog.comment, worklogDate);
                if (timeRange) {
                    // Use the parsed time range from description
                    const worklogStartTime = timeRange.start.getTime();
                    const worklogEndTime = timeRange.end.getTime();
                    
                    // Check if worklog period overlaps with status period
                    const overlaps = worklogStartTime <= periodEndTime && worklogEndTime >= periodStartTime;
                    
                    if (overlaps) {
                        return true; // Found a match using description time range
                    }
                    // If description time range doesn't match, fall through to check using started + duration
                }
            }
            
            // Fallback: Calculate when the worklog period ends (start + duration)
            const worklogDurationMs = (worklog.timeSpentSeconds || 0) * 1000;
            const worklogEnd = new Date(worklogDate.getTime() + worklogDurationMs);
            
            // Check if worklog period overlaps with status period
            // Two periods overlap if: worklogStart <= periodEnd AND worklogEnd >= periodStart
            const worklogStartTime = worklogDate.getTime();
            const worklogEndTime = worklogEnd.getTime();
            
            // Check if worklog overlaps with the period
            const overlaps = worklogStartTime <= periodEndTime && worklogEndTime >= periodStartTime;
            
            return overlaps;
        });
    };

    // Analyze ticket for time tracking violations (memoized to use cached fetchChangelog)
    const analyzeTicket = useCallback(async (ticket) => {
        const violations = [];
        
        try {
            // Fetch changelog (will use cache if already fetched)
            const changelog = await fetchChangelog(ticket.ticketNumber);
            
            // Track all status periods in target statuses
            const statusPeriods = [];
            
            // Process changelog entries chronologically (oldest first)
            const sortedChangelog = [...changelog].sort((a, b) => 
                new Date(a.created) - new Date(b.created)
            );
            
            // Build timeline of status changes
            const statusHistory = [];
            
            for (const history of sortedChangelog) {
                for (const item of history.items || []) {
                    if (item.field === 'status') {
                        const fromStatus = item.fromString;
                        const toStatus = item.toString;
                        const changeDate = new Date(history.created);
                        
                        statusHistory.push({
                            from: fromStatus,
                            to: toStatus,
                            date: changeDate,
                            author: history.author?.displayName || 'Unknown'
                        });
                    }
                }
            }
            
            // Now process status history to find periods in target statuses
            for (let i = 0; i < statusHistory.length; i++) {
                const transition = statusHistory[i];
                const fromStatus = transition.from;
                const toStatus = transition.to;
                
                // If entering a target status
                if (TARGET_STATUSES.includes(toStatus) && !TARGET_STATUSES.includes(fromStatus)) {
                    // Find when it exits this status
                    let exitDate = null;
                    let exitAuthor = null;
                    
                    for (let j = i + 1; j < statusHistory.length; j++) {
                        const nextTransition = statusHistory[j];
                        if (nextTransition.from === toStatus) {
                            exitDate = nextTransition.date;
                            exitAuthor = nextTransition.author;
                            break;
                        }
                    }
                    
                    statusPeriods.push({
                        status: toStatus,
                        entryDate: transition.date,
                        exitDate: exitDate,
                        entryAuthor: transition.author,
                        exitAuthor: exitAuthor
                    });
                }
            }
            
            // Check if currently in a target status
            if (ticket.status && TARGET_STATUSES.includes(ticket.status)) {
                // Find the most recent entry into this status
                let mostRecentEntry = null;
                for (let i = sortedChangelog.length - 1; i >= 0; i--) {
                    const history = sortedChangelog[i];
                    for (const item of history.items || []) {
                        if (item.field === 'status' && item.toString === ticket.status) {
                            mostRecentEntry = new Date(history.created);
                            break;
                        }
                    }
                    if (mostRecentEntry) break;
                }
                
                if (mostRecentEntry) {
                    statusPeriods.push({
                        status: ticket.status,
                        entryDate: mostRecentEntry,
                        exitDate: null, // Still in status
                        entryAuthor: 'Unknown',
                        exitAuthor: null
                    });
                }
            }
            
            // Check each period for time tracking
            for (const period of statusPeriods) {
                const worklogs = ticket.fullWorklogs || [];
                const endDate = period.exitDate || new Date();
                const timeTracked = hasTimeTracked(worklogs, period.entryDate, endDate);
                
                // Debug logging for periods without time tracked
                if (!timeTracked && worklogs.length > 0) {
                    const periodStart = period.entryDate.getTime();
                    const periodEnd = endDate.getTime();
                    const worklogDetails = worklogs.map(w => {
                        const wStart = w.started ? new Date(w.started).getTime() : null;
                        const wEnd = wStart && w.timeSpentSeconds ? wStart + (w.timeSpentSeconds * 1000) : null;
                        return {
                            started: w.started,
                            created: w.created,
                            timeSpentSeconds: w.timeSpentSeconds,
                            startedTime: wStart,
                            endTime: wEnd,
                            startedISO: w.started ? new Date(w.started).toISOString() : null,
                            createdISO: w.created ? new Date(w.created).toISOString() : null,
                            overlaps: wStart && wEnd ? (wStart <= periodEnd && wEnd >= periodStart) : false
                        };
                    });
                    console.log(`[${ticket.ticketNumber}] No time tracked for period:`, {
                        status: period.status,
                        entryDate: period.entryDate.toISOString(),
                        exitDate: endDate.toISOString(),
                        periodStartTime: periodStart,
                        periodEndTime: periodEnd,
                        worklogsCount: worklogs.length,
                        worklogDetails: worklogDetails
                    });
                }
                
                if (!timeTracked) {
                    const durationHours = (endDate - period.entryDate) / (1000 * 60 * 60);
                    
                    // Ignore violations with duration of 0.2 hours or less
                    if (durationHours <= 0.2) {
                        continue;
                    }
                    
                    // Check for duplicate by comparing entry/exit dates
                    const isDuplicate = violations.some(v => 
                        v.status === period.status &&
                        Math.abs(v.entryDate.getTime() - period.entryDate.getTime()) < 1000 &&
                        ((!v.exitDate && !period.exitDate) || 
                         (v.exitDate && period.exitDate && 
                          Math.abs(v.exitDate.getTime() - period.exitDate.getTime()) < 1000))
                    );
                    
                    if (!isDuplicate) {
                        violations.push({
                            status: period.status,
                            entryDate: period.entryDate,
                            exitDate: period.exitDate,
                            entryAuthor: period.entryAuthor,
                            exitAuthor: period.exitAuthor,
                            durationHours: durationHours
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error(`Error analyzing ticket ${ticket.ticketNumber}:`, error);
        }
        
        return violations;
    }, [fetchChangelog]);

    // Run validation
    const runValidation = useCallback(async () => {
        if (!ticketsInEpics || ticketsInEpics.length === 0) {
            if (isMountedRef.current) {
                setValidationResults([]);
                setProcessingStatus({});
                setProcessedCount(0);
            }
            return;
        }

        if (!isMountedRef.current) {
            return; // Component unmounted, don't start validation
        }
        
        try {
            setIsLoading(true);
        } catch (err) {
            console.warn('Error setting loading state:', err);
            return; // Don't proceed if we can't set loading state
        }
        const results = [];
        const status = {};
        let count = 0;
        
        // Track processed tickets to avoid duplicates
        const processedTickets = new Set();

        try {
            // Process tickets sequentially with minimal delays
            for (const ticket of ticketsInEpics) {
                // Skip if already processed
                if (processedTickets.has(ticket.ticketNumber)) {
                    continue;
                }
                processedTickets.add(ticket.ticketNumber);
                
                // Update status to processing (only if component is still mounted)
                status[ticket.ticketNumber] = { status: 'processing', ticket: ticket };
                if (isMountedRef.current) {
                    setProcessingStatus({ ...status });
                }
                
                try {
                    const violations = await analyzeTicket(ticket);
                    if (!isMountedRef.current) {
                        break; // Component unmounted, stop processing
                    }
                    
                    count++;
                    if (isMountedRef.current) {
                        setProcessedCount(count);
                    }
                    
                    if (violations.length > 0) {
                        // Calculate lastupdate from the most recent violation's entryDate
                        const sortedViolations = [...violations].sort((a, b) => {
                            const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
                            const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
                            return dateB - dateA; // Descending order
                        });
                        const lastupdate = sortedViolations[0]?.entryDate || null;
                        
                        results.push({
                            ticket: ticket,
                            violations: violations,
                            lastupdate: lastupdate
                        });
                        status[ticket.ticketNumber] = { 
                            status: 'violation', 
                            ticket: ticket, 
                            violations: violations 
                        };
                    } else {
                        status[ticket.ticketNumber] = { 
                            status: 'passed', 
                            ticket: ticket 
                        };
                    }
                    
                    // Update results incrementally (only if component is still mounted)
                    if (isMountedRef.current) {
                        setValidationResults([...results]);
                        setProcessingStatus({ ...status });
                        // Reset to first page when new results come in
                        setCurrentPage(1);
                    }
                    
                    // Small delay to avoid overwhelming the API
                    await delay(100);
                } catch (error) {
                    console.error(`Error analyzing ticket ${ticket.ticketNumber}:`, error);
                    if (!isMountedRef.current) {
                        break; // Component unmounted, stop processing
                    }
                    
                    count++;
                    if (isMountedRef.current) {
                        setProcessedCount(count);
                        status[ticket.ticketNumber] = { 
                            status: 'error', 
                            ticket: ticket, 
                            error: error.message 
                        };
                        setProcessingStatus({ ...status });
                    }
                    // Continue with next ticket even if one fails
                }
            }
        } catch (error) {
            console.error('Error running validation:', error);
        } finally {
            // Use a small delay to ensure state updates happen after render cycle
            // Only update state if component is still mounted
            const timeoutId = setTimeout(() => {
                if (isMountedRef.current) {
                    try {
                        setIsLoading(false);
                        setProcessingStatus({});
                    } catch (err) {
                        // Silently ignore errors if component is unmounting
                        // This can happen if React is in the middle of unmounting
                        if (process.env.NODE_ENV === 'development') {
                            console.warn('Error updating state after validation (component may be unmounting):', err);
                        }
                    }
                }
            }, 10); // Small delay to let React finish current render cycle
            
            // Store timeout ID for potential cleanup (though component unmount should handle it)
            // Note: We can't easily clean this up since we're in a callback, but the mount check should prevent issues
        }
    }, [ticketsInEpics, analyzeTicket]);

    // Auto-run validation when tickets change
    useEffect(() => {
        if (loaded && ticketsInEpics.length > 0) {
            runValidation();
        }
    }, [loaded, ticketsInEpics.length, runValidation]);

    const toggleTicketExpansion = (ticketKey) => {
        const newExpanded = new Set(expandedTickets);
        if (newExpanded.has(ticketKey)) {
            newExpanded.delete(ticketKey);
        } else {
            newExpanded.add(ticketKey);
        }
        setExpandedTickets(newExpanded);
    };

    const openTicket = (ticketKey) => {
        const modal = new ViewIssueModal({
            onClose: () => {},
            context: {
                issueKey: ticketKey,
            },
        });
        modal.open();
    };

    const showValidationDetails = (result) => {
        setSelectedTicketDetails(result);
    };

    const closeValidationDetails = () => {
        setSelectedTicketDetails(null);
    };

    // Helper function to get epic name from EpicKey
    const getEpicName = useCallback((epicKey) => {
        if (!epicKey || !data || !Array.isArray(data)) return epicKey || 'N/A';
        const epic = data.find(e => e.EpicKey === epicKey);
        return epic?.Summary || epicKey || 'N/A';
    }, [data]);

    // Filter results if filterByCurrentUser is true (must be before early return)
    const filteredResults = useMemo(() => {
        if (!filterByCurrentUser || !currentUser?.displayName) {
            return validationResults || [];
        }
        
        // Filter to only show tickets where the current user is in the "Changed By" column
        return (validationResults || []).filter(result => {
            const violations = Array.isArray(result.violations) ? result.violations : [];
            // Check if any violation has entryAuthor matching current user's displayName
            return violations.some(violation => 
                violation.entryAuthor && 
                violation.entryAuthor === currentUser.displayName
            );
        });
    }, [validationResults, filterByCurrentUser, currentUser?.displayName]);

    // Group results by "Changed By" if grouping is enabled
    const groupedResults = useMemo(() => {
        if (!groupByChangedBy) {
            return { ungrouped: filteredResults };
        }
        
        // Group by entryAuthor (Changed By)
        const groups = {};
        filteredResults.forEach(result => {
            const violations = Array.isArray(result.violations) ? result.violations : [];
            // Get all unique entryAuthors from violations
            const authors = new Set();
            violations.forEach(v => {
                if (v.entryAuthor) {
                    authors.add(v.entryAuthor);
                }
            });
            
            // If no author found, use "Unknown"
            if (authors.size === 0) {
                authors.add('Unknown');
            }
            
            // Add result to each author's group
            authors.forEach(author => {
                if (!groups[author]) {
                    groups[author] = [];
                }
                groups[author].push(result);
            });
        });
        
        return groups;
    }, [filteredResults, groupByChangedBy]);

    // Reset to page 1 when filtered results change
    // Use a stable dependency to avoid hook count issues
    const filteredResultsLength = filteredResults.length;
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredResultsLength]);

    const totalViolations = filteredResults.reduce((sum, result) => {
        return sum + (result?.violations?.length || 0);
    }, 0);

    // Don't render early return - conditionally render content instead to maintain hook order
    if (!loaded) {
        return null;
    }

    return (
        <Box xcss={xcss({ marginTop: 'space.400', padding: 'space.200' })}>
            <Box xcss={xcss({ marginBottom: 'space.200', display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <h2 style={{ fontWeight: 'bold', margin: 0 }}>Time Tracking Validation</h2>
                <Box xcss={xcss({ display: 'flex', gap: 'space.100', alignItems: 'center' })}>
                    <Button 
                        appearance={groupByChangedBy ? "primary" : "default"}
                        onClick={() => setGroupByChangedBy(!groupByChangedBy)}
                        isDisabled={isLoading}
                    >
                        {groupByChangedBy ? 'Ungroup' : 'Group by Changed By'}
                    </Button>
                    <Button appearance="primary" onClick={runValidation} isDisabled={isLoading}>
                        {isLoading ? 'Validating...' : 'Refresh Validation'}
                    </Button>
                </Box>
            </Box>
            
            <Box xcss={xcss({ marginBottom: 'space.200' })}>
                <p style={{ margin: 0, color: '#6B778C' }}>
                    Checking tickets that exited "{TARGET_STATUSES.join('" or "')}" without time tracking.
                    {isLoading && ticketsInEpics.length > 0 && (
                        <span style={{ color: '#6B778C', fontWeight: 'normal' }}>
                            {' '}(Processing {processedCount} of {ticketsInEpics.length} tickets...)
                        </span>
                    )}
                    {!isLoading && totalViolations > 0 && (
                        <span style={{ color: '#DE350B', fontWeight: 'bold' }}>
                            {' '}Found {totalViolations} violation{totalViolations !== 1 ? 's' : ''}.
                        </span>
                    )}
                </p>
            </Box>

            {/* Show processing status for each ticket */}
            {isLoading && processingStatus && Object.keys(processingStatus).length > 0 && (
                <Box xcss={xcss({ marginBottom: 'space.200', padding: 'space.200', backgroundColor: '#F4F5F7', borderRadius: '3px' })}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>Processing Status:</p>
                    <Box xcss={xcss({ maxHeight: '200px', overflowY: 'auto' })}>
                        {Object.values(processingStatus)
                            .filter(item => item && item.ticket && item.ticket.ticketNumber)
                            .map((item, idx) => {
                            if (!item || !item.ticket) return null;
                            const ticket = item.ticket;
                            let statusColor = '#6B778C';
                            let statusText = 'Processing...';
                            let statusIcon = '⏳';
                            
                            if (item.status === 'passed') {
                                statusColor = '#00875A';
                                statusText = '✓ Passed';
                                statusIcon = '✓';
                            } else if (item.status === 'violation') {
                                statusColor = '#DE350B';
                                statusText = `✗ ${item.violations?.length || 0} violation(s)`;
                                statusIcon = '✗';
                            } else if (item.status === 'error') {
                                statusColor = '#FF5630';
                                statusText = 'Error';
                                statusIcon = '⚠';
                            }
                            
                            return (
                                <Box key={ticket.ticketNumber || idx} xcss={xcss({ marginBottom: 'space.050', fontSize: '12px' })}>
                                    <span 
                                        style={{ 
                                            color: statusColor, 
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                        onClick={() => {
                                            // If this ticket has violations, show details
                                            if (item.status === 'violation' && item.violations) {
                                                showValidationDetails({
                                                    ticket: ticket,
                                                    violations: item.violations
                                                });
                                            }
                                        }}
                                    >
                                        {statusIcon} {ticket.ticketNumber}
                                    </span>
                                    <span style={{ color: '#6B778C', marginLeft: '8px' }}>
                                        {statusText}
                                    </span>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {isLoading ? (
                <Box xcss={xcss({ display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
                    <Spinner size="medium" />
                </Box>
            ) : !filteredResults || filteredResults.length === 0 ? (
                <Box xcss={xcss({ padding: 'space.200', textAlign: 'center', color: '#6B778C' })}>
                    <p>
                        {filterByCurrentUser 
                            ? 'No time tracking violations found for your tickets. All your tickets have appropriate time tracking.'
                            : 'No time tracking violations found. All tickets have appropriate time tracking.'}
                    </p>
                </Box>
            ) : (
                <>
                    <div className="time-tracking-validation-table">
                        <TableTree label="Time Tracking Violations">
                            <Headers>
                                <Header width={150}>Ticket</Header>
                                <Header width={200}>Epic</Header>
                                <Header width={200}>Status</Header>
                                <Header width={150}>Last Update</Header>
                                <Header width={100}>Actions</Header>
                            </Headers>
                        {groupByChangedBy ? (
                            // Grouped view - flatten groups and results into a single list with type indicators
                            <Rows
                                items={Object.entries(groupedResults)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .flatMap(([author, results]) => {
                                        const sortedResults = results
                                            .filter(r => r && r.ticket && r.ticket.ticketNumber)
                                            .sort((a, b) => {
                                                const dateA = a.lastupdate ? new Date(a.lastupdate).getTime() : 0;
                                                const dateB = b.lastupdate ? new Date(b.lastupdate).getTime() : 0;
                                                return dateB - dateA;
                                            });
                                        
                                        return [
                                            { type: 'group', author, results: sortedResults },
                                            ...(expandedTickets.has(author) ? sortedResults.map(r => ({ type: 'result', ...r })) : [])
                                        ];
                                    })}
                                render={(item) => {
                                    if (item.type === 'group') {
                                        const { author, results: sortedResults } = item;
                                        const isExpanded = expandedTickets.has(author);
                                        
                                        return (
                                            <Row
                                                key={author}
                                                items={[]}
                                                hasChildren={false}
                                            >
                                                <Cell width={150}>
                                                    <Button
                                                        appearance="subtle"
                                                        onClick={() => toggleTicketExpansion(author)}
                                                        style={{ padding: 0, textAlign: 'left', fontWeight: 'bold' }}
                                                    >
                                                        {isExpanded ? '▼' : '▶'} {author}
                                                    </Button>
                                                </Cell>
                                                <Cell width={200}>
                                                    <span style={{ color: '#6B778C', fontSize: '12px' }}>
                                                        {sortedResults.length} ticket{sortedResults.length !== 1 ? 's' : ''}
                                                    </span>
                                                </Cell>
                                                <Cell width={200}>
                                                    <Lozenge appearance="inprogress">
                                                        {sortedResults.reduce((sum, r) => sum + (r?.violations?.length || 0), 0)} total violation{sortedResults.reduce((sum, r) => sum + (r?.violations?.length || 0), 0) !== 1 ? 's' : ''}
                                                    </Lozenge>
                                                </Cell>
                                                <Cell width={150}>
                                                    {sortedResults.length > 0 && sortedResults[0].lastupdate ? (() => {
                                                        try {
                                                            const lastUpdateDate = new Date(sortedResults[0].lastupdate);
                                                            if (isNaN(lastUpdateDate.getTime())) return 'N/A';
                                                            return (
                                                                <Box>
                                                                    <div>{lastUpdateDate.toLocaleDateString()}</div>
                                                                    <div style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                                                                        {lastUpdateDate.toLocaleTimeString()}
                                                                    </div>
                                                                </Box>
                                                            );
                                                        } catch (err) {
                                                            return 'N/A';
                                                        }
                                                    })() : 'N/A'}
                                                </Cell>
                                                <Cell width={100}></Cell>
                                            </Row>
                                        );
                                    } else {
                                        // Child result row
                                        const result = item;
                                        try {
                                            if (!result || !result.ticket || !result.ticket.ticketNumber) {
                                                return null;
                                            }
                                            const violations = Array.isArray(result.violations) ? result.violations : [];
                                            const ticketKey = result.ticket.ticketNumber;
                                            
                                            return (
                                                <Row
                                                    key={ticketKey}
                                                    items={[]}
                                                    hasChildren={false}
                                                >
                                                    <Cell width={150}>
                                                        <span style={{ marginLeft: '20px' }}>
                                                            <Button
                                                                appearance="link"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (result && result.ticket) {
                                                                        showValidationDetails(result);
                                                                    }
                                                                }}
                                                                style={{ 
                                                                    padding: 0,
                                                                    textAlign: 'left',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {result.ticket.ticketNumber}
                                                            </Button>
                                                        </span>
                                                    </Cell>
                                                    <Cell width={200}>
                                                        {getEpicName(result.ticket.EpicKey)}
                                                    </Cell>
                                                    <Cell width={200}>
                                                        <Lozenge appearance="removed">
                                                            {violations.length} violation{violations.length !== 1 ? 's' : ''}
                                                        </Lozenge>
                                                    </Cell>
                                                    <Cell width={150}>
                                                        {result.lastupdate ? (() => {
                                                            try {
                                                                const lastUpdateDate = new Date(result.lastupdate);
                                                                if (isNaN(lastUpdateDate.getTime())) return 'N/A';
                                                                return (
                                                                    <Box>
                                                                        <div>{lastUpdateDate.toLocaleDateString()}</div>
                                                                        <div style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                                                                            {lastUpdateDate.toLocaleTimeString()}
                                                                        </div>
                                                                    </Box>
                                                                );
                                                            } catch (err) {
                                                                return 'N/A';
                                                            }
                                                        })() : 'N/A'}
                                                    </Cell>
                                                    <Cell width={100}>
                                                        <Button 
                                                            appearance="subtle" 
                                                            onClick={() => {
                                                                if (result && result.ticket && result.ticket.ticketNumber) {
                                                                    showValidationDetails(result);
                                                                }
                                                            }}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </Cell>
                                                </Row>
                                            );
                                        } catch (err) {
                                            console.error('Error rendering result row:', err, result);
                                            return null;
                                        }
                                    }
                                }}
                            />
                        ) : (
                            // Ungrouped view
                            <Rows
                                items={filteredResults
                                    .filter(r => r && r.ticket && r.ticket.ticketNumber)
                                    .sort((a, b) => {
                                        // Sort by lastupdate descending
                                        const dateA = a.lastupdate ? new Date(a.lastupdate).getTime() : 0;
                                        const dateB = b.lastupdate ? new Date(b.lastupdate).getTime() : 0;
                                        return dateB - dateA; // Descending order
                                    })
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                                render={(result) => {
                                    try {
                                        if (!result || !result.ticket || !result.ticket.ticketNumber) {
                                            return null;
                                        }
                                        const violations = Array.isArray(result.violations) ? result.violations : [];
                                        const ticketKey = result.ticket.ticketNumber;
                                        
                                        return (
                                            <Row
                                                key={ticketKey}
                                                items={[]}
                                                hasChildren={false}
                                            >
                                                <Cell width={150}>
                                                    <Button
                                                        appearance="link"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (result && result.ticket) {
                                                                showValidationDetails(result);
                                                            }
                                                        }}
                                                        style={{ 
                                                            padding: 0,
                                                            textAlign: 'left',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {result.ticket.ticketNumber}
                                                    </Button>
                                                </Cell>
                                                <Cell width={200}>
                                                    {getEpicName(result.ticket.EpicKey)}
                                                </Cell>
                                                <Cell width={200}>
                                                    <Lozenge appearance="removed">
                                                        {violations.length} violation{violations.length !== 1 ? 's' : ''}
                                                    </Lozenge>
                                                </Cell>
                                                <Cell width={150}>
                                                    {result.lastupdate ? (() => {
                                                        try {
                                                            const lastUpdateDate = new Date(result.lastupdate);
                                                            if (isNaN(lastUpdateDate.getTime())) return 'N/A';
                                                            return (
                                                                <Box>
                                                                    <div>{lastUpdateDate.toLocaleDateString()}</div>
                                                                    <div style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                                                                        {lastUpdateDate.toLocaleTimeString()}
                                                                    </div>
                                                                </Box>
                                                            );
                                                        } catch (err) {
                                                            return 'N/A';
                                                        }
                                                    })() : 'N/A'}
                                                </Cell>
                                                <Cell width={100}>
                                                    <Button 
                                                        appearance="subtle" 
                                                        onClick={() => {
                                                            if (result && result.ticket && result.ticket.ticketNumber) {
                                                                showValidationDetails(result);
                                                            }
                                                        }}
                                                    >
                                                        View Details
                                                    </Button>
                                                </Cell>
                                            </Row>
                                        );
                                    } catch (err) {
                                        console.error('Error rendering result row:', err, result);
                                        return null;
                                    }
                                }}
                            />
                        )}
                        </TableTree>
                    </div>
                    {(groupByChangedBy ? Object.keys(groupedResults).length : filteredResults.length) > itemsPerPage && (
                        <Box xcss={xcss({ marginTop: 'space.200', display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                            <Box xcss={xcss({ display: 'flex', gap: 'space.100', alignItems: 'center' })}>
                                <Button 
                                    appearance="subtle"
                                    isDisabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    Previous
                                </Button>
                                <span style={{ color: '#6B778C' }}>
                                    Page {currentPage} of {Math.ceil((groupByChangedBy ? Object.keys(groupedResults).length : filteredResults.length) / itemsPerPage)}
                                </span>
                                <Button 
                                    appearance="subtle"
                                    isDisabled={currentPage >= Math.ceil((groupByChangedBy ? Object.keys(groupedResults).length : filteredResults.length) / itemsPerPage)}
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil((groupByChangedBy ? Object.keys(groupedResults).length : filteredResults.length) / itemsPerPage), prev + 1))}
                                >
                                    Next
                                </Button>
                            </Box>
                            <span style={{ color: '#6B778C', fontSize: '12px' }}>
                                {groupByChangedBy 
                                    ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, Object.keys(groupedResults).length)} of ${Object.keys(groupedResults).length} groups`
                                    : `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredResults.length)} of ${filteredResults.length} violations`}
                            </span>
                        </Box>
                    )}
                </>
            )}

            {/* Validation Details Modal */}
            <ModalTransition>
                {selectedTicketDetails && (
                    <Modal onClose={closeValidationDetails} width="90%">
                        <ModalHeader>
                            <Grid gap="space.200" templateAreas={['title close']} xcss={xcss({ width: '100%' })}>
                                <Flex xcss={xcss({ gridArea: 'close' })} justifyContent="end">
                                    <IconButton
                                        appearance="subtle"
                                        icon={CrossIcon}
                                        label="Close Modal"
                                        onClick={closeValidationDetails}
                                    />
                                </Flex>
                                <Flex xcss={xcss({ gridArea: 'title' })} justifyContent="start">
                                    <ModalTitle>
                                        Validation Details - {selectedTicketDetails?.ticket?.ticketNumber || 'N/A'}
                                    </ModalTitle>
                                </Flex>
                            </Grid>
                        </ModalHeader>
                        <ModalBody>
                            <Box xcss={xcss({ padding: 'space.200' })}>
                                <Box xcss={xcss({ marginBottom: 'space.200' })}>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Ticket Information:</p>
                                    <p style={{ margin: 0, color: '#6B778C' }}>
                                        <strong>Ticket:</strong> {selectedTicketDetails?.ticket?.ticketNumber || 'N/A'}<br/>
                                        <strong>Epic:</strong> {getEpicName(selectedTicketDetails?.ticket?.EpicKey)}<br/>
                                        <strong>Current Status:</strong> {selectedTicketDetails?.ticket?.status || 'N/A'}<br/>
                                        <strong>Violations Found:</strong> {Array.isArray(selectedTicketDetails?.violations) ? selectedTicketDetails.violations.length : 0}
                                    </p>
                                </Box>
                                
                                <Box xcss={xcss({ marginTop: 'space.300' })}>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Validation Failures:</p>
                                    <p style={{ margin: '0 0 16px 0', color: '#6B778C', fontSize: '14px' }}>
                                        This ticket exited "{TARGET_STATUSES.join('" or "')}" status without time tracking being recorded during the period it was in that status.
                                    </p>
                                    
                                    <TableTree label="Violations">
                                        <Headers>
                                            <Header width={200}>Status</Header>
                                            <Header width={150}>Entered</Header>
                                            <Header width={150}>Exited</Header>
                                            <Header width={150}>Changed By</Header>
                                            <Header width={100}>Duration</Header>
                                            <Header width={200}>Reason</Header>
                                        </Headers>
                                        <Rows
                                            items={(Array.isArray(selectedTicketDetails?.violations) ? selectedTicketDetails.violations : [])
                                                .filter(v => v && v.entryDate)
                                                .sort((a, b) => {
                                                    // Sort by entryDate descending
                                                    const dateA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
                                                    const dateB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
                                                    return dateB - dateA; // Descending order
                                                })}
                                            render={(violation) => {
                                                if (!violation || !violation.entryDate) return null;
                                                try {
                                                    // Format duration as hours and minutes
                                                    const formatDuration = (hours) => {
                                                        if (!hours || typeof hours !== 'number') return '0h 0m';
                                                        const totalMinutes = Math.round(hours * 60);
                                                        const h = Math.floor(totalMinutes / 60);
                                                        const m = totalMinutes % 60;
                                                        if (h > 0 && m > 0) {
                                                            return `${h}h ${m}m`;
                                                        } else if (h > 0) {
                                                            return `${h}h`;
                                                        } else {
                                                            return `${m}m`;
                                                        }
                                                    };
                                                    
                                                    const durationFormatted = violation.durationHours && typeof violation.durationHours === 'number'
                                                        ? formatDuration(violation.durationHours)
                                                        : '0h 0m';
                                                    
                                                    const reason = violation.exitDate 
                                                        ? `No time tracked during ${durationFormatted} period while in "${violation.status || 'Unknown'}" status`
                                                        : `Currently in "${violation.status || 'Unknown'}" status with no time tracked since entry`;
                                                    
                                                    return (
                                                        <Row items={[]} hasChildren={false}>
                                                            <Cell width={200}>
                                                                <Lozenge appearance="inprogress">
                                                                    {violation.status || 'Unknown'}
                                                                </Lozenge>
                                                            </Cell>
                                                            <Cell width={150}>
                                                                {violation.entryDate && typeof violation.entryDate.toLocaleDateString === 'function' ? (
                                                                    <Box>
                                                                        <div>{violation.entryDate.toLocaleDateString()}</div>
                                                                        <div style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                                                                            {violation.entryDate.toLocaleTimeString()}
                                                                        </div>
                                                                    </Box>
                                                                ) : 'N/A'}
                                                            </Cell>
                                                            <Cell width={150}>
                                                                {violation.exitDate && typeof violation.exitDate.toLocaleDateString === 'function' ? (
                                                                    <Box>
                                                                        <div>{violation.exitDate.toLocaleDateString()}</div>
                                                                        <div style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                                                                            {violation.exitDate.toLocaleTimeString()}
                                                                        </div>
                                                                    </Box>
                                                                ) : 'Still in status'}
                                                            </Cell>
                                                            <Cell width={150}>
                                                                {violation.entryAuthor || 'Unknown'}
                                                            </Cell>
                                                            <Cell width={100}>
                                                                {violation.durationHours && typeof violation.durationHours.toFixed === 'function'
                                                                    ? violation.durationHours.toFixed(1) + 'h'
                                                                    : 'N/A'}
                                                            </Cell>
                                                            <Cell width={200}>
                                                                <span style={{ fontSize: '12px', color: '#6B778C' }}>
                                                                    {reason}
                                                                </span>
                                                            </Cell>
                                                        </Row>
                                                    );
                                                } catch (err) {
                                                    console.error('Error rendering violation in modal:', err, violation);
                                                    return null;
                                                }
                                            }}
                                        />
                                    </TableTree>
                                </Box>
                            </Box>
                        </ModalBody>
                        <ModalFooter>
                            <Button appearance="subtle" onClick={closeValidationDetails}>
                                Close
                            </Button>
                            <Button 
                                appearance="primary" 
                                onClick={() => {
                                    if (selectedTicketDetails?.ticket?.ticketNumber) {
                                        openTicket(selectedTicketDetails.ticket.ticketNumber);
                                    }
                                }}
                            >
                                Open in Jira
                            </Button>
                        </ModalFooter>
                    </Modal>
                )}
            </ModalTransition>
        </Box>
    );
};


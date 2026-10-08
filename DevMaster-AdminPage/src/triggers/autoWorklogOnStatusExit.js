import api, { route } from '@forge/api';

// Keep in sync with TimeTrackingValidation TARGET_STATUSES.
const TARGET_STATUSES = ['analysis in progress', 'in peer review'];
const MIN_DURATION_HOURS = 0.2;
// Cap so tickets left overnight/weekend do not dump 12h+ onto remaining estimate.
const MAX_DURATION_SECONDS = 8 * 3600;
const OVERLAP_BUFFER_MS = 10 * 60 * 1000;

const normalizeStatus = (value) => (value || '').trim().toLowerCase();

const isTargetStatus = (value) => TARGET_STATUSES.includes(normalizeStatus(value));

const formatForJira = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
        throw new Error('Invalid date');
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.000+0000`;
};

const extractCommentText = (comment) => {
    if (!comment) return '';
    if (typeof comment === 'string') return comment;
    if (comment.content && Array.isArray(comment.content)) {
        const extractText = (content) => {
            if (typeof content === 'string') return content;
            if (content.text) return content.text;
            if (content.content && Array.isArray(content.content)) {
                return content.content.map(extractText).join('');
            }
            return '';
        };
        return comment.content.map(extractText).join('');
    }
    return '';
};

const parseTimeRangeFromDescription = (description, worklogDate) => {
    if (!description || typeof description !== 'string') return null;

    const patterns = [
        /(?:worked\s+)?from\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i,
        /(?:worked\s+)?from\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s+to\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i,
        /worked\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i,
        /worked\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)\s+to\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i
    ];

    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (!match) continue;
        try {
            const startHour = parseInt(match[1], 10);
            const startMinute = parseInt(match[2], 10);
            const startPeriod = match[3].toLowerCase();
            const endHour = parseInt(match[4], 10);
            const endMinute = parseInt(match[5], 10);
            const endPeriod = match[6].toLowerCase();

            let startHour24 = startHour;
            if (startPeriod === 'pm' && startHour !== 12) startHour24 += 12;
            if (startPeriod === 'am' && startHour === 12) startHour24 = 0;

            let endHour24 = endHour;
            if (endPeriod === 'pm' && endHour !== 12) endHour24 += 12;
            if (endPeriod === 'am' && endHour === 12) endHour24 = 0;

            const worklogDateObj = new Date(worklogDate);
            const startTime = new Date(worklogDateObj);
            startTime.setHours(startHour24, startMinute, 0, 0);
            const endTime = new Date(worklogDateObj);
            endTime.setHours(endHour24, endMinute, 0, 0);
            if (endTime < startTime) {
                endTime.setDate(endTime.getDate() + 1);
            }
            return { start: startTime, end: endTime };
        } catch (error) {
            console.warn('autoWorklog: failed to parse worklog time range', error);
            return null;
        }
    }
    return null;
};

const hasTimeTracked = (worklogs, startDate, endDate) => {
    if (!worklogs || worklogs.length === 0) return false;

    const periodStartTime = new Date(startDate).getTime() - OVERLAP_BUFFER_MS;
    const periodEndTime = new Date(endDate).getTime() + OVERLAP_BUFFER_MS;

    return worklogs.some((worklog) => {
        const worklogStartStr = worklog.started || worklog.created;
        if (!worklogStartStr) return false;
        const worklogDate = new Date(worklogStartStr);
        if (Number.isNaN(worklogDate.getTime())) return false;

        const comment = extractCommentText(worklog.comment);
        if (comment) {
            const timeRange = parseTimeRangeFromDescription(comment, worklogDate);
            if (timeRange) {
                if (timeRange.start.getTime() <= periodEndTime && timeRange.end.getTime() >= periodStartTime) {
                    return true;
                }
            }
        }

        const worklogStartTime = worklogDate.getTime();
        const worklogEndTime = worklogStartTime + (worklog.timeSpentSeconds || 0) * 1000;
        return worklogStartTime <= periodEndTime && worklogEndTime >= periodStartTime;
    });
};

const jsonOrThrow = async (response, label) => {
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`${label} failed: ${response.status} ${body || response.statusText}`);
    }
    return response.json();
};

const fetchAllChangelog = async (issueKey) => {
    const values = [];
    let startAt = 0;
    const maxResults = 100;
    while (true) {
        const response = await api.asApp().requestJira(
            route`/rest/api/3/issue/${issueKey}/changelog?startAt=${String(startAt)}&maxResults=${String(maxResults)}`,
            { headers: { Accept: 'application/json' } }
        );
        const page = await jsonOrThrow(response, `Fetch changelog for ${issueKey}`);
        values.push(...(page.values || []));
        const next = startAt + (page.maxResults || maxResults);
        if (!page.values?.length || next >= (page.total || 0)) break;
        startAt = next;
    }
    return values;
};

const fetchAllWorklogs = async (issueKey) => {
    const worklogs = [];
    let startAt = 0;
    const maxResults = 100;
    while (true) {
        const response = await api.asApp().requestJira(
            route`/rest/api/3/issue/${issueKey}/worklog?startAt=${String(startAt)}&maxResults=${String(maxResults)}`,
            { headers: { Accept: 'application/json' } }
        );
        const page = await jsonOrThrow(response, `Fetch worklogs for ${issueKey}`);
        worklogs.push(...(page.worklogs || []));
        const next = startAt + (page.maxResults || maxResults);
        if (!page.worklogs?.length || next >= (page.total || 0)) break;
        startAt = next;
    }
    return worklogs;
};

const findStatusExit = (event) => {
    const items = event?.changelog?.items || [];
    return items.find((item) => item?.field === 'status' && isTargetStatus(item.fromString));
};

const findEntryDate = (changelog, exitedStatus, exitDate, createdDate) => {
    const statusChanges = [];
    for (const history of changelog) {
        const created = history.created ? new Date(history.created) : null;
        if (!created || Number.isNaN(created.getTime())) continue;
        for (const item of history.items || []) {
            if (item.field !== 'status') continue;
            statusChanges.push({
                date: created,
                from: item.fromString,
                to: item.toString
            });
        }
    }
    statusChanges.sort((a, b) => a.date.getTime() - b.date.getTime());

    let entryDate = null;
    for (const change of statusChanges) {
        if (change.date.getTime() >= exitDate.getTime() - 1000) continue;
        if (normalizeStatus(change.to) === normalizeStatus(exitedStatus)) {
            entryDate = change.date;
        }
    }
    return entryDate || createdDate || null;
};

const postWorklogAsUser = async (issueKey, accountId, payload) => {
    if (!accountId) {
        throw new Error('Cannot create worklog: missing transitioning user accountId');
    }

    // asUser(accountId) is the impersonation API. requestJira must receive a route`` object,
    // not a plain string, or Forge throws requireSafeUrl.
    const response = await api.asUser(accountId).requestJira(
        route`/rest/api/3/issue/${issueKey}/worklog`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }
    );
    return jsonOrThrow(response, `Create worklog for ${issueKey}`);
};

export const run = async (event) => {
    try {
        const issueKey = event?.issue?.key;
        if (!issueKey) {
            console.warn('autoWorklog: missing issue key');
            return;
        }

        const statusChange = findStatusExit(event);
        if (!statusChange) {
            return;
        }

        const exitedStatus = statusChange.fromString;
        const exitDate = event.timestamp ? new Date(Number(event.timestamp)) : new Date();
        const createdDate = event.issue?.fields?.created ? new Date(event.issue.fields.created) : null;

        const changelog = await fetchAllChangelog(issueKey);
        const entryDate = findEntryDate(changelog, exitedStatus, exitDate, createdDate);
        if (!entryDate) {
            console.warn(`autoWorklog: ${issueKey} left "${exitedStatus}" but entry time was not found`);
            return;
        }

        const durationMs = Math.max(exitDate.getTime() - entryDate.getTime(), 0);
        const durationHours = durationMs / (1000 * 60 * 60);
        if (durationHours <= MIN_DURATION_HOURS) {
            console.log(`autoWorklog: ${issueKey} skipped; ${durationHours.toFixed(2)}h in "${exitedStatus}" is under ${MIN_DURATION_HOURS}h`);
            return;
        }

        const worklogs = await fetchAllWorklogs(issueKey);
        if (hasTimeTracked(worklogs, entryDate, exitDate)) {
            console.log(`autoWorklog: ${issueKey} skipped; existing worklog already covers "${exitedStatus}"`);
            return;
        }

        const uncappedSeconds = Math.max(60, Math.round(durationMs / 1000));
        const timeSpentSeconds = Math.min(uncappedSeconds, MAX_DURATION_SECONDS);
        const startedDate = new Date(exitDate.getTime() - timeSpentSeconds * 1000);
        const cappedNote = timeSpentSeconds < uncappedSeconds
            ? ` Capped at 8h (actual status duration ${durationHours.toFixed(1)}h).`
            : '';

        const commentText = `Auto-added by DevMaster when leaving "${exitedStatus}" (${entryDate.toISOString()} - ${exitDate.toISOString()}).${cappedNote}`;
        const commentAdf = {
            type: 'doc',
            version: 1,
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: commentText }]
                }
            ]
        };

        await postWorklogAsUser(issueKey, event.atlassianId, {
            comment: commentAdf,
            started: formatForJira(startedDate),
            timeSpentSeconds
        });

        console.log(`autoWorklog: ${issueKey} logged ${timeSpentSeconds}s for "${exitedStatus}" as ${event.atlassianId || 'app'}`);
    } catch (error) {
        console.error('autoWorklog: failed to add worklog on status exit', error);
    }
};

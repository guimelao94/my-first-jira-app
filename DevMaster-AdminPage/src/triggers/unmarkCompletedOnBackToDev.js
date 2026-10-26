import { storage } from '@forge/api';

const MARK_COMPLETED_STATUSES = ['ready for staging qa', 'cancel', 'canceled', 'cancelled'];
const UNMARK_COMPLETED_STATUSES = ['in dev queue', 'back to dev'];

const normalizeStatus = (value) => (value || '').trim().toLowerCase();

const completedFlagForStatus = (status) => {
    const normalized = normalizeStatus(status);
    if (MARK_COMPLETED_STATUSES.includes(normalized)) return true;
    if (UNMARK_COMPLETED_STATUSES.includes(normalized)) return false;
    return null;
};

const findStatusChange = (event) => {
    const items = event?.changelog?.items || [];
    return items.find((item) => item?.field === 'status' && completedFlagForStatus(item.toString) !== null);
};

export const run = async (event) => {
    try {
        const issueKey = event?.issue?.key;
        if (!issueKey) {
            console.warn('syncCompleted: missing issue key');
            return;
        }

        const statusChange = findStatusChange(event);
        if (!statusChange) {
            return;
        }

        const nextCompleted = completedFlagForStatus(statusChange.toString);
        const stored = (await storage.get(issueKey)) || {};
        if (!!stored.isCompleted === nextCompleted) {
            console.log(`syncCompleted: ${issueKey} skipped; already ${nextCompleted ? 'completed' : 'not completed'}`);
            return;
        }

        await storage.set(issueKey, {
            ...stored,
            isCompleted: nextCompleted
        });

        console.log(`syncCompleted: ${issueKey} ${nextCompleted ? 'marked' : 'unmarked'} completed after move to "${statusChange.toString}"`);
    } catch (error) {
        console.error('syncCompleted: failed to sync completed on status change', error);
    }
};

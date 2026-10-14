import { storage } from '@forge/api';

// "Back to Dev" is a transition into In Dev Queue on some workflows;
// other sites use Back To Dev as the status name itself.
const TARGET_STATUSES = ['back to dev', 'in dev queue'];

const normalizeStatus = (value) => (value || '').trim().toLowerCase();

const isBackToDevStatus = (value) => TARGET_STATUSES.includes(normalizeStatus(value));

const findBackToDevTransition = (event) => {
    const items = event?.changelog?.items || [];
    return items.find((item) => item?.field === 'status' && isBackToDevStatus(item.toString));
};

export const run = async (event) => {
    try {
        const issueKey = event?.issue?.key;
        if (!issueKey) {
            console.warn('unmarkCompleted: missing issue key');
            return;
        }

        const statusChange = findBackToDevTransition(event);
        if (!statusChange) {
            return;
        }

        const stored = (await storage.get(issueKey)) || {};
        if (!stored.isCompleted) {
            console.log(`unmarkCompleted: ${issueKey} skipped; already not completed`);
            return;
        }

        await storage.set(issueKey, {
            ...stored,
            isCompleted: false
        });

        console.log(`unmarkCompleted: ${issueKey} unmarked after move to "${statusChange.toString}"`);
    } catch (error) {
        console.error('unmarkCompleted: failed to unmark completed on Back To Dev', error);
    }
};

import { requestJira } from '@forge/bridge';

// App-defined Forge custom fields (jira:customField) are assigned a generated
// `customfield_NNNNN` id at install time, and that id differs per Jira site. To read their
// values from issue data we must resolve the id at runtime by matching the field's
// schema.custom ARI suffix (which ends with the module key defined in the manifest).

let cachedIds = null;
let inFlight = null;

const APP_FIELD_KEYS = {
    peerReviewEstimate: 'peerReviewEstimate'
};

const resolve = async () => {
    const ids = { peerReviewEstimate: null };
    try {
        const res = await requestJira('/rest/api/3/field', { headers: { Accept: 'application/json' } });
        if (!res.ok) {
            console.error('CustomFields: failed to fetch field metadata', res.status);
            return ids;
        }
        const fields = await res.json();
        for (const [alias, moduleKey] of Object.entries(APP_FIELD_KEYS)) {
            const match = fields.find(
                (f) => typeof f?.schema?.custom === 'string' && f.schema.custom.endsWith(`/${moduleKey}`)
            );
            ids[alias] = match?.id || null;
        }
    } catch (error) {
        console.error('CustomFields: error resolving app field ids', error);
    }
    return ids;
};

// Returns { peerReviewEstimate: 'customfield_NNNNN' | null }, cached after first resolution.
export const getAppFieldIds = async () => {
    if (cachedIds) return cachedIds;
    if (inFlight) return inFlight;
    inFlight = resolve().then((ids) => {
        cachedIds = ids;
        inFlight = null;
        return ids;
    });
    return inFlight;
};

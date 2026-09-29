// Utilities for extracting the peer-review time estimate from the "Development Plan"
// custom field (customfield_11141), which is an Atlassian Document Format (ADF) rich-text
// value. The estimate is authored as free text, e.g. a bullet line like:
//   "Peer review [30m]"   (the time is an inline ADF `status` lozenge)
//   "Peer review [1H]"
//   "PR creation & Peer Review (3h)"   (time in parentheses, different shape)
// Parsing is therefore best-effort and tolerant of mixed units/casing.

const UNIT_SECONDS = {
    d: 8 * 3600, // treat a "day" as 8 working hours
    h: 3600,
    m: 60
};

// Parse a single time token like "30m", "1H", "0.5H", "45M", "1.25h", "3h", "2d" -> seconds.
// Returns 0 when the token is not a recognizable time (e.g. "DONE", "IN-PROGRESS").
export const parseTimeTokenToSeconds = (raw) => {
    if (raw == null) return 0;
    const match = String(raw).trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*([dhm])$/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isFinite(value) || !UNIT_SECONDS[unit]) return 0;
    return Math.round(value * UNIT_SECONDS[unit]);
};

// Flatten an ADF document into trimmed text lines. Inline `status` lozenges are wrapped in
// braces (e.g. "{30m}") so they can be distinguished from literal parentheses in the text.
export const flattenAdfLines = (adf) => {
    if (!adf || typeof adf !== 'object') return [];

    let buffer = '';
    const walk = (node) => {
        if (!node) return;
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (node.type === 'text') {
            buffer += node.text || '';
        } else if (node.type === 'status') {
            buffer += ` {${((node.attrs && node.attrs.text) || '').trim()}} `;
        }
        if (node.content) walk(node.content);
        // Treat block-level nodes as line breaks so each bullet/paragraph is its own line.
        if (node.type === 'paragraph' || node.type === 'listItem' || node.type === 'heading') {
            buffer += '\n';
        }
    };

    walk(adf);
    return buffer
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
};

// Extract the peer-review estimate (in seconds) from a Development Plan ADF value.
// Returns 0 when no peer-review estimate can be confidently parsed.
export const extractPeerReviewSeconds = (adf) => {
    const lines = flattenAdfLines(adf);

    for (const line of lines) {
        if (!/peer\s*review/i.test(line)) continue;

        // 1) Inline status lozenges: "Peer review {30m}"
        const statusTokens = Array.from(line.matchAll(/\{([^}]*)\}/g), (m) => m[1]);
        for (const token of statusTokens) {
            const seconds = parseTimeTokenToSeconds(token);
            if (seconds > 0) return seconds;
        }

        // 2) Parenthesized time: "PR creation & Peer Review (3h)"
        const parenTokens = Array.from(line.matchAll(/\(([^)]*)\)/g), (m) => m[1]);
        for (const token of parenTokens) {
            const seconds = parseTimeTokenToSeconds(token);
            if (seconds > 0) return seconds;
        }

        // 3) Bare time following the label: "Peer review 30m"
        const bare = line.match(/peer\s*review[^0-9]*([0-9]+(?:\.[0-9]+)?\s*[dhm])/i);
        if (bare) {
            const seconds = parseTimeTokenToSeconds(bare[1]);
            if (seconds > 0) return seconds;
        }
    }

    return 0;
};

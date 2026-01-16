
const rules = require('./data.json');

// Generic Fallback Rules for Standard UK Ranges
// Used if specific prefix is not found in data but range is valid.
const GENERIC_RULES = {
    // 01: Geographic. Usually [4, 6] or [3, 7] etc. 
    // Defaulting to widely compatible [4, 6] (01xx xxx xxxx) or [5, 5]?
    // Most 01 are 01xxx. Let's use [4, 6] as safe fallback for "Standard Geographic".
    // Or better: [4, 6] -> 10 len. 011x is [3, 7].
    // Let's use [5, 5] (01xxx xxxxx)? 
    // Actually [4, 6] covers 0121, 0131 (3 digits NDC? 0+3).
    // 0121 is 0121 xxx xxxx.
    // Let's default 01 to [4, 6].
    '01': { b: [4, 6] },
    '02': { b: [2, 4, 4] },
    '03': { b: [3, 3, 4] },
    '05': { b: [3, 3, 4] },
    '07': { b: [4, 6] },
    '08': { b: [3, 3, 4] },
    '09': { b: [3, 3, 4] }
};

/**
 * Clean phone number string, stripping non-digit characters except leading +
 * @param {string} number 
 * @returns {string}
 */
function clean(number) {
    if (!number) return '';
    let cleaned = number.replace(/[^0-9+]/g, '');
    return cleaned;
}

/**
 * Validate and format a UK phone number
 * @param {string} number 
 * @returns {object} Validation result
 */
function validate(number) {
    const cleaned = clean(number);
    let digits = cleaned;

    // Check for Int'l prefix
    if (digits.startsWith('+44')) {
        digits = digits.substring(3);
    }

    let candidates = [];
    if (!digits.startsWith('0')) {
        candidates.push('0' + digits);
        if (digits.startsWith('1')) candidates.push(digits);
    } else {
        candidates.push(digits);
    }

    let bestRule = null;
    let matchedPrefix = '';
    let usedDigits = '';
    let matchMethod = 'none';
    let foundSpecificRule = false; // Flag to track if we hit a specific rule during traversal

    // 1. Exact Lookup
    for (const cand of candidates) {
        let node = rules;
        let p = '';
        let rule = null;
        for (let i = 0; i < cand.length; i++) {
            const char = cand[i];
            if (node[char]) {
                node = node[char];
                p += char;
                if (node._rule) {
                    rule = node._rule;
                    foundSpecificRule = true; // We found a candidate rule in the tree
                }
            } else {
                break;
            }
        }

        if (rule) {
            let expectedLen = 0;
            const sumBlocks = rule.b.reduce((a, v) => a + v, 0);
            if (cand.startsWith('0')) {
                expectedLen = 1 + sumBlocks;
            } else {
                expectedLen = sumBlocks;
            }

            if (cand.length === expectedLen) {
                bestRule = rule;
                matchedPrefix = p;
                usedDigits = cand;
                matchMethod = 'exact';
                break;
            }
        }
    }

    // 2. Generic Fallback
    // ONLY if we didn't find ANY specific rule in the tree path.
    // This prevents falling back to generics for Allocated ranges where length mismatch implies invalidity.
    if (!bestRule && !foundSpecificRule) {
        // Try to match generic ranges if candidate starts with 0
        // We only check candidates that start with 0 for generics (1.. is short code, usually fully listed)

        // Find candidate starting with 0 (or make one)
        let stdCand = candidates.find(c => c.startsWith('0'));
        if (!stdCand && digits.length >= 9) stdCand = '0' + digits; // Auto-prefix 0 if missing and looks like std

        if (stdCand) {
            // Check prefixes 01..09
            const p2 = stdCand.substring(0, 2);
            if (GENERIC_RULES[p2]) {
                const rule = GENERIC_RULES[p2];
                const sumBlocks = rule.b.reduce((a, v) => a + v, 0);
                const expectedLen = 1 + sumBlocks;

                if (stdCand.length === expectedLen) {
                    bestRule = rule;
                    usedDigits = stdCand;
                    matchedPrefix = p2;
                    matchMethod = 'fallback';
                }
            }
        }
    }

    if (!bestRule) {
        return {
            valid: false,
            prefixLength: 0,
            formatted: number,
            formattedInternational: { short: '', long: '' },
            rule: null,
            matchMethod: 'none'
        };
    }

    // Valid!
    const blocks = bestRule.b;
    let form = '';
    let rawIndex = 0;

    // Formatting loop
    let parts = [];
    if (usedDigits.startsWith('0')) {
        rawIndex = 1; // Skip the leading 0 for block extraction
    }

    // Add '0' to first block if it exists
    let firstBlockPart = '';
    if (usedDigits.startsWith('0')) firstBlockPart += '0';

    for (let i = 0; i < blocks.length; i++) {
        const blkLen = blocks[i];
        const chunk = usedDigits.substring(rawIndex, rawIndex + blkLen);
        if (i === 0) {
            firstBlockPart += chunk;
            parts.push(firstBlockPart);
        } else {
            parts.push(chunk);
        }
        rawIndex += blkLen;
    }

    const formattedLocal = parts.join(' ').trim();
    const prefixLength = blocks[0];

    // Intl
    let formattedIntlShort = '';
    let formattedIntlLong = '';

    if (usedDigits.startsWith('0')) {
        const p1 = parts[0];
        const p1_no0 = p1.substring(1);
        const rest = parts.slice(1).join(' ');

        formattedIntlShort = `+44 ${p1_no0} ${rest}`.trim();
        formattedIntlLong = `+44 (0) ${p1_no0} ${rest}`.trim();
    } else {
        formattedIntlShort = `+44 ${formattedLocal}`;
        formattedIntlLong = formattedIntlShort;
    }

    return {
        valid: true,
        prefixLength: prefixLength,
        formatted: formattedLocal,
        formattedInternational: {
            short: formattedIntlShort,
            long: formattedIntlLong
        },
        rule: bestRule,
        matchMethod: matchMethod
    };
}

function getDataInfo() {
    return rules._meta || {};
}

const { version } = require('../package.json');

module.exports = {
    validate,
    getDataInfo,
    version
};

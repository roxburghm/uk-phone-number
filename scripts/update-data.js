
const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');
const { Select, Input } = require('enquirer');

const OFCOM_URL = 'https://www.ofcom.org.uk/siteassets/resources/documents/phones-telecoms-and-internet/information-for-industry/numbering/regular-updates/telephone-numbers/codelist.zip?v=410719';
const DATA_DIR = path.join(__dirname, '../data');
const ZIP_FILE = path.join(DATA_DIR, 'codelist.zip');
const MAPPINGS_FILE = path.join(DATA_DIR, 'mappings.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => { file.close(resolve); });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

function loadMappings() {
    if (fs.existsSync(MAPPINGS_FILE)) return JSON.parse(fs.readFileSync(MAPPINGS_FILE, 'utf8'));
    return { columnB: {}, columnD: {} };
}

function saveMappings(mappings) {
    fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
}

async function getMapping(type, value, mappings, context) {
    if (mappings[type].hasOwnProperty(value)) return mappings[type][value];

    console.log(`\nFound new value in ${type}: "${value}"`);
    if (context) {
        console.log(`Location: ${context.file}:${context.line}`);
        console.log(`Context: ${JSON.stringify(context.row)}`);
    }

    if (type === 'columnB') {
        const prompt = new Select({
            name: 'include',
            message: `Should we include records with status "${value}"?`,
            choices: ['Yes', 'No']
        });
        const answer = await prompt.run();
        const result = answer === 'Yes';
        mappings[type][value] = result;
        saveMappings(mappings);
        return result;
    } else if (type === 'columnD') {
        const lenPrompt = new Input({
            name: 'length',
            message: `What is the total length (excluding 0) for "${value}"? (Enter number)`,
            validate: val => !isNaN(parseInt(val)) || 'Please enter a number'
        });
        const len = parseInt(await lenPrompt.run());

        const blocksPrompt = new Input({
            name: 'blocks',
            message: `Enter blocks array for "${value}" (e.g. 3,3,4) or leave empty:`,
        });
        const blocksStr = await blocksPrompt.run();
        const blocks = blocksStr ? blocksStr.split(',').map(n => parseInt(n.trim())) : [];

        const result = { length: len, blocks: blocks };
        mappings[type][value] = result;
        saveMappings(mappings);
        return result;
    }
}

function calculateBlocks(totalLenExcl0, prefixLenExcl0) {
    const rem = totalLenExcl0 - prefixLenExcl0;
    const blocks = [prefixLenExcl0];
    if (rem < 7) blocks.push(rem);
    else if (rem === 7) blocks.push(3, 4);
    else blocks.push(4, rem - 4);
    return blocks;
}

// FORMATTING OVERRIDES
// These enforce standard UK formatting regardless of granular Ofcom records.
// Key = Prefix (cleaned, so starts with 0 for std, or 1.. for short)
const PREFIX_OVERRIDES = {
    // 03xx Wide area: 0300 xxx xxxx -> [3, 3, 4]
    '03': { b: [3, 3, 4] },
    // 05xx Corp: 0551 xxx xxxx -> [3, 3, 4]
    '05': { b: [3, 3, 4] },
    // 07xx Mobile: 07123 xxxxxx -> [4, 6]
    '07': { b: [4, 6] },
    // 08xx Free/Service: 0800 xxx xxxx -> [3, 3, 4]
    '08': { b: [3, 3, 4] },
    // 09xx Premium: 0900 xxx xxxx -> [3, 3, 4]
    '09': { b: [3, 3, 4] }
};

async function processData() {
    const forceDownload = process.argv.includes('--force');
    let shouldDownload = true;

    if (fs.existsSync(ZIP_FILE) && !forceDownload) {
        const stats = fs.statSync(ZIP_FILE);
        const fileDate = stats.mtime.toDateString();
        const today = new Date().toDateString();
        if (fileDate === today) {
            console.log('Using cached ZIP file from today.');
            shouldDownload = false;
        }
    }

    if (shouldDownload) {
        console.log('Downloading data...');
        await downloadFile(OFCOM_URL, ZIP_FILE);
    }

    console.log('Reading zip...');
    const zip = new AdmZip(ZIP_FILE);
    const zipEntries = zip.getEntries();

    const mappings = loadMappings();
    const rawData = new Map();

    for (const entry of zipEntries) {
        if (!entry.entryName.match(/S[1-9]\.csv/)) continue;

        console.log(`Processing ${entry.entryName}...`);
        const csvContent = entry.getData().toString('utf8');
        const RECORDS = parse(csvContent, { columns: false, skip_empty_lines: true, from_line: 2 });

        for (let i = 0; i < RECORDS.length; i++) {
            const row = RECORDS[i];
            const context = { file: entry.entryName, line: i + 2, row: row };

            const rawPrefix = row[0];
            const rawStatus = row[1];
            const rawLengthStr = row[3];

            if (!rawPrefix) continue;

            const include = await getMapping('columnB', rawStatus, mappings, context);
            if (!include) continue;

            let rule = await getMapping('columnD', rawLengthStr, mappings, context);

            if (typeof rule === 'number') rule = { length: rule, blocks: [] };

            let cleanPrefix;
            let capturedPrefixLenExcl0;

            const spaceIndex = rawPrefix.indexOf(' ');
            if (spaceIndex !== -1) {
                const prefixPart = rawPrefix.substring(0, spaceIndex);
                cleanPrefix = '0' + rawPrefix.replace(/\s+/g, '');
                capturedPrefixLenExcl0 = prefixPart.length;
            } else {
                cleanPrefix = rawPrefix.replace(/\s+/g, '');
                if (rule.length > 6) {
                    cleanPrefix = '0' + cleanPrefix;
                    capturedPrefixLenExcl0 = cleanPrefix.length - 1;
                } else {
                    // Short code
                    capturedPrefixLenExcl0 = cleanPrefix.length;
                }
            }

            if (['101', '105', '111', '112', '999'].includes(cleanPrefix)) {
                if (cleanPrefix.startsWith('0')) cleanPrefix = cleanPrefix.substring(1);
            }

            let finalBlocks = [];

            // Check heuristic override first
            let override = null;
            // Iterate overrides keys for match (longest match wins?)
            // We want specific 015396 to win over 01 (if we had 01).
            // Current keys: 02, 03... 0113... 015396.
            // Check EXACT first, then prefixes?
            // Sort keys by length desc to find longest prefix match.
            const sortedOverrides = Object.keys(PREFIX_OVERRIDES).sort((a, b) => b.length - a.length);
            for (const k of sortedOverrides) {
                if (cleanPrefix.startsWith(k)) {
                    override = PREFIX_OVERRIDES[k];
                    break;
                }
            }

            if (override) {
                finalBlocks = override.b;
            } else if (rule.blocks && rule.blocks.length > 0) {
                finalBlocks = rule.blocks;
            } else {
                finalBlocks = calculateBlocks(rule.length, capturedPrefixLenExcl0);
            }

            if (!override && rule.length <= 6) {
                finalBlocks = [rule.length];
            }

            rawData.set(cleanPrefix, { b: finalBlocks });
        }
    }

    console.log(`Total raw prefixes loaded: ${rawData.size}`);
    console.log('Compressing data...');

    const tree = {};

    // START METADATA CAPTURE
    // Find the latest date from files INSIDE the zip
    let maxDate = new Date(0);
    zipEntries.forEach(entry => {
        const d = entry.getData().length > 0 ? entry.header.time : null;
        // adm-zip header.time is usually the date. Let's verify documentation or use standard property if available.
        // Actually adm-zip entry object has 'time' which is the date.
        // If not, we might need another way. But let's check `entry.d` or similar if `header.time` isn't a Date object.
        // `entry.header.time` is often a Date in newer adm-zip, or we can use `entry.getData()`? No.
        // Let's use `entry.header.time` but ensure it's treated as date.

        // Simpler: `entry.header.time` is a Date object in adm-zip 0.5+
        if (entry.header && entry.header.time) {
            const ed = new Date(entry.header.time);
            if (ed > maxDate) maxDate = ed;
        }
    });

    // Fallback if maxDate is still epoch (empty zip?) - use file stat
    if (maxDate.getTime() === 0) {
        maxDate = fs.statSync(ZIP_FILE).mtime;
    }

    tree._meta = {
        url: OFCOM_URL,
        date: maxDate.toISOString(),
        timestamp: maxDate.getTime()
    };
    // END METADATA CAPTURE

    for (const [prefix, data] of rawData) {
        let node = tree;
        for (const char of prefix) {
            if (!node[char]) node[char] = {};
            node = node[char];
        }
        node._rule = data;
    }

    function compress(node) {
        // Post-order traversal: Compress children first
        const childrenKeys = Object.keys(node).filter(k => k !== '_rule' && k !== '_meta');
        childrenKeys.forEach(key => compress(node[key]));

        // Re-fetch children keys after their potential compression/deletion (though keys don't strictly change, logical "leafness" might)
        // Actually we just need to look at current immediate children
        const currentChildrenKeys = Object.keys(node).filter(k => k !== '_rule' && k !== '_meta');

        if (currentChildrenKeys.length === 0) return;

        // Group children by rule signature
        const ruleCounts = {};
        const ruleMap = {};

        for (const key of currentChildrenKeys) {
            const child = node[key];
            if (child._rule) {
                const sig = JSON.stringify(child._rule);
                if (!ruleCounts[sig]) {
                    ruleCounts[sig] = 0;
                    ruleMap[sig] = child._rule; // Store the object
                }
                ruleCounts[sig]++;
            }
        }

        // Find majority rule
        let bestSig = null;
        let bestCount = -1;

        for (const sig in ruleCounts) {
            if (ruleCounts[sig] > bestCount) {
                bestCount = ruleCounts[sig];
                bestSig = sig;
            }
        }

        // If we found a rule that appears in children
        if (bestSig) {
            const majorityRule = ruleMap[bestSig];

            // Hoist majority rule to current node
            // Note: If current node already had a rule (e.g. from data), this overrides it?
            // "prefixes" usually don't have overlapping specific data vs range data in this tree structure 
            // because we build it from full leaves.
            // But if we are mid-tree, we are creating a rule for a prefix like "017048" which didn't exist before.
            node._rule = majorityRule;

            // Remove matching children (implied by parent)
            for (const key of currentChildrenKeys) {
                const child = node[key];
                if (child._rule && JSON.stringify(child._rule) === bestSig) {
                    // Check if child has incomplete sub-children? 
                    // If child has children of its own, we can ONLY remove the child node 
                    // IF the child node's rule is redundant AND the child has no sub-children that are exceptions.
                    // Wait. If child has sub-children, typically `child._rule` comes from ITS compression.
                    // If `node` (parent) now has the same rule, `child`'s rule is redundant.
                    // But `child` itself might be needed as a path to its sub-children.

                    const childHasSubChildren = Object.keys(child).some(k => k !== '_rule');

                    if (!childHasSubChildren) {
                        // Leaf child matching parent -> Delete completely
                        delete node[key];
                    } else {
                        // Internal node child matching parent -> Remove the redundant rule, but keep the node for path
                        delete child._rule;
                        // Start pruning: recursive cleanup?
                        // If child now has no rule and no specific sub-children? 
                        // (It matches parent rule).
                        // If child has sub-children, they are exceptions to the child's (now parent's) rule.
                        // So keep child node.
                    }
                }
            }
        }
    }

    // Start compression from root
    compress(tree);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tree));
    console.log(`Data saved to ${OUTPUT_FILE}`);
}

processData().catch(err => console.error(err));

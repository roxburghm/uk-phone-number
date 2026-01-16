
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../src/data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function inspect(number) {
    console.log(`\nInspecting: ${number}`);

    // Simple clean
    let clean = number.replace(/[^0-9]/g, '');
    if (clean.startsWith('44')) clean = '0' + clean.substring(2);

    console.log(`Cleaned (traversal key): ${clean}`);

    let node = data;
    let pathFound = '';

    // Traverse
    for (const char of clean) {
        if (node[char]) {
            node = node[char];
            pathFound += char;

            console.log(`\nStep '${char}' -> Path: ${pathFound}`);

            if (node._rule) {
                console.log('  Found Rule:', JSON.stringify(node._rule));
            } else {
                console.log('  (No specific rule at this node)');
            }

            const children = Object.keys(node).filter(k => k !== '_rule');
            if (children.length > 0) {
                // Don't dump all children, too noisy. Just counts.
                console.log(`  Children: ${children.length} keys (${children.join(', ')})`);
            }
        } else {
            console.log(`\nStopped at '${char}' - No further path in dictionary.`);
            break;
        }
    }
}

// Allow CLI usage: node scripts/inspect.js 01204123456
const args = process.argv.slice(2);
if (args.length > 0) {
    inspect(args[0]);
} else {
    console.log("Usage: node scripts/inspect.js <number>");
}

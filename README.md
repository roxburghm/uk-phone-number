
# UK Phone Number Validator

A data-driven JavaScript library for validating and formatting UK telephone numbers. This library uses official Ofcom data to ensure accurate validation and formatting rules for specific prefixes, including standard geographic numbers, mobile numbers, service numbers, and short codes.

[Try the Demo](https://htmlpreview.github.io/?https://github.com/roxburghm/uk-phone-number/blob/main/demo/index.html)

## Features

- **Accurate Validation**: Validates numbers against official Ofcom allocation records.
- **Precise Formatting**: Formats numbers according to standard UK conventions (e.g., `020 xxxx xxxx`, `07xxx xxxxxx`, `015396 xxxxx`).
- **International Support**: Generates standard international formats (+44).
- **Data-Driven**: Uses a compressed radix tree structure derived directly from Ofcom's daily codelists.
- **Lightweight**: Zero runtime dependencies for the core library.

For compression reasons assumptions have been made about some validity. For example if 01234 1, 01234 2 and 01234 3 are all valid and the remaining prefixes are not in the ofcom data then only 01234 is stored in the data and it's assumed that 01234 4 - 9 are also valid. This is a trade-off for compression purposes. 

## Installation

```bash
npm install uk-phone-number
```

## Usage

```javascript
const UKPhone = require('uk-phone-number');

// Validate and format
const result = UKPhone.validate('020 7946 0000');

if (result.valid) {
    console.log(result.formatted); // "020 7946 0000"
    console.log(result.formattedInternational.short); // "+44 20 7946 0000"
    console.log(result.formattedInternational.long); // "+44 (0) 20 7946 0000"
    console.log(result.rule); // Debug info about the matched rule
} else {
    console.log('Invalid number');
}
```

### Return Object

The `validate` function returns an object with the following structure:

```json
{
    "valid": true,
    "prefixLength": 2, // e.g. 2 for "020" (excluding leading 0 it matches "20")
    "formatted": "020 7946 0000",
    "formattedInternational": {
        "short": "+44 20 7946 0000",
        "long": "+44 (0) 20 7946 0000"
    },
    "matchMethod": "exact", // 'exact' (data match) or 'fallback' (standard pattern)
    "rule": { 
        "b": [2, 4, 4] // Formatting blocks
    }
}
```

## Library Metadata

You can access library version and data provenance information:

```javascript
console.log(UKPhone.version); // e.g. "1.0.2"

const meta = UKPhone.getDataInfo();
console.log(meta.date); // ISO Date string of the source data (e.g. "2023-10-27T...")
console.log(meta.url);  // URL from where the data was sourced
```

## Formatting Logic

formatting is determined by a `blocks` array logic. For example:
- `020 7946 0000`: Blocks `[2, 4, 4]` -> `020` (2 digit NDC) `7946` (4) `0000` (4).
- `07700 900123`: Blocks `[5, 6]` -> `07700` (5) `900123` (6).
- `015396 12345`: Blocks `[6, 5]` -> `015396` (6) `12345` (5).

## Updating Data

This library relies on a generated `src/data.json` file. You can update this file from the latest Ofcom data using the included script.

```bash
npm run update-data
```
The script downloads the latest `codelist.zip` from Ofcom, parses it, applies user-defined mappings (`data/mappings.json`) and heuristic overrides to ensure formatting consistency, and compresses it into `src/data.json`.

## Building for Browser

To create a standalone bundle for browser usage:

```bash
npm run build
# Creates dist/uk-phone.js
```

A minified version is also available:
```bash
npm run build:min
# Creates dist/uk-phone.min.js
```

## Testing

Run the test suite:
```bash
npm test
```
This runs unit tests (`tests/index.test.js`) and a comprehensive suite (`tests/comprehensive.test.js`) covering various number types and edge cases.

## License
MIT
# uk-phone-number

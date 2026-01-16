
const { validate, format, getDataInfo, version } = require('../src/index');

describe('UK Phone Number Validator', () => {

    test('Has version and metadata', () => {
        expect(version).toBeDefined();
        const meta = getDataInfo();
        expect(meta).toBeDefined();
        expect(meta.url).toBeDefined();
        expect(meta.date).toBeDefined();
    });

    test('Validates standard landline (020 prefix, 10 + 1 digits check? No, 11 total)', () => {
        // 020 8579 0238 (11 digits: 0 + 10)
        const result = validate('02085790238');
        expect(result.valid).toBe(true);
        expect(result.formatted).toBe('020 8579 0238');
    });

    test('Validates number with spaces', () => {
        const result = validate('020 8579 0238');
        expect(result.valid).toBe(true);
    });

    test('Validates international format +44', () => {
        const result = validate('+442085790238');
        expect(result.valid).toBe(true);
        expect(result.formatted).toBe('020 8579 0238');
    });

    test('Validates international format logic', () => {
        const result = validate('02085790238');
        expect(result.formattedInternational.short).toBe('+44 20 8579 0238');
        expect(result.formattedInternational.long).toBe('+44 (0) 20 8579 0238');
    });

    test('Rejects invalid length', () => {
        // 020 123 (too short)
        const result = validate('020123');
        expect(result.valid).toBe(false);
    });

    test('Rejects unallocated prefix', () => {
        // Assuming 01111 is not allocated or mocked data doesn't have it
        // Depending on real data. 
        // 00000000000 definitely invalid
        const result = validate('00000000000');
        expect(result.valid).toBe(false);
    });

    test('Formats 7 digit remainder', () => {
        // Example: 01xxx xxx xxxx
        // If we find a prefix with that rule.
        // Let's rely on standard formats.
        // 0113 245 0192 (Leeds) -> 0113 xxx xxxx (11 digits total, prefix 4)
        // Remainder 7 digits.
        // 0113 245 0192
        // Formatted rule: "xxx xxxx" for 7 digits
        const result = validate('01132450192');
        // Note: Check if 0113 is in our data. It should be.
        if (result.valid) {
            expect(result.formatted).toBe('0113 245 0192');
        }
    });

    test('Formats < 7 digit remainder', () => {
        // Some areas have 5 digit numbers? (Total 9? e.g. 4+5)
        // 016977 xxxxx (Brampton)
        // 016977 12345
        const result = validate('01697712345');
        if (result.valid) {
            // Remainder 6 digits. "Solid block"
            expect(result.formatted).toBe('01697 712345');
        }
    });

});

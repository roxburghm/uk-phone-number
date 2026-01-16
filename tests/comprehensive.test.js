
const { validate } = require('../src/index');

const testData = [
    { input: '2079460123', expected: '020 7946 0123', type: 'Geographic' },
    { input: '2039845521', expected: '020 3984 5521', type: 'Geographic' },
    { input: '1132457789', expected: '0113 245 7789', type: 'Geographic' },
    { input: '1163029988', expected: '0116 302 9988', type: 'Geographic' },
    { input: '1216654321', expected: '0121 665 4321', type: 'Geographic' },
    { input: '1204998432', expected: '01204 998432', type: 'Geographic' },
    { input: '1315567842', expected: '0131 556 7842', type: 'Geographic' },
    { input: '1382445566', expected: '01382 445566', type: 'Geographic' },
    { input: '1412239876', expected: '0141 223 9876', type: 'Geographic' },
    { input: '1452778899', expected: '01452 778899', type: 'Geographic' },
    { input: '1512203344', expected: '0151 220 3344', type: 'Geographic' },
    { input: '1524998877', expected: '01524 998877', type: 'Geographic' },
    { input: '1539655221', expected: '015396 55221', type: 'Geographic' },
    { input: '1615002233', expected: '0161 500 2233', type: 'Geographic' },
    { input: '1632960001', expected: '01632 960001', type: 'Geographic' },
    { input: '1642554433', expected: '01642 554433', type: 'Geographic' },
    { input: '1722112233', expected: '01722 112233', type: 'Geographic' },
    { input: '1782445566', expected: '01782 445566', type: 'Geographic' },
    { input: '1865778899', expected: '01865 778899', type: 'Geographic' },
    { input: '1912304455', expected: '0191 230 4455', type: 'Geographic' },
    { input: '1932432100', expected: '01932 432100', type: 'Geographic' },
    { input: '1977223344', expected: '01977 223344', type: 'Geographic' },
    { input: '1983876543', expected: '01983 876543', type: 'Geographic' },
    { input: '1995667788', expected: '01995 667788', type: 'Geographic' },
    { input: '3001234567', expected: '0300 123 4567', type: '03 Non-geographic' },
    { input: '3005558899', expected: '0300 555 8899', type: '03 Non-geographic' },
    { input: '3302213344', expected: '0330 221 3344', type: '03 Non-geographic' },
    { input: '3332001122', expected: '0333 200 1122', type: '03 Non-geographic' },
    { input: '3456789900', expected: '0345 678 9900', type: '03 Non-geographic' },
    { input: '3704455566', expected: '0370 445 5566', type: '03 Non-geographic' },
    { input: '3801122334', expected: '0380 112 2334', type: '03 Non-geographic' },
    { input: '3907788990', expected: '0390 778 8990', type: '03 Non-geographic' },
    { input: '3309996655', expected: '0330 999 6655', type: '03 Non-geographic' },
    { input: '3008801122', expected: '0300 880 1122', type: '03 Non-geographic' },
    { input: '5511234567', expected: '0551 123 4567', type: 'Corporate / VoIP' },
    { input: '5519981123', expected: '0551 998 1123', type: 'Corporate / VoIP' },
    { input: '5524457788', expected: '0552 445 7788', type: 'Corporate / VoIP' },
    { input: '5551122244', expected: '0555 112 2244', type: 'Corporate / VoIP' },
    { input: '5605507788', expected: '0560 550 7788', type: 'Corporate / VoIP' },
    { input: '5608823344', expected: '0560 882 3344', type: 'Corporate / VoIP' },
    { input: '5612246688', expected: '0561 224 6688', type: 'Corporate / VoIP' },
    { input: '5618829900', expected: '0561 882 9900', type: 'Corporate / VoIP' },
    { input: '5604451122', expected: '0560 445 1122', type: 'Corporate / VoIP' },
    { input: '5627781100', expected: '0562 778 1100', type: 'Corporate / VoIP' },
    { input: '7123445566', expected: '07123 445566', type: 'Mobile' },
    { input: '7145998877', expected: '07145 998877', type: 'Mobile' },
    { input: '7200112233', expected: '07200 112233', type: 'Mobile' },
    { input: '7288667788', expected: '07288 667788', type: 'Mobile' },
    { input: '7300998877', expected: '07300 998877', type: 'Mobile' },
    { input: '7377221199', expected: '07377 221199', type: 'Mobile' },
    { input: '7400112244', expected: '07400 112244', type: 'Mobile' },
    { input: '7455667700', expected: '07455 667700', type: 'Mobile' },
    { input: '7500556677', expected: '07500 556677', type: 'Mobile' },
    { input: '7533119988', expected: '07533 119988', type: 'Mobile' },
    { input: '7624778899', expected: '07624 778899', type: 'Mobile' },
    { input: '7700900123', expected: '07700 900123', type: 'Mobile' },
    { input: '7788220033', expected: '07788 220033', type: 'Mobile' },
    { input: '7800551122', expected: '07800 551122', type: 'Mobile' },
    { input: '7855893344', expected: '07855 893344', type: 'Mobile' },
    { input: '7900123456', expected: '07900 123456', type: 'Mobile' },
    { input: '7911445500', expected: '07911 445500', type: 'Mobile' },
    { input: '7922667788', expected: '07922 667788', type: 'Mobile' },
    { input: '7933889911', expected: '07933 889911', type: 'Mobile' },
    { input: '7488552233', expected: '07488 552233', type: 'Mobile' },
    { input: '7166338899', expected: '07166 338899', type: 'Mobile' },
    { input: '7399774422', expected: '07399 774422', type: 'Mobile' },
    { input: '7588990011', expected: '07588 990011', type: 'Mobile' },
    { input: '7766223344', expected: '07766 223344', type: 'Mobile' },
    { input: '7899110022', expected: '07899 110022', type: 'Mobile' },
    { input: '8001112222', expected: '0800 111 2222', type: 'Freephone' },
    { input: '8008009000', expected: '0800 800 9000', type: 'Freephone' },
    { input: '8005557788', expected: '0800 555 7788', type: 'Freephone' },
    { input: '8081003344', expected: '0808 100 3344', type: 'Freephone' },
    { input: '8082005566', expected: '0808 200 5566', type: 'Freephone' },
    { input: '8001238800', expected: '0800 123 8800', type: 'Freephone' },
    { input: '8088001122', expected: '0808 800 1122', type: 'Freephone' },
    { input: '8004007788', expected: '0800 400 7788', type: 'Freephone' },
    { input: '8009901100', expected: '0800 990 1100', type: 'Freephone' },
    { input: '8081237777', expected: '0808 123 7777', type: 'Freephone' },
    { input: '8432213344', expected: '0843 221 3344', type: 'Service' },
    { input: '8449981122', expected: '0844 998 1122', type: 'Service' },
    { input: '8455567788', expected: '0845 556 7788', type: 'Service' },
    { input: '8450803344', expected: '0845 080 3344', type: 'Service' },
    { input: '8702218899', expected: '0870 221 8899', type: 'Service' },
    { input: '8715501122', expected: '0871 550 1122', type: 'Service' },
    { input: '8727789900', expected: '0872 778 9900', type: 'Service' },
    { input: '8719905577', expected: '0871 990 5577', type: 'Service' },
    { input: '8453302299', expected: '0845 330 2299', type: 'Service' },
    { input: '8701124466', expected: '0870 112 4466', type: 'Service' },
    { input: '9001234567', expected: '0900 123 4567', type: 'Premium' },
    { input: '9045567788', expected: '0904 556 7788', type: 'Premium' },
    { input: '9058823344', expected: '0905 882 3344', type: 'Premium' },
    { input: '9821107766', expected: '0982 110 7766', type: 'Premium' },
    { input: '9893342299', expected: '0989 334 2299', type: 'Premium' }
];

describe('Comprehensive Data Tests', () => {

    const prefixes = [
        '',           // raw
        '0',          // std
        '+44',        // intl
        '+44 (0) '    // intl with 0
    ];

    function testCase(type, input, expected) {
        prefixes.forEach(p => {
            const numberToTest = p + input;

            test(`[${type}] [OK] ${numberToTest} -> ${expected}`, () => {
                const result = validate(numberToTest);
                if (!result.valid) {
                    console.error(`Failed valid check for ${numberToTest}. Got valid:false. Rule found: ${JSON.stringify(result)}`);
                }
                expect(result.valid).toBe(true);
                expect(result.formatted).toBe(expected);
            });
        });
    }

    function negativeTest(type, shortInput, longInput) {
        test(`[${type}] [FAIL] Too short: ${shortInput}`, () => {
            const result = validate(shortInput);
            expect(result.valid).toBe(false);
        });

        test(`[${type}] [FAIL] Too long: ${longInput}`, () => {
            const result = validate(longInput);
            expect(result.valid).toBe(false);
        });
    }

    testData.forEach(({ input, expected, type }) => {
        testCase(type, input, expected);

        // Negative Tests
        // 1. Too Short: Drop last digit
        const shortInput = '0' + input.slice(0, -1);
        // 2. Too Long: Add '7'
        const longInput = '0' + input + '7';
        negativeTest(type, shortInput, longInput);
    });

});

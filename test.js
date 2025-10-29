// Test script for parseDateTime function
// Copy the parseDateTime function here for testing

function parseDateTime(dateStr, timeStr, platform) {
    let dateParts, timeParts;

    if (platform === 'whatsapp') {
        // Handles different date formats
        if (dateStr.includes('/')) {
            dateParts = dateStr.split('/');
        } else if (dateStr.includes('-')) {
            dateParts = dateStr.split('-');
        }
        timeParts = timeStr.split(':');
    } else if (platform === 'telegram') {
        dateParts = dateStr.split('.');
        timeParts = timeStr.split(':');
    } else if (platform === 'facebook') {
        dateParts = dateStr.split('/');
        timeParts = timeStr.split(':');
    }

    let day, month, year;

    if (platform === 'whatsapp' || platform === 'facebook') {
        // Check for yy/mm/dd format (first part >=20, all 2 digits)
        if (dateParts.length === 3 &&
            dateParts[0].length === 2 &&
            dateParts[1].length === 2 &&
            dateParts[2].length === 2 &&
            parseInt(dateParts[0]) >= 20) {
            // yy/mm/dd
            year = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1;
            day = parseInt(dateParts[2]);
        } else {
            // Existing logic for other formats
            if (dateParts[0].length === 4) {
                // YYYY/MM/DD
                year = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
                day = parseInt(dateParts[2]);
            } else if (parseInt(dateParts[0]) > 12) {
                // MM/DD/YY
                day = parseInt(dateParts[1]);
                month = parseInt(dateParts[0]) - 1;
                year = parseInt(dateParts[2]);
            } else {
                // DD/MM/YY
                day = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
                year = parseInt(dateParts[2]);
            }
        }
    } else if (platform === 'telegram') {
        if (dateParts[0].length === 4) {
            // YYYY.MM.DD
            year = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1;
            day = parseInt(dateParts[2]);
        } else {
            // DD.MM.YY
            day = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1;
            year = parseInt(dateParts[2]);
        }
    }
    if (year < 100) {
        year += 2000;
    }
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = timeParts.length > 2 ? parseInt(timeParts[2]) : 0;

    return new Date(year, month, day, hours, minutes, seconds);
}

// Test cases (expected in UTC, assuming local timezone is UTC+2)
const tests = [
    // WhatsApp
    { dateStr: '12/05/23', timeStr: '10:30', platform: 'whatsapp', expected: '2023-05-12T08:30:00.000Z' }, // DD/MM/YY -> May 12, 2023
    { dateStr: '05/12/23', timeStr: '10:30', platform: 'whatsapp', expected: '2023-12-05T08:30:00.000Z' }, // DD/MM/YY -> Dec 5, 2023
    { dateStr: '2023/05/12', timeStr: '10:30', platform: 'whatsapp', expected: '2023-05-12T08:30:00.000Z' }, // YYYY/MM/DD
    { dateStr: '23/05/12', timeStr: '10:30', platform: 'whatsapp', expected: '2023-05-12T08:30:00.000Z' }, // yy/mm/dd -> May 12, 2023
    // Telegram
    { dateStr: '12.05.23', timeStr: '10:30', platform: 'telegram', expected: '2023-05-12T08:30:00.000Z' }, // DD.MM.YY
    { dateStr: '2023.05.12', timeStr: '10:30', platform: 'telegram', expected: '2023-05-12T08:30:00.000Z' }, // YYYY.MM.DD
    // Facebook (similar to WhatsApp)
    { dateStr: '12/05/23', timeStr: '10:30', platform: 'facebook', expected: '2023-05-12T08:30:00.000Z' },
    { dateStr: '05/12/23', timeStr: '10:30', platform: 'facebook', expected: '2023-12-05T08:30:00.000Z' },
    { dateStr: '2023/05/12', timeStr: '10:30', platform: 'facebook', expected: '2023-05-12T08:30:00.000Z' },
    { dateStr: '23/05/12', timeStr: '10:30', platform: 'facebook', expected: '2023-05-12T08:30:00.000Z' }, // yy/mm/dd -> May 12, 2023
    // Edge cases
    { dateStr: '01/01/24', timeStr: '00:00', platform: 'whatsapp', expected: '2023-12-31T22:00:00.000Z' }, // New year
    { dateStr: '31.12.22', timeStr: '23:59', platform: 'telegram', expected: '2022-12-31T21:59:00.000Z' }, // End of year
];

console.log('Testing parseDateTime function...\n');

tests.forEach((test, index) => {
    const result = parseDateTime(test.dateStr, test.timeStr, test.platform);
    const resultISO = result.toISOString();
    const pass = resultISO === test.expected;
    console.log(`Test ${index + 1}: ${test.platform} - ${test.dateStr} ${test.timeStr}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got:      ${resultISO}`);
    console.log(`  Result:   ${pass ? 'PASS' : 'FAIL'}\n`);
});

console.log('Testing complete.');

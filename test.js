// Test script for parseDateTime function
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

// Test cases
const testCases = [
    // yy/mm/dd format (new)
    { dateStr: '23/12/25', timeStr: '10:30', platform: 'whatsapp', expected: new Date(2023, 11, 25, 10, 30) }, // Dec 25, 2023
    { dateStr: '24/01/15', timeStr: '14:45', platform: 'facebook', expected: new Date(2024, 0, 15, 14, 45) }, // Jan 15, 2024

    // dd/mm/yy format (existing)
    { dateStr: '25/12/23', timeStr: '11:00', platform: 'whatsapp', expected: new Date(2023, 11, 25, 11, 0) }, // Dec 25, 2023
    { dateStr: '15/01/24', timeStr: '16:20', platform: 'facebook', expected: new Date(2024, 0, 15, 16, 20) }, // Jan 15, 2024

    // Other formats
    { dateStr: '2023/12/25', timeStr: '12:00', platform: 'whatsapp', expected: new Date(2023, 11, 25, 12, 0) }, // YYYY/MM/DD
    { dateStr: '12/25/23', timeStr: '13:30', platform: 'whatsapp', expected: new Date(2023, 11, 25, 13, 30) }, // MM/DD/YY
];

console.log('Testing parseDateTime function...\n');

testCases.forEach((test, index) => {
    const result = parseDateTime(test.dateStr, test.timeStr, test.platform);
    const passed = result.getTime() === test.expected.getTime();
    console.log(`Test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}`);
    console.log(`  Input: ${test.dateStr} ${test.timeStr} (${test.platform})`);
    console.log(`  Expected: ${test.expected.toISOString()}`);
    console.log(`  Got: ${result.toISOString()}`);
    if (!passed) {
        console.log('  ERROR: Dates do not match!');
    }
    console.log('');
});

console.log('Testing complete.');

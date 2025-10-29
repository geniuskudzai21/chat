const fs = require('fs');

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
        if (dateParts[0].length == 4) {
            // yyyy/mm/dd
            year = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1;
            day = parseInt(dateParts[2]);
        } else {
            if (parseInt(dateParts[0]) > 12) {
                // yy/mm/dd
                year = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
                day = parseInt(dateParts[2]);
            } else {
                // dd/mm/yy
                day = parseInt(dateParts[0]);
                month = parseInt(dateParts[1]) - 1;
                year = parseInt(dateParts[2]);
            }
        }
    } else if (platform === 'telegram') {
        day = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]) - 1;
        year = parseInt(dateParts[2]);
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
console.log('Testing parseDateTime function:');

// Test dd/mm/yy (existing format)
let date = parseDateTime('23/05/24', '10:30', 'whatsapp');
console.log('dd/mm/yy: 23/05/24 ->', date.toISOString());

// Test yy/mm/dd (new format)
date = parseDateTime('24/05/23', '10:30', 'whatsapp');
console.log('yy/mm/dd: 24/05/23 ->', date.toISOString());

// Test yyyy/mm/dd (if present)
date = parseDateTime('2024/05/23', '10:30', 'whatsapp');
console.log('yyyy/mm/dd: 2024/05/23 ->', date.toISOString());

// Test telegram (should remain unchanged)
date = parseDateTime('23.05.24', '10:30', 'telegram');
console.log('telegram: 23.05.24 ->', date.toISOString());

// Test specific yyyy/mm/dd format
date = parseDateTime('2023/02/21', '10:30', 'whatsapp');
console.log('yyyy/mm/dd specific: 2023/02/21 ->', date.toISOString());

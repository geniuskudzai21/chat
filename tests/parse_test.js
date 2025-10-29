// Lightweight tests for the updated parseDateTime from script.js

function parseDateTime(dateStr, timeStr, platform) {
    dateStr = dateStr.replace(/-/g, '/').trim();
    if (platform === 'telegram') {
        dateStr = dateStr.replace(/\./g, '/');
    }

    const dateParts = dateStr.split('/').map(p => p.trim());
    const timeParts = timeStr.trim().split(':').map(p => p.trim());

    let day = 1, month = 0, year = new Date().getFullYear();

    if (dateParts.length === 3) {
        const p0 = dateParts[0];
        const p1 = dateParts[1];
        const p2 = dateParts[2];

        if (p0.length === 4) {
            year = parseInt(p0, 10);
            month = parseInt(p1, 10) - 1;
            day = parseInt(p2, 10);
        } else if (p2.length === 4) {
            year = parseInt(p2, 10);
            const first = parseInt(p0, 10);
            const second = parseInt(p1, 10);
            if (first > 12) {
                day = first;
                month = second - 1;
            } else if (second > 12) {
                month = first - 1;
                day = second;
            } else {
                day = first;
                month = second - 1;
            }
        } else {
            let yy = parseInt(p2, 10);
            if (!isNaN(yy)) {
                year = yy < 100 ? 2000 + yy : yy;
            }
            const first = parseInt(p0, 10);
            const second = parseInt(p1, 10);
            if (first > 12) {
                day = first;
                month = second - 1;
            } else if (second > 12) {
                month = first - 1;
                day = second;
            } else {
                day = first;
                month = second - 1;
            }
        }
    }

    let hours = 0, minutes = 0, seconds = 0;
    if (timeParts.length >= 1) hours = parseInt(timeParts[0], 10) || 0;
    if (timeParts.length >= 2) minutes = parseInt(timeParts[1], 10) || 0;
    if (timeParts.length >= 3) seconds = parseInt(timeParts[2], 10) || 0;

    const ampmMatch = timeStr.match(/(am|pm)/i);
    if (ampmMatch) {
        const isPm = /pm/i.test(ampmMatch[0]);
        if (isPm && hours < 12) hours += 12;
        if (!isPm && hours === 12) hours = 0;
    }

    if (year < 100) year += 2000;
    if (month < 0) month = 0;
    if (day < 1) day = 1;

    return new Date(year, month, day, hours, minutes, seconds);
}

const samples = [
    { line: '2023/11/30, 07:52 - You created this group', platform: 'whatsapp' },
    { line: '2023/12/05, 22:19 - vimbai Violet: Tadie and kaerezi inbox', platform: 'whatsapp' },
    { line: '2023/12/08, 04:37 - GNC🥰🥰: 😂😂 hey ,Yeah we are all fine & we are enjoying holiday iyi ...bt that doesn\'t mean kt tane maPics a notarisika 🤭🤭 Good mrng', platform: 'whatsapp' },
    { line: '07/12/23, 10:05 - John Doe: Hello there', platform: 'whatsapp' },
    { line: '12/25/23, 13:30 - Jane: Merry Christmas', platform: 'whatsapp' }
];

console.log('Running parse tests...');
for (const s of samples) {
    // Try to extract date/time/sender/message similar to the main parser
    const regex = /^(\[?\s*)?(\d{1,4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]m)?)\s*-\s*([^:]+):?\s*(.*)$/i;
    const m = s.line.match(regex);
    if (m) {
        const dateStr = m[2];
        const timeStr = m[3];
        const sender = m[4];
        const message = m[5];
        const dt = parseDateTime(dateStr, timeStr, s.platform);
        console.log('\nLine: ' + s.line);
        console.log('  Parsed -> date:', dateStr, 'time:', timeStr);
        console.log('  Sender:', sender);
        console.log('  Message:', message.substring(0,60));
        console.log('  Date object ->', dt.toISOString());
    } else {
        console.log('\nLine did not match regex:', s.line);
    }
}

console.log('\nTests complete.');

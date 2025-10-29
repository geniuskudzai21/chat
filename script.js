const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const platformSelect = document.getElementById('platformSelect');
const durationSelect = document.getElementById('durationSelect');
const customDateRange = document.getElementById('customDateRange');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const resultsSection = document.getElementById('results');

let chatData = null;
let currentCharts = [];
let individualChart = null;
let userDaysChart = null;

const POSITIVE_WORDS = ['good', 'great', 'excellent', 'awesome', 'wonderful', 'happy', 'love', 'like', 'nice', 'best', 'amazing', 'fantastic', 'perfect', 'beautiful', 'fun', 'joy', 'pleasure', 'smile', 'laugh', 'success'];

document.addEventListener('DOMContentLoaded', function() {
    // Setting up event listeners
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-500');
        dropZone.classList.remove('border-gray-300');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-indigo-500');
        dropZone.classList.add('border-gray-300');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500');
        dropZone.classList.add('border-gray-300');

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    analyzeBtn.addEventListener('click', analyzeChat);

    // Duration selection event listener
    durationSelect.addEventListener('change', toggleCustomDateRange);

    // Checking if we have stored data
    const storedData = localStorage.getItem('chatData');
    if (storedData) {
        chatData = JSON.parse(storedData);
        analyzeBtn.disabled = false;
    }
});

// Functions
function handleFileSelect(file) {
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
        alert('Please upload a text file (.txt)');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please upload a smaller file.');
        return;
    }

    // Show file name in the drop zone
    fileName.textContent = file.name;
    fileName.classList.remove('hidden');

    // Upload to server
    uploadFile(file);
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const uploadedFile = await response.json();
            alert('File uploaded successfully!');
            // Store the uploaded file ID for analysis
            localStorage.setItem('uploadedFileId', uploadedFile._id);
            // Parse and prepare for analysis
            const platform = platformSelect.value;
            chatData = parseChat(uploadedFile.content, platform);
            analyzeBtn.disabled = false;
            localStorage.setItem('chatData', JSON.stringify(chatData));
        } else {
            alert('Failed to upload file.');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file.');
    }
}

function parseChat(content, platform) {
    const lines = content.split('\n');
    const messages = [];
    let currentDate = null;

    const patterns = {
        whatsapp: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),? (\d{1,2}:\d{2}) - ([^:]+): (.+)$/,
        whatsapp2: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),? (\d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$/,
        telegram: /^(\d{1,2}\.\d{1,2}\.\d{2,4}),? (\d{1,2}:\d{2}) - ([^:]+): (.+)$/,
        facebook: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),? (\d{1,2}:\d{2}) - ([^:]+): (.+)$/
    };
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        let match = null;

        if (platform === 'whatsapp') {
            match = line.match(patterns.whatsapp) || line.match(patterns.whatsapp2);
        } else if (platform === 'telegram') {
            match = line.match(patterns.telegram);
        } else if (platform === 'facebook') {
            match = line.match(patterns.facebook);
        }
        
        if (match) {
            let dateStr, timeStr, sender, text;
            
            if (patterns.whatsapp2.test(line)) {
                [, dateStr, timeStr, sender, text] = match;
            } else {
                [, dateStr, timeStr, sender, text] = match;
            }

            const dateTime = parseDateTime(dateStr, timeStr, platform);
            
            messages.push({
                date: dateTime,
                sender: sender.trim(),
                message: text.trim(),
                timestamp: dateTime.getTime()
            });
            currentDate = dateTime;
        } else if (messages.length > 0) {
            messages[messages.length - 1].message += '\n' + line;
        }
    }
    
    return messages;
}

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
        if (parseInt(dateParts[0]) > 1) {
            day = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1;
            year = parseInt(dateParts[2]);
        } else {
            day = parseInt(dateParts[1]);
            month = parseInt(dateParts[0]) - 1;
            year = parseInt(dateParts[2]);
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
function analyzeChat() {
    if (!chatData || chatData.length === 0) {
        alert('Please input a .txt file first');
        return;
    }
    clearCharts();

    analyzeBtn.innerHTML = '<div class="loading"></div> Analyzing...';
    analyzeBtn.disabled = true;

    setTimeout(() => {
        try {
            // Get date range and filter messages
            const dateRange = getDateRange();
            const filteredMessages = filterMessagesByDate(chatData, dateRange);

            if (filteredMessages.length === 0) {
                alert('No messages found in the selected date range.');
                return;
            }

            // Analyze the chat
            const analysis = performAnalysis(filteredMessages);
            // Visualize the results
            visualizeResults(analysis);
            // Show results section
            resultsSection.classList.remove('hidden');
            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("Error during analysis:", error);
            alert("An error occurred during analysis. Please try again.");
        } finally {
            // Always reset button state
            analyzeBtn.innerHTML = '<i class="fas fa-chart-line mr-2"></i> Analyze Chat';
            analyzeBtn.disabled = false;
        }
    }, 100);
}

function clearCharts() {
    // Destroy all existing charts to prevent memory leaks
    currentCharts.forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    currentCharts = [];
}

function performAnalysis(messages) {
    if (messages.length === 0) {
        return null;
    }

    // Basic statistics
    const users = {};
    let firstMessageOfDay = {};
    let lastMessageTimePerDay = {};
    let responseTimes = {};
    let currentDay = null;
    let activeHours = Array(24).fill(0);
    let dailyActivity = {};
    let wordFrequency = {};
    let emojiFrequency = {};
    let sentimentData = [];
    let emotionalTimeline = {};

    // Process each message
    messages.forEach((msg, index) => {
        const date = msg.date;
        const sender = msg.sender;
        const message = msg.message;
        const timestamp = msg.timestamp;

        // Initialize user if not exists
        if (!users[sender]) {
            users[sender] = {
                messageCount: 0,
                totalChars: 0,
                totalWords: 0,
                words: {},
                emojis: {},
                sentimentScore: 0,
                firstMessageCount: 0,
                hourlyActivity: Array(24).fill(0),
                dailyActivity: {},
                dailyActivityByDay: Array(7).fill(0),
                topMessages: [],
                totalPositiveWords: 0
            };
        }

        // Update user stats
        users[sender].messageCount++;
        users[sender].totalChars += message.length;
        users[sender].totalWords += countWords(message);

        // Track first message of the day
        const dayKey = date.toDateString();
        if (!firstMessageOfDay[dayKey]) {
            firstMessageOfDay[dayKey] = sender;
            users[sender].firstMessageCount++;
        }

        // Reset last message time for new day
        if (currentDay !== dayKey) {
            lastMessageTimePerDay = {};
            currentDay = dayKey;
        }

        // Track response times
        if (lastMessageTimePerDay[sender]) {
            const responseTime = timestamp - lastMessageTimePerDay[sender];
            if (!responseTimes[sender]) {
                responseTimes[sender] = [];
            }
            responseTimes[sender].push(responseTime);
        }
        lastMessageTimePerDay[sender] = timestamp;

        // Track active hours
        const hour = date.getHours();
        activeHours[hour]++;

        // Track user's hourly activity
        users[sender].hourlyActivity[hour]++;

        // Track user's daily activity by day of week
        const dayOfWeek = date.getDay();
        users[sender].dailyActivityByDay[dayOfWeek]++;

        // Track daily activity
        const dateKey = date.toISOString().split('T')[0];
        if (!dailyActivity[dateKey]) {
            dailyActivity[dateKey] = 0;
        }
        dailyActivity[dateKey]++;

        // Track user's daily activity
        if (!users[sender].dailyActivity[dateKey]) {
            users[sender].dailyActivity[dateKey] = 0;
        }
        users[sender].dailyActivity[dateKey]++;

        // Analyze words and emojis
        analyzeText(message, wordFrequency, emojiFrequency, users[sender].emojis, users[sender].words);

        // Count positive words
        users[sender].totalPositiveWords += countPositiveWords(message);

        // Analyze sentiment
        const sentiment = analyzeSentiment(message);
        users[sender].sentimentScore += sentiment.score;
        sentimentData.push({
            date: dateKey,
            sender: sender,
            sentiment: sentiment.score
        });

        // Track top messages for happiness/expressiveness
        addToTopMessages(users[sender].topMessages, {
            message: message,
            sentiment: sentiment.score,
            date: date,
            emojiCount: (message.match(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length
        });

    // Analyze emotions for timeline (removed)
    });
    
    // Calculate averages
    Object.keys(users).forEach(user => {
        users[user].avgChars = users[user].totalChars / users[user].messageCount;
        users[user].avgWords = users[user].totalWords / users[user].messageCount;
        users[user].avgSentiment = users[user].sentimentScore / users[user].messageCount;
        
        if (responseTimes[user] && responseTimes[user].length > 0) {
            users[user].avgResponseTime = responseTimes[user].reduce((a, b) => a + b, 0) / responseTimes[user].length;
        } else {
            users[user].avgResponseTime = null;
        }
    });
    
    // Find most active user
    let mostActiveUser = null;
    let maxMessages = 0;
    
    Object.keys(users).forEach(user => {
        if (users[user].messageCount > maxMessages) {
            maxMessages = users[user].messageCount;
            mostActiveUser = user;
        }
    });
    
    // Find most positive user
    let mostPositiveUser = null;
    let maxSentiment = -Infinity;
    
    Object.keys(users).forEach(user => {
        if (users[user].avgSentiment > maxSentiment) {
            maxSentiment = users[user].avgSentiment;
            mostPositiveUser = user;
        }
    });
    
    // Prepare time series data - filter out future dates
    const timeSeries = prepareTimeSeriesData(dailyActivity);
    
    return {
        users,
        mostActiveUser,
        mostPositiveUser,
        totalMessages: messages.length,
        timeSeries,
        activeHours,
        wordFrequency,
        emojiFrequency,
        emotionalTimeline,
        firstMessageStats: calculateFirstMessageStats(firstMessageOfDay),
        dateRange: {
            start: messages[0].date,
            end: messages[messages.length - 1].date
        }
    };
}

function countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

function analyzeText(text, wordFrequency, emojiFrequency, userEmojis, userWords) {
    // Stop words to exclude
    const stopWords = new Set(['with','gud','he', 'to', 'it','its','noo','im','tt','asi','here','see','yes', 'is', 'of', 'in', 'for', 'and', 'but', 'okay', 'how', 'or', 'why', 'where', 'what',
    'the', 'a', 'an', 'that', 'this', 'was', 'were', 'are', 'am', 'i', 'you', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my',
    'your', 'our', 'their', 'mine', 'yours', 'ours', 'theirs','will','so',"i'm",'like',"it's",'not','now','be','omitted','media','bt',
    'know','wat','have','cz','then','do','on','no','too','if','ok','ur','about','just',"dont",'kuti']);

    // Simple word tokenization
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];

    words.forEach(word => {
        if (word.length < 2 || stopWords.has(word)) return;

        if (!wordFrequency[word]) {
            wordFrequency[word] = 0;
        }
        wordFrequency[word]++;

        if (!userWords[word]) {
            userWords[word] = 0;
        }
        userWords[word]++;
    });

    // Simple emoji detection
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];

    emojis.forEach(emoji => {
        if (!emojiFrequency[emoji]) {
            emojiFrequency[emoji] = 0;
        }
        emojiFrequency[emoji]++;

        if (!userEmojis[emoji]) {
            userEmojis[emoji] = 0;
        }
        userEmojis[emoji]++;
    });
}

function classifyEmotion(text) {
    const happinessWords = ['happy', 'joy', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'fantastic', 'love', 'like', 'fun', 'smile', 'laugh', 'perfect', 'beautiful', 'pleasure', 'success', 'celebrate', 'yay', 'woo'];
    const sadnessWords = ['sad', 'sorry', 'unhappy', 'depressed', 'cry', 'tears', 'heartbroken', 'disappointed', 'miss', 'lonely', 'hurt', 'pain', 'sorrow', 'grief', 'blue'];
    const excitementWords = ['excited', 'thrilled', 'amazing', 'wow', 'awesome', 'fantastic', 'incredible', 'unbelievable', 'insane', 'crazy', 'epic', 'legendary', 'fire', 'lit', 'dope'];
    const angerWords = ['angry', 'mad', 'furious', 'pissed', 'annoyed', 'irritated', 'frustrated', 'hate', 'rage', 'fury', 'outraged', 'infuriated', 'enraged'];

    const happinessEmojis = ['😊', '😀', '😍', '😄', '😎', '🙌', '💯', '🔥', '👏', '😘', '🥰', '🤩', '🎉', '✨', '🌟'];
    const sadnessEmojis = ['😢', '😭', '😞', '😔', '😕', '💔', '😿', '😥', '😓', '😪', '😴'];
    const excitementEmojis = ['🤩', '😍', '🔥', '✨', '🌟', '💥', '🎉', '🎊', '🎈', '🎆', '🎇'];
    const angerEmojis = ['😠', '😡', '🤬', '😤', '😒', '🙄', '😑', '💢', '👿', '😾'];

    const emotions = {
        happiness: 0,
        sadness: 0,
        excitement: 0,
        anger: 0
    };

    // Tokenize words
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];

    // Count emotion words
    words.forEach(word => {
        if (happinessWords.includes(word)) emotions.happiness++;
        if (sadnessWords.includes(word)) emotions.sadness++;
        if (excitementWords.includes(word)) emotions.excitement++;
        if (angerWords.includes(word)) emotions.anger++;
    });

    // Extract emojis
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];

    // Count emotion emojis
    emojis.forEach(emoji => {
        if (happinessEmojis.includes(emoji)) emotions.happiness++;
        if (sadnessEmojis.includes(emoji)) emotions.sadness++;
        if (excitementEmojis.includes(emoji)) emotions.excitement++;
        if (angerEmojis.includes(emoji)) emotions.anger++;
    });

    // Determine dominant emotion
    const maxEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);

    return {
        dominant: maxEmotion,
        scores: emotions,
        hasEmotion: emotions[maxEmotion] > 0
    };
}

function countPositiveWords(text) {
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    return words.filter(word => POSITIVE_WORDS.includes(word)).length;
}

function analyzeSentiment(text) {
    const positiveWords = [
        'good', 'great', 'excellent', 'awesome', 'wonderful', 'happy', 'love', 'like', 'nice', 'best', 'amazing', 'fantastic',
        'perfect', 'beautiful', 'fun', 'joy', 'pleasure', 'smile', 'laugh', 'success'
    ];
    const negativeWords = [
        'bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'sad', 'angry', 'upset', 'annoying', 'hate', 'problem',
            'issue', 'wrong', 'fail', 'failure', 'disappoint', 'cry', 'mad'
    ];

    const positiveEmojis = ['😊', '😀', '😍', '👍', '❤️', '🎉', '😄', '😎', '🙌', '💯', '🔥', '👏', '😘', '🥰', '🤩'];
    const negativeEmojis = ['😢', '😭', '😞', '👎', '💔', '😠', '😡', '🤬', '😤', '😒', '🙄', '😑', '😔', '😕', '🤢'];

    let score = 0;

    // Tokenize words
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];

    // Count positive and negative words
    words.forEach(word => {
        if (positiveWords.includes(word)) {
            score += 1;
        } else if (negativeWords.includes(word)) {
            score -= 1;
        }
    });

    // Extract emojis
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];

    // Count positive and negative emojis
    emojis.forEach(emoji => {
        if (positiveEmojis.includes(emoji)) {
            score += 1;
        } else if (negativeEmojis.includes(emoji)) {
            score -= 1;
        }
    });

    return { score };

}

function addToTopMessages(topMessages, newMessage) {
    topMessages.push(newMessage);

    // Sort by sentiment descending, then by emojiCount descending
    topMessages.sort((a, b) => {
        if (b.sentiment !== a.sentiment) {
            return b.sentiment - a.sentiment;
        }
        return b.emojiCount - a.emojiCount;
    });

    // Keep only top 20
    if (topMessages.length > 20) {
        topMessages.splice(20);
    }
}
function prepareTimeSeriesData(dailyActivity) {
    // Filter out future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    const filteredDates = Object.keys(dailyActivity)
        .filter(dateStr => {
            const date = new Date(dateStr);
            return date.getTime() <= todayTime;
        })
        .sort();
        
    const values = filteredDates.map(date => dailyActivity[date]);
    
    return {
        labels: filteredDates,
        values: values
    };
}

function calculateFirstMessageStats(firstMessageOfDay) {
    const stats = {};
    
    Object.values(firstMessageOfDay).forEach(sender => {
        if (!stats[sender]) {
            stats[sender] = 0;
        }
        stats[sender]++;
    });
    
    return stats;
}

function visualizeResults(analysis) {
    if (!analysis) return;

    // Update summary cards
    document.getElementById('mostActiveUser').textContent = analysis.mostActiveUser;
    document.getElementById('totalMessages').textContent = analysis.totalMessages.toLocaleString();
    document.getElementById('mostPositive').textContent = analysis.mostPositiveUser;

    const startDate = new Date(analysis.dateRange.start).toLocaleDateString();
    const endDate = new Date(analysis.dateRange.end).toLocaleDateString();
    document.getElementById('analysisPeriod').textContent = `${startDate} to ${endDate}`;

    // Create charts
    createActivityChart(analysis.timeSeries);
    createUserDistributionChart(analysis.users);
    createActiveHoursChart(analysis.activeHours);
    createWordCloud(analysis.wordFrequency);
    createEmojiCloud(analysis.emojiFrequency);
    createDetailedStats(analysis.users, analysis.firstMessageStats);
    createChatAwards(analysis);
    createChemistryLab(analysis);

    // Initialize user selector and individual summary
    createUserSelector(analysis.users);
    createIndividualSummary();
}

function createActivityChart(timeSeries) {
    const ctx = document.getElementById('activityChart').getContext('2d');

    // Format dates properly with months and years
    const formattedLabels = timeSeries.labels.map(label => {
        const date = new Date(label);
        const options = {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        };
        return date.toLocaleDateString(undefined, options);
    });
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: 'Messages per Day',
                data: timeSeries.values,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    currentCharts.push(chart);
}

function createUserDistributionChart(users) {
    const ctx = document.getElementById('userDistributionChart').getContext('2d');
    
    const userNames = Object.keys(users);
    const messageCounts = userNames.map(user => users[user].messageCount);
    
    // Generate colors for each user
    const backgroundColors = userNames.map((_, i) => {
        const hue = (i * 137.5) % 360; // Golden angle for distinct colors
        return `hsl(${hue}, 70%, 65%)`;
    });
    
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: userNames,
            datasets: [{
                data: messageCounts,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    
    currentCharts.push(chart);
}

function createActiveHoursChart(activeHours) {
    const ctx = document.getElementById('activeHoursChart').getContext('2d');
    
    const labels = Array.from({length: 24}, (_, i) => {
        const hour = i % 12 || 12;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour} ${period}`;
    });
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Messages',
                data: activeHours,
                backgroundColor: 'rgba(79, 70, 229, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    currentCharts.push(chart);
}

function createWordCloud(wordFrequency) {
    const container = document.getElementById('wordCloud');
    container.innerHTML = '';

    // Get top 20 words only
    const words = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    if (words.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Not enough data to generate word cloud</p>';
        return;
    }

    const maxFreq = words[0][1];
    const minFreq = words[words.length - 1][1];

    words.forEach(([word, freq]) => {

        const size = 14 + (Math.log(freq) / Math.log(maxFreq)) * 30;
        const hue = Math.random() * 360;

        const wordContainer = document.createElement('div');
        wordContainer.className = 'word';
        wordContainer.style.fontSize = `${size}px`;
        wordContainer.style.opacity = 0.7 + (0.3 * (freq - minFreq) / (maxFreq - minFreq));
        wordContainer.style.setProperty('--hue', hue);

        const wordSpan = document.createElement('span');
        wordSpan.textContent = word;

        const countSpan = document.createElement('span');
        countSpan.className = 'word-count';
        countSpan.textContent = `(${freq})`;

        wordContainer.appendChild(wordSpan);
        wordContainer.appendChild(countSpan);
        container.appendChild(wordContainer);
    });
}

function createEmojiCloud(emojiFrequency) {
    const container = document.getElementById('emojiCloud');
    container.innerHTML = '';

    // Get top 20 emojis only
    const emojis = Object.entries(emojiFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    if (emojis.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Not enough data to generate emoji cloud</p>';
        return;
    }

    const maxFreq = emojis[0][1];
    const minFreq = emojis[emojis.length - 1][1];

    emojis.forEach(([emoji, freq]) => {

        const size = 14 + (Math.log(freq) / Math.log(maxFreq)) * 30;
        const hue = Math.random() * 360;

        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji';
        emojiContainer.style.fontSize = `${size}px`;
        emojiContainer.style.opacity = 0.7 + (0.3 * (freq - minFreq) / (maxFreq - minFreq));
        emojiContainer.style.setProperty('--hue', hue);

        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = emoji;

        const countSpan = document.createElement('span');
        countSpan.className = 'emoji-count';
        countSpan.textContent = `(${freq})`;

        emojiContainer.appendChild(emojiSpan);
        emojiContainer.appendChild(countSpan);
        container.appendChild(emojiContainer);
    });
}

function createDetailedStats(users, firstMessageStats) {
    const container = document.getElementById('detailedStats');

    let html = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Messages</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emojis</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
    `;

    Object.entries(users).forEach(([user, stats]) => {
        const emojiCount = Object.values(stats.emojis).reduce((sum, count) => sum + count, 0);
        html += `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap font-medium">${user}</td>
                <td class="px-6 py-4 whitespace-nowrap">${stats.messageCount}</td>
                <td class="px-6 py-4 whitespace-nowrap">${firstMessageStats[user] || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap">${stats.avgSentiment.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${emojiCount}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function createEmotionalTimelineChart(emotionalTimeline) {
    const ctx = document.getElementById('emotionalTimelineChart').getContext('2d');

    // Prepare data for the chart
    const dates = Object.keys(emotionalTimeline).sort();
    const happinessData = dates.map(date => emotionalTimeline[date].happiness);
    const sadnessData = dates.map(date => emotionalTimeline[date].sadness);
    const excitementData = dates.map(date => emotionalTimeline[date].excitement);
    const angerData = dates.map(date => emotionalTimeline[date].anger);

    // Format dates for display
    const formattedLabels = dates.map(label => {
        const date = new Date(label);
        const options = {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        };
        return date.toLocaleDateString(undefined, options);
    });

    // Prepare tooltip data with example messages
    const tooltipData = dates.map(date => {
        const dayData = emotionalTimeline[date];
        const examples = dayData.messages.slice(0, 3); // Show up to 3 example messages
        return {
            happiness: dayData.happiness,
            sadness: dayData.sadness,
            excitement: dayData.excitement,
            anger: dayData.anger,
            examples: examples
        };
    });

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Happiness',
                    data: happinessData,
                    borderColor: '#fbbf24', // yellow
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    tension: 0.2,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Sadness',
                    data: sadnessData,
                    borderColor: '#3b82f6', // blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.2,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Excitement',
                    data: excitementData,
                    borderColor: '#10b981', // green
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.2,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Anger',
                    data: angerData,
                    borderColor: '#ef4444', // red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.2,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const dataIndex = context.dataIndex;
                            const emotionData = tooltipData[dataIndex];
                            const emotion = context.dataset.label.toLowerCase();
                            const count = emotionData[emotion];

                            if (count > 0) {
                                let tooltipText = `\n${emotion.charAt(0).toUpperCase() + emotion.slice(1)} messages: ${count}`;

                                if (emotionData.examples.length > 0) {
                                    tooltipText += '\n\nExamples:';
                                    emotionData.examples.forEach((msg, idx) => {
                                        if (idx < 2) { // Show max 2 examples in tooltip
                                            const truncatedMsg = msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message;
                                            tooltipText += `\n• ${truncatedMsg}`;
                                        }
                                    });
                                }

                                return tooltipText;
                            }
                            return '';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Emotion Count'
                    }
                }
            }
        }
    });

    currentCharts.push(chart);
}

function createChatAwards(analysis) {
    const container = document.getElementById('chatAwards');
    const users = analysis.users;

    let mostCaring = { name: '', score: -Infinity };
    let fastestReplier = { name: '', score: Infinity };
    let longestMessages = { name: '', score: -Infinity };
    let mostEmojis = { name: '', score: -Infinity };

    Object.entries(users).forEach(([user, stats]) => {
        // Most caring (based on positive sentiment)
        if (stats.avgSentiment > mostCaring.score) {
            mostCaring = { name: user, score: stats.avgSentiment };
        }

        // Fastest replier (based on average response time)
        if (stats.avgResponseTime && stats.avgResponseTime < fastestReplier.score) {
            fastestReplier = { name: user, score: stats.avgResponseTime };
        }

        // Longest messages (based on average characters)
        if (stats.avgChars > longestMessages.score) {
            longestMessages = { name: user, score: stats.avgChars };
        }

        // Most emojis (based on emoji count)
        const emojiCount = Object.values(stats.emojis).reduce((sum, count) => sum + count, 0);
        if (emojiCount > mostEmojis.score) {
            mostEmojis = { name: user, score: emojiCount };
        }
    });

    const awards = [
        { title: 'Most Active', recipient: analysis.mostActiveUser, icon: 'fas fa-comment', color: 'bg-blue-100 text-blue-800' },
        { title: 'Most Positive', recipient: analysis.mostPositiveUser, icon: 'fas fa-smile', color: 'bg-green-100 text-green-800' },
        { title: 'Most Caring', recipient: mostCaring.name, icon: 'fas fa-heart', color: 'bg-pink-100 text-pink-800' },
        { title: 'Fastest Replier', recipient: fastestReplier.name, icon: 'fas fa-stopwatch', color: 'bg-yellow-100 text-yellow-800' },
        { title: 'Most Detailed', recipient: longestMessages.name, icon: 'fas fa-align-left', color: 'bg-purple-100 text-purple-800' },
        { title: 'Most Expressive', recipient: mostEmojis.name, icon: 'fas fa-laugh', color: 'bg-orange-100 text-orange-800' }
    ];

    let html = '';

    awards.forEach(award => {
        if (award.recipient) {
            html += `
                <div class="card bg-white rounded-lg shadow p-4 flex items-center">
                    <div class="${award.color} p-3 rounded-full mr-4">
                        <i class="${award.icon} text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold">${award.title}</h3>
                        <p class="text-lg">${award.recipient}</p>
                    </div>
                </div>
            `;
        }
    });
    container.innerHTML = html || '<p class="text-gray-500">Not enough data to generate awards</p>';
}

function classifyChemistry(analysis) {
    const users = analysis.users;
    const totalMessages = analysis.totalMessages;

    // Calculate overall metrics
    let totalSentiment = 0;
    let totalResponseTime = 0;
    let userCount = 0;
    let totalEmojis = 0;
    let totalPositiveWords = 0;
    let avgMessagesPerUser = 0;

    Object.entries(users).forEach(([user, stats]) => {
        totalSentiment += stats.avgSentiment;
        if (stats.avgResponseTime) {
            totalResponseTime += stats.avgResponseTime;
        }
        totalEmojis += Object.values(stats.emojis).reduce((sum, count) => sum + count, 0);
        // Assuming totalPositiveWords is calculated in performAnalysis and added to analysis
        totalPositiveWords += stats.totalPositiveWords || 0;
        userCount++;
    });

    const avgSentiment = totalSentiment / userCount;
    const avgResponseTime = totalResponseTime / userCount;
    avgMessagesPerUser = totalMessages / userCount;

    // Define chemistry labels based on metrics, now including positive wordss
    const chemistryLabels = [
        {
            emoji: '💞',
            label: '"Romantic Spark"',
            description: 'Flirty or affectionate, moderate consistency',
            condition: avgSentiment > 0.15 && avgMessagesPerUser > 20 && avgResponseTime < 500000 // >0.3 sentiment, >20 msgs/user, <2hr response, >20% positive words
        },
        {
            emoji: '👀',
            label: '"Something Special"',
            description: 'Frequent, positive, engaging messages',
            condition: avgSentiment > 0.10 && avgMessagesPerUser > 10 && (totalEmojis > totalMessages * 0.1 || totalPositiveWords > totalMessages * 0.09) // >0.1 sentiment, >10 msgs/user, >10% emojis or >15% positive words
        },
        {
            emoji: '🤝',
            label: '"Strong Friendship"',
            description: 'Lots of laughter, inside jokes, trustful words',
            condition: avgSentiment > 0.05 && avgMessagesPerUser > 10 && (totalEmojis > totalMessages * 0.1 || totalPositiveWords > totalMessages * 0.09) // >0.1 sentiment, >10 msgs/user, >10% emojis or >15% positive words
        },
        {
            emoji: '😅',
            label: '"Just Casual"',
            description: 'Light, fun, low emotional weight',
            condition: avgSentiment > 0.03 && avgMessagesPerUser > 5  // >-0.1 sentiment, >5 msgs/user, >5% positive words
        },
        {
            emoji: '😤',
            label: '"Conflict Zone"',
            description: 'Many negative or angry messages',
            condition: avgSentiment < -0.2 // < -0.2 sentiment
        },
        {
            emoji: '🧊',
            label: '"Cold/Neutral"',
            description: 'Short or formal texts, no emotion indicators',
            condition: true // Default fallback
        }
    ];

    // Find the first matching condition
    const matchedChemistry = chemistryLabels.find(label => label.condition);

    return matchedChemistry;
}

function createChemistryLab(analysis) {
    const container = document.getElementById('chemistryLab');
    const chemistry = classifyChemistry(analysis);

    if (chemistry) {
        container.innerHTML = `
            <div class="text-6xl mb-4">${chemistry.emoji}</div>
            <h3 class="text-2xl font-bold mb-2">${chemistry.label}</h3>
            <p class="text-gray-600">${chemistry.description}</p>
        `;
    } else {
        container.innerHTML = '<p class="text-gray-500">Not enough data to analyze chemistry</p>';
    }
}
function toggleCustomDateRange() {
    const selectedValue = durationSelect.value;
    if (selectedValue === 'custom') {
        customDateRange.classList.remove('hidden');
    } else {
        customDateRange.classList.add('hidden');
    }
}

function getDateRange() {
    const selectedValue = durationSelect.value;
    const now = new Date();
    let startDate, endDate;

    switch (selectedValue) {
        case 'all':
            return null; // No filtering
        case 'custom':
            const customStart = document.getElementById('startDate').value;
            const customEnd = document.getElementById('endDate').value;
            if (!customStart || !customEnd) {
                alert('Please select both start and end dates for custom range.');
                return null;
            }
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            if (startDate > endDate) {
                alert('Start date cannot be after end date.');
                return null;
            }
            break;
        default:
            return null;
    }

    return { start: startDate, end: endDate };
}

function filterMessagesByDate(messages, dateRange) {
    if (!dateRange) return messages;

    return messages.filter(msg => {
        const msgDate = new Date(msg.date);
        return msgDate >= dateRange.start && msgDate <= dateRange.end;
    });
}

function createUserSelector(users) {
    const selector = document.getElementById('userSelector');
    selector.innerHTML = '<option value="">Select a user...</option>';

    Object.keys(users).forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        selector.appendChild(option);
    });

    // Show the user selector section
    document.getElementById('userSelectorSection').classList.remove('hidden');

    // Add event listener for user selection
    selector.addEventListener('change', (e) => {
        const selectedUser = e.target.value;
        if (selectedUser) {
            displayIndividualSummary(selectedUser, users[selectedUser]);
            // Reset selector to allow re-selection of the same user
            setTimeout(() => {
                selector.value = "";
            }, 100);
        } else {
            hideIndividualSummary();
        }
    });
}

function createIndividualSummary() {
    // This function is called to initialize the individual summary section
    // The actual display is handled by displayIndividualSummary
}

function displayIndividualSummary(userName, userStats) {
    // Update modal header with user name
    document.getElementById('modalUserName').textContent = userName;

    // Update individual user summary cards
    document.getElementById('userMessageCount').textContent = userStats.messageCount;
    document.getElementById('userAvgResponseTime').textContent = userStats.avgResponseTime ? formatTime(userStats.avgResponseTime) : 'N/A';
    document.getElementById('userSentiment').textContent = userStats.avgSentiment.toFixed(2);

    // Create user's active hours chart
    createUserActiveHoursChart(userStats.hourlyActivity);

    // Create user's active days chart
    createUserActiveDaysChart(userStats.dailyActivityByDay);

    // Create user's top words cloud
    createUserTopWords(userStats.words);

    // Create user's top emojis cloud
    createUserTopEmojis(userStats.emojis);

    // Display user's top messages with default count
    const defaultCount = parseInt(document.getElementById('topMessagesCount').value);
    displayUserTopMessages(userStats.topMessages, defaultCount);

    // Add event listener to the count selector
    const countSelector = document.getElementById('topMessagesCount');
    countSelector.addEventListener('change', (e) => {
        const newCount = parseInt(e.target.value);
        displayUserTopMessages(userStats.topMessages, newCount);
    });

    // Show the individual summary modal
    document.getElementById('individualSummaryModal').classList.remove('hidden');
}

function hideIndividualSummary() {
    document.getElementById('individualSummaryModal').classList.add('hidden');
}

function createUserActiveHoursChart(hourlyActivity) {
    // Destroy previous individual chart if it exists
    if (individualChart) {
        individualChart.destroy();
    }

    const ctx = document.getElementById('userActiveHoursChart').getContext('2d');

    const labels = Array.from({length: 24}, (_, i) => {
        const hour = i % 12 || 12;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour} ${period}`;
    });

    individualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Messages',
                data: hourlyActivity,
                backgroundColor: 'rgba(79, 70, 229, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createUserActiveDaysChart(dailyActivityByDay) {
    // Destroy previous user days chart if it exists
    if (userDaysChart) {
        userDaysChart.destroy();
    }

    const ctx = document.getElementById('userActiveDaysChart').getContext('2d');

    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    userDaysChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Messages',
                data: dailyActivityByDay,
                backgroundColor: 'rgba(79, 70, 229, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createUserTopWords(userWords) {
    const container = document.getElementById('userTopWords');
    container.innerHTML = '';

    const words = Object.entries(userWords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (words.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No words to display</p>';
        return;
    }

    const maxFreq = words[0][1];
    const minFreq = words[words.length - 1][1];

    words.forEach(([word, freq]) => {
        const size = 14 + (Math.log(freq) / Math.log(maxFreq)) * 30;
        const hue = Math.random() * 360;

        const wordContainer = document.createElement('div');
        wordContainer.className = 'word';
        wordContainer.style.fontSize = `${size}px`;
        wordContainer.style.opacity = 0.7 + (0.3 * (freq - minFreq) / (maxFreq - minFreq));
        wordContainer.style.setProperty('--hue', hue);

        const wordSpan = document.createElement('span');
        wordSpan.textContent = word;

        const countSpan = document.createElement('span');
        countSpan.className = 'word-count';
        countSpan.textContent = `(${freq})`;

        wordContainer.appendChild(wordSpan);
        wordContainer.appendChild(countSpan);
        container.appendChild(wordContainer);
    });
}

function createUserTopEmojis(userEmojis) {
    const container = document.getElementById('userTopEmojis');
    container.innerHTML = '';

    const emojis = Object.entries(userEmojis)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    if (emojis.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No emojis to display</p>';
        return;
    }

    const maxFreq = emojis[0][1];
    const minFreq = emojis[emojis.length - 1][1];

    emojis.forEach(([emoji, freq]) => {
        const size = 14 + (Math.log(freq) / Math.log(maxFreq)) * 30;
        const hue = Math.random() * 360;

        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji';
        emojiContainer.style.fontSize = `${size}px`;
        emojiContainer.style.opacity = 0.7 + (0.3 * (freq - minFreq) / (maxFreq - minFreq));
        emojiContainer.style.setProperty('--hue', hue);

        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = emoji;

        const countSpan = document.createElement('span');
        countSpan.className = 'emoji-count';
        countSpan.textContent = `(${freq})`;

        emojiContainer.appendChild(emojiSpan);
        emojiContainer.appendChild(countSpan);
        container.appendChild(emojiContainer);
    });
}

function generateUserSuggestions(userStats) {
    const container = document.getElementById('userSuggestions');
    const suggestions = [];

    // Analyze user's activity patterns
    const avgMessagesPerDay = userStats.messageCount / Object.keys(userStats.dailyActivity).length;
    const avgResponseTime = userStats.avgResponseTime;
    const sentiment = userStats.avgSentiment;
    const emojiCount = Object.values(userStats.emojis).reduce((sum, count) => sum + count, 0);

    // Peak activity hour
    const peakHour = userStats.hourlyActivity.indexOf(Math.max(...userStats.hourlyActivity));
    const hourLabel = peakHour === 0 ? '12 AM' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`;
    suggestions.push(`You're most active around ${hourLabel}. Try to schedule important conversations during this time.`);

    if (suggestions.length === 0) {
        suggestions.push("Keep up the good work! Your communication style seems well-balanced.");
    }

    container.innerHTML = suggestions.map(suggestion => `<p class="mb-2"><i class="fas fa-lightbulb mr-2 text-yellow-500"></i>${suggestion}</p>`).join('');
}

function displayUserTopMessages(topMessages, count = 10) {
    const container = document.getElementById('userTopMessages');
    container.innerHTML = '';

    if (topMessages.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No top messages to display</p>';
        return;
    }

    // Filter messages with positive sentiment and emojis
    const filteredMessages = topMessages.filter(msg => msg.sentiment > 0 && msg.emojiCount > 0);

    if (filteredMessages.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No positive messages with emojis to display</p>';
        return;
    }

    // Display up to the specified count
    const displayMessages = filteredMessages.slice(0, count);

    displayMessages.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-400';

        const dateStr = msg.date.toLocaleDateString();
        const sentimentIcon = msg.sentiment > 0.5 ? '😊' : '🙂';

        messageDiv.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <span class="text-sm text-gray-600 font-medium">${dateStr}</span>
                <div class="flex items-center text-sm text-gray-600">
                    <span class="mr-2">${sentimentIcon} Sentiment: ${msg.sentiment.toFixed(2)}</span>
                    <span>🎉 Emojis: ${msg.emojiCount}</span>
                </div>
            </div>
            <p class="text-gray-800">${msg.message}</p>
        `;

        container.appendChild(messageDiv);
    });
}

function formatTime(milliseconds) {
    if (!milliseconds) return 'N/A';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}





import * as http from "node:http";
import * as url from "node:url";
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus, getCompletedQuestions } from "./loader";

const PORT = 8081;

async function getQueueData(targetDate?: string) {
    const keywords = await loadKeywordsToQuery(targetDate);
    const taskQueues = await buildTaskQueue(keywords);
    const status = getQueueStatus(taskQueues);
    const dateUsed = targetDate || new Date().toLocaleDateString('en-CA');

    // Calculate total expected and completed questions per platform
    const platformStats: Record<string, { pending: number; total: number; completed: number }> = {};

    for (const keyword of keywords) {
        const questionsPerKeyword = 1 + keyword.extendedKeywords.length; // core + extended

        for (const platform of keyword.platforms) {
            if (!platformStats[platform]) {
                platformStats[platform] = { pending: 0, total: 0, completed: 0 };
            }
            platformStats[platform].total += questionsPerKeyword;
        }
    }

    // Add pending counts and calculate completed
    for (const { platform, count } of status) {
        if (platformStats[platform]) {
            platformStats[platform].pending = count;
            platformStats[platform].completed = platformStats[platform].total - count;
        }
    }

    // Enhance status with completion info
    const enhancedStatus = status.map(s => ({
        platform: s.platform,
        count: s.count,
        completed: platformStats[s.platform]?.completed || 0,
        total: platformStats[s.platform]?.total || 0,
        percentage: platformStats[s.platform]?.total > 0
            ? ((platformStats[s.platform].completed / platformStats[s.platform].total) * 100).toFixed(1)
            : '0'
    }));

    const totalPending = status.reduce((sum, s) => sum + s.count, 0);
    const totalExpected = Object.values(platformStats).reduce((sum, s) => sum + s.total, 0);
    const totalCompleted = totalExpected - totalPending;

    // Get detailed unfinished questions by platform (extended keywords only)
    const unfinishedByPlatform: Record<string, Array<{keyword: string, isExtended: boolean}>> = {};
    for (const [platform, tasks] of Object.entries(taskQueues)) {
        unfinishedByPlatform[platform] = tasks
            .filter(task => task.extendedKeyword) // Only show extended keywords
            .map(task => ({
                keyword: task.extendedKeyword!,
                isExtended: true
            }));
    }

    // Get completed questions (extended keywords only)
    const completedQuestions = await getCompletedQuestions(keywords);
    const completedByPlatform: Record<string, Array<{keyword: string, isExtended: boolean}>> = {};
    for (const q of completedQuestions) {
        if (q.extendedKeyword) { // Only show extended keywords
            if (!completedByPlatform[q.platform]) {
                completedByPlatform[q.platform] = [];
            }
            completedByPlatform[q.platform].push({
                keyword: q.extendedKeyword,
                isExtended: true
            });
        }
    }

    return {
        keywords: keywords.length,
        status: enhancedStatus.sort((a, b) => b.count - a.count),
        totalPending,
        totalCompleted,
        totalExpected,
        dateUsed,
        unfinishedByPlatform,
        completedByPlatform
    };
}

function generatePlatformDetails(platform: string, completed: Array<{keyword: string, isExtended: boolean}>, unfinished: Array<{keyword: string, isExtended: boolean}>) {
    return `
        <div id="details-${platform}" class="platform-details">
            <div class="details-section">
                <h4 style="color: #dc3545; margin-bottom: 10px;">⚠ Pending (${unfinished.length})</h4>
                ${unfinished.length > 0 ? unfinished.map(item => `
                    <div class="question-item pending-item ${item.isExtended ? 'extended' : ''}">
                        ${item.keyword}
                    </div>
                `).join('') : '<p style="color: #6c757d; font-size: 0.9em;">No pending questions</p>'}
            </div>
            <div class="details-section" style="margin-top: 20px;">
                <h4 style="color: #28a745; margin-bottom: 10px;">✓ Completed (${completed.length})</h4>
                ${completed.length > 0 ? completed.map(item => `
                    <div class="question-item completed-item ${item.isExtended ? 'extended' : ''}">
                        ${item.keyword}
                    </div>
                `).join('') : '<p style="color: #6c757d; font-size: 0.9em;">No completed questions</p>'}
            </div>
        </div>
    `;
}

function generateHTML(data: any) {
    const overallProgress = data.totalExpected > 0
        ? ((data.totalCompleted / data.totalExpected) * 100).toFixed(1)
        : '0';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Queue Status Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            padding: 30px 40px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        .summary-card .label {
            color: #6c757d;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .table-container {
            padding: 40px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 1px;
        }
        th:last-child, td:last-child {
            text-align: center;
        }
        td {
            padding: 16px;
            border-bottom: 1px solid #e9ecef;
        }
        tbody tr:hover {
            background: #f8f9fa;
            transition: background 0.2s;
        }
        .progress-bar {
            width: 100%;
            height: 24px;
            background: #e9ecef;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.75em;
            font-weight: bold;
        }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }
        .refresh-note {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 0.9em;
        }
        .date-picker {
            text-align: center;
            padding: 20px 40px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }
        .date-picker label {
            margin-right: 10px;
            font-weight: 600;
            color: #495057;
        }
        .date-picker input[type="date"] {
            padding: 8px 12px;
            border: 2px solid #667eea;
            border-radius: 6px;
            font-size: 1em;
            color: #495057;
            cursor: pointer;
        }
        .date-picker input[type="date"]:focus {
            outline: none;
            border-color: #764ba2;
            box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.1);
        }
        .date-picker button {
            margin-left: 10px;
            padding: 8px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .date-picker button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .unfinished-section {
            padding: 40px;
        }
        .unfinished-toggle {
            text-align: center;
            margin-bottom: 20px;
        }
        .unfinished-toggle button {
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .unfinished-toggle button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .unfinished-list {
            display: none;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-height: 600px;
            overflow-y: auto;
        }
        .unfinished-list.show {
            display: block;
        }
        .platform-group {
            margin-bottom: 30px;
        }
        .platform-group h3 {
            color: #667eea;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        .question-item {
            padding: 10px 15px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }
        .question-item.extended {
            border-left-color: #764ba2;
            background: #f3f0f7;
        }
        .platform-details {
            display: none;
            background: #f8f9fa;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
        }
        .platform-details.show {
            display: block;
        }
        .details-section h4 {
            font-size: 1.1em;
            font-weight: 600;
        }
        .completed-item {
            opacity: 0.8;
            border-left-color: #28a745 !important;
        }
        .pending-item {
            border-left-color: #dc3545 !important;
        }
        .details-btn {
            padding: 6px 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85em;
            transition: background 0.2s;
        }
        .details-btn:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Queue Status Dashboard</h1>
        </div>

        <div class="date-picker">
            <label for="date">Select Date:</label>
            <input type="date" id="date" value="${data.dateUsed}" />
            <button onclick="loadDate()">Load</button>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Keywords Due</div>
                <div class="value">${data.keywords}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Pending</div>
                <div class="value">${data.totalPending}</div>
            </div>
            <div class="summary-card">
                <div class="label">Completed</div>
                <div class="value">${data.totalCompleted}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Expected</div>
                <div class="value">${data.totalExpected}</div>
            </div>
            <div class="summary-card">
                <div class="label">Progress</div>
                <div class="value">${overallProgress}%</div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Platform</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Total</th>
                        <th>Progress</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.status.map((s: any) => {
                        const progress = parseFloat(s.percentage);
                        const completed = data.completedByPlatform[s.platform] || [];
                        const unfinished = data.unfinishedByPlatform[s.platform] || [];
                        const detailsHtml = generatePlatformDetails(s.platform, completed, unfinished);

                        return `
                        <tr>
                            <td><strong>${s.platform}</strong></td>
                            <td style="color: #28a745; font-weight: 600;">${s.completed}</td>
                            <td style="color: #dc3545; font-weight: 600;">${s.count}</td>
                            <td>${s.total}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progress}%">
                                        ${progress > 0 ? progress + '%' : ''}
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: center;">
                                <button class="details-btn" onclick="toggleDetails('${s.platform}')">Show Details</button>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="6" style="padding: 0;">
                                ${detailsHtml}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="refresh-note">
            Page refreshes automatically every 30 seconds
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => window.location.reload(), 30000);

        function loadDate() {
            const date = document.getElementById('date').value;
            if (date) {
                window.location.href = '/?date=' + date;
            }
        }

        function toggleDetails(platform) {
            const details = document.getElementById('details-' + platform);
            const buttons = document.querySelectorAll('.details-btn');

            // Find the button for this platform
            let currentButton = null;
            buttons.forEach(btn => {
                if (btn.textContent.includes('Details') &&
                    btn.closest('tr').querySelector('strong').textContent === platform) {
                    currentButton = btn;
                }
            });

            if (details.classList.contains('show')) {
                details.classList.remove('show');
                if (currentButton) currentButton.textContent = 'Show Details';
            } else {
                details.classList.add('show');
                if (currentButton) currentButton.textContent = 'Hide Details';
            }
        }

        // Allow Enter key to submit
        document.getElementById('date').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadDate();
            }
        });
    </script>
</body>
</html>`;
}

http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Parse query parameters
        const parsedUrl = url.parse(req.url || '', true);
        const targetDate = parsedUrl.query.date as string | undefined;

        const data = await getQueueData(targetDate);
        const html = generateHTML(data);
        res.end(html);
    } catch (error) {
        console.error('Error generating queue page:', error);
        res.statusCode = 500;
        res.end('<h1>Error loading queue data</h1><pre>' + error + '</pre>');
    }
}).listen(PORT);

console.log(`Queue Status Dashboard running at http://localhost:${PORT}`);

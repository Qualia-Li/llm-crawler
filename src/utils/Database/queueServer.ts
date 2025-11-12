import * as http from "node:http";
import * as url from "node:url";
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus } from "./loader";

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

    // Get detailed unfinished questions
    const unfinishedQuestions: Array<{platform: string, keyword: string, isExtended: boolean}> = [];
    for (const [platform, tasks] of Object.entries(taskQueues)) {
        for (const task of tasks) {
            const questionText = task.extendedKeyword || task.coreKeyword;
            unfinishedQuestions.push({
                platform,
                keyword: questionText,
                isExtended: !!task.extendedKeyword
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
        unfinishedQuestions
    };
}

function generateUnfinishedList(questions: Array<{platform: string, keyword: string, isExtended: boolean}>) {
    // Group by platform
    const grouped: Record<string, Array<{keyword: string, isExtended: boolean}>> = {};
    for (const q of questions) {
        if (!grouped[q.platform]) {
            grouped[q.platform] = [];
        }
        grouped[q.platform].push({ keyword: q.keyword, isExtended: q.isExtended });
    }

    let html = '';
    for (const [platform, items] of Object.entries(grouped)) {
        html += `
            <div class="platform-group">
                <h3>${platform} (${items.length} pending)</h3>
                ${items.map(item => `
                    <div class="question-item ${item.isExtended ? 'extended' : ''}">
                        ${item.keyword}
                    </div>
                `).join('')}
            </div>
        `;
    }
    return html || '<p style="text-align: center; color: #6c757d;">No unfinished questions</p>';
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
                    </tr>
                </thead>
                <tbody>
                    ${data.status.map((s: any) => {
                        const progress = parseFloat(s.percentage);

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
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="unfinished-section">
            <div class="unfinished-toggle">
                <button onclick="toggleUnfinished()">Show Unfinished Questions (${data.totalPending})</button>
            </div>
            <div id="unfinishedList" class="unfinished-list">
                ${generateUnfinishedList(data.unfinishedQuestions)}
            </div>
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

        function toggleUnfinished() {
            const list = document.getElementById('unfinishedList');
            const button = event.target;
            if (list.classList.contains('show')) {
                list.classList.remove('show');
                button.textContent = 'Show Unfinished Questions (${data.totalPending})';
            } else {
                list.classList.add('show');
                button.textContent = 'Hide Unfinished Questions';
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

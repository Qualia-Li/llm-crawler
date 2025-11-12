import * as http from "node:http";
import * as url from "node:url";
import { loadKeywordsToQuery, buildTaskQueue, getQueueStatus } from "./loader";

const PORT = 8081;

async function getQueueData(targetDate?: string) {
    const keywords = await loadKeywordsToQuery(targetDate);
    const taskQueues = await buildTaskQueue(keywords);
    const status = getQueueStatus(taskQueues);
    const dateUsed = targetDate || new Date().toLocaleDateString('en-CA');

    return {
        keywords: keywords.length,
        status: status.sort((a, b) => b.count - a.count),
        totalPending: status.reduce((sum, s) => sum + s.count, 0),
        dateUsed
    };
}

function generateHTML(data: any) {
    // Calculate total questions for this date
    const totalNeeded = data.keywords * 6 * 16; // Approximate: keywords * avg platforms * avg questions
    const totalCompleted = Math.max(0, totalNeeded - data.totalPending);
    const overallProgress = totalNeeded > 0 ? ((totalCompleted / totalNeeded) * 100).toFixed(1) : '0';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Queue Status - ${data.dateUsed}</title>
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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Queue Status Dashboard</h1>
            <p>${data.dateUsed}</p>
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
                <div class="value">${totalCompleted}</div>
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
                        <th>Pending Questions</th>
                        <th>Status</th>
                        <th>Progress</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.status.map((s: any) => {
                        const progress = s.count === 0 ? 100 : 0;
                        const badge = s.count === 0 ? 'badge-success' : (s.count < 100 ? 'badge-warning' : 'badge-danger');
                        const statusText = s.count === 0 ? 'Complete ✓' : `${s.count} remaining`;

                        return `
                        <tr>
                            <td><strong>${s.platform}</strong></td>
                            <td>${s.count}</td>
                            <td><span class="badge ${badge}">${statusText}</span></td>
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

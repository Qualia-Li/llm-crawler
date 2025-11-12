import fs from "node:fs";

// Load the result data
const resultData = JSON.parse(fs.readFileSync('./data/result.json', 'utf8'));

const engines = ["deepseek", "夸克", "kimi", "豆包", "元宝", "文心一言"];

console.log("📊 Queue Status Report\n");
console.log("="
.repeat(80));

let totalPending = 0;

for (const engine of engines) {
    let pendingCount = 0;

    for (const question of resultData) {
        const platformData = question.platforms[engine];

        if (!platformData) continue;

        // Check if core keyword needs answer
        if (platformData.length === 0) {
            pendingCount++;
        }

        // Check extended keywords
        const extendedNeeded = question.extendedKeywords.length - (platformData.length - 1);
        if (extendedNeeded > 0) {
            pendingCount += extendedNeeded;
        }
    }

    totalPending += pendingCount;
    console.log(`${engine.padEnd(15)} : ${pendingCount} questions pending`);
}

console.log("=".repeat(80));
console.log(`Total Pending: ${totalPending} questions\n`);

// Show some example pending questions
console.log("\n📝 Example Pending Questions:");
let shown = 0;
for (const question of resultData) {
    if (shown >= 5) break;

    for (const engine of engines) {
        const platformData = question.platforms[engine];
        if (!platformData || platformData.length === 0) {
            console.log(`  - [${engine}] ${question.coreKeyword}`);
            shown++;
            break;
        }
    }
}

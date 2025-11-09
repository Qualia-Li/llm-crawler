import fs from 'fs';

// Read and parse the JSON file
const data = JSON.parse(fs.readFileSync('./data/result.json', 'utf8'));

// Set to store unique extended_keywords that have answers
const keywordsWithAnswers = new Set();
const keywordDetails = {};

// Iterate through the data
data.forEach(item => {
    // Check if extendedKeywords exists and platforms exists
    if (item.extendedKeywords && item.platforms && typeof item.platforms === 'object') {
        // Iterate through each extended keyword
        item.extendedKeywords.forEach(keyword => {
            // Check each platform for this keyword
            let hasAnswer = false;
            const engines = [];

            for (const [platform, answers] of Object.entries(item.platforms)) {
                // Check if this platform has answers (non-empty array)
                if (Array.isArray(answers) && answers.length > 0) {
                    // Check if any answer is non-empty
                    const hasValidAnswer = answers.some(answer => answer && answer.trim() !== '');
                    if (hasValidAnswer) {
                        hasAnswer = true;
                        engines.push(platform);
                    }
                }
            }

            if (hasAnswer) {
                keywordsWithAnswers.add(keyword);

                if (!keywordDetails[keyword]) {
                    keywordDetails[keyword] = {
                        count: engines.length,
                        engines: new Set(engines)
                    };
                } else {
                    keywordDetails[keyword].count += engines.length;
                    engines.forEach(e => keywordDetails[keyword].engines.add(e));
                }
            }
        });
    }
});

console.log(`\nTotal extended_keywords with answers: ${keywordsWithAnswers.size}`);
console.log(`\nKeywords breakdown:`);
console.log('='.repeat(80));

// Sort keywords alphabetically
const sortedKeywords = Array.from(keywordsWithAnswers).sort();

sortedKeywords.forEach(keyword => {
    const details = keywordDetails[keyword];
    const engines = Array.from(details.engines).join(', ');
    console.log(`\n${keyword}`);
    console.log(`  Answers: ${details.count}`);
    console.log(`  Engines: ${engines || 'N/A'}`);
});

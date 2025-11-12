import * as readline from 'readline';

/**
 * Create readline interface
 */
function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Ask a question and get user input
 */
export function question(query: string): Promise<string> {
    const rl = createInterface();

    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Ask for confirmation (y/n)
 */
export async function confirm(query: string): Promise<boolean> {
    const answer = await question(`${query} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * Ask for a date with default value
 */
export async function askDate(defaultDate: string): Promise<string> {
    const answer = await question(`Enter target date (YYYY-MM-DD) [${defaultDate}]: `);

    // If empty, use default
    if (!answer) {
        return defaultDate;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(answer)) {
        console.log('❌ Invalid date format. Using default.');
        return defaultDate;
    }

    // Validate date is valid
    const date = new Date(answer);
    if (isNaN(date.getTime())) {
        console.log('❌ Invalid date. Using default.');
        return defaultDate;
    }

    return answer;
}

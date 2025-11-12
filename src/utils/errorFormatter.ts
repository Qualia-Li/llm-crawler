/**
 * Format error for concise console output (no stack trace)
 */
export function formatError(error: unknown): string {
    if (error instanceof Error) {
        // Just return the error message, optionally with error name
        return `${error.name}: ${error.message}`;
    }
    return String(error);
}

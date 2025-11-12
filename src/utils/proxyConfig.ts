/**
 * Parse proxy URL and extract server and credentials
 */
export interface ProxyConfig {
    server: string;
    username?: string;
    password?: string;
}

export function parseProxyUrl(proxyUrl: string): ProxyConfig | null {
    if (!proxyUrl) return null;

    try {
        const url = new URL(proxyUrl);

        // Extract credentials if present
        const username = url.username ? decodeURIComponent(url.username) : undefined;
        const password = url.password ? decodeURIComponent(url.password) : undefined;

        // Build server URL without credentials
        const server = `${url.protocol}//${url.host}`;

        return {
            server,
            username,
            password
        };
    } catch (error) {
        console.error('Failed to parse proxy URL:', error);
        return null;
    }
}

export function convertMapToObj(value: unknown): any {
    if (value instanceof Map) {
        // Convert Map to plain object
        return Object.fromEntries(
            Array.from(value.entries()).map(([k, v]) => [k, convertMapToObj(v)])
        );
    }

    if (Array.isArray(value)) {
        // Recurse into arrays
        return value.map(convertMapToObj);
    }

    if (value !== null && typeof value === 'object') {
        // Recurse into plain objects
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, convertMapToObj(v)])
        );
    }

    // Return primitives as-is (string, number, boolean, null, undefined)
    return value;
}

export function getDataJson(data: any) {
    return JSON.stringify(convertMapToObj(data));
}
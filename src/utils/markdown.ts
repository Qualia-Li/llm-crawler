import TurndownService from "turndown"


interface LinkReference {
    text: string;
    url: string;
    title?: string;
}

export function convertInlineToReference(markdown: string): string {
    const linkRegex = /!?\[([^\]]+)]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g;
    const references: LinkReference[] = [];
    let match: RegExpExecArray | null;

    // Find all inline links
    while ((match = linkRegex.exec(markdown)) !== null) {
        const [_fullMatch, text, url, title] = match;
        references.push({ text, url, title });
    }

    // Remove duplicates while preserving order
    const uniqueRefs = references.filter((ref, index, self) =>
            index === self.findIndex(r =>
                r.text === ref.text &&
                r.url === ref.url &&
                r.title === ref.title
            )
    );

    // Create reference map
    const refMap = new Map<string, string>();
    uniqueRefs.forEach((ref, index) => {
        const key = `${ref.text}|${ref.url}|${ref.title || ''}`;
        refMap.set(key, `[${index + 1}]`);
    });

    // Replace inline links with references
    let result = markdown.replace(linkRegex, (_match, text, url, title) => {
        const key = `${text}|${url}|${title || ''}`;
        const refId = refMap.get(key) || '[1]'; // Fallback shouldn't happen
        return title
            ? `![${text}]${refId} "${title}"`
            : `![${text}]${refId}`;
    });

    // Append reference definitions
    if (uniqueRefs.length > 0) {
        result += '\n\n';
        uniqueRefs.forEach((ref, index) => {
            const id = index + 1;
            if (ref.title) {
                result += `[${id}]: ${ref.url} "${ref.title}"\n`;
            } else {
                result += `[${id}]: ${ref.url}\n`;
            }
        });
    }

    return result;
}

const turndownService = new TurndownService({linkStyle:"referenced"});
export function toMD(html:string){
    let markdown = turndownService.turndown(html);
    markdown = convertInlineToReference(markdown)
    return markdown;
}
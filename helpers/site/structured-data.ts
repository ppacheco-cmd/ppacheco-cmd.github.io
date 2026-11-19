/** The JSON-LD block of a page, as raw text and as parsed data */
export interface StructuredData {
    raw: string;
    data: Record<string, unknown>;
}

const JSON_LD_BLOCK =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/;

/**
 * Finds the JSON-LD block in a page's HTML and parses it.
 *
 * @param html - The page source.
 * @returns The raw block and its parsed content, or null when the page has none.
 */
export function extractStructuredData(html: string): StructuredData | null {
    const match = JSON_LD_BLOCK.exec(html);
    if (!match) return null;
    const raw = match[1];
    return { raw, data: JSON.parse(raw) as Record<string, unknown> };
}

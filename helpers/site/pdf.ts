import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

/** What was read from a PDF file */
export interface PdfContent {
    pages: number;
    text: string;
}

/**
 * Collapses a text for comparison: bullet glyphs removed, all whitespace made
 * single spaces. Text that wraps across lines in a PDF then equals the same
 * text written on one line on a web page.
 *
 * @param text - Any text.
 * @returns The text with one space between words.
 */
export function normalizeForComparison(text: string): string {
    return text.replace(/[•●]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Reads a PDF file and returns its page count and its text.
 *
 * @param path - The PDF file, relative to the repository root.
 * @returns The number of pages and the normalized text.
 */
export async function readPdf(path: string): Promise<PdfContent> {
    const parsed = await pdfParse(fs.readFileSync(path));
    return {
        pages: parsed.numpages,
        text: normalizeForComparison(parsed.text),
    };
}

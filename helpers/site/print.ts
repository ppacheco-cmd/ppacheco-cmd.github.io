/**
 * Counts the pages of a PDF produced by the browser.
 *
 * @param pdf - The PDF file contents.
 * @returns The number of page objects in the file.
 */
export function countPdfPages(pdf: Buffer): number {
    return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

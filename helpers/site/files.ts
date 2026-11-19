import { Download } from '@playwright/test';
import fs from 'fs';
import { CvFileRules } from '../../enums/site/theme';

/**
 * Lists the PDF files in the site's `cv/` folder.
 *
 * @returns The PDF file names, sorted as the file system returns them.
 */
export function pdfFilesInCvFolder(): string[] {
    return fs
        .readdirSync(CvFileRules.FOLDER)
        .filter((file) => file.toLowerCase().endsWith(CvFileRules.EXTENSION));
}

/**
 * Reads a file the browser downloaded.
 *
 * @param download - The download to read.
 * @returns The file contents.
 */
export async function readDownload(download: Download): Promise<Buffer> {
    const path = await download.path();
    return fs.readFileSync(path);
}

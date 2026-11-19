import { Download } from '@playwright/test';
import crypto from 'crypto';
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

/**
 * Computes the SHA-256 fingerprint of some bytes.
 *
 * @param data - The bytes to fingerprint.
 * @returns The fingerprint as lowercase hex.
 */
export function sha256(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

import fs from 'fs';

/**
 * Reads a GitHub Actions workflow file.
 *
 * @param path - The workflow file, relative to the repository root.
 * @returns The file contents.
 */
export function readWorkflow(path: string): string {
    return fs.readFileSync(path, 'utf8');
}

/**
 * Reads one script from package.json.
 *
 * @param name - The script name, e.g. `test:smoke`.
 * @returns The command line the script runs.
 */
export function npmScript(name: string): string {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
        scripts: Record<string, string>;
    };
    return pkg.scripts[name] ?? '';
}

/**
 * Counts the pages the Lighthouse gate audits by default.
 *
 * @returns The number of pages in the gate's default page list.
 */
export function lighthousePageCount(): number {
    const source = fs.readFileSync('scripts/lighthouse.mjs', 'utf8');
    const list = /process\.env\.LH_PAGES[^:]*:\s*\[([^\]]+)\]/.exec(source);
    return list ? (list[1].match(/'[^']+'/g) ?? []).length : 0;
}

/**
 * Lists the modes (mobile, desktop) the Lighthouse gate audits.
 *
 * @returns The modes named in the gate's loop.
 */
export function lighthouseModes(): string[] {
    const source = fs.readFileSync('scripts/lighthouse.mjs', 'utf8');
    const loop = /for \(const mode of \[([^\]]+)\]\)/.exec(source);
    return loop
        ? (loop[1].match(/'([^']+)'/g) ?? []).map((m) => m.slice(1, -1))
        : [];
}

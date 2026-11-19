import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { Page } from '@playwright/test';
import { AxeRuleTags } from '../../enums/site/a11y';

/** What an accessibility scan found */
export interface A11yScan {
    violations: Result[];
    passedRules: number;
}

/**
 * Runs axe-core on the page as it is right now.
 *
 * @param page - The page to scan.
 * @returns The violations and how many rules passed.
 */
export async function scanAccessibility(page: Page): Promise<A11yScan> {
    const results = await new AxeBuilder({ page })
        .withTags([...AxeRuleTags])
        .analyze();
    return {
        violations: results.violations,
        passedRules: results.passes.length,
    };
}

/**
 * Writes violations as readable text, for the message of a failed assertion.
 *
 * @param violations - The violations axe reported.
 * @returns One block per rule, with the first five failing elements.
 */
export function describeViolations(violations: Result[]): string {
    return violations
        .map(
            (violation) =>
                `${violation.id} (${violation.impact}): ${violation.help}\n` +
                violation.nodes
                    .slice(0, 5)
                    .map(
                        (node) =>
                            `    ${node.target.join(' ')}  ->  ${(node.failureSummary ?? '').split('\n').slice(1).join(' ')}`
                    )
                    .join('\n')
        )
        .join('\n');
}

/**
 * Loads an HTML string as the page content.
 *
 * @param page - The page to fill.
 * @param html - The document to load.
 */
export async function loadHtml(page: Page, html: string): Promise<void> {
    await page.setContent(html);
}

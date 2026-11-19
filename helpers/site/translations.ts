import fs from 'fs';
import { Page } from '@playwright/test';
import { ALL_LANGUAGES } from '../../enums/site/i18n';

/** One ready-made question with its answer */
export interface QaItem {
    id: string;
    q: string;
    a: string;
}

/** The text of one language: every plain string by key, plus the questions */
export interface Dictionary {
    strings: Record<string, string>;
    qa: QaItem[];
}

/** All translations, as the browser sees them */
export interface Translations {
    dictionaries: Record<string, Dictionary>;
    months: Record<string, string[]>;
}

interface RawBundle {
    DICT: Record<string, Record<string, string> & { qa?: QaItem[] }>;
    MONTHS: Record<string, string[]>;
}

/**
 * Loads assets/i18n.js the same way a browser does: the file attaches an
 * `I18N` object to `window`.
 *
 * @returns The dictionaries (strings and questions kept apart) and the month tables.
 */
export function loadTranslations(): Translations {
    const holder: { I18N?: RawBundle } = {};
    new Function('window', fs.readFileSync('assets/i18n.js', 'utf8'))(holder);
    const bundle = holder.I18N;
    if (!bundle) throw new Error('assets/i18n.js did not define I18N');
    const dictionaries: Record<string, Dictionary> = {};
    for (const code of ALL_LANGUAGES) {
        const raw = bundle.DICT[code];
        const strings: Record<string, string> = {};
        for (const [key, value] of Object.entries(raw)) {
            if (key !== 'qa' && typeof value === 'string') strings[key] = value;
        }
        dictionaries[code] = { strings, qa: raw.qa ?? [] };
    }
    return { dictionaries, months: bundle.MONTHS };
}

/**
 * Lists every translation key the two pages ask for in their markup.
 *
 * @returns The keys from `data-i18n` and `data-i18n-attr` attributes.
 */
export function translationKeysUsedInPages(): Set<string> {
    const used = new Set<string>();
    for (const file of ['index.html', 'resume.html']) {
        const html = fs.readFileSync(file, 'utf8');
        for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) {
            used.add(match[1]);
        }
        for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
            for (const pair of match[1].split(';'))
                used.add(pair.split(':')[1]);
        }
    }
    return used;
}

/**
 * Every visible string of one language, the strings and the questions and answers.
 *
 * @param dictionary - One language's dictionary.
 * @returns A list of `[where, text]` pairs.
 */
export function allTexts(dictionary: Dictionary): Array<[string, string]> {
    const texts: Array<[string, string]> = Object.entries(dictionary.strings);
    for (const item of dictionary.qa) {
        texts.push([`qa:${item.id}:q`, item.q], [`qa:${item.id}:a`, item.a]);
    }
    return texts;
}

/**
 * Pulls the numbers out of a text.
 *
 * @param text - Any text.
 * @returns Each run of digits, in order.
 */
export function digitsOf(text: string): string[] {
    return text.match(/\d+/g) ?? [];
}

/**
 * Counts how many times a marker appears in a text.
 *
 * @param text - The text to search.
 * @param marker - The marker, e.g. `**` or `__`.
 * @returns The number of occurrences.
 */
export function countMarker(text: string, marker: string): number {
    return text.split(marker).length - 1;
}

/** Wording that would make the text gendered, or drop the title "QA Engineer" */
export const GENDERED_WORDING =
    // lookarounds instead of \b: \b does not treat accented letters (the U in "Único") as word characters
    /(?<![\p{L}])(motivad[oa]|[uú]nic[oa] QA|engenheir[oa]|ingenier[oa] de|ingénieu?r[e]? QA|seul[e]? QA)(?![\p{L}])/iu;

/** Wording that means unfinished content was left in a text */
export const LEFTOVERS = /\bTODO\b|lorem ipsum|undefined|\[object/;

/**
 * Stops the page's scripts from running, so the raw English HTML can be read
 * before any translation is applied. Call before navigating.
 *
 * @param page - The page to prepare.
 */
export async function blockPageScripts(page: Page): Promise<void> {
    await page.route('**/assets/*.js', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: '' })
    );
}

/**
 * Reads the English text written in the HTML, keyed by translation key, with
 * `**bold**` and `__italic__` marks for strong and em elements.
 *
 * @param page - A page loaded with its scripts blocked.
 * @returns The text of every translatable element and attribute.
 */
export async function rawTranslatableText(
    page: Page
): Promise<Record<string, string>> {
    return page.evaluate(() => {
        const markup = (element: Element): string =>
            Array.from(element.childNodes)
                .map((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent ?? '';
                    }
                    const tag = (node as Element).tagName;
                    const text = node.textContent ?? '';
                    if (tag === 'STRONG') return `**${text}**`;
                    if (tag === 'EM') return `__${text}__`;
                    return text;
                })
                .join('')
                .replace(/\s+/g, ' ')
                .trim();
        const found: Record<string, string> = {};
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            found[element.getAttribute('data-i18n') ?? ''] = markup(element);
        });
        document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
            for (const pair of (
                element.getAttribute('data-i18n-attr') ?? ''
            ).split(';')) {
                const [attribute, key] = pair.split(':');
                found[key] = element.getAttribute(attribute) ?? '';
            }
        });
        return found;
    });
}

/**
 * Finds structural problems in one language: empty values, unbalanced bold or
 * italic marks, and leftover placeholder wording.
 *
 * @param dictionary - One language's dictionary.
 * @returns One line per problem, empty when the language is clean.
 */
export function textProblems(dictionary: Dictionary): string[] {
    const problems: string[] = [];
    for (const [where, text] of allTexts(dictionary)) {
        if (text.trim().length === 0) problems.push(`${where}: empty`);
        if (countMarker(text, '**') % 2 !== 0) {
            problems.push(`${where}: unbalanced bold`);
        }
        if (countMarker(text, '__') % 2 !== 0) {
            problems.push(`${where}: unbalanced italic`);
        }
        if (LEFTOVERS.test(text))
            problems.push(`${where}: leftover placeholder`);
    }
    return problems;
}

/**
 * Finds keys whose text is identical to the English although it should be translated.
 *
 * @param english - The English dictionary.
 * @param translated - The dictionary to check.
 * @param allowed - Keys that may equal the English (names kept on purpose).
 * @returns The untranslated keys, and untranslated questions or answers.
 */
export function untranslatedEntries(
    english: Dictionary,
    translated: Dictionary,
    allowed: Set<string>
): string[] {
    const same = Object.keys(english.strings).filter(
        (key) =>
            translated.strings[key] === english.strings[key] &&
            !allowed.has(key)
    );
    english.qa.forEach((item, index) => {
        if (translated.qa[index].q === item.q) same.push(`qa:${item.id}:q`);
        if (translated.qa[index].a === item.a) same.push(`qa:${item.id}:a`);
    });
    return same;
}

/**
 * Finds numbers that are in the English text but missing from the translation.
 *
 * @param english - The English dictionary.
 * @param translated - The dictionary to check.
 * @returns One line per lost number, as `where: number`.
 */
export function lostNumbers(
    english: Dictionary,
    translated: Dictionary
): string[] {
    const lost: string[] = [];
    const compare = (where: string, from: string, to: string): void => {
        const kept = digitsOf(to);
        for (const digit of digitsOf(from)) {
            if (!kept.includes(digit)) lost.push(`${where}: ${digit}`);
        }
    };
    for (const key of Object.keys(english.strings)) {
        compare(key, english.strings[key], translated.strings[key]);
    }
    english.qa.forEach((item, index) => {
        compare(`qa:${item.id}`, item.a, translated.qa[index].a);
    });
    return lost;
}

/**
 * Finds product or tool names that are in the English résumé and answers but
 * missing from the translation.
 *
 * @param english - The English dictionary.
 * @param translated - The dictionary to check.
 * @param names - The names that must survive.
 * @returns The names that were lost.
 */
export function lostProductNames(
    english: Dictionary,
    translated: Dictionary,
    names: readonly string[]
): string[] {
    const keys = Object.keys(english.strings).filter(
        (key) => key.startsWith('r.') || key === 'c.help.intro'
    );
    const textOf = (dictionary: Dictionary): string =>
        keys.map((key) => dictionary.strings[key]).join(' ') +
        dictionary.qa.map((item) => item.a).join(' ');
    const original = textOf(english);
    const result = textOf(translated);
    return names.filter(
        (name) => original.includes(name) && !result.includes(name)
    );
}

/**
 * Lists where a dictionary uses gendered wording.
 *
 * @param dictionary - One language's dictionary.
 * @returns The keys (or question ids) whose text is gendered.
 */
export function genderedEntries(dictionary: Dictionary): string[] {
    return allTexts(dictionary)
        .filter(([, text]) => GENDERED_WORDING.test(text))
        .map(([where]) => where);
}

/**
 * Lists the keys the pages use that a dictionary has no value for.
 *
 * @param dictionary - One language's dictionary.
 * @param used - The keys the pages use.
 * @returns The missing keys.
 */
export function missingKeys(
    dictionary: Dictionary,
    used: Set<string>
): string[] {
    return [...used].filter((key) => !dictionary.strings[key]);
}

/**
 * Lists keys whose text differs between the page's raw English and the dictionary.
 *
 * @param found - The raw text read from the page.
 * @param english - The English dictionary.
 * @returns The keys that have drifted.
 */
export function driftedKeys(
    found: Record<string, string>,
    english: Dictionary
): string[] {
    return Object.entries(found)
        .filter(([key, text]) => english.strings[key] !== text)
        .map(([key]) => key);
}

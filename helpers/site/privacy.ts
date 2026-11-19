/**
 * A generic Portuguese-style phone number (+351 optional, nine digits starting
 * with 9). It catches any such number without writing a real one into this
 * public repository.
 */
const PHONE_LIKE =
    /(?:\+\s?351[\s.-]?)?(?<![\w.])9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}(?![\w])/;

/** Words that mean unfinished content was left in an answer */
const PLACEHOLDER_WORDS = /\bTODO\b|lorem ipsum|XXX/i;

/**
 * Tells whether a text contains something that looks like a phone number.
 *
 * @param text - The text to check.
 * @returns True when a phone-like number is present.
 */
export function containsPhoneNumber(text: string): boolean {
    return PHONE_LIKE.test(text) || text.includes('+351');
}

/**
 * Tells whether a text contains leftover placeholder wording.
 *
 * @param text - The text to check.
 * @returns True when a placeholder word is present.
 */
export function containsPlaceholder(text: string): boolean {
    return PLACEHOLDER_WORDS.test(text);
}

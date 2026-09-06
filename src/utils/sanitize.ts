/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips all undefined properties recursively from objects before passing to Firestore
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === undefined || obj === null) {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj, (_key, value) => {
    return value === undefined ? null : value;
  }));
}

/**
 * Strips common markdown symbols (asterisks, hashtags, underscores, backticks) for clean previews
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '') // Remove heading hashtags
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove code backticks
    .replace(/^(\s*)[*+-]\s+/gm, '$1') // Remove bullet list asterisks/dashes
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/^\s*>\s+/gm, '') // Remove blockquotes
    .trim();
}

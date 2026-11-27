/**
 * Determines the locale-specific decimal separator.
 * It uses the provided locale or the first locale in navigator.languages (if available) and falls back to "en".
 *
 * @param languages - Optional array of locales or a single locale string
 * @returns The decimal separator character (typically '.' or ',').
 */
export default function getDecimalSeparator(languages?: string | string[]): string {
  const locales = languages || (typeof navigator !== 'undefined' ? navigator.languages : undefined);
  if (!locales) {
    return '.';
  }
  // Every number field asks on every render, and building an `Intl.NumberFormat` is slow
  // As JSON, so a list of locales is not kept as the string that joins them, which names no locale
  const key = JSON.stringify(locales);
  let separator = separators.get(key);
  if (separator === undefined) {
    try {
      const parts = new Intl.NumberFormat(locales).formatToParts(1.1);
      separator = parts.find((part) => part.type === 'decimal')?.value || '.';
    } catch (e) {
      separator = '.';
    }
    separators.set(key, separator);
  }
  return separator;
}

const separators = new Map<string, string>();

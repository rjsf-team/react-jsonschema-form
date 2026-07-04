/**
 * Determines the locale-specific decimal separator.
 * It uses the provided locale or the first locale in navigator.languages (if available) and falls back to "en".
 *
 * @param languages - Optional array of locales or a single locale string
 * @returns The decimal separator character (typically '.' or ',').
 */
export default function getDecimalSeparator(languages?: string | string[]): string {
  const locales = languages || (typeof navigator !== 'undefined' ? navigator.languages : undefined);
  if (locales) {
    try {
      const formatter = new Intl.NumberFormat(locales);
      const parts = formatter.formatToParts(1.1);
      return parts.find((part) => part.type === 'decimal')?.value || '.';
    } catch (e) {
      // Fallback
    }
  }
  return '.';
}

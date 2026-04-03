/** Regex that matches a `now()` expression with an optional offset in seconds.
 * Examples: `"now()"`, `"now()+3600"`, `"now()-86400"`, `"now() + 60"`
 */
export const NOW_EXPRESSION_REGEX = /^now\(\)\s*([+-]\s*\d+)?$/;

/** Formats a `Date` object as a string matching the given JSON Schema date/time format.
 *
 * @param date - The date to format
 * @param format - The JSON Schema format: `"date"`, `"date-time"`, or `"time"`
 * @returns - The formatted date string
 */
export function formatDateForSchema(date: Date, format: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'date-time':
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/** Resolves a `formatMinimum`/`formatMaximum` expression to a concrete date string.
 * If the expression matches the `now()` syntax it is evaluated at call time; otherwise
 * the string is returned unchanged so static date values are unaffected.
 *
 * @param expression - The expression to resolve, e.g. `"now()"`, `"now()+3600"`, or `"2023-01-01"`
 * @param format - The JSON Schema format of the field: `"date"`, `"date-time"`, or `"time"`
 * @returns - The resolved date string
 */
export function resolveDateExpression(expression: string, format: string): string {
  const match = NOW_EXPRESSION_REGEX.exec(expression);
  if (!match) {
    return expression;
  }

  const now = new Date();
  const offsetPart = match[1];

  if (offsetPart) {
    const offsetSeconds = parseInt(offsetPart.replace(/\s/g, ''), 10);
    now.setSeconds(now.getSeconds() + offsetSeconds);
  }

  return formatDateForSchema(now, format);
}

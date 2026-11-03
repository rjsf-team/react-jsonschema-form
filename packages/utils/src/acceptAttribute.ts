/** The value of a file input's `accept` attribute for an `accept` option: a string, or an array of them joined with
 * commas. A JSON uiSchema can hold anything here, so whatever isn't a string is left out
 *
 * @param accept - The `accept` option
 * @returns - The attribute's value, or undefined when the option names no file types
 */
export default function acceptAttribute(accept: unknown): string | undefined {
  const fileTypes: unknown[] = Array.isArray(accept) ? accept : [accept];
  return fileTypes.filter((fileType) => typeof fileType === 'string').join(',') || undefined;
}

/** Converts a local Date string into a UTC date string
 *
 * @param dateString
 * @returns - A UTC date string if `dateString` is truthy, otherwise undefined
 */
export default function localToUTC(dateString: string) {
  return dateString ? new Date(dateString).toJSON() : undefined;
}

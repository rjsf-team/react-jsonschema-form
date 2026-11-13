/** Strips a trailing colon, ASCII or full-width, from a label's text, which antd's form does to a string label where it
 * draws its own colon as generated content, so the label doesn't show two
 *
 * @param text - The label's text
 * @returns - The text without its trailing colon
 */
export default function stripTrailingColon(text: string): string {
  return text.replace(/[：:]\s*$/, '');
}

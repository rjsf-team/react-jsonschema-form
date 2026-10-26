/** The ids carried by more than one element in `container`
 *
 * @param container - The element or document to search
 * @param [selector='[id]'] - The elements whose ids are compared, such as only the form's own
 * @returns - Each repeat of an id already carried by an earlier element
 */
export function duplicateIds(container: ParentNode, selector = '[id]') {
  const seen = new Set<string>();
  const repeats: string[] = [];
  for (const { id } of container.querySelectorAll(selector)) {
    if (seen.has(id)) {
      repeats.push(id);
    } else {
      seen.add(id);
    }
  }
  return repeats;
}

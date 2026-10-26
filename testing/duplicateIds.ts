/** The ids carried by more than one element in `container`
 *
 * @param container - The element or document to search
 * @returns - Each repeat of an id already carried by an earlier element
 */
export function duplicateIds(container: ParentNode) {
  const ids = Array.from(container.querySelectorAll('[id]'), (element) => element.id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

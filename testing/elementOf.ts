/** The first element `selector` matches in `container`, failing the test when there is none, or when it isn't a `type`
 *
 * @param container - The element or document to search
 * @param selector - The selector to match
 * @param [type] - The class the element must be an instance of, `Element` by default
 * @returns - The element, narrowed to `type`
 */
export function elementOf(container: ParentNode, selector: string): Element;
export function elementOf<E extends Element>(container: ParentNode, selector: string, type: abstract new () => E): E;
export function elementOf(container: ParentNode, selector: string, type: abstract new () => Element = Element) {
  const element = container.querySelector(selector);
  if (!(element instanceof type)) {
    throw new Error(`No ${type.name} matches ${selector}`);
  }
  return element;
}

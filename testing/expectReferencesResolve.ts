const REFERENCES = ['aria-labelledby', 'aria-describedby', 'aria-controls'];

/** Checks that every id a `for`, an `aria-labelledby`, an `aria-describedby` or an `aria-controls` in `container` names
 * belongs to an element there, listing each reference that names none
 */
export function expectReferencesResolve(container: HTMLElement) {
  const dangling: string[] = [];
  const check = (element: Element, attribute: string, ids: string | null) =>
    (ids ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((id) => {
        if (!container.querySelector(`[id="${CSS.escape(id)}"]`)) {
          dangling.push(`${attribute}="${id}" on ${element.outerHTML.slice(0, 120)}`);
        }
      });
  container.querySelectorAll('label[for]').forEach((label) => check(label, 'for', label.getAttribute('for')));
  container.querySelectorAll(REFERENCES.map((attribute) => `[${attribute}]`).join(', ')).forEach((element) => {
    REFERENCES.forEach((attribute) => check(element, attribute, element.getAttribute(attribute)));
  });
  expect(dangling).toEqual([]);
}

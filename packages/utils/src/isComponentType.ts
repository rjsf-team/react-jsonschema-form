import type { ComponentType } from 'react';

/** The `$$typeof` markers of the components React builds as objects rather than functions. A React element carries a
 * `$$typeof` too, which is why the marker's value is checked rather than its presence: `<MyField />` is not a
 * component, and rendering it as one throws
 */
const OBJECT_COMPONENT_TYPES = new Set<unknown>([
  Symbol.for('react.memo'),
  Symbol.for('react.forward_ref'),
  Symbol.for('react.lazy'),
]);

/** Determines whether a value given in place of a component, such as a `ui:field`, a `ui:widget` or a
 * `LayoutGridField` cell's `render`, is one React can render as a component: a function, or one of the objects
 * `memo()`, `forwardRef()` and `lazy()` return, all of which `ComponentType` admits.
 *
 * @param value - The value to check
 * @returns - True when the value is a component, false for anything else, a React element included
 */
export default function isComponentType(value: unknown): value is ComponentType<any> {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' &&
      value !== null &&
      OBJECT_COMPONENT_TYPES.has((value as { $$typeof?: unknown }).$$typeof))
  );
}

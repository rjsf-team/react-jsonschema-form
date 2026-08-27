import { isValidElement } from 'react';

import type { FormContextType, StrictRJSFSchema, Widget } from './types';

/** Determines whether `widget` is a renderable component rather than a widget name. Function and class components
 * are functions; wrappers such as `memo()`, `forwardRef()` and `lazy()` are objects tagged with a `$$typeof` symbol,
 * so checking the tag covers current and future wrappers alike. Elements carry the tag too, so `isValidElement`
 * excludes a mistakenly passed `<Widget />`.
 *
 * @param widget - Either the name of the widget OR a `Widget` implementation
 * @returns - True when `widget` is a component that can be rendered directly
 */
export default function isWidgetComponent<T, S extends StrictRJSFSchema, F extends FormContextType>(
  widget: unknown,
): widget is Widget<T, S, F> {
  if (typeof widget === 'function') {
    return true;
  }
  if (typeof widget !== 'object' || widget === null || isValidElement(widget)) {
    return false;
  }
  return '$$typeof' in widget && typeof widget.$$typeof === 'symbol';
}

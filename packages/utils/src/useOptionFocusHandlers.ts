'use client';

import { useMemo } from 'react';

import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

export interface UseOptionFocusHandlersResult {
  /** The `onFocus` handler of each option of `enumOptions`, by position, which reports that option's value */
  focusHandlers: (() => void)[];
  /** The `onBlur` handler of each option of `enumOptions`, by position, which reports that option's value */
  blurHandlers: (() => void)[];
}

/** Hook which builds the focus and blur handlers of the options of a widget that renders one focusable element per
 * option, such as a `CheckboxesWidget`. Each handler reports its option's value from `enumOptions`, rather than
 * decoding the focused element's DOM `value`, so it holds whether or not a theme's component forwards that attribute.
 * To be used by theme specific `CheckboxesWidget` implementations.
 *
 * @param props - The `id`, `options`, `onFocus` and `onBlur` from the `WidgetProps` of the widget
 * @returns - The `UseOptionFocusHandlersResult` to be used within the widget implementation
 */
export default function useOptionFocusHandlers<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'id' | 'options' | 'onFocus' | 'onBlur'>): UseOptionFocusHandlersResult {
  const { id, options, onFocus, onBlur } = props;
  const { enumOptions } = options;
  return useMemo(() => {
    const optionList = Array.isArray(enumOptions) ? enumOptions : [];
    // Guarded although `WidgetProps` requires both, since a custom field composing a theme's widget may leave them out
    return {
      focusHandlers: optionList.map(
        ({ value }) =>
          () =>
            onFocus?.(id, value),
      ),
      blurHandlers: optionList.map(
        ({ value }) =>
          () =>
            onBlur?.(id, value),
      ),
    };
  }, [id, enumOptions, onFocus, onBlur]);
}

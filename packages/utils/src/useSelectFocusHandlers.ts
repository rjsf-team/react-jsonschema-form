'use client';

import { useCallback } from 'react';

import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

export interface UseSelectFocusHandlersResult {
  /** Reports the widget's form data value to its `onFocus` */
  handleFocus: () => void;
  /** Reports the widget's form data value to its `onBlur` */
  handleBlur: () => void;
}

/** Hook which builds the focus and blur handlers of a select widget whose focused element carries no option value of
 * its own, such as a trigger button or a custom combobox. The widget's `value` is already form data rather than a DOM
 * value, so it's reported as it is, with no selection read as the `emptyValue` option the way a native select reports
 * its decoded empty selection. To be used by theme specific `SelectWidget` implementations.
 *
 * @param props - The `id`, `value`, `options`, `onFocus` and `onBlur` from the `WidgetProps` of the `SelectWidget`
 * @returns - The `UseSelectFocusHandlersResult` to be used within a `SelectWidget` implementation
 */
export default function useSelectFocusHandlers<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'id' | 'value' | 'options' | 'onFocus' | 'onBlur'>): UseSelectFocusHandlersResult {
  const { id, value, options, onFocus, onBlur } = props;
  const reportedValue = value === undefined ? options.emptyValue : value;
  // Guarded although `WidgetProps` requires both, since a custom field composing a theme's widget may leave them out
  const handleFocus = useCallback(() => onFocus?.(id, reportedValue), [onFocus, id, reportedValue]);
  const handleBlur = useCallback(() => onBlur?.(id, reportedValue), [onBlur, id, reportedValue]);
  return { handleFocus, handleBlur };
}

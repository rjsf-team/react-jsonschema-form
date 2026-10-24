import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates } from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { value, disabled, readonly, registry, options } = props;
  const { BaseInputTemplate } = getTemplates<T, S, F>(registry, options);
  const { classMap } = registry;
  // A browser ignores `readonly` on a range input, so a read-only range is disabled to keep it from being dragged, and a
  // range input can't show an empty value, so it has no clear button, which would leave the slider at its midpoint
  return (
    <div className={clsx('rjsf-field-range-wrapper', classMap.rangeWrapper)}>
      <BaseInputTemplate
        type='range'
        {...props}
        disabled={disabled || readonly}
        options={{ ...options, allowClearTextInputs: false }}
      />
      <span className='rjsf-range-view'>{value}</span>
    </div>
  );
}

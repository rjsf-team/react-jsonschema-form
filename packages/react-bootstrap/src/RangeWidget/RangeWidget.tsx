import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates, toInputValue } from '@rjsf/utils';

/** The `RangeWidget` component renders a `range` input through the `BaseInputTemplate`, as core's does, with the
 * value beside it
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
  // A browser ignores `readonly` on a range input, so a read-only range is disabled to keep it from being dragged.
  // `offersClearButton()` offers no clear button for a range, and `allowClearTextInputs: false` keeps one off in a custom
  // `BaseInputTemplate` that doesn't ask it
  return (
    <>
      <BaseInputTemplate
        type='range'
        {...props}
        disabled={disabled || readonly}
        options={{ ...options, allowClearTextInputs: false }}
      />
      <span className='range-view'>{toInputValue(value)}</span>
    </>
  );
}

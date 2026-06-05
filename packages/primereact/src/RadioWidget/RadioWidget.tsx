import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsIsSelected,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';
import type { RadioButtonChangeEvent } from 'primereact/radiobutton';
import { RadioButton } from 'primereact/radiobutton';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, htmlName, value, disabled, readonly, onChange, onBlur, onFocus, options } = props;
  const primeProps = (options.prime || {}) as object;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);

  const handleChange = (e: RadioButtonChangeEvent) => {
    onChange(enumOptionValueDecoder<S>(e.value, enumOptions, optionValueFormat, emptyValue));
  };

  const handleBlur = () => onBlur(id, value);
  const handleFocus = () => onFocus(id, value);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, value);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
          return (
            <div key={String(option.value)} style={{ display: 'flex', alignItems: 'center' }}>
              <RadioButton
                inputId={optionId(id, index)}
                name={htmlName || id}
                {...primeProps}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                aria-describedby={ariaDescribedByIds(id)}
              />
              <label htmlFor={optionId(id, index)} style={{ marginLeft: '8px' }}>
                {option.label}
              </label>
            </div>
          );
        })}
    </div>
  );
}

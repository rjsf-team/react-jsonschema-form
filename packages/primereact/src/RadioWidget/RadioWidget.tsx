import {
  ariaDescribedByIds,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, value, disabled, readonly, onChange, onBlur, onFocus, options } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = (e: RadioButtonChangeEvent) => {
    onChange(enumOptionsValueForIndex<S>(e.value, enumOptions, emptyValue));
  };

  const _onBlur = () => onBlur(id, value);
  const _onFocus = () => onFocus(id, value);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, value);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <RadioButton
                inputId={optionId(id, index)}
                name={id}
                onFocus={_onFocus}
                onBlur={_onBlur}
                onChange={_onChange}
                value={String(index)}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                aria-describedby={ariaDescribedByIds<T>(id)}
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

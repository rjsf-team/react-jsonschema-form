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

import { Input, Radio } from '@mantine/core';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, value, required, disabled, readonly, onChange, onBlur, onFocus, options, rawErrors = [] } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const _onChange = (nextValue: any) => onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  const hasErrors = rawErrors.length > 0;

  const _onBlur = () => onBlur(id, value);
  const _onFocus = () => onFocus(id, value);
  return (
    <Input.Wrapper>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, value);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          return (
            <Radio
              required={required}
              id={optionId(id, index)}
              name={id}
              onFocus={_onFocus}
              onBlur={_onBlur}
              onChange={_onChange}
              label={option.label}
              value={String(index)}
              key={index}
              checked={checked}
              disabled={disabled || itemDisabled || readonly}
              aria-describedby={ariaDescribedByIds<T>(id)}
            />
          );
        })}
      {hasErrors &&
        rawErrors.map((error, index) => <Input.Error key={`radio-widget-input-errors-${index}`}>{error}</Input.Error>)}
    </Input.Wrapper>
  );
}

import { FormEvent } from 'react';
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
import { CheckboxProps, Form, Radio } from 'semantic-ui-react';
import { getSemanticProps } from '../util';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    onChange,
    onBlur,
    onFocus,
    options,
    formContext,
    uiSchema,
    rawErrors = [],
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const semanticProps = getSemanticProps<T, S, F>({
    formContext,
    options,
    uiSchema,
  });
  const _onChange = (_: FormEvent<HTMLInputElement>, { value: eventValue }: CheckboxProps) => {
    return onChange(enumOptionsValueForIndex<S>(eventValue!, enumOptions, emptyValue));
  };

  const _onBlur = () => onBlur(id, value);
  const _onFocus = () => onFocus(id, value);
  const inlineOption = options.inline ? { inline: true } : { grouped: true };
  return (
    <Form.Group {...inlineOption}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, value);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          return (
            <Form.Field
              required={required}
              control={Radio}
              id={optionId(id, index)}
              name={id}
              {...semanticProps}
              onFocus={_onFocus}
              onBlur={_onBlur}
              onChange={_onChange}
              label={option.label}
              value={String(index)}
              error={rawErrors.length > 0}
              key={index}
              checked={checked}
              disabled={disabled || itemDisabled || readonly}
              aria-describedby={ariaDescribedByIds<T>(id)}
            />
          );
        })}
    </Form.Group>
  );
}

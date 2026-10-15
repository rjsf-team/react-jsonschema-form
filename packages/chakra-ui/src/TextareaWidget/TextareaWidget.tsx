import type { ChangeEvent, FocusEvent } from 'react';
import { Textarea } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, hasWidgetErrors, labelValue, widgetDrawsLabelText } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { getChakra } from '../utils.ts';

export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    value,
    label,
    disabled,
    autofocus,
    readonly,
    onBlur,
    onFocus,
    onChange,
    options,
    required,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value);

  const chakraProps = getChakra(options);

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, hideLabel || !label)}
      {...chakraProps}
    >
      <Textarea
        id={id}
        name={htmlName || id}
        value={value ?? ''}
        placeholder={placeholder}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        rows={options.rows}
        {...getControlAttributes<T, S, F>({ id, presentation })}
      />
    </Field>
  );
}

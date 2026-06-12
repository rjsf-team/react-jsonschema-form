import type { ChangeEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue } from '@rjsf/utils';
import { Form } from 'semantic-ui-react';

import { getSemanticProps } from '../util';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    value,
    required,
    disabled,
    autofocus,
    label,
    hideLabel,
    readonly,
    onBlur,
    onFocus,
    onChange,
    options,
    registry,
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    formContext: registry.formContext,
    options,
    defaultSchemaProps: { inverted: 'false' },
  });
  // oxlint-disable-next-line no-shadow
  const handleChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange?.(value === '' ? options.emptyValue : value);
  const handleBlur = () => onBlur?.(id, value);
  const handleFocus = () => onFocus?.(id, value);
  return (
    <Form.TextArea
      id={id}
      key={id}
      name={htmlName || id}
      label={labelValue(label || undefined, hideLabel, false)}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      {...semanticProps}
      value={value || ''}
      error={rawErrors.length > 0}
      rows={options.rows || 5}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}

import { ChangeEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Form } from 'semantic-ui-react';
import { getSemanticProps } from '../util';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
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
    formContext,
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    formContext,
    options,
    defaultSchemaProps: { inverted: 'false' },
  });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange && onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <Form.TextArea
      id={id}
      key={id}
      name={id}
      label={labelValue(label || undefined, hideLabel, false)}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      {...semanticProps}
      value={value || ''}
      error={rawErrors.length > 0}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}

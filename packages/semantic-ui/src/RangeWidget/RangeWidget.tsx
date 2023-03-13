import { ChangeEvent } from 'react';
import { Input } from 'semantic-ui-react';
import { ariaDescribedByIds, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, rangeSpec } from '@rjsf/utils';
import { getSemanticProps } from '../util';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const {
    id,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
    uiSchema,
    formContext,
    rawErrors = [],
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    formContext,
    options,
    uiSchema,
    defaultSchemaProps: {
      fluid: true,
    },
  });

  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange && onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <>
      <Input
        id={id}
        key={id}
        name={id}
        type='range'
        required={required}
        disabled={disabled || readonly}
        {...rangeSpec<S>(schema)}
        {...semanticProps}
        value={value || ''}
        error={rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
      <span>{value}</span>
    </>
  );
}

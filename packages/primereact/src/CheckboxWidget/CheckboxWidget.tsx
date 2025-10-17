import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  labelValue,
  schemaRequiresTrueValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';

import { Label } from '../util';

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label = '',
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
    schema,
    uiSchema,
    registry,
  } = props;

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );

  const required = schemaRequiresTrueValue<S>(schema);
  const checked = value === 'true' || value === true;
  const _onChange = (e: CheckboxChangeEvent) => onChange && onChange(e.checked);
  const _onBlur: React.FocusEventHandler<HTMLInputElement> = () => onBlur && onBlur(id, value);
  const _onFocus: React.FocusEventHandler<HTMLInputElement> = () => onFocus && onFocus(id, value);
  const description = options.description ?? schema.description;
  const primeProps = (options.prime || {}) as object;

  return (
    <>
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
        <Checkbox
          inputId={id}
          name={htmlName || id}
          {...primeProps}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          checked={typeof value === 'undefined' ? false : checked}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
          required={required}
          aria-describedby={ariaDescribedByIds(id)}
        />
        {labelValue(<Label id={id} text={label} />, hideLabel, false)}
      </div>
    </>
  );
}

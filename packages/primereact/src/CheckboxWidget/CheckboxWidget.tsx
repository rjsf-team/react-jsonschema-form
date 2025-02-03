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
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
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
    options
  );

  const required = schemaRequiresTrueValue<S>(schema);
  const _onChange = (e: CheckboxChangeEvent) => onChange && onChange(e.checked);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const checked = value === 'true' || value === true;
  const description = options.description ?? schema.description;

  return (
    <>
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div
        className='field-checkbox'
        style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}
      >
        <Checkbox
          inputId={id}
          name={id}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          checked={typeof value === 'undefined' ? false : checked}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
          required={required}
          aria-describedby={ariaDescribedByIds<T>(id)}
        />
        {labelValue(<Label id={id} text={label} />, hideLabel, false)}
      </div>
    </>
  );
}

import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  descriptionId,
  getTemplate,
} from '@rjsf/utils';
import { Label } from '../util';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    onChange,
    onBlur,
    onFocus,
    schema,
    uiSchema,
    registry,
    hideLabel,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onChange = (index: number) => (e: CheckboxChangeEvent) => {
    if (e.checked) {
      onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
    } else {
      onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
    }
  };

  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );

  const _onBlur = () => onBlur(id, value);
  const _onFocus = () => onFocus(id, value);

  const description = options.description ?? schema.description;

  return (
    <div
      id={id}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}
    >
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          return (
            <div
              key={index}
              className='field-checkbox'
              style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}
            >
              <Checkbox
                inputId={optionId(id, index)}
                name={id}
                value={option.value}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={_onChange(index)}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={ariaDescribedByIds<T>(id)}
              />
              <Label id={optionId(id, index)} text={option.label} />
            </div>
          );
        })}
    </div>
  );
}

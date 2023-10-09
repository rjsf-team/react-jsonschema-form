import { ChangeEvent, FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  WidgetProps,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from '@rjsf/utils';
import { Checkbox } from '@carbon/react';
import { LabelValue } from '../components/LabelValue';

/** Implement `CheckboxWidget`
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
    rawErrors,
    onChange,
    onBlur,
    onFocus,
    label,
    hideLabel,
    registry,
    options,
    uiSchema,
    schema,
  } = props;
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );
  const description = options.description || schema.description;

  const _onChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <>
      <style>
        {`
          .checkbox.cds--checkbox-wrapper--invalid>.cds--checkbox__validation-msg {
            display: none;
          }
        `}
      </style>
      <Checkbox
        id={id}
        name={id}
        className='checkbox'
        labelText={<LabelValue label={label} required={required} hide={hideLabel || !label} />}
        checked={typeof value === 'undefined' ? false : value}
        disabled={disabled || readonly}
        invalid={rawErrors && rawErrors.length > 0}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
        readOnly={readonly}
        required={required}
      />
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
}

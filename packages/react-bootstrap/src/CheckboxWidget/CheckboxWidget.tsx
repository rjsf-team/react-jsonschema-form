import type { FocusEvent } from 'react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, getTemplate, schemaRequiresTrueValue } from '@rjsf/utils';
import { Form } from 'react-bootstrap';

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
    label,
    hideLabel,
    schema,
    autofocus,
    options,
    onChange,
    onBlur,
    onFocus,
    registry,
    uiSchema,
    required,
  } = props;
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const trueValueRequired = schemaRequiresTrueValue<S>(schema) && required;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );

  const handleChange = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onChange(checked);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.checked);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.checked);

  const description = options.description || schema.description;
  return (
    <Form.Group className={disabled || readonly ? 'disabled' : ''} aria-describedby={ariaDescribedByIds(id)}>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Form.Check
        id={id}
        name={htmlName || id}
        label={
          !hideLabel && label ? (
            <>
              {label}
              {trueValueRequired && <span className='required'>*</span>}
            </>
          ) : undefined
        }
        checked={typeof value === 'undefined' ? false : value}
        required={trueValueRequired}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        type='checkbox'
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
    </Form.Group>
  );
}

import type { FocusEvent } from 'react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  getControlAttributes,
  getTemplates,
  getWidgetDescription,
  hasWidgetErrors,
  schemaRequiresTrueValue,
  widgetDrawsLabel,
} from '@rjsf/utils';
import { Form } from 'react-bootstrap';

export default function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    options,
    onChange,
    onBlur,
    onFocus,
    registry,
    presentation,
    uiSchema,
    required,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const trueValueRequired = schemaRequiresTrueValue<S>(schema) && required;
  // The label is marked as a plan's `required` says, which takes in a box `ui:required` asks of that holds no value
  // yet, while the box is natively required only where the schema demands `true`, as RJSF's own check covers the rest
  // and `aria-required` tells a screen reader of, as the marker is hidden from it
  const marksRequired = presentation?.control ? required : trueValueRequired;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);

  const handleChange = ({ target: { checked } }: FocusEvent<HTMLInputElement>) => onChange(checked);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.checked);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.checked);

  const description = getWidgetDescription<T, S, F>(props);
  return (
    <Form.Group className={disabled || readonly ? 'disabled' : ''}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
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
              {marksRequired && <span className='required'>*</span>}
            </>
          ) : undefined
        }
        checked={Boolean(value)}
        required={trueValueRequired}
        aria-required={(marksRequired && !trueValueRequired) || undefined}
        isInvalid={hasWidgetErrors<T, S, F>(props)}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        type='checkbox'
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...getControlAttributes<T, S, F>({ id, presentation })}
      />
    </Form.Group>
  );
}

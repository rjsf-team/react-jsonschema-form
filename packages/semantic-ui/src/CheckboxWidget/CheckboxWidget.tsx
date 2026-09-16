import type { FormEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, getTemplate, labelValue, schemaRequiresTrueValue } from '@rjsf/utils';
import type { CheckboxProps } from 'semantic-ui-react';
import { Form } from 'semantic-ui-react';

import { getSemanticProps } from '../util.tsx';

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
    label,
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
    schema,
    uiSchema,
    rawErrors = [],
    registry,
    required,
  } = props;
  const semanticProps = getSemanticProps<T, S, F>({
    options,
    formContext: registry.formContext,
    uiSchema,
    defaultSchemaProps: {
      inverted: 'false',
    },
  });
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  const checked = value === 'true' || value === true;
  const handleChange = (_: FormEvent<HTMLInputElement>, data: CheckboxProps) => onChange?.(data.checked);
  const handleBlur: React.FocusEventHandler<HTMLInputElement> = () => onBlur?.(id, value);
  const handleFocus: React.FocusEventHandler<HTMLInputElement> = () => onFocus?.(id, value);
  const description = options.description ?? schema.description;
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;

  return (
    <>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Form.Checkbox
        id={id}
        name={htmlName || id}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        {...semanticProps}
        checked={typeof value === 'undefined' ? false : checked}
        error={rawErrors.length > 0}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={trueValueRequired}
        label={labelValue(label, hideLabel, false)}
        aria-describedby={ariaDescribedByIds(id)}
      />
    </>
  );
}

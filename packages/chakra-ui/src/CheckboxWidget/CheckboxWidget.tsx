import type { FocusEvent } from 'react';
import type { CheckboxCheckedChangeDetails } from '@chakra-ui/react';
import { Field as ChakraField, Text } from '@chakra-ui/react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { ariaDescribedByIds, descriptionId, getTemplates, getUiOptions, schemaRequiresTrueValue } from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Field } from '../components/ui/field.tsx';
import { getChakra } from '../utils.ts';

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
    onChange,
    onBlur,
    onFocus,
    label,
    hideLabel,
    registry,
    options,
    uiSchema,
    schema,
    required,
  } = props;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const uiOptions = getUiOptions(uiSchema);
  const isCheckbox = uiOptions.widget === 'checkbox';
  const description = isCheckbox ? undefined : (options.description ?? schema.description);
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;

  const handleChange = ({ checked }: CheckboxCheckedChangeDetails) => onChange(checked);
  // Duck-typed rather than `instanceof HTMLInputElement`, which is false for inputs rendered inside an iframe.
  const handleBlur = ({ target }: FocusEvent<HTMLElement>) =>
    onBlur(id, 'checked' in target ? target.checked : undefined);
  const handleFocus = ({ target }: FocusEvent<HTMLElement>) =>
    onFocus(id, 'checked' in target ? target.checked : undefined);

  const chakraProps = getChakra({ uiSchema });

  return (
    <Field mb={1} required={required} {...chakraProps}>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={id}
        name={htmlName || id}
        checked={typeof value === 'undefined' ? false : value}
        disabled={disabled || readonly}
        onCheckedChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id)}
      >
        {!hideLabel && label ? (
          <Text>
            {label}
            {trueValueRequired && <ChakraField.RequiredIndicator />}
          </Text>
        ) : undefined}
      </Checkbox>
    </Field>
  );
}

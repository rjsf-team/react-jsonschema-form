import type { FocusEvent } from 'react';
import type { CheckboxCheckedChangeDetails } from '@chakra-ui/react';
import { Field as ChakraField, Text } from '@chakra-ui/react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  getControlAttributes,
  getTemplates,
  getUiOptions,
  getWidgetDescription,
  schemaRequiresTrueValue,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Field } from '../components/ui/field.tsx';
import { getChakra, isInputElement, labelledByOrNone } from '../utils.ts';

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
    presentation,
    registry,
    options,
    uiSchema,
    schema,
    required,
  } = props;
  const drawsLabel = widgetDrawsLabel<T, S, F>(props) && !!label;
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  // The plan says which description this widget draws; without a plan, a template rendering the `checkbox` alias draws
  // the description itself
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;

  const handleChange = ({ checked }: CheckboxCheckedChangeDetails) => onChange(checked);
  const handleBlur = ({ target }: FocusEvent<HTMLElement>) =>
    onBlur(id, isInputElement(target) ? target.checked : undefined);
  const handleFocus = ({ target }: FocusEvent<HTMLElement>) =>
    onFocus(id, isInputElement(target) ? target.checked : undefined);

  const chakraProps = getChakra(options);
  const controlAttributes = getControlAttributes<T, S, F>({ id, presentation });

  return (
    <Field mb={1} required={trueValueRequired} id={id} {...chakraProps}>
      {description && (
        <DescriptionFieldTemplate
          id={description.id}
          description={description.text}
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
        // Ark points the input at the label it draws inside the checkbox, so with none drawn it is pointed at nothing
        inputProps={{
          ...controlAttributes,
          'aria-labelledby': labelledByOrNone(controlAttributes['aria-labelledby'], drawsLabel),
        }}
      >
        {drawsLabel ? (
          <Text>
            {label}
            {trueValueRequired && <ChakraField.RequiredIndicator />}
          </Text>
        ) : undefined}
      </Checkbox>
    </Field>
  );
}

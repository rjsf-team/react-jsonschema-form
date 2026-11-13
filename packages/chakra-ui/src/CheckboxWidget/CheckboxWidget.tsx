import type { FocusEvent } from 'react';
import type { CheckboxCheckedChangeDetails } from '@chakra-ui/react';
import { Text } from '@chakra-ui/react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  getControlAttributes,
  getTemplates,
  getUiOptions,
  getWidgetDescription,
  hasWidgetErrors,
  schemaRequiresTrueValue,
  widgetDrawsLabelText,
  templateMarksRequired,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Field, RequiredMarker } from '../components/ui/field.tsx';
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
    autofocus,
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
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  // The plan says which description this widget draws; without a plan, a template rendering the `checkbox` alias draws
  // the description itself
  const description =
    presentation || getUiOptions(uiSchema).widget !== 'checkbox' ? getWidgetDescription<T, S, F>(props) : undefined;
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;
  // The label is marked as a plan's `required` says, which takes in a box `ui:required` asks of that holds no value
  // yet, while the box is natively required only where the schema demands `true`, as RJSF's own check covers the rest
  // and `aria-required` tells a screen reader of, as the marker is hidden from it
  const marksRequired = presentation?.control ? required : trueValueRequired;

  const handleChange = ({ checked }: CheckboxCheckedChangeDetails) => onChange(checked);
  const handleBlur = ({ target }: FocusEvent<HTMLElement>) =>
    onBlur(id, isInputElement(target) ? target.checked : undefined);
  const handleFocus = ({ target }: FocusEvent<HTMLElement>) =>
    onFocus(id, isInputElement(target) ? target.checked : undefined);

  const chakraProps = getChakra(options);
  const controlAttributes = getControlAttributes<T, S, F>({ id, presentation });

  return (
    <Field mb={1} required={trueValueRequired} invalid={hasWidgetErrors<T, S, F>(props)} id={id} {...chakraProps}>
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
        checked={Boolean(value)}
        disabled={disabled || readonly}
        onCheckedChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        // Ark points the input at the label it draws inside the checkbox, so with none drawn it is pointed at nothing
        inputProps={{
          ...controlAttributes,
          'aria-labelledby': labelledByOrNone(controlAttributes['aria-labelledby'], drawsLabel),
          autoFocus: autofocus,
          'aria-required': (marksRequired && !trueValueRequired) || undefined,
        }}
      >
        {drawsLabel ? (
          <Text>
            {label}
            {marksRequired && templateMarksRequired<T, S, F>(props) && <RequiredMarker />}
          </Text>
        ) : undefined}
      </Checkbox>
    </Field>
  );
}

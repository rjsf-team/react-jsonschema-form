import { FocusEvent } from 'react';
import { CheckboxCheckedChangeDetails, Text } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  labelValue,
  WidgetProps,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from '@rjsf/utils';

import { Field } from '../components/ui/field';
import { Checkbox } from '../components/ui/checkbox';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
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
  } = props;
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options,
  );
  const description = options.description || schema.description;

  const _onChange = ({ checked }: CheckboxCheckedChangeDetails) => onChange(checked);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement | any>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement | any>) => onFocus(id, target && target.value);

  return (
    <Field mb={1} required={required}>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Checkbox
        id={id}
        name={id}
        checked={typeof value === 'undefined' ? false : value}
        disabled={disabled || readonly}
        onCheckedChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {labelValue(<Text>{label}</Text>, hideLabel || !label)}
      </Checkbox>
    </Field>
  );
}

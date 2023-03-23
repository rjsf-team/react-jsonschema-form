import { ChangeEvent, FocusEvent } from 'react';
import { Checkbox, FormControl, Text } from '@chakra-ui/react';
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
import { getChakra } from '../utils';

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
  const chakraProps = getChakra({ uiSchema });
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
    <FormControl mb={1} {...chakraProps} isRequired={required}>
      {!hideLabel && !!description && (
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
        isChecked={typeof value === 'undefined' ? false : value}
        isDisabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {labelValue(<Text>{label}</Text>, hideLabel || !label)}
      </Checkbox>
    </FormControl>
  );
}

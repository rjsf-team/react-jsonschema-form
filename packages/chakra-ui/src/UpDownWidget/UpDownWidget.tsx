import { FocusEvent } from 'react';
import {
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getChakra } from '../utils';

export default function UpDownWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, uiSchema, readonly, disabled, label, hideLabel, value, onChange, onBlur, onFocus, rawErrors, required } =
    props;

  const chakraProps = getChakra({ uiSchema });

  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      {labelValue(<FormLabel htmlFor={id}>{label}</FormLabel>, hideLabel || !label)}
      <NumberInput
        value={value ?? ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        <NumberInputField id={id} name={id} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </FormControl>
  );
}

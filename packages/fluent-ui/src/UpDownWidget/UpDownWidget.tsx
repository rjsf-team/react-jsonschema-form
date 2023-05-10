import { ChangeEvent, FocusEvent, SyntheticEvent } from 'react';
import { ISpinButtonProps, SpinButton } from '@fluentui/react';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  rangeSpec,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WidgetProps,
} from '@rjsf/utils';
import _pick from 'lodash/pick';

import FluentLabel from '../FluentLabel/FluentLabel';

// Keys of ISpinButtonProps from @fluentui/react
const allowedProps: (keyof ISpinButtonProps)[] = [
  'ariaDescribedBy',
  'ariaLabel',
  'ariaPositionInSet',
  'ariaSetSize',
  'ariaValueNow',
  'ariaValueText',
  'className',
  'componentRef',
  'decrementButtonAriaLabel',
  'decrementButtonIcon',
  'defaultValue',
  'disabled',
  'downArrowButtonStyles',
  /* Backward compatibility with fluentui v7 */
  'getClassNames' as any,
  'iconButtonProps',
  'iconProps',
  'incrementButtonAriaLabel',
  'incrementButtonIcon',
  'inputProps',
  'keytipProps',
  'label',
  'labelPosition',
  'max',
  'min',
  'onBlur',
  'onDecrement',
  'onFocus',
  'onIncrement',
  'onValidate',
  'precision',
  'step',
  'styles',
  'theme',
  'title',
  'upArrowButtonStyles',
  'value',
];

export default function UpDownWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  required,
  readonly,
  disabled,
  label,
  hideLabel,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  schema,
  registry,
}: WidgetProps<T, S, F>) {
  const { translateString } = registry;
  const _onChange = (ev: ChangeEvent<HTMLInputElement> | SyntheticEvent<HTMLElement>, newValue?: string) => {
    if (newValue) {
      onChange(Number(newValue));
    } else if ('value' in ev.target) {
      /* Backward compatibility with fluentui v7 */
      onChange(Number(ev.target.value));
    }
  };

  let { min, max, step } = rangeSpec<S>(schema);
  if (min === undefined) {
    min = -1 * Infinity;
  }
  if (max === undefined) {
    max = Infinity;
  }
  if (step === undefined) {
    step = 1;
  }

  const _onIncrement = (value: string) => {
    if (Number(value) + step! <= max!) {
      onChange(Number(value) + step!);
    }
  };

  const _onDecrement = (value: string) => {
    if (Number(value) - step! >= min!) {
      onChange(Number(value) - step!);
    }
  };

  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);

  return (
    <>
      {labelValue(<FluentLabel label={label || undefined} required={required} id={id} />, hideLabel)}
      <SpinButton
        id={id}
        min={min}
        max={max}
        step={step}
        incrementButtonAriaLabel={translateString(TranslatableString.IncrementAriaLabel)}
        decrementButtonAriaLabel={translateString(TranslatableString.DecrementAriaLabel)}
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ''}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
        onIncrement={_onIncrement}
        onDecrement={_onDecrement}
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}

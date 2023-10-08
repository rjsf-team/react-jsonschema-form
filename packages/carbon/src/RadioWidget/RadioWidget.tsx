import { FocusEvent } from 'react';
import { FormGroup, RadioButtonGroup, RadioButton } from '@carbon/react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { ConditionLabel } from '../components/ConditionLabel';

/** Implement `RadioWidget`
 */
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  hideLabel,
  rawErrors,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue, inline } = options;

  const _onChange = (nextValue: any) => onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const selectedIndex = (enumOptionsIndexForValue<S>(value, enumOptions) as string) ?? null;

  return (
    <>
      <style>
        {`
          .field-radio-group .cds--radio-button-group--invalid+.cds--radio-button__validation-msg {
            display: none;
          }
          .field-radio-group .block .cds--radio-button-group {
            flex-direction: column;
            align-items: flex-start;
          }
          .field-radio-group .block .cds--radio-button-group > .cds--radio-button-wrapper:not(:last-of-type) {
            margin-inline-end: 0;
            margin-block-end: 0.5rem;
          }
        `}
      </style>
      <FormGroup
        legendText={<ConditionLabel label={label} hide={hideLabel || !label} required={required} />}
        legendId={id}
        aria-describedby={ariaDescribedByIds<T>(id)}
        className='field-radio-group'
      >
        <RadioButtonGroup
          name={id}
          valueSelected={selectedIndex}
          disabled={disabled || readonly}
          className={[!inline && 'block'].filter(Boolean).join(' ')}
          invalid={rawErrors && rawErrors.length > 0}
          onChange={_onChange}
        >
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              console.log(option);
              const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
              return (
                <RadioButton
                  key={index}
                  id={optionId(id, index)}
                  labelText={option.label}
                  value={String(index)}
                  disabled={disabled || readonly || itemDisabled}
                  onBlur={_onBlur}
                  onFocus={_onFocus}
                />
              );
            })}
        </RadioButtonGroup>
      </FormGroup>
    </>
  );
}

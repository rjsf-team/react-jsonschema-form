import { FocusEvent } from 'react';
// @ts-expect-error No types available for CheckboxGroup
import { CheckboxGroup, Checkbox } from '@carbon/react';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

/** Implement `CheckboxesWidget`
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    disabled,
    options,
    value,
    readonly,
    onChange,
    onBlur,
    onFocus,
    // uiSchema,
    rawErrors = [],
  } = props;
  const { enumOptions, enumDisabled, emptyValue } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement | any>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  // const row = options ? options.inline : false;
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, true) as string[];

  const onCheckboxChange = (changedIndex: number) => {
    const option: string[] = [...selectedIndexes];
    if (option.indexOf(String(changedIndex)) !== -1) {
      option.splice(option.indexOf(String(changedIndex)), 1);
    } else {
      option.push(String(changedIndex));
    }
    onChange(enumOptionsValueForIndex<S>(option, enumOptions, emptyValue));
  };

  return (
    <>
      <style>
        {`
        .checkboxes.cds--checkbox-group--invalid .cds--checkbox-group__validation-msg {
          display: none;
        }
        .checkboxes .cds--label {
          display: none;
        }
      `}
      </style>
      <CheckboxGroup
        className='checkboxes'
        legendId={id}
        legendText={null}
        aria-describedby={ariaDescribedByIds<T>(id)}
        invalid={rawErrors && rawErrors.length > 0}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            return (
              <Checkbox
                className='checkbox'
                labelText={option.label}
                key={index}
                onChange={() => onCheckboxChange(index)}
                id={optionId(id, index)}
                name={id}
                value={String(index)}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                onBlur={_onBlur}
                onFocus={_onFocus}
                readOnly={readonly}
                defaultChecked={selectedIndexes.indexOf(String(index)) !== -1}
              />
            );
          })}
      </CheckboxGroup>
    </>
  );
}

import type { ChangeEvent } from 'react';
import { Label, Checkbox } from '@fluentui/react-components';
import { Flex } from '@fluentui/react-migration-v0-v9';
import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getGroupLabelling,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { label, id, htmlName, disabled, options, value, autofocus, readonly, required, onChange, onBlur, onFocus } =
    props;
  const { enumOptions, enumDisabled, inline } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      if (checked) {
        onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
      } else {
        onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
      }
    };

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });
  const {
    drawsLabel,
    labelId,
    group: groupAttributes,
    option: optionAttributes,
  } = getGroupLabelling<T, S, F>(props, 'group');

  return (
    <>
      {drawsLabel && (
        <Label id={labelId} required={required}>
          {label}
        </Label>
      )}
      {/* The group carries the field's id and each checkbox its option's, as core's do */}
      <Flex column={!inline} id={id} {...groupAttributes}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index: number) => {
            const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
            const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
            return (
              <Checkbox
                // oxlint-disable-next-line react/no-array-index-key
                key={index}
                id={optionId(id, index)}
                name={htmlName || id}
                label={option.label}
                checked={checked}
                value={domValues[index]}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange(index)}
                onBlur={blurHandlers[index]}
                onFocus={focusHandlers[index]}
                {...optionAttributes}
              />
            );
          })}
      </Flex>
    </>
  );
}

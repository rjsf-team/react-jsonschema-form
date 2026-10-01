import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

import { Checkbox } from '../components/ui/checkbox.tsx';
import { Label } from '../components/ui/label.tsx';
import { cn } from '../lib/utils.ts';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  disabled,
  options,
  value,
  autofocus,
  readonly,
  required,
  onChange,
  onBlur,
  onFocus,
  className,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  return (
    <div className={cn({ 'flex flex-col gap-2': !inline, 'flex flex-row gap-4 flex-wrap': inline })}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled =
            Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === option.value);
          const indexOptionId = optionId(id, index);

          return (
            <div className='flex items-center gap-2' key={indexOptionId}>
              <Checkbox
                id={indexOptionId}
                name={htmlName || id}
                required={required}
                disabled={disabled || itemDisabled || readonly}
                onCheckedChange={(state) => {
                  if (state) {
                    onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
                  } else {
                    onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
                  }
                }}
                className={className}
                checked={checked}
                value={domValues[index]}
                autoFocus={autofocus && index === 0}
                onBlur={blurHandlers[index]}
                onFocus={focusHandlers[index]}
                aria-describedby={ariaDescribedByIds(id)}
              />
              <Label className='leading-tight' htmlFor={optionId(id, index)}>
                {option.label}
              </Label>
            </div>
          );
        })}
    </div>
  );
}

import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsAutofocusIndex,
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getGroupAttributes,
  getOptionValueFormat,
  hasWidgetErrors,
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
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    onChange,
    onBlur,
    onFocus,
    className,
    presentation,
  } = props;
  const { enumOptions, enumDisabled, inline } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });
  const checkboxClassName = cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className);
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'group',
  );

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus);
  return (
    <div
      id={id}
      {...groupAttributes}
      className={cn({ 'flex flex-col gap-2': !inline, 'flex flex-row gap-4 flex-wrap': inline })}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
          const indexOptionId = optionId(id, index);

          return (
            <div className='flex items-center gap-2' key={indexOptionId}>
              <Checkbox
                id={indexOptionId}
                name={htmlName || id}
                disabled={disabled || itemDisabled || readonly}
                onCheckedChange={(state) => {
                  if (state) {
                    onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
                  } else {
                    onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
                  }
                }}
                className={checkboxClassName}
                checked={checked}
                value={domValues[index]}
                autoFocus={index === autofocusIndex}
                onBlur={blurHandlers[index]}
                onFocus={focusHandlers[index]}
                {...optionAttributes}
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

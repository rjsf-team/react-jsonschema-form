import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { DateElement, dateElementId, dateElementLabel, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';

import { getGroupProps } from '../../utils.ts';

/** The `AltDateWidget` component provides an alternative date/time input
 * with individual fields for year, month, day, and optionally time components.
 *
 * Features:
 * - Supports different date formats (YMD, MDY, DMY)
 * - Optional time selection (hours, minutes, seconds)
 * - "Set to now" and "Clear" buttons
 * - Configurable year ranges
 * - Accessible controls with proper labeling
 * - DaisyUI styling for all elements
 *
 * @param props - The `WidgetProps` for this component
 */
export default function AltDateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    disabled = false,
    readonly = false,
    autofocus = false,
    options,
    id,
    name,
    label,
    hideLabel,
    registry,
    onBlur,
    onFocus,
  } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);

  return (
    <div className='space-y-3' {...getGroupProps({ id, label, name, hideLabel, role: 'group' })}>
      <div className='grid grid-cols-3 gap-2'>
        {elements.map((elemProps, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <div key={i} className='form-control'>
            {/* Naming each select, which is otherwise left to whatever it happens to be displaying. A single control is
                named by this association alone, and announces the value it displays after it */}
            <label htmlFor={dateElementId(id, elemProps.type)} className='label'>
              <span className='label-text capitalize'>{dateElementLabel(elemProps.type, translateString)}</span>
            </label>
            <DateElement
              rootId={id}
              // The part's own id, as `@rjsf/mantine` and `@rjsf/chakra-ui` name theirs: each select is a control in
              // its own right, and a field with no property name of its own — a root field, an array item — would
              // otherwise leave the label above replacing the value its select displays rather than preceding it
              name={dateElementId(id, elemProps.type)}
              label={label}
              hideLabel={hideLabel}
              className='select select-bordered select-sm'
              select={handleChange}
              type={elemProps.type}
              range={elemProps.range}
              value={elemProps.value}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              onFocus={onFocus}
              autofocus={autofocus && i === 0}
            />
          </div>
        ))}
      </div>
      <div className='flex justify-start space-x-2'>
        {(options.hideNowButton !== undefined ? !options.hideNowButton : true) && (
          <button
            type='button'
            className='btn btn-sm btn-primary'
            onClick={handleSetNow}
            disabled={disabled || readonly}
          >
            {translateString(TranslatableString.NowLabel)}
          </button>
        )}
        {(options.hideClearButton !== undefined ? !options.hideClearButton : true) && (
          <button
            type='button'
            className='btn btn-sm btn-secondary'
            onClick={handleClear}
            disabled={disabled || readonly}
          >
            {translateString(TranslatableString.ClearLabel)}
          </button>
        )}
      </div>
    </div>
  );
}

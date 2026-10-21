import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  DateElement,
  dateElementId,
  dateElementLabel,
  TranslatableString,
  useAltDateWidgetProps,
  widgetDrawsLabel,
} from '@rjsf/utils';

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
    label,
    presentation,
    registry,
    onBlur,
    onFocus,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);

  return (
    <div className='space-y-3' {...getGroupProps({ id, label, hideLabel, presentation, role: 'group' })}>
      <div className='grid grid-cols-3 gap-2'>
        {elements.map((elemProps, i) => {
          const elementLabel = dateElementLabel(elemProps.type, translateString);
          return (
            // oxlint-disable-next-line react/no-array-index-key
            <div key={i} className='form-control'>
              {/* The part's name as the user sees it. The select's `aria-label`, which `DateElement` builds from the
                field's label and this same translated name, outranks this association as its accessible name */}
              <label htmlFor={dateElementId(id, elemProps.type)} className='label'>
                <span className='label-text'>{elementLabel}</span>
              </label>
              <DateElement
                rootId={id}
                label={label}
                elementLabel={elementLabel}
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
                presentation={presentation}
              />
            </div>
          );
        })}
      </div>
      <div className='flex justify-start space-x-2'>
        {!options.hideNowButton && (
          <button type='button' className='btn btn-sm btn-primary' onClick={handleSetNow} disabled={buttonsDisabled}>
            {translateString(TranslatableString.NowLabel)}
          </button>
        )}
        {!options.hideClearButton && (
          <button type='button' className='btn btn-sm btn-secondary' onClick={handleClear} disabled={buttonsDisabled}>
            {translateString(TranslatableString.ClearLabel)}
          </button>
        )}
      </div>
    </div>
  );
}

import {
  DateElement,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  useAltDateWidgetProps,
  WidgetProps,
} from '@rjsf/utils';

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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    disabled = false,
    readonly = false,
    autofocus = false,
    options = {},
    id,
    name,
    registry,
    onBlur,
    onFocus,
  } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-3 gap-2'>
        {elements.map((elemProps, i) => (
          <div key={i} className='form-control'>
            <label className='label'>
              <span className='label-text capitalize'>{elemProps.type}</span>
            </label>
            <DateElement
              rootId={id}
              name={name}
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

import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { DateElement, getGroupAttributes, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';

/** The `AltDateWidget` is an alternative widget for rendering date properties. Its list of date parts sits in the
 * `group` carrying the field's id, named by the template's label through `aria-labelledby`, since no part carries that
 * id for a `for` to name. The group wraps the list rather than replacing its role, so the parts stay its list items
 *
 * @param props - The `WidgetProps` for this component
 */
function AltDateWidget<
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
    registry,
    onBlur,
    onFocus,
    presentation,
  } = props;
  const { translateString } = registry;
  const { group } = getGroupAttributes<T, S, F>({ id, presentation }, 'group');
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);

  return (
    <div id={id} {...group}>
      <ul className='list-inline'>
        {elements.map((elemProps, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <li className='list-inline-item' key={i}>
            <DateElement
              rootId={id}
              label={label}
              select={handleChange}
              {...elemProps}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              onFocus={onFocus}
              autofocus={autofocus && i === 0}
              presentation={presentation}
            />
          </li>
        ))}
        {!options.hideNowButton && (
          <li className='list-inline-item'>
            <button type='button' className='btn btn-info btn-now' onClick={handleSetNow} disabled={buttonsDisabled}>
              {translateString(TranslatableString.NowLabel)}
            </button>
          </li>
        )}
        {!options.hideClearButton && (
          <li className='list-inline-item'>
            <button
              type='button'
              className='btn btn-warning btn-clear'
              onClick={handleClear}
              disabled={buttonsDisabled}
            >
              {translateString(TranslatableString.ClearLabel)}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default AltDateWidget;

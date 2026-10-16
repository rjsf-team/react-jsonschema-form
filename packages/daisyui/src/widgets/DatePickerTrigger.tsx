import type { MouseEvent, ReactNode, RefObject } from 'react';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FieldPresentation, FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getControlAttributes, getControlFallbackName, TranslatableString } from '@rjsf/utils';

/** The name a picker's trigger falls back to where no label names it, which the dialog it opens takes too, so the two
 * can't drift apart: the field's label, else its placeholder, or the translated date prompt for a field with neither
 *
 * @param label - The field's label, empty when it has no title
 * @param placeholder - The field's placeholder, if any
 * @param registry - The field's registry, for the translated prompt
 * @returns - The name
 */
function getDatePickerName<T, S extends StrictRJSFSchema, F extends FormContextType>(
  label: string | undefined,
  placeholder: string | undefined,
  registry: Registry<T, S, F>,
) {
  return getControlFallbackName<T, S, F>(
    { label: label ?? '', placeholder, registry },
    TranslatableString.AriaDateLabel,
  );
}

interface DatePickerTriggerProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The field's `id`, which is also this button's, so the template's label names it through its own `htmlFor` */
  id: string;
  /** The field's label, empty when it has no title */
  label?: string;
  /** Whether a label the template draws names this button, as `isNamedByTemplateLabel()` says of the widget's props */
  named: boolean;
  /** The field's plan, whose control attributes this button carries */
  presentation?: FieldPresentation;
  /** The field's placeholder, displayed where it holds no date, and naming it where it has no label */
  placeholder?: string;
  /** The date the picker is holding, formatted for display, `undefined` where it holds none */
  formattedValue?: string;
  /** Whether the popup is open */
  isOpen: boolean;
  /** The id of the popup, which this combobox controls while it is open */
  popupId: string;
  /** Whether the field is disabled, which takes this button out of the form as the attribute does any control */
  disabled?: boolean;
  /** Whether the field is read-only, which stops the popup opening while leaving the value it displays reachable */
  readonly?: boolean;
  /** Whether `ui:autofocus` asks for this button to be focused as it mounts */
  autofocus?: boolean;
  /** The ref the popup positions itself against and returns focus to */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Opens the popup, or closes it where a press here is the way out */
  onClick: (e: MouseEvent) => void;
  /** Reports focus */
  onFocus: () => void;
  /** Reports blur */
  onBlur: () => void;
  /** The field's registry, for the translated text a trigger with nothing else to show falls back to */
  registry: Registry<T, S, F>;
}

/** The button both picker widgets open their popup from, which is the whole of what a screen reader and a pointer
 * reach when the popup is closed. It is a combobox, as `SelectWidget`'s trigger is, so it can be `aria-invalid` while
 * its errors show, which a button can't, and holds the date it displays as its value.
 *
 * Its text is the value it holds, falling back to the placeholder, then to the field's label, and last to the
 * translated prompt, so it is never blank on the screen. A combobox takes no name from its text, so where no label,
 * nor the plan, names it, it is named by the field's label, or for a field with no title its placeholder, else the
 * translated prompt.
 *
 * @param props - The value to display and the state to display it in, with the handlers for each way into the popup
 */
export default function DatePickerTrigger<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  label,
  named,
  presentation,
  placeholder,
  formattedValue,
  isOpen,
  popupId,
  disabled,
  readonly,
  autofocus,
  triggerRef,
  onClick,
  onFocus,
  onBlur,
  registry,
}: DatePickerTriggerProps<T, S, F>) {
  const controlAttributes = getControlAttributes<T, S, F>({ id, presentation });
  const fallbackName = getDatePickerName<T, S, F>(label, placeholder, registry);
  const text = formattedValue || placeholder || fallbackName;

  return (
    <button
      type='button'
      id={id}
      className={`input input-bordered w-full flex items-center justify-between cursor-pointer ${
        isOpen ? 'ring-2 ring-primary/50' : ''
      }`}
      disabled={disabled}
      autoFocus={autofocus}
      // Rather than the attribute, which would take the trigger out of the tab order along with the date it displays:
      // a field that cannot be edited is still one a keyboard user reads, and `SelectWidget` keeps its own reachable
      aria-disabled={readonly || undefined}
      onClick={readonly ? undefined : onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      role='combobox'
      aria-haspopup='dialog'
      aria-expanded={isOpen}
      aria-controls={isOpen ? popupId : undefined}
      aria-label={named ? undefined : fallbackName}
      {...controlAttributes}
      ref={triggerRef}
    >
      <span className={formattedValue ? '' : 'text-base-content/50'}>{text}</span>
      <FontAwesomeIcon icon={faCalendar} className='ml-2 h-4 w-4 text-primary' />
    </button>
  );
}

interface DatePickerDialogProps<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The popup's id, which the trigger's `aria-controls` points at while it is open */
  id: string;
  /** The field's label, empty when it has no title */
  label?: string;
  /** The field's placeholder, which names it where it has no label */
  placeholder?: string;
  /** The field's registry, for the translated prompt */
  registry: Registry<T, S, F>;
  children: ReactNode;
}

/** The dialog both picker widgets open their calendar in, which their trigger controls, named as the trigger is
 *
 * @param props - The popup's id, the field's label, placeholder and registry it is named from, and its contents
 */
export function DatePickerDialog<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, label, placeholder, registry, children }: DatePickerDialogProps<T, S, F>) {
  return (
    <div id={id} role='dialog' aria-label={getDatePickerName<T, S, F>(label, placeholder, registry)}>
      {children}
    </div>
  );
}

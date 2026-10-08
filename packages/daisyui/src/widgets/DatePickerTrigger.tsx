import type { MouseEvent, RefObject } from 'react';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString, triggerValueId } from '@rjsf/utils';

import { getTriggerDescribedBy } from '../utils.ts';

interface DatePickerTriggerProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The field's `id`, which is also this button's, so the template's label names it through its own `htmlFor` */
  id: string;
  /** The field's label, empty when it has no title */
  label?: string;
  /** The field's property name, which the label naming this button falls back to */
  name?: string;
  /** Whether the label is hidden, in which case the template renders none */
  hideLabel?: boolean;
  /** The field's placeholder, displayed where it holds no date */
  placeholder?: string;
  /** The date the picker is holding, formatted for display, `undefined` where it holds none */
  formattedValue?: string;
  /** Whether the popup is open */
  isOpen: boolean;
  /** Whether the field is disabled, which takes this button out of the form as the attribute does any control */
  disabled?: boolean;
  /** Whether the field is read-only, which stops the popup opening while leaving the value it displays reachable */
  readonly?: boolean;
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
 * reach when the popup is closed.
 *
 * Its text is the value it holds, falling back to the placeholder, then to the field's label, and last to the
 * translated prompt: a button with nothing in it is not only blank on the screen but nameless, since the field it
 * belongs to may have no title for `FieldTemplate` to render a label from.
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
  name,
  hideLabel,
  placeholder,
  formattedValue,
  isOpen,
  disabled,
  readonly,
  triggerRef,
  onClick,
  onFocus,
  onBlur,
  registry,
}: DatePickerTriggerProps<T, S, F>) {
  const describedBy = getTriggerDescribedBy({ id, label, name, hideLabel, hasValue: !!formattedValue });
  const text = formattedValue || placeholder || label || registry.translateString(TranslatableString.AriaDateLabel);

  return (
    <button
      type='button'
      id={id}
      className={`input input-bordered w-full flex items-center justify-between cursor-pointer ${
        isOpen ? 'ring-2 ring-primary/50' : ''
      }`}
      disabled={disabled}
      // Rather than the attribute, which would take the trigger out of the tab order along with the date it displays:
      // a field that cannot be edited is still one a keyboard user reads, and `SelectWidget` keeps its own reachable
      aria-disabled={readonly || undefined}
      onClick={readonly ? undefined : onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-haspopup='true'
      aria-expanded={isOpen}
      aria-describedby={describedBy}
      ref={triggerRef}
    >
      <span id={triggerValueId(id)} className={formattedValue ? '' : 'text-base-content/50'}>
        {text}
      </span>
      <FontAwesomeIcon icon={faCalendar} className='ml-2 h-4 w-4 text-primary' />
    </button>
  );
}

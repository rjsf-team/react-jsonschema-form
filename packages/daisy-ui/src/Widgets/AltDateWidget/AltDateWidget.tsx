import { useCallback, useState } from 'react';
import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { CalendarIcon } from '../../icons';

export default function AltDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, value, required, disabled, readonly, onChange } = props;
  const [isOpen, setIsOpen] = useState(false);

  const handleDaySelect = useCallback(
    (date: Date | undefined) => {
      onChange(date?.toISOString().slice(0, 10) || '');
      setIsOpen(false);
    },
    [onChange]
  );

  const selected = value ? new Date(value) : undefined;
  const displayValue = selected ? selected.toLocaleDateString() : 'Select date...';

  return (
    <div className='form-control'>
      <div className='input-group'>
        <input
          type='text'
          className='input input-bordered flex-1'
          value={displayValue}
          readOnly
          onClick={() => !disabled && !readonly && setIsOpen(true)}
        />
        <button className='btn btn-square' onClick={() => !disabled && !readonly && setIsOpen(true)} type='button'>
          <CalendarIcon className='w-5 h-5' />
        </button>
      </div>

      <dialog id={`modal-${id}`} className={`modal ${isOpen ? 'modal-open' : ''}`}>
        <div className='modal-box'>
          <DayPicker
            id={id}
            mode='single'
            required={required}
            disabled={disabled || readonly}
            selected={selected}
            onSelect={handleDaySelect}
            className='bg-base-100'
            classNames={{
              button: 'hover:bg-primary hover:text-primary-content',
              day_selected: 'bg-primary text-primary-content',
              day_today: 'text-accent font-bold',
            }}
          />
          <div className='modal-action'>
            <button className='btn' onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
        <form method='dialog' className='modal-backdrop' onClick={() => setIsOpen(false)}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

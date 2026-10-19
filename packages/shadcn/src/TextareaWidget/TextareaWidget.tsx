import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, hasWidgetErrors } from '@rjsf/utils';

import { Textarea } from '../components/ui/textarea.tsx';
import { cn } from '../lib/utils.ts';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    placeholder,
    value,
    required,
    disabled,
    autofocus,
    readonly,
    onBlur,
    onFocus,
    onChange,
    options,
    className,
    presentation,
  } = props;
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value);

  return (
    <div className='flex p-0.5'>
      <Textarea
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        value={value ?? ''}
        required={required}
        autoFocus={autofocus}
        rows={options.rows ?? 5}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...getControlAttributes<T, S, F>({ id, presentation })}
        className={cn({ 'border-destructive': hasWidgetErrors<T, S, F>(props) }, className)}
      />
    </div>
  );
}

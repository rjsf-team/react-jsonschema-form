import type { ChangeEvent, FocusEvent } from 'react';
import { Label, Textarea, makeStyles } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, labelValue, widgetDrawsLabelText } from '@rjsf/utils';

const useStyles = makeStyles({
  label: {
    paddingTop: '2px',
    paddingBottom: '2px',
    marginBottom: '2px',
  },
});

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
    required,
    readonly,
    disabled,
    value,
    label,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    presentation,
  } = props;
  // A label holding only a required field's `*` would name the textarea "star", so one is drawn only with text
  const hideLabel = !widgetDrawsLabelText<T, S, F>(props);
  const classes = useStyles();
  const handleChange = ({ target: { value: newValue } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(newValue === '' ? options.emptyValue : newValue);
  const handleBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target?.value);

  let rows: string | number = 5;
  if (typeof options.rows === 'string' || typeof options.rows === 'number') {
    rows = options.rows;
  }

  return (
    <>
      {labelValue(
        <Label htmlFor={id} required={required} disabled={disabled} className={classes.label}>
          {label}
        </Label>,
        hideLabel,
      )}
      <Textarea
        id={id}
        name={htmlName || id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...getControlAttributes<T, S, F>({ id, presentation })}
        rows={rows}
      />
    </>
  );
}

import { Label, Textarea, makeStyles } from '@fluentui/react-components';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  ariaDescribedByIds,
  labelValue,
} from '@rjsf/utils';
import { ChangeEvent, FocusEvent } from 'react';

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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    required,
    readonly,
    disabled,
    value,
    label,
    hideLabel,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
  } = props;
  const classes = useStyles();
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, target && target.value);

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
        name={id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ''}
        onChange={onChangeOverride || _onChange}
        onFocus={_onFocus}
        onBlur={_onBlur}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
        rows={rows}
      />
    </>
  );
}

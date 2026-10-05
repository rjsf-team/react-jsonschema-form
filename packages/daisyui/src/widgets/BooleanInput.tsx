import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  descriptionId,
  getKnownTypes,
  getSchemaType,
  getTemplates,
  schemaRequiresTrueValue,
} from '@rjsf/utils';

interface BooleanInputProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends WidgetProps<T, S, F> {
  /** The DaisyUI class for the input itself, which is what makes it look like a checkbox or a switch */
  inputClassName: string;
  /** The DaisyUI classes for the `<label>` wrapping the input and its text */
  labelClassName: string;
}

/** The single boolean input behind `CheckboxWidget` and `ToggleWidget`, which differ only in how DaisyUI paints them.
 *
 * It renders the field's label after the input and its description above, so `FieldTemplate` renders neither: a
 * checkbox reads as its own label, and a label placed above it belongs to nothing the user can see. With no label to
 * render — hidden, or a field with no title — the input stands on its own and is named by whatever points at its id.
 *
 * @param props - The `WidgetProps` for the widget, plus the two class names that distinguish the two
 */
export default function BooleanInput<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  htmlName,
  value,
  label,
  hideLabel,
  required,
  disabled,
  readonly,
  autofocus,
  onChange,
  onFocus,
  onBlur,
  options,
  schema,
  uiSchema,
  registry,
  inputClassName,
  labelClassName,
}: BooleanInputProps<T, S, F>) {
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, options);
  const description = options.description || schema.description;
  const trueValueRequired = schemaRequiresTrueValue(schema) && required;
  // A checkbox already answers a boolean whose schema accepts `false`, so a required one of those is marked no more
  // than a field the user has already filled in, as is a `type` list naming `boolean`, which `BooleanField` renders a
  // checkbox for and seeds with the same `false`. On any other schema an unchecked box answers nothing, and this
  // widget's own label is the only one rendered, so the marker has nowhere else to come from
  const acceptsFalse = getSchemaType(schema) === 'boolean' || getKnownTypes(schema).includes('boolean');
  const marksRequired = required && (trueValueRequired || !acceptsFalse);

  /** Handle change events
   *
   * @param event - The change event
   */
  const handleChange = useCallback(
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked),
    [onChange],
  );

  /** Handle focus events
   */
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  /** Handle blur events
   */
  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const input = (
    <input
      type='checkbox'
      id={id}
      name={htmlName || id}
      // React reads `undefined` or `null` as "no `checked` prop" and mounts the input uncontrolled, so it would keep
      // whatever the user clicked even where the form rejected the change
      checked={!!value}
      // Only where `false` is not an answer the schema accepts, as `schemaRequiresTrueValue()` decides: HTML5
      // constraint validation fails an unchecked required box, which would block the form with nothing on the screen
      // to say why for every optional-in-effect boolean a parent merely lists as required
      required={trueValueRequired}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={inputClassName}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );

  return (
    <div className='form-control'>
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hideLabel || !label ? (
        input
      ) : (
        <label className={labelClassName}>
          {/* A `<label>` permits only phrasing content, so the input's wrapper cannot be a block element */}
          <span className='mr-2'>{input}</span>
          <span className='label-text'>
            {label}
            {marksRequired && <span className='text-error ml-1'>*</span>}
          </span>
        </label>
      )}
    </div>
  );
}

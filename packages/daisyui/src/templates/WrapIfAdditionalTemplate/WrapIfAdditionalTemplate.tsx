import type { WrapIfAdditionalTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  additionalKeyId,
  AdditionalPropertyKeySelect,
  buttonId,
  getAdditionalKeyAttributes,
  hasAdditionalKeyLabel,
  TranslatableString,
} from '@rjsf/utils';

/** The row of the key, the value and the remove button: `--rjsf-control-row` is the value's control row, past the key's
 * label. Both labels wrap, as daisyUI's `.label` doesn't, so a long one stays in its column rather than running into the
 * next
 */
const ROW_CLASSES =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] grid-rows-[repeat(7,auto)_1fr] items-start gap-x-2 [--rjsf-control-row:1] ' +
  'has-[>.rjsf-additional-property-key>label]:[--rjsf-control-row:2]';

/** The value, which spans every row, so a value of any `FieldTemplate` keeps its column. It is laid out on the row's rows
 * where it is this theme's `FieldTemplate` `<div>` drawing the value's label, and otherwise the last row, `1fr`, takes
 * whatever height it needs past the key's label and input. A button drawn beside the value's control, such as the Clear
 * button, keeps its own width rather than stretching to the column
 */
const VALUE_CLASSES =
  'rjsf-additional-property-value row-span-full [&>.field-template>label]:whitespace-normal [&>.field-template>label]:[overflow-wrap:anywhere] ' +
  'has-[>.field-template>label]:grid has-[>.field-template>label]:grid-cols-1 has-[>.field-template>label]:grid-rows-subgrid ' +
  'has-[>.field-template>label]:[&>.field-template]:grid has-[>.field-template>label]:[&>.field-template]:grid-cols-1 has-[>.field-template>label]:[&>.field-template]:grid-rows-subgrid has-[>.field-template>label]:[&>.field-template]:row-span-full has-[>.field-template>label]:[&>.field-template]:items-start ' +
  'has-[>.field-template>label]:[&>.field-template>button]:justify-self-start';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    // Kept out of the props this spreads onto the element
    hasErrors,
    id,
    label,
    keyName,
    // oxlint-disable-next-line typescript/no-deprecated -- kept out of the props this spreads onto the element
    displayLabel,
    presentation,
    readonly,
    required,
    schema,
    uiSchema,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    keyNotAllowed,
    // Kept out of the props this spreads onto the element
    rawDescription,
    registry,
    ...rest
  } = props;
  // The key is labelled wherever the value's label is drawn, by the template or the value's own component
  const hasKeyLabel = hasAdditionalKeyLabel<T, S, F>(props);
  const keyAttributes = getAdditionalKeyAttributes<T, S, F>(props);

  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const keyId = additionalKeyId(id);

  if (!additional) {
    return (
      <div className={`flex-grow ${classNames ?? ''}`.trim()} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div className={`wrap-if-additional-template ${classNames ?? ''}`.trim()} style={style} {...rest}>
      {/* The key's input and the remove button sit on the value's control row, however far its label wraps */}
      <div className={ROW_CLASSES}>
        <div className='rjsf-additional-property-key row-span-full grid grid-cols-1 grid-rows-subgrid items-start [&>:not(label)]:row-[var(--rjsf-control-row)/-1]'>
          {hasKeyLabel && (
            <label htmlFor={keyId} className='rjsf-field-label label whitespace-normal [overflow-wrap:anywhere]'>
              <span className='label-text'>{keyLabel}</span>
            </label>
          )}
          {propertyNamesEnum ? (
            <AdditionalPropertyKeySelect<T, S, F>
              errorAttributes={keyAttributes}
              id={keyId}
              label={keyLabel}
              hideLabel
              labelledByTemplate={hasKeyLabel}
              value={keyName}
              propertyNamesEnum={propertyNamesEnum}
              onKeyRename={onKeyRename}
              disabled={disabled}
              readonly={readonly}
              required={required}
              registry={registry}
            />
          ) : (
            <input
              key={keyName}
              type='text'
              className='input input-bordered'
              id={keyId}
              aria-label={hasKeyLabel ? undefined : keyLabel}
              {...keyAttributes}
              onBlur={onKeyRenameBlur}
              defaultValue={keyName}
              disabled={disabled || readonly}
            />
          )}
        </div>
        <div className={VALUE_CLASSES}>{children}</div>
        <div className='flex row-[var(--rjsf-control-row)/-1]'>
          <RemoveButton
            id={buttonId(id, 'remove')}
            className='rjsf-object-property-remove'
            disabled={disabled || readonly}
            onClick={onRemoveProperty}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
}

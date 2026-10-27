import { FieldLabel } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  additionalKeyId,
  AdditionalPropertyKeySelect,
  buttonId,
  getAdditionalKeyAttributes,
  hasAdditionalKeyLabel,
  TranslatableString,
} from '@rjsf/utils';

import { Input } from '../components/ui/input.tsx';
import { Separator } from '../components/ui/separator.tsx';
import { cn } from '../lib/utils.ts';

/** The row of the key, the value and the remove button: `--rjsf-control-row` is the value's control row, past the key's
 * label, the value's description or both. A value of any other `FieldTemplate` spans every row, and the last row, `1fr`,
 * takes whatever height it needs past the key's label and input. `String.raw` keeps the `\_` Tailwind reads as an
 * underscore in a description's id, where a bare `_` would be a space
 */
const ROW_CLASSES =
  String.raw`rjsf-additional-property grid grid-cols-12 grid-rows-[repeat(7,auto)_1fr] items-start gap-x-2 [--rjsf-control-row:1] ` +
  String.raw`has-[>.rjsf-additional-property-key>.rjsf-field-label]:[--rjsf-control-row:2] has-[>.rjsf-additional-property-value>:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[--rjsf-control-row:2] ` +
  String.raw`has-[>.rjsf-additional-property-value>:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])+:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[--rjsf-control-row:3] ` +
  String.raw`has-[>.rjsf-additional-property-value>.rjsf-field-label+:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])+:is(.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[--rjsf-control-row:4]`;

/** The value, laid out on the row's rows where it holds core's `FieldTemplate` parts, spaced by a margin under each
 * rather than a gap, which would space the empty rows too, so its control's row starts where the key's input does
 */
const VALUE_CLASSES =
  String.raw`rjsf-additional-property-value col-span-6 row-span-full grid gap-2 pr-0.5 ` +
  String.raw`has-[>:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:grid-rows-subgrid has-[>:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:gap-y-0 has-[>:is(.rjsf-field-label,.rjsf-field-description,[id$=\_\_description],[id$=\_\_selectedOptionDescription])]:[&>:not(:last-child)]:mb-2`;

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
    classNames,
    style,
    children,
    disabled,
    hasErrors,
    id,
    label,
    keyName,
    onRemoveProperty,
    onKeyRename,
    onKeyRenameBlur,
    propertyNamesEnum,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  // The key is labelled wherever the value's label is drawn, by the template or the value's own component
  const hasKeyLabel = hasAdditionalKeyLabel<T, S, F>(props);
  const keyAttributes = getAdditionalKeyAttributes<T, S, F>(props);
  const { templates, translateString, classMap } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={cn('flex flex-col gap-2', classNames)} style={style} data-invalid={hasErrors || undefined}>
        {children}
      </div>
    );
  }

  const keyId = additionalKeyId(id);

  return (
    // One element, so the separator keeps its gap under the row wherever the object's template puts the property
    <div className={cn('flex flex-col gap-2', classNames)} style={style} data-invalid={hasErrors || undefined}>
      {/* The key's input and the remove button sit on the value's control row, however far its label or description
          wraps */}
      <div className={ROW_CLASSES}>
        <div className='rjsf-additional-property-key col-span-5 row-span-full grid grid-rows-subgrid [&>:not(:last-child)]:mb-2 [&>:not(.rjsf-field-label)]:row-(--rjsf-control-row)'>
          {hasKeyLabel && (
            <FieldLabel
              label={keyLabel}
              required={required}
              id={keyId}
              className={cn('rjsf-field-label text-muted-foreground', classMap.fieldLabel)}
              invalid={keyAttributes['aria-invalid']}
            />
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
            // The theme's `SelectWidget` pads itself; the input takes the same 2px the value's input wrapper has
            <div className='pl-0.5 pt-0.5'>
              <Input
                key={keyName}
                aria-label={hasKeyLabel ? undefined : keyLabel}
                {...keyAttributes}
                required={required}
                defaultValue={keyName}
                disabled={disabled || readonly}
                id={keyId}
                name={keyId}
                onBlur={!readonly ? onKeyRenameBlur : undefined}
                type='text'
                className='w-full border shadow-sm'
              />
            </div>
          )}
        </div>
        <div className={VALUE_CLASSES}>{children}</div>
        {/* The same 2px as the inputs' wrappers, so the button lines up with them */}
        <div className='grid col-span-1 row-(--rjsf-control-row) pt-0.5'>
          <RemoveButton
            id={buttonId(id, 'remove')}
            iconType='block'
            className='rjsf-object-property-remove w-full'
            disabled={disabled || readonly}
            onClick={onRemoveProperty}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      </div>
      <Separator />
    </div>
  );
}

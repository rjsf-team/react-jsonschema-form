import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  additionalKeyId,
  AdditionalPropertyKeySelect,
  buttonId,
  descriptionId,
  getAdditionalKeyAttributes,
  getTemplates,
  getUiOptions,
  hasAdditionalKeyLabel,
  templateDrawsDescription,
  TranslatableString,
} from '@rjsf/utils';

import { Input } from '../components/ui/input.tsx';
import { Separator } from '../components/ui/separator.tsx';
import { cn } from '../lib/utils.ts';

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
    rawDescription,
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
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, getUiOptions<T, S, F>(uiSchema));

  return (
    // One element, so the separator keeps its gap under the row wherever the object's template puts the property
    <div className={cn('flex flex-col gap-2', classNames)} style={style} data-invalid={hasErrors || undefined}>
      {/* Top-aligned, with the value spanning both rows, so the first is as tall as the key's label, the value's
          description and the key input, and the remove button sits at its foot, beside the key input, whatever errors
          or help follow the value's input */}
      <div className='grid grid-cols-12 grid-rows-[auto_1fr] items-start gap-x-2'>
        <div className='grid gap-2 col-span-5'>
          <div className='flex flex-col gap-2'>
            {hasKeyLabel && (
              <label
                htmlFor={keyId}
                className={cn('rjsf-field-label text-muted-foreground', classMap.fieldLabel)}
                data-invalid={keyAttributes['aria-invalid'] || undefined}
              >
                {keyLabel}
                {required && <span className='rjsf-required'>*</span>}
              </label>
            )}
            {/* The value's description sits between its label and input, so the key's input is held level with the
                value's by an invisible copy of it, drawn by the same template under an id of its own, which wraps alike
                for a description as wide in either column */}
            {rawDescription && templateDrawsDescription<T, S, F>(props) && (
              <div aria-hidden='true' className='invisible'>
                <DescriptionFieldTemplate
                  id={descriptionId(keyId)}
                  description={rawDescription}
                  hasErrors={hasErrors}
                  schema={schema}
                  uiSchema={uiSchema}
                  registry={registry}
                />
              </div>
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
        </div>
        <div className='grid gap-2 col-span-6 row-span-2 pr-0.5'>{children}</div>
        <div className='grid gap-2 col-span-1 self-end'>
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

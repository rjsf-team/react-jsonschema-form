import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import { ADDITIONAL_PROPERTY_FLAG, buttonId, TranslatableString, getWidget } from '@rjsf/utils';

import { Input } from '../components/ui/input.tsx';
import { Separator } from '../components/ui/separator.tsx';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  classNames,
  style,
  children,
  disabled,
  id,
  label,
  displayLabel,
  onRemoveProperty,
  onKeyRenameBlur,
  rawDescription,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
  propertyNamesEnum,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString, widgets } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  // Use SelectWidget when propertyNamesEnum is available
  const SelectWidget = propertyNamesEnum && propertyNamesEnum.length > 0 ? getWidget(widgets, 'SelectWidget') : null;
  const enumOptions = propertyNamesEnum?.map((value) => ({ value, label: String(value) })) ?? [];

  // Handle onBlur for SelectWidget which expects (id: string, value: any) => void
  // but onKeyRenameBlur expects (event: FocusEvent<HTMLInputElement>) => void
  const handleSelectBlur = useCallback(
    (_id: string, value: any) => {
      onKeyRenameBlur({ target: { value } } as any);
    },
    [onKeyRenameBlur],
  );

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const marginDesc = rawDescription ? -28 : 0;
  const margin = displayLabel ? 22 + marginDesc : 0;
  const keyId = `${id}-key`;

  return (
    <>
      <div className={`grid grid-cols-12 col-span-12 items-center gap-2 ${classNames}`} style={style}>
        <div className='grid gap-2 col-span-5'>
          <div className='flex flex-col gap-2'>
            {displayLabel && (
              <label htmlFor={keyId} className='text-sm font-medium text-muted-foreground leading-none'>
                {keyLabel}
              </label>
            )}
            <div className='pl-0.5'>
              {SelectWidget ? (
                <SelectWidget
                  key={label}
                  id={keyId}
                  name={keyId}
                  value={label}
                  required={required}
                  disabled={disabled || readonly}
                  readonly={readonly}
                  options={{
                    enumOptions,
                    enumDisabled: [],
                  }}
                  onBlur={handleSelectBlur}
                  onFocus={handleSelectBlur}
                  onChange={(value) => {
                    onKeyRenameBlur({ target: { value } } as any);
                  }}
                  schema={{ type: 'string', enum: propertyNamesEnum }}
                  as
                  any
                  registry={registry as any}
                  uiSchema={uiSchema as any}
                  label={keyLabel}
                />
              ) : (
                <Input
                  key={label}
                  required={required}
                  defaultValue={label}
                  disabled={disabled || readonly}
                  id={keyId}
                  name={keyId}
                  onBlur={!readonly ? onKeyRenameBlur : undefined}
                  type='text'
                  className='w-full border shadow-sm'
                />
              )}
            </div>
            {!!rawDescription && (
              <span className='text-xs font-medium text-muted-foreground'>
                <div className='text-sm text-muted-foreground'>&nbsp;</div>
              </span>
            )}
          </div>
        </div>
        <div className='grid gap-2 col-span-6 pr-0.5'>{children}</div>
        <div className='grid gap-2 col-span-1' style={{ marginTop: `${margin}px` }}>
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
      <Separator dir='horizontal' className='mt-2' />
    </>
  );
}

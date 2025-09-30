import {
  ADDITIONAL_PROPERTY_FLAG,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { FocusEvent } from 'react';

import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';

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
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  uiSchema,
  registry,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);
  const keyId = `${id}-key`;

  return (
    <>
      <div className={`flex flex-row items-center gap-2 relative w-full ${classNames}`} style={style}>
        <div className='flex flex-col w-full gap-2 line-clamp-1'>
          <div className='flex-grow'>
            <label htmlFor={keyId} className='pt-2 text-sm font-medium text-muted-foreground mb-4 line-clamp-1'>
              {keyLabel}
            </label>
            <div className='pl-0.5'>
              <Input
                required={required}
                defaultValue={label}
                disabled={disabled || readonly}
                id={keyId}
                name={keyId}
                onBlur={!readonly ? handleBlur : undefined}
                type='text'
                className='mt-1 w-full border shadow-sm'
              />
            </div>
          </div>
          <div className='flex-grow pr-0.5'>{children}</div>
        </div>

        <RemoveButton
          id={buttonId<T>(id, 'remove')}
          iconType='block'
          className='rjsf-object-property-remove w-full'
          disabled={disabled || readonly}
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
          registry={registry}
        />
      </div>
      <Separator dir='horizontal' className='mt-2' />
    </>
  );
}

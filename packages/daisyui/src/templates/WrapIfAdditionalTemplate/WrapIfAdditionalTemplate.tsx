import { useCallback } from 'react';
import {
  WrapIfAdditionalTemplateProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  buttonId,
  ADDITIONAL_PROPERTY_FLAG,
  TranslatableString,
} from '@rjsf/utils';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    disabled,
    id,
    label,
    readonly,
    required,
    schema,
    uiSchema,
    onKeyChange,
    onDropPropertyClick,
    registry,
    ...rest
  } = props;

  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onKeyChange(event.target.value);
    },
    [onKeyChange],
  );

  const handleRemove = useCallback(() => {
    onDropPropertyClick(label)();
  }, [onDropPropertyClick, label]);

  if (!additional) {
    return <div className={classNames}>{children}</div>;
  }

  return (
    <div className={`wrap-if-additional-template ${classNames}`} {...rest}>
      <div className='flex items-baseline' style={{ justifyContent: 'space-between' }}>
        <div>
          <label htmlFor={`${id}-key`} className='label'>
            <span className='label-text'>{keyLabel}</span>
          </label>
          <input
            type='text'
            className='input input-bordered'
            id={`${id}-key`}
            onBlur={handleBlur}
            defaultValue={label}
            disabled={disabled || readonly}
          />
        </div>
        {children}
        <div className='flex self-center'>
          <RemoveButton
            id={buttonId<T>(id, 'remove')}
            className='rjsf-object-property-remove'
            disabled={disabled || readonly}
            onClick={handleRemove}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
}

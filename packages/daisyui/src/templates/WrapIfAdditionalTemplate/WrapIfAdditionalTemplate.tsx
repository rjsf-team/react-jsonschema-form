import { useCallback } from 'react';
import {
  WrapIfAdditionalTemplateProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  TranslatableString,
  buttonId,
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
    onKeyChange,
    onDropPropertyClick,
    registry,
    ...rest
  } = props;

  const { translateString } = registry;

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onKeyChange(event.target.value);
    },
    [onKeyChange],
  );

  const handleRemove = useCallback(() => {
    onDropPropertyClick(label)();
  }, [onDropPropertyClick, label]);

  return (
    <div className={`wrap-if-additional-template ${classNames}`} {...rest}>
      <div className='flex items-center'>
        <input
          type='text'
          className='input input-bordered'
          id={`${id}-key`}
          onBlur={handleBlur}
          defaultValue={label}
          disabled={disabled || readonly}
        />
        {schema.additionalProperties && (
          <button
            id={buttonId<T>(id, 'remove')}
            className='rjsf-array-item-remove btn btn-danger ml-2'
            onClick={handleRemove}
            disabled={disabled || readonly}
          >
            {translateString(TranslatableString.RemoveButton)}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

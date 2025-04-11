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
  F extends FormContextType = any
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

  return (
    <div className={`wrap-if-additional-template ${classNames}`} {...rest}>
      <div className='flex items-center'>
        <input
          type='text'
          className='input input-bordered'
          id={`${id}-key`}
          onBlur={(event) => onKeyChange(event.target.value)}
          defaultValue={label}
          disabled={disabled || readonly}
        />
        {schema.additionalProperties && (
          <button
            className='btn btn-danger ml-2'
            id={buttonId<T>(id, 'remove')}
            onClick={onDropPropertyClick(label)}
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

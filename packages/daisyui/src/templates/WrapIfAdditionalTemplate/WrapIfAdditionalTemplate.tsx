import { WrapIfAdditionalTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const WrapIfAdditionalTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WrapIfAdditionalTemplateProps<T, S, F>
) => {
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
    ...rest
  } = props;
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
          <button className='btn btn-danger ml-2' onClick={onDropPropertyClick(label)} disabled={disabled || readonly}>
            Remove
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default WrapIfAdditionalTemplate;

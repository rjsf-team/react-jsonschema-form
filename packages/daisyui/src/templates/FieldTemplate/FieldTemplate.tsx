import { FieldTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const FieldTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldTemplateProps<T, S, F>
) => {
  const {
    id,
    label,
    children,
    errors,
    formContext,
    formData,
    help,
    hideError,
    displayLabel,
    classNames,
    // Destructure props we don't want to pass to div
    onKeyChange,
    onDropPropertyClick,
    uiSchema,
    schema,
    readonly,
    required,
    rawErrors,
    rawHelp,
    rawDescription,
    hidden,
    onChange,
    ...divProps
  } = props;

  console.log('DaisyUI FieldTemplate');

  return (
    <div className={`field-template mb-2 ${classNames || ''}`} {...divProps}>
      {displayLabel && (
        <label htmlFor={id} className='label'>
          <span className='label-text'>{label}</span>
        </label>
      )}
      {children}
      {errors}
      {help}
    </div>
  );
};

export default FieldTemplate;

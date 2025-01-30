import { FieldTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const FieldTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldTemplateProps<T, S, F>
) => {
  const { id, label, children, errors, help, displayLabel, classNames, onChange, ...divProps } = props;
  return (
    <div className={`field-template`} {...divProps}>
      <label htmlFor={id} className='label'>
        <span className='label-text'>{label}</span>
      </label>
      {children}
      {errors}
      {help}
    </div>
  );
};

export default FieldTemplate;

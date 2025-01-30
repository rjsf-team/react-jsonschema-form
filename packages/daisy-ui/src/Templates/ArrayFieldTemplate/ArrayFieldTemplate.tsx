import { ArrayFieldTemplateProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const ArrayFieldTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayFieldTemplateProps<T, S, F>
) => {
  const { items, canAdd, onAddClick, title } = props;
  return (
    <div className='array-field'>
      <div className='array-field-title'>{title}</div>
      <div className='array-field-items'>
        {items.map((element) => (
          <div key={element.index} className='array-field-item'>
            {element.children}
          </div>
        ))}
      </div>
      {canAdd && (
        <button type='button' className='btn btn-primary' onClick={onAddClick}>
          Add Item
        </button>
      )}
    </div>
  );
};

export default ArrayFieldTemplate;

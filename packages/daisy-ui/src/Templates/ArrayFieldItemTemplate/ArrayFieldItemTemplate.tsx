import { ArrayFieldTemplateItemType, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

const ArrayFieldItemTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayFieldTemplateItemType<T, S, F>
) => {
  const { children, hasMoveUp, hasMoveDown, onDropIndexClick, onReorderClick, index } = props;
  return (
    <div className='array-field-item'>
      <div className='array-field-item-content'>{children}</div>
      <div className='array-field-item-controls'>
        {hasMoveUp && (
          <button type='button' className='btn btn-secondary' onClick={onReorderClick(index, index - 1)}>
            Move Up
          </button>
        )}
        {hasMoveDown && (
          <button type='button' className='btn btn-secondary' onClick={onReorderClick(index, index + 1)}>
            Move Down
          </button>
        )}
        <button type='button' className='btn btn-danger' onClick={onDropIndexClick(index)}>
          Remove
        </button>
      </div>
    </div>
  );
};

export default ArrayFieldItemTemplate;

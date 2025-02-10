import { ArrayFieldTemplateItemType, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

import { MoveUpButton, MoveDownButton, RemoveButton } from '../ButtonTemplates/IconButton';

const ArrayFieldItemTemplate = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ArrayFieldTemplateItemType<T, S, F>
) => {
  const { children, hasMoveUp, hasMoveDown, onDropIndexClick, onReorderClick, index, registry } = props;
  console.log('ArrayFieldItemTemplate full props:', props);
  console.log('DaisyUI ArrayFieldItemTemplate props:', {
    hasMoveUp,
    hasMoveDown,
    onDropIndexClick,
    onReorderClick,
    index,
  });
  console.log('onReorderClick type:', typeof onReorderClick);
  console.log('onReorderClick value:', onReorderClick);

  // Test if the function is actually callable
  if (typeof onReorderClick === 'function') {
    console.log('onReorderClick is a function');
  } else {
    console.error('onReorderClick is not a function:', onReorderClick);
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    console.log('handleReorder:', { fromIndex, toIndex });
    try {
      console.log('About to call onReorderClick');
      const handler = onReorderClick(fromIndex, toIndex);
      handler(); // Call the returned function without an event
      console.log('Called onReorderClick');
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  return (
    <div className='card bg-base-100 shadow-sm mb-4'>
      <div className='card-body p-4'>
        <div className='array-field-item-content mb-2'>{children}</div>
        <div className='card-actions justify-end'>
          {hasMoveUp && (
            <MoveUpButton
              className='btn btn-sm btn-ghost'
              onClick={() => {
                console.log('MoveUp clicked', index);
                handleReorder(index, index - 1);
              }}
              registry={registry}
            />
          )}
          {hasMoveDown && (
            <MoveDownButton
              className='btn btn-sm btn-ghost'
              onClick={() => handleReorder(index, index + 1)}
              registry={registry}
            />
          )}
          <RemoveButton
            className='btn btn-sm btn-ghost btn-error'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const handler = onDropIndexClick(index);
              handler();
            }}
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
};

export default ArrayFieldItemTemplate;

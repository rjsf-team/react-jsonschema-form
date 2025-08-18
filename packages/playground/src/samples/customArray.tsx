import { Sample } from './Sample';
import { ArrayFieldTemplateProps } from '@rjsf/utils';

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { className, items, canAdd, onAddClick } = props;
  return (
    <div className={className}>
      {items &&
        items.map((element) => (
          <div key={element.key} className={element.className}>
            <div>{element.children}</div>
            {element.buttonsProps.hasMoveDown && (
              <button onClick={element.buttonsProps.onReorderClick(element.index, element.index + 1)}>Down</button>
            )}
            {element.buttonsProps.hasMoveUp && (
              <button onClick={element.buttonsProps.onReorderClick(element.index, element.index - 1)}>Up</button>
            )}
            <button onClick={element.buttonsProps.onDropIndexClick(element.index)}>Delete</button>
            <hr />
          </div>
        ))}

      {canAdd && (
        <div className='row'>
          <p className='col-xs-3 col-xs-offset-9 array-item-add text-right'>
            <button onClick={onAddClick} type='button'>
              Custom +
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export const customArray: Sample = {
  schema: {
    title: 'Custom array of strings',
    type: 'array',
    items: {
      type: 'string',
    },
  },
  formData: ['react', 'jsonschema', 'form'],
  templates: { ArrayFieldTemplate },
};

export default customArray;

import { ArrayFieldItemButtonsTemplateType, ArrayFieldTemplateProps } from '@rjsf/utils';

import { Sample } from './Sample';

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { className, items, canAdd, onAddClick } = props;
  return (
    <div className={className}>
      {items}
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

function ArrayFieldItemButtonsTemplate(props: ArrayFieldItemButtonsTemplateType) {
  const { hasMoveDown, hasMoveUp, onMoveDownItem, onMoveUpItem, onRemoveItem } = props;
  return (
    <>
      {hasMoveDown && <button onClick={onMoveDownItem}>Down</button>}
      {hasMoveUp && <button onClick={onMoveUpItem}>Up</button>}
      <button onClick={onRemoveItem}>Delete</button>
      <hr />
    </>
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
  templates: { ArrayFieldTemplate, ArrayFieldItemButtonsTemplate },
};

export default customArray;

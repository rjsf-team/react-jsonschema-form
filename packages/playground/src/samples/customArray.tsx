import type { ArrayFieldItemButtonsTemplateProps, ArrayFieldTemplateProps } from '@rjsf/utils';

import type { Sample } from './Sample.ts';

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { className, items, canAdd, onAddClick, disabled, readonly } = props;
  return (
    <div className={className}>
      {items}
      {canAdd && (
        <div className='row'>
          <p className='col-xs-3 col-xs-offset-9 array-item-add text-right'>
            <button onClick={onAddClick} type='button' disabled={disabled || readonly}>
              Custom +
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

function ArrayFieldItemButtonsTemplate(props: ArrayFieldItemButtonsTemplateProps) {
  const { disabled, readonly, hasMoveDown, hasMoveUp, hasRemove, onMoveDownItem, onMoveUpItem, onRemoveItem } = props;
  const locked = disabled || readonly;
  return (
    <>
      {hasMoveDown && (
        <button type='button' onClick={onMoveDownItem} disabled={locked}>
          Down
        </button>
      )}
      {hasMoveUp && (
        <button type='button' onClick={onMoveUpItem} disabled={locked}>
          Up
        </button>
      )}
      {hasRemove && (
        <button type='button' onClick={onRemoveItem} disabled={locked}>
          Delete
        </button>
      )}
      <hr />
    </>
  );
}

const customArray: Sample = {
  schema: {
    title: 'Custom array of strings',
    type: 'array',
    items: {
      type: 'string',
    },
  },
  initialFormData: ['react', 'jsonschema', 'form'],
  templates: { ArrayFieldTemplate, ArrayFieldItemButtonsTemplate },
};

export default customArray;

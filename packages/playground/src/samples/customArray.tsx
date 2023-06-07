const ArrayFieldTemplate: React.FC<{ className: string; items?: any[]; canAdd?: boolean; onAddClick: () => void }> = ({
  className,
  items,
  canAdd,
  onAddClick,
}) => {
  return (
    <div className={className}>
      {items &&
        items.map((element) => (
          <div key={element.key} className={element.className}>
            <div>{element.children}</div>
            {element.hasMoveDown && (
              <button onClick={element.onReorderClick(element.index, element.index + 1)}>Down</button>
            )}
            {element.hasMoveUp && (
              <button onClick={element.onReorderClick(element.index, element.index - 1)}>Up</button>
            )}
            <button onClick={element.onDropIndexClick(element.index)}>Delete</button>
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
};

export default {
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

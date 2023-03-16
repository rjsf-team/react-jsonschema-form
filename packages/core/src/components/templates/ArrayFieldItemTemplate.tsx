import { CSSProperties } from 'react';
import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    hasCopy,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    uiSchema,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  return (
    <div className={className}>
      <div className={hasToolbar ? 'col-xs-9' : 'col-xs-12'}>{children}</div>
      {hasToolbar && (
        <div className='col-xs-3 array-item-toolbox'>
          <div
            className='btn-group'
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                style={btnStyle}
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                style={btnStyle}
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasCopy && (
              <CopyButton
                style={btnStyle}
                disabled={disabled || readonly}
                onClick={onCopyIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                style={btnStyle}
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

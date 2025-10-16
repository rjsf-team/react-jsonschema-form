import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ArrayFieldItemButtonsTemplateType,
  buttonId,
} from '@rjsf/utils';

/** The `ArrayFieldItemButtonsTemplate` component renders the action buttons for an array field item
 * using DaisyUI's join component when multiple buttons are present.
 */
export default function ArrayFieldItemButtonsTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemButtonsTemplateType<T, S, F>) {
  const {
    disabled,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    fieldPathId,
    onCopyItem,
    onRemoveItem,
    onMoveDownItem,
    onMoveUpItem,
    readonly,
    registry,
    uiSchema,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;

  const renderMany = [hasMoveUp || hasMoveDown, hasCopy, hasRemove].filter(Boolean).length > 1;
  const btnClass = renderMany ? 'join-item btn btn-sm px-2' : 'btn btn-sm px-2 rounded-sm';
  const removeBtnClass = renderMany ? 'join-item btn btn-sm btn-error px-2' : 'btn btn-sm btn-error px-2 rounded-sm';

  const buttons = (
    <>
      {(hasMoveUp || hasMoveDown) && (
        <>
          <MoveUpButton
            id={buttonId(fieldPathId, 'moveUp')}
            className={`rjsf-array-item-move-up ${btnClass}`}
            disabled={disabled || readonly || !hasMoveUp}
            onClick={onMoveUpItem}
            uiSchema={uiSchema}
            registry={registry}
          />
          <MoveDownButton
            id={buttonId(fieldPathId, 'moveDown')}
            className={`rjsf-array-item-move-down ${btnClass}`}
            disabled={disabled || readonly || !hasMoveDown}
            onClick={onMoveDownItem}
            uiSchema={uiSchema}
            registry={registry}
          />
        </>
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId(fieldPathId, 'copy')}
          className={`rjsf-array-item-copy ${btnClass}`}
          disabled={disabled || readonly}
          onClick={onCopyItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId(fieldPathId, 'remove')}
          className={`rjsf-array-item-remove ${removeBtnClass}`}
          disabled={disabled || readonly}
          onClick={onRemoveItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );

  return renderMany ? <div className='join'>{buttons}</div> : buttons;
}

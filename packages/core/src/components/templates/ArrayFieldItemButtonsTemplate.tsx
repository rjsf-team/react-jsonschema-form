import {
  ArrayFieldItemButtonsTemplateType,
  buttonId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `ArrayFieldTemplateItemButtons` component is the template used to render the buttons associate3d with items of
 * an array.
 *
 * @param props - The `ArrayFieldItemButtonsTemplateType` props for the component
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

  return (
    <>
      {(hasMoveUp || hasMoveDown) && (
        <MoveUpButton
          id={buttonId(fieldPathId, 'moveUp')}
          className='rjsf-array-item-move-up'
          disabled={disabled || readonly || !hasMoveUp}
          onClick={onMoveUpItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(hasMoveUp || hasMoveDown) && (
        <MoveDownButton
          id={buttonId(fieldPathId, 'moveDown')}
          className='rjsf-array-item-move-down'
          disabled={disabled || readonly || !hasMoveDown}
          onClick={onMoveDownItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId(fieldPathId, 'copy')}
          className='rjsf-array-item-copy'
          disabled={disabled || readonly}
          onClick={onCopyItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId(fieldPathId, 'remove')}
          className='rjsf-array-item-remove'
          disabled={disabled || readonly}
          onClick={onRemoveItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
}

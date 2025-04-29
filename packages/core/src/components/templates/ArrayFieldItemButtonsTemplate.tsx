import { useMemo } from 'react';
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
    idSchema,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    uiSchema,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
  const onCopyClick = useMemo(() => onCopyIndexClick(index), [index, onCopyIndexClick]);
  const onRemoveClick = useMemo(() => onDropIndexClick(index), [index, onDropIndexClick]);
  const onArrowUpClick = useMemo(() => onReorderClick(index, index - 1), [index, onReorderClick]);
  const onArrowDownClick = useMemo(() => onReorderClick(index, index + 1), [index, onReorderClick]);

  return (
    <>
      {(hasMoveUp || hasMoveDown) && (
        <MoveUpButton
          id={buttonId<T>(idSchema, 'moveUp')}
          className='rjsf-array-item-move-up'
          disabled={disabled || readonly || !hasMoveUp}
          onClick={onArrowUpClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(hasMoveUp || hasMoveDown) && (
        <MoveDownButton
          id={buttonId<T>(idSchema, 'moveDown')}
          className='rjsf-array-item-move-down'
          disabled={disabled || readonly || !hasMoveDown}
          onClick={onArrowDownClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId<T>(idSchema, 'copy')}
          className='rjsf-array-item-copy'
          disabled={disabled || readonly}
          onClick={onCopyClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId<T>(idSchema, 'remove')}
          className='rjsf-array-item-remove'
          disabled={disabled || readonly}
          onClick={onRemoveClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
}

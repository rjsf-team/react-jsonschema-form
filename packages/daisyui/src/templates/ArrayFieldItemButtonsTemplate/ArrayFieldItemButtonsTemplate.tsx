import { useMemo } from 'react';
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

  const renderMany = [hasMoveUp || hasMoveDown, hasCopy, hasRemove].filter(Boolean).length > 1;
  const btnClass = renderMany ? 'join-item btn btn-sm px-2' : 'btn btn-sm px-2 rounded-sm';
  const removeBtnClass = renderMany ? 'join-item btn btn-sm btn-error px-2' : 'btn btn-sm btn-error px-2 rounded-sm';

  const buttons = (
    <>
      {(hasMoveUp || hasMoveDown) && (
        <>
          <MoveUpButton
            id={buttonId<T>(idSchema, 'moveUp')}
            className={`rjsf-array-item-move-up ${btnClass}`}
            disabled={disabled || readonly || !hasMoveUp}
            onClick={onArrowUpClick}
            uiSchema={uiSchema}
            registry={registry}
          />
          <MoveDownButton
            id={buttonId<T>(idSchema, 'moveDown')}
            className={`rjsf-array-item-move-down ${btnClass}`}
            disabled={disabled || readonly || !hasMoveDown}
            onClick={onArrowDownClick}
            uiSchema={uiSchema}
            registry={registry}
          />
        </>
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId<T>(idSchema, 'copy')}
          className={`rjsf-array-item-copy ${btnClass}`}
          disabled={disabled || readonly}
          onClick={onCopyClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId<T>(idSchema, 'remove')}
          className={`rjsf-array-item-remove ${removeBtnClass}`}
          disabled={disabled || readonly}
          onClick={onRemoveClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );

  return renderMany ? <div className='join'>{buttons}</div> : buttons;
}

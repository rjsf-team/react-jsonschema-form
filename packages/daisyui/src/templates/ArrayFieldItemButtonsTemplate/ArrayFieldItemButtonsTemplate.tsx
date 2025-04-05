import { useMemo } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ArrayFieldItemButtonsTemplateType,
  buttonId,
} from '@rjsf/utils';

export default function ArrayFieldItemButtonsTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
          className='btn btn-sm btn-ghost'
          disabled={disabled || readonly || !hasMoveUp}
          onClick={onArrowUpClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {(hasMoveUp || hasMoveDown) && (
        <MoveDownButton
          id={buttonId<T>(idSchema, 'moveDown')}
          className='btn btn-sm btn-ghost'
          disabled={disabled || readonly || !hasMoveDown}
          onClick={onArrowDownClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId<T>(idSchema, 'copy')}
          className='btn btn-sm btn-ghost'
          disabled={disabled || readonly}
          onClick={onCopyClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId<T>(idSchema, 'remove')}
          className='btn btn-sm btn-ghost btn-error'
          disabled={disabled || readonly}
          onClick={onRemoveClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
}

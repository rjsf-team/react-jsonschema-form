import { useMemo } from 'react';
import { Box, ButtonGroup, HStack } from '@chakra-ui/react';
import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    disabled,
    hasToolbar,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    uiSchema,
    registry,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
  const onCopyClick = useMemo(() => onCopyIndexClick(index), [index, onCopyIndexClick]);

  const onRemoveClick = useMemo(() => onDropIndexClick(index), [index, onDropIndexClick]);

  const onArrowUpClick = useMemo(() => onReorderClick(index, index - 1), [index, onReorderClick]);

  const onArrowDownClick = useMemo(() => onReorderClick(index, index + 1), [index, onReorderClick]);

  return (
    <HStack alignItems={'flex-end'} py={1}>
      <Box w='100%'>{children}</Box>
      {hasToolbar && (
        <Box>
          <ButtonGroup isAttached mb={1}>
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onArrowUpClick}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onArrowDownClick}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasCopy && (
              <CopyButton
                disabled={disabled || readonly}
                onClick={onCopyClick}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                disabled={disabled || readonly}
                onClick={onRemoveClick}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
          </ButtonGroup>
        </Box>
      )}
    </HStack>
  );
}

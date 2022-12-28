import React, { useMemo } from "react";
import { Box, ButtonGroup, HStack } from "@chakra-ui/react";
import { ArrayFieldTemplateItemType } from "@rjsf/utils";

const ArrayFieldItemTemplate = (props: ArrayFieldTemplateItemType) => {
  const {
    children,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onDropIndexClick,
    onReorderClick,
    readonly,
    uiSchema,
    registry,
  } = props;
  const { MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates;
  const onRemoveClick = useMemo(
    () => onDropIndexClick(index),
    [index, onDropIndexClick]
  );

  const onArrowUpClick = useMemo(
    () => onReorderClick(index, index - 1),
    [index, onReorderClick]
  );

  const onArrowDownClick = useMemo(
    () => onReorderClick(index, index + 1),
    [index, onReorderClick]
  );

  return (
    <HStack alignItems={"flex-end"} py={1}>
      <Box w="100%">{children}</Box>
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
};

export default ArrayFieldItemTemplate;

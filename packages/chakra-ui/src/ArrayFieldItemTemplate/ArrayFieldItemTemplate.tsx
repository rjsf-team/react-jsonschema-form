import React, { useMemo } from "react";
import { Box, ButtonGroup, HStack } from "@chakra-ui/react";
import { ArrayFieldTemplateItemType } from "@rjsf/utils";

import IconButton from "../IconButton";

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
  } = props;
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
              <IconButton
                icon="arrow-up"
                tabIndex={-1}
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onArrowUpClick}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <IconButton
                icon="arrow-down"
                tabIndex={-1}
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onArrowDownClick}
              />
            )}
            {hasRemove && (
              <IconButton
                icon="remove"
                tabIndex={-1}
                disabled={disabled || readonly}
                onClick={onRemoveClick}
              />
            )}
          </ButtonGroup>
        </Box>
      )}
    </HStack>
  );
};

export default ArrayFieldItemTemplate;

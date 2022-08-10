import React from "react";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
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
  } = props;
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
    minWidth: 0,
  };
  return (
    <Grid container={true} alignItems="center">
      <Grid item={true} xs style={{ overflow: "auto" }}>
        <Box mb={2}>
          <Paper elevation={2}>
            <Box p={2}>{children}</Box>
          </Paper>
        </Box>
      </Grid>

      {hasToolbar && (
        <Grid item={true}>
          {(hasMoveUp || hasMoveDown) && (
            <IconButton
              size="small"
              className="array-item-move-up"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={disabled || readonly || !hasMoveUp}
              onClick={onReorderClick(index, index - 1)}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          )}
          {(hasMoveUp || hasMoveDown) && (
            <IconButton
              size="small"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={disabled || readonly || !hasMoveDown}
              onClick={onReorderClick(index, index + 1)}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          )}
          {hasRemove && (
            <IconButton
              size="small"
              tabIndex={-1}
              style={btnStyle as any}
              disabled={disabled || readonly}
              onClick={onDropIndexClick(index)}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          )}
        </Grid>
      )}
    </Grid>
  );
};

export default ArrayFieldItemTemplate;

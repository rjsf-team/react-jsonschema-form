import React from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import RemoveIcon from "@material-ui/icons/Remove";
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

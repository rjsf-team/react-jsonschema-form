import { CSSProperties } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateItemType<T, S, F>) {
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
  const btnStyle: CSSProperties = {
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
            <MoveUpButton
              style={btnStyle}
              disabled={disabled || readonly || !hasMoveUp}
              onClick={onReorderClick(index, index - 1)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
          {(hasMoveUp || hasMoveDown) && (
            <MoveDownButton
              style={btnStyle}
              disabled={disabled || readonly || !hasMoveDown}
              onClick={onReorderClick(index, index + 1)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
          {hasRemove && (
            <RemoveButton
              style={btnStyle}
              disabled={disabled || readonly}
              onClick={onDropIndexClick(index)}
              uiSchema={uiSchema}
              registry={registry}
            />
          )}
        </Grid>
      )}
    </Grid>
  );
}

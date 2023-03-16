import { CSSProperties } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

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
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
    minWidth: 0,
  };
  return (
    <Grid container={true} alignItems='center'>
      <Grid item={true} xs style={{ overflow: 'auto' }}>
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
          {hasCopy && (
            <CopyButton
              style={btnStyle}
              disabled={disabled || readonly}
              onClick={onCopyIndexClick(index)}
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

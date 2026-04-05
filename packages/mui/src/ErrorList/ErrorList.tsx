import ErrorIcon from '@mui/icons-material/Error';
import Box, { BoxProps } from '@mui/material/Box';
import List, { ListProps } from '@mui/material/List';
import ListItem, { ListItemProps } from '@mui/material/ListItem';
import ListItemIcon, { ListItemIconProps } from '@mui/material/ListItemIcon';
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText';
import Paper, { PaperProps } from '@mui/material/Paper';
import Typography, { TypographyProps } from '@mui/material/Typography';
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
  uiSchema,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <Paper elevation={2} {...(otherMuiProps as PaperProps)} {...(muiSlotProps?.paper as PaperProps)}>
      <Box mb={2} p={2} {...(muiSlotProps?.box as BoxProps)}>
        <Typography variant='h6' {...(muiSlotProps?.typography as TypographyProps)}>
          {translateString(TranslatableString.ErrorsLabel)}
        </Typography>
        <List dense={true} {...(muiSlotProps?.list as ListProps)}>
          {errors.map((error, i: number) => {
            return (
              <ListItem key={i} {...(muiSlotProps?.listItem as ListItemProps)}>
                <ListItemIcon {...(muiSlotProps?.listItemIcon as ListItemIconProps)}>
                  <ErrorIcon color='error' />
                </ListItemIcon>
                <ListItemText primary={error.stack} {...(muiSlotProps?.listItemText as ListItemTextProps)} />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}

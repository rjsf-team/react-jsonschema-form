import ListItem, { ListItemProps } from '@mui/material/ListItem';
import FormHelperText, { FormHelperTextProps } from '@mui/material/FormHelperText';
import List, { ListProps } from '@mui/material/List';
import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema, getUiOptions } from '@rjsf/utils';
import { getMuiProps } from '../util';

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], fieldPathId, uiSchema, registry } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldPathId);

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F>({
    uiSchema,
    formContext: registry.formContext,
    options: uiOptions,
  });
  const { slotProps: muiSlotProps, ...otherMuiProps } = muiProps;

  return (
    <List
      id={id}
      dense={true}
      disablePadding={true}
      {...(otherMuiProps as ListProps)}
      {...(muiSlotProps?.list as ListProps)}
    >
      {errors.map((error, i: number) => {
        return (
          <ListItem key={i} disableGutters={true} {...(muiSlotProps?.listItem as ListItemProps)}>
            <FormHelperText
              component='div'
              id={`${id}-${i}`}
              {...(muiSlotProps?.formHelperText as FormHelperTextProps)}
            >
              {error}
            </FormHelperText>
          </ListItem>
        );
      })}
    </List>
  );
}

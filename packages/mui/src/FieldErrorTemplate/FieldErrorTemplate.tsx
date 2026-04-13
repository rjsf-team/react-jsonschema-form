import ListItem, { ListItemProps } from '@mui/material/ListItem';
import FormHelperText, { FormHelperTextProps } from '@mui/material/FormHelperText';
import List, { ListProps } from '@mui/material/List';
import {
  errorId,
  FieldErrorProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';
import { getMuiProps } from '../util';

/** Properties available for the `rjsfSlotProps` target of the FieldErrorTemplate. */
export interface FieldErrorTemplateMuiProps extends GenericObjectType {
  /** RJSF-specific slot props for targeting child elements of the FieldErrorTemplate. */
  rjsfSlotProps?: {
    /** Props applied to the `List` container holding the errors. */
    fieldErrorList?: ListProps;
    /** Props applied to each `ListItem` representing an error. */
    fieldErrorListItem?: ListItemProps;
    /** Props applied to the `FormHelperText` displaying the actual error message. */
    fieldErrorFormHelperText?: FormHelperTextProps;
  };
}

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], fieldPathId, uiSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId(fieldPathId);

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const muiProps = getMuiProps<T, S, F, FieldErrorTemplateMuiProps>(uiOptions);
  const { rjsfSlotProps: muiSlotProps } = muiProps;

  return (
    <List id={id} dense={true} disablePadding={true} {...muiSlotProps?.fieldErrorList}>
      {errors.map((error, i: number) => {
        return (
          <ListItem key={i} disableGutters={true} {...muiSlotProps?.fieldErrorListItem}>
            <FormHelperText component='div' id={`${id}-${i}`} {...muiSlotProps?.fieldErrorFormHelperText}>
              {error}
            </FormHelperText>
          </ListItem>
        );
      })}
    </List>
  );
}

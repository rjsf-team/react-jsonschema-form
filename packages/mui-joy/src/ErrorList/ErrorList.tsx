import ErrorIcon from "@mui/icons-material/Error";
import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import {
  ErrorListProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from "@rjsf/utils";

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ errors, registry }: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Sheet variant="outlined">
      <Box mb={2} p={2}>
        <Typography level="h4">
          {translateString(TranslatableString.ErrorsLabel)}
        </Typography>
        <List size="sm">
          {errors.map((error, i: number) => {
            return (
              <ListItem key={i}>
                <ListItemDecorator>
                  <ErrorIcon color="error" />
                </ListItemDecorator>
                <ListItemContent>{error.stack} </ListItemContent>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Sheet>
  );
}

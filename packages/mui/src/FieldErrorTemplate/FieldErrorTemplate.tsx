import React from "react";
import { FieldErrorProps } from "@rjsf/utils";
import ListItem from "@mui/material/ListItem";
import FormHelperText from "@mui/material/FormHelperText";
import List from "@mui/material/List";

/** The `FieldErrorTemplate` component renders the errors local to the particular field
 *
 * @param props - The `FieldErrorProps` for the errors being rendered
 */
export default function FieldErrorTemplate(props: FieldErrorProps) {
  const { errors = [], idSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = `${idSchema.$id}__error`;

  return (
    <List dense={true} disablePadding={true}>
      {errors.map((error, i: number) => {
        return (
          <ListItem key={i} disableGutters={true}>
            <FormHelperText id={id}>{error}</FormHelperText>
          </ListItem>
        );
      })}
    </List>
  );
}

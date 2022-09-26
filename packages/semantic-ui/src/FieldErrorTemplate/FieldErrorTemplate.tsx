import React from "react";
import { FieldErrorProps } from "@rjsf/utils";
import { nanoid } from "nanoid";
import { Label, List } from "semantic-ui-react";

import { getSemanticErrorProps } from "../util";

const DEFAULT_OPTIONS = {
  options: {
    pointing: "above",
    size: "small",
  },
};

/**
 *
 * @param errors
 * @param displayError
 * @returns {*}
 * @constructor
 * @return {null}
 */
function FieldErrorTemplate({
  errors,
  idSchema,
  uiSchema,
  registry,
}: FieldErrorProps) {
  const { formContext } = registry;
  const options = getSemanticErrorProps({
    formContext,
    uiSchema,
    defaultProps: DEFAULT_OPTIONS,
  });
  const { pointing, size } = options;
  if (errors && errors.length > 0) {
    const id = `${idSchema.$id}__error`;
    return (
      <Label
        id={id}
        color="red"
        pointing={pointing || "above"}
        size={size || "small"}
        basic
      >
        <List bulleted>
          {errors.map((error) => (
            <List.Item key={nanoid()}>{error}</List.Item>
          ))}
        </List>
      </Label>
    );
  }
  return null;
}

export default FieldErrorTemplate;

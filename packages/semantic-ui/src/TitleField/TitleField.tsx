import React from "react";
import { TitleFieldProps } from "@rjsf/utils";
import { Header } from "semantic-ui-react";

import { getSemanticProps } from "../util";

const DEFAULT_OPTIONS = {
  inverted: false,
  dividing: true,
};

function TitleField({ id, title, uiSchema }: TitleFieldProps) {
  const semanticProps = getSemanticProps({
    uiSchema,
    defaultSchemaProps: DEFAULT_OPTIONS,
  });
  if (!title) {
    return null;
  }
  return (
    <Header id={id} {...semanticProps} as="h5">
      {title}
    </Header>
  );
}

export default TitleField;

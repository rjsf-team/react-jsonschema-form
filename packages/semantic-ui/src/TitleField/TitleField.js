import { Header } from "semantic-ui-react";
import { getUiOptions } from "@rjsf/utils";

const DEFAULT_OPTIONS = {
  semantic: {
    inverted: false,
    dividing: true,
  },
};

function TitleField({ id, title, uiSchema }) {
  const uiOptions = getUiOptions(uiSchema);
  const { semantic } = uiOptions.options || DEFAULT_OPTIONS;
  if (title) {
    return (
      <Header id={id} {...semantic} as="h5">
        {title}
      </Header>
    );
  }
}

export default TitleField;

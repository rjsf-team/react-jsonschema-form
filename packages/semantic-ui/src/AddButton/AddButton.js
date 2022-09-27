import React from "react";
import { Button, Icon } from "semantic-ui-react";

function AddButton({ uiSchema, ...props }) {
  return (
    <Button title="Add Item" {...props} icon size="tiny">
      <Icon name="plus" />
    </Button>
  );
}

export default AddButton;

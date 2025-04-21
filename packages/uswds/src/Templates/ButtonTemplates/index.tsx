import React from "react";
import { AddButtonProps, IconButtonProps as RjsfIconButtonProps } from "@rjsf/utils";
import IconButton from "./IconButton"; // Import the generic IconButton

// Define specific button types using the generic IconButton
const AddButton = (props: AddButtonProps) => (
  <IconButton
    {...props}
    iconName="add"
    uswdsStyle="outline"
    title="Add Item" // Default title
  >
    Add Item {/* Default text */}
  </IconButton>
);

const RemoveButton = (props: RjsfIconButtonProps) => (
  <IconButton
    {...props}
    iconName="remove"
    uswdsStyle="unstyled"
    title="Remove Item" // Default title
  />
);

const MoveUpButton = (props: RjsfIconButtonProps) => (
  <IconButton
    {...props}
    iconName="arrow-upward"
    uswdsStyle="unstyled"
    title="Move Item Up" // Default title
  />
);

const MoveDownButton = (props: RjsfIconButtonProps) => (
  <IconButton
    {...props}
    iconName="arrow-downward"
    uswdsStyle="unstyled"
    title="Move Item Down" // Default title
  />
);

const CopyButton = (props: RjsfIconButtonProps) => (
  <IconButton
    {...props}
    iconName="copy" // Assuming 'copy' is added to iconMap
    uswdsStyle="unstyled"
    title="Copy Item" // Default title
  />
);

// Export the pre-configured buttons
export default {
  AddButton,
  CopyButton,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
  // You could also export the generic IconButton itself if needed elsewhere
  // IconButton,
};

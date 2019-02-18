import React from "react";
import { Chip } from "@material-ui/core";

const SelectionBar = props => {
  const {
    isMultiselect,
    selectedOptions,
    selectionColumn,
    onDeleteChoice,
  } = props;
  if (isMultiselect) {
    return (
      <React.Fragment>
        {selectedOptions.map((value, key) => (
          <Chip
            key={key}
            label={value[selectionColumn]}
            style={{ marginRight: 5, height: 30 }}
            onDelete={() => onDeleteChoice(value[selectionColumn])}
          />
        ))}
      </React.Fragment>
    );
  } else if (selectedOptions[0]) {
    return selectedOptions[0][selectionColumn];
  }

  return null;
};

export default SelectionBar;

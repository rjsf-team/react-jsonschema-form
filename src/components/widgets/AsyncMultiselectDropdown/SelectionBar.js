import React from "react";
import { Chip } from "@material-ui/core";

const SelectionBar = props => {
  const {
    isMultiselect,
    selectedOptions,
    selectionColumn,
    onDeleteChoice,
    primaryColumn,
    getChipDisplayText
  } = props;
  
  if (isMultiselect) {
    return (
      <React.Fragment>
        {selectedOptions.map((value, key) => (
          <Chip
            key={key}
            label={getChipDisplayText ? getChipDisplayText(value[primaryColumn]) : value[selectionColumn]}
            style={{ marginRight: 5, height: 30 }}
            onDelete={() => onDeleteChoice(value[selectionColumn])}
          />
        ))}
      </React.Fragment>
    );
  } else if (selectedOptions[0]) {
    return (
      <Chip
        label={getChipDisplayText ? getChipDisplayText(selectedOptions[0][primaryColumn]): selectedOptions[0][selectionColumn]}
        style={{ marginRight: 5, height: 30 }}
        onDelete={() => onDeleteChoice(selectedOptions[0][selectionColumn])}
      />
    );
  }

  return null;
};

export default SelectionBar;

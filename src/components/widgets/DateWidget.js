import React, {PropTypes} from "react";

import BaseInput from "./BaseInput";


function DateWidget(props) {
  const {onChange} = props;
  // Note: native HTML date widgets are already clearable.
  return (
    <BaseInput
      type="date"
      {...props}
      clearable={false}
      onChange={(value) => onChange(value || undefined)}/>
  );
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateWidget;

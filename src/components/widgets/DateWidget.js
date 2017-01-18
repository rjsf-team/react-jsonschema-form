import React, {PropTypes} from "react";

import BaseInput from "./BaseInput";


function DateWidget(props) {
  const {onChange, onBlur} = props;
  return (
    <BaseInput
      type="date"
      {...props}
      onChange={(value) => onChange(value || undefined)}
      onBlur={(value) => {
        return onBlur(value || undefined);
      }}/>
  );
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateWidget;

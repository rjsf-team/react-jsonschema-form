import React from "react";
import PropTypes from "prop-types";

function ColorWidget(props) {
  const {
    disabled,
    readonly,
    registry: {
      widgets: { BaseInput },
    },
  } = props;

  const styles = {
    root: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    input: {
      order: 1,
    },
    picker: {
      order: 2,
      width: 60,
      padding: 0,
      border: "none",
      background: "none",
    },
  };

  return (
    <div style={styles.root}>
      <BaseInput
        type="text"
        style={styles.input}
        className="form-control"
        {...props}
        disabled={disabled || readonly}
      />
      <BaseInput
        type="color"
        style={styles.picker}
        {...props}
        autofocus={false}
        disabled={disabled || readonly}
      />
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  ColorWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default ColorWidget;

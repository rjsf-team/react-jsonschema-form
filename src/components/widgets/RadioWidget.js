import React from "react";
import PropTypes from "prop-types";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Tooltip from "@material-ui/core/Tooltip";
import InfoIcon from "@material-ui/icons/Info";
import IconButton from "@material-ui/core/IconButton";
import ReactHtmlParser from "react-html-parser";

function RadioWidget(props) {
  const {
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    schema,
    id,
  } = props;
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, enumDisabled, inline } = options;
  // checked={checked} has been moved above name={name}, As mentioned in #349;
  // this is a temporary fix for radio button rendering bug in React, facebook/react#7630.
  return (
    <RadioGroup name={name} className="field-radio-group">
      {enumOptions.map((option, i) => {
        const checked = option.value === value;
        const itemDisabled =
          enumDisabled && enumDisabled.indexOf(option.value) != -1;
        const disabledCls =
          disabled || itemDisabled || readonly ? "disabled" : "";
        const toolTip =
          schema && schema.anyOf && schema.anyOf[i].help ? (
            <span>
              <Tooltip title={ReactHtmlParser(schema.anyOf[i].help)}>
                <IconButton aria-label={ReactHtmlParser(schema.anyOf[i].help)}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </span>
          ) : (
            <div />
          );

        const radio = (
          <span>
            <FormControlLabel
              type="radio"
              control={<Radio color="primary" />}
              label={option.label}
              checked={checked}
              name={name}
              required={required}
              value={option.value}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && i === 0}
              onChange={_ => onChange(option.value)}
              onBlur={onBlur && (event => onBlur(id, event.target.value))}
              onFocus={onFocus && (event => onFocus(id, event.target.value))}
            />
            {/* <span>{option.label}</span> */}
            <span>{toolTip}</span>
          </span>
        );

        return inline ? (
          <label key={i} className={`radio-inline ${disabledCls}`}>
            {radio}
          </label>
        ) : (
          <div key={i} className={`radio ${disabledCls}`}>
            <label>{radio}</label>
          </div>
        );
      })}
    </RadioGroup>
  );
}

RadioWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
      inline: PropTypes.bool,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;

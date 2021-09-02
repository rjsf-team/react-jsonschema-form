import React from "react";
import PropTypes from "prop-types";
import Skeleton from 'react-loading-skeleton';

function selectValue(value, selected, all) {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));
  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a, b) => all.indexOf(a) > all.indexOf(b));
}

function deselectValue(value, selected) {
  return selected.filter(v => v !== value);
}

function CheckboxesWidget(props) {
  const { id, disabled, options, value, autofocus, readonly, onChange, onBlur } = props;
  const { enumOptions, enumDisabled, inline } = options;
  let isDataLoaded = true;
  if (props.isDataLoaded !== undefined) {
    isDataLoaded = props.isDataLoaded;
  }
  return (
    <React.Fragment>
      {(value == null || value === "" || value === undefined) && !isDataLoaded && (
        <Skeleton/>
      )}
      {(value || isDataLoaded) && (
        <div className="checkboxes" id={id}  onMouseLeave={onBlur && (() => onBlur(value))}>
          {enumOptions.map((option, index) => {
            const checked = value.indexOf(option.value) !== -1;
            const itemDisabled =
              enumDisabled && enumDisabled.indexOf(option.value) != -1;
            const disabledCls =
              disabled || itemDisabled || readonly ? "disabled" : "";
            const checkbox = (
              <span>
                <input
                  type="checkbox"
                  id={`${id}_${index}`}
                  className="custom-control-input"
                  checked={checked}
                  disabled={disabled || itemDisabled || readonly}
                  autoFocus={autofocus && index === 0}
                  onChange={event => {
                    const all = enumOptions.map(({ value }) => value);
                    if (event.target.checked) {
                      onChange(selectValue(option.value, value, all));
                    } else {
                      onChange(deselectValue(option.value, value));
                    }
                  }}
                />
                <label className="custom-control-label" htmlFor={`${id}_${index}`}>{option.label}</label>
              </span>
            );
            return inline ? (
              <div key={index} className={`custom-control custom-checkbox custom-control-inline ${disabledCls}`}>
                {checkbox}
              </div>
            ) : (
              <div key={index} className={`custom-control custom-checkbox ${disabledCls}`}>
                {checkbox}
              </div>
            );
          })}
        </div>
      )}
    </React.Fragment>
  );
}

CheckboxesWidget.defaultProps = {
  autofocus: false,
  options: {
    inline: false,
  },
};

if (process.env.NODE_ENV !== "production") {
  CheckboxesWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
      inline: PropTypes.bool,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    disabled: PropTypes.bool,
    multiple: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default CheckboxesWidget;

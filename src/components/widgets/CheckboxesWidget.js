import React, { PropTypes } from "react";


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
  const {id, disabled, options, value, onChange} = props;
  return (
    <div className="checkboxes" id={id}>{
      options.map((option, index) => {
        const checked = value.indexOf(option.value) !== -1;
        return (
          <div key={index} className="checkbox">
            <label>
              <input type="checkbox"
                id={`${id}_${index}`}
                checked={checked}
                disabled={disabled}
                onChange={(event) => {
                  const all = options.map(({value}) => value);
                  if (event.target.checked) {
                    onChange(selectValue(option.value, value, all));
                  } else {
                    onChange(deselectValue(option.value, value));
                  }
                }} />
              <strong>{option.label}</strong>
            </label>
          </div>
        );
      })
    }</div>
  );
}

if (process.env.NODE_ENV !== "production") {
  CheckboxesWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    multiple: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default CheckboxesWidget;

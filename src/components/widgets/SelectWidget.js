import React from 'react';
import PropTypes from 'prop-types';

import { asNumber, guessType } from '../../utils';

const nums = new Set(['number', 'integer']);
const nullPlaceholderValue = '|||nullPlaceholder|||';
const defaultPlaceholderValue = '|||defaultPlaceholder|||';

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(schema, value) {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return value;
  } else if (value === nullPlaceholderValue) {
    return undefined;
  } else if (value === defaultPlaceholderValue) {
    return "";
  } else if (type === 'array' && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (Array.isArray(value)) {
    return value.map(
      item => processValue(schema, item)
    );
  } else if (type === 'boolean') {
    return value === 'true';
  } else if (type === 'number') {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every(x => guessType(x) === 'number')) {
      return asNumber(value);
    } else if (schema.enum.every(x => guessType(x) === 'boolean')) {
      return value === 'true';
    }
  }

  return value;
}

function getValue(event, multiple) {
  if (multiple) {
    return [].slice
      .call(event.target.options)
      .filter(o => o.selected)
      .map(o => {
        if (o.value === defaultPlaceholderValue) {
          return '';
        } else if (o.value === nullPlaceholderValue) {
          return null;
        }
        return o.value;
      });
  } else {
    return event.target.value;
  }
}

function SelectWidget(props) {
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    placeholder,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const emptyValue = multiple ? [] : '';

  let invalidValue;

  if (value === undefined || value === null) {
    invalidValue = null;
  }
  if (
    typeof value === "string" &&
    !enumOptions.map(option =>  option.value).includes(value)
  ) {
    invalidValue = value;
  }
  if (Array.isArray(value)) {
    // Get the set difference between the actual
    // values in the data, and the allowed
    // values from the schema:
    invalidValue = [...value].filter(
      x => {
        return !enumOptions.map(option => option.value).includes(x);
      }
    );
  }

  let selectValue = value;
  if (typeof value === 'undefined' || value === null) {
    selectValue = nullPlaceholderValue;
  } else if (Array.isArray(value)) {
    selectValue = value.map(item => {
      console.log('item is:');
      console.log(item);
      if (item === "") {
        return defaultPlaceholderValue;
      }
      if (item === null || item === undefined) {
        return nullPlaceholderValue;
      }
      return item;
    });
  }

  console.log('selectValue:');
  console.log(selectValue);
  console.log('value:');
  console.log(value);
  console.log('invalidValue:');
  console.log(invalidValue);

  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={selectValue}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={
        onBlur &&
        (event => {
          const newValue = getValue(event, multiple);
          onBlur(id, processValue(schema, newValue));
        })
      }
      onFocus={
        onFocus &&
        (event => {
          const newValue = getValue(event, multiple);
          onFocus(id, processValue(schema, newValue));
        })
      }
      onChange={event => {
        const newValue = getValue(event, multiple);
        onChange(processValue(schema, newValue));
      }}>
      {!multiple && schema.default === undefined && (
        <option value={defaultPlaceholderValue} key="placeholder">
          {placeholder || emptyValue}
        </option>
      )}
      {
        (
          typeof invalidValue === 'string' ||
          typeof invalidValue === undefined ||
          invalidValue === null
        ) &&
          // Don't re-render an option that is
          // identical to the placeholder above:
          invalidValue !== placeholder &&
          invalidValue !== "" &&
          <option
            key={`${value}-invalid-${Math.random()}`}
            value={
              (
                (typeof invalidValue === "undefined" || invalidValue === null) ?
                nullPlaceholderValue : false
              ) ||
              invalidValue ||
              emptyValue
            }
          >
            {String(invalidValue) || emptyValue} [Invalid value]
          </option>
      }
      {
        Array.isArray(invalidValue) &&
        invalidValue.map(singleInvalidValue => {
          return <option
            key={`${singleInvalidValue}-invalid-${Math.random()}`}
            value={(
              (typeof singleInvalidValue === "undefined" || singleInvalidValue === null) ?
              nullPlaceholderValue : false
              ) ||
              singleInvalidValue ||
              defaultPlaceholderValue
            }
          >
            {String(singleInvalidValue) || '[blank]'} [Invalid value]
          </option>;
        })
      }
      {enumOptions.map(({ value, label }, i) => {
        const disabled = enumDisabled && enumDisabled.indexOf(value) != -1;

        return (
          // Don't re-render an option that is
          // identical to the placeholder above:
          value !== placeholder &&
          value !== "" &&
          <option key={i} value={
            (
              (typeof value === "undefined" || value === null) ?
              nullPlaceholderValue : false
            ) ||
            value ||
            emptyValue
          }
          disabled={disabled}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

SelectWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== 'production') {
  SelectWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    multiple: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
  };
}

export default SelectWidget;

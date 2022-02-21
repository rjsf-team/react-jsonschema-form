/* eslint-disable react/prop-types,react/no-array-index-key */
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import TitleField from "../TitleField";

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
  const {
    id,
    disabled,
    options,
    value,
    autofocus,
    readonly,
    onChange,
    onBlur,
    onFocus,
    formContext,
    schema,
    uiSchema,
  } = props;
  const { enumOptions, enumDisabled, inline } = options;
  const { title } = schema;
  const semanticProps = getSemanticProps({
    options,
    formContext,
    schema,
    uiSchema,
    defaultSchemaProps: {
      inverted: false,
    },
   });
  const _onChange = option => ({ target: { checked } }) => {
    // eslint-disable-next-line no-shadow
    const all = enumOptions.map(({ value }) => value);
    if (checked) {
      onChange(selectValue(option.value, value, all));
    } else {
      onChange(deselectValue(option.value, value));
    }
  };

  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const inlineOption = inline ? { inline: true } : { grouped: true };
  return (
    <React.Fragment>
      {title && <TitleField title={title} />}
      <Form.Group {...inlineOption}>
        {enumOptions.map((option, index) => {
          const checked = value.indexOf(option.value) !== -1;
          const itemDisabled =
            enumDisabled && enumDisabled.indexOf(option.value) !== -1;
          return (
            <Form.Checkbox
              id={`${id}_${index}`}
              key={`${id}_${index}`}
              label={option.label}
              {...semanticProps}
              checked={checked}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && index === 0}
              onChange={_onChange(option)}
              onBlur={_onBlur}
              onFocus={_onFocus}
            />
          );
        })}
      </Form.Group>
    </React.Fragment>
  );
}
export default CheckboxesWidget;

import React from "react";
import { Form } from "semantic-ui-react";
import { getTemplate, WidgetProps, EnumOptionsType } from "@rjsf/utils";
import { getSemanticProps } from "../util";

function selectValue(
  value: EnumOptionsType["value"],
  selected: any,
  all: any[]
) {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));
  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a: any, b: any) => all.indexOf(a) > all.indexOf(b));
}

function deselectValue(value: EnumOptionsType["value"], selected: any) {
  return selected.filter((v: any) => v !== value);
}

function CheckboxesWidget(props: WidgetProps) {
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
    rawErrors = [],
    registry,
  } = props;
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate">(
    "TitleFieldTemplate",
    registry,
    options
  );
  const { enumOptions, enumDisabled, inline } = options;
  const { title } = schema;
  const semanticProps = getSemanticProps({
    options,
    formContext,
    uiSchema,
    defaultSchemaProps: {
      inverted: false,
    },
  });
  const _onChange =
    (option: EnumOptionsType) =>
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      // eslint-disable-next-line no-shadow
      const all = enumOptions ? enumOptions.map(({ value }) => value) : [];
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
      {title && (
        <TitleFieldTemplate
          id={`${id}-title`}
          title={title}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Form.Group id={id} name={id} {...inlineOption}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const checked = value.indexOf(option.value) !== -1;
            const itemDisabled =
              Array.isArray(enumDisabled) &&
              enumDisabled.indexOf(option.value) !== -1;
            return (
              <Form.Checkbox
                id={`${id}-${option.value}`}
                name={id}
                key={option.value}
                label={option.label}
                {...semanticProps}
                checked={checked}
                error={rawErrors.length > 0}
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

import React from "react";
import { Form } from "semantic-ui-react";
import {
  EnumOptionsType,
  FormContextType,
  getTemplate,
  RJSFSchema,
  enumOptionsDeselectValue,
  enumOptionsSelectValue,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { getSemanticProps } from "../util";

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
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
  const TitleFieldTemplate = getTemplate<"TitleFieldTemplate", T, S, F>(
    "TitleFieldTemplate",
    registry,
    options
  );
  const { enumOptions, enumDisabled, inline } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];
  const { title } = schema;
  const semanticProps = getSemanticProps<T, S, F>({
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
      if (checked) {
        onChange(
          enumOptionsSelectValue<S>(option.value, checkboxesValues, enumOptions)
        );
      } else {
        onChange(enumOptionsDeselectValue<S>(option.value, checkboxesValues));
      }
    };

  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const inlineOption = inline ? { inline: true } : { grouped: true };
  return (
    <>
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
            const checked = checkboxesValues.includes(option.value);
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
    </>
  );
}

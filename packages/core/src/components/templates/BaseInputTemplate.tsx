import { getInputProps, WidgetProps } from "@rjsf/utils";

/** The `BaseInputTemplate` is the template to use to render the basic `<input>` component for the `core` theme.
 * It is used as the template for rendering many of the <input> based widgets that differ by `type` and callbacks only.
 * It can be customized/overridden for other themes or individual implementations as needed.
 *
 * @param props - The `WidgetProps` for this template
 */
export default function BaseInputTemplate<T = any, F = any>(
  props: WidgetProps<T, F>
) {
  const {
    id,
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    options,
    schema,
    uiSchema,
    formContext,
    registry,
    rawErrors,
    type,
    ...rest
  } = props;

  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  if (!id) {
    console.log("No id for", props);
    throw new Error(`no id for props ${JSON.stringify(props)}`);
  }
  const inputProps = { ...rest, ...getInputProps(schema, type, options) };

  let inputValue;
  if (inputProps.type === "number" || inputProps.type === "integer") {
    inputValue = value || value === 0 ? value : "";
  } else {
    inputValue = value == null ? "" : value;
  }

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <>
      <input
        key={id}
        id={id}
        className="form-control"
        readOnly={readonly}
        disabled={disabled}
        autoFocus={autofocus}
        value={inputValue}
        {...inputProps}
        list={schema.examples ? `examples_${id}` : undefined}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      {Array.isArray(schema.examples) && (
        <datalist key={`datalist_${id}`} id={`examples_${id}`}>
          {[
            ...new Set(
              schema.examples.concat(schema.default ? [schema.default] : [])
            ),
          ].map((example: any) => (
            <option key={example} value={example} />
          ))}
        </datalist>
      )}
    </>
  );
}

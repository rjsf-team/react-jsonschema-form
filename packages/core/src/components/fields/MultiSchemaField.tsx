import React, { Component } from "react";
import {
  getUiOptions,
  getWidget,
  guessType,
  deepEquals,
  FieldProps,
  RJSFSchema,
} from "@rjsf/utils";
import unset from "lodash/unset";

/** Type used for the state of the `AnyOfField` component */
type AnyOfFieldState = {
  /** The currently selected option */
  selectedOption: number;
};

/** The `AnyOfField` component is used to render a field in the schema that is an `anyOf`, `allOf` or `oneOf`. It tracks
 * the currently selected option and cleans up any irrelevant data in `formData`.
 *
 * @param props - The `FieldProps` for this template
 */
class AnyOfField<T = any, F = any> extends Component<
  FieldProps<T, F>,
  AnyOfFieldState
> {
  /** Constructs an `AnyOfField` with the given `props` to initialize the initially selected option in state
   *
   * @param props - The `FieldProps` for this template
   */
  constructor(props: FieldProps<T, F>) {
    super(props);

    const { formData, options } = this.props;

    this.state = {
      selectedOption: this.getMatchingOption(0, formData, options),
    };
  }

  /** React lifecycle methos that is called when the props and/or state for this component is updated. It recomputes the
   * currently selected option based on the overall `formData`
   *
   * @param prevProps - The previous `FieldProps` for this template
   * @param prevState - The previous `AnyOfFieldState` for this template
   */
  componentDidUpdate(
    prevProps: Readonly<FieldProps<T, F>>,
    prevState: Readonly<AnyOfFieldState>
  ) {
    const { formData, options, idSchema } = this.props;
    const { selectedOption } = this.state;
    if (
      !deepEquals(formData, prevProps.formData) &&
      idSchema.$id === prevProps.idSchema.$id
    ) {
      const matchingOption = this.getMatchingOption(
        selectedOption,
        formData,
        options
      );

      if (!prevState || matchingOption === selectedOption) {
        return;
      }

      this.setState({
        selectedOption: matchingOption,
      });
    }
  }

  /** Determines the best matching option for the given `formData` and `options`.
   *
   * @param formData - The new formData
   * @param options - The list of options to choose from
   * @return - The index of the `option` that best matches the `formData`
   */
  getMatchingOption(
    selectedOption: number,
    formData: T,
    options: RJSFSchema[]
  ) {
    const { schemaUtils } = this.props.registry;

    const option = schemaUtils.getMatchingOption(formData, options);
    if (option !== 0) {
      return option;
    }
    // If the form data matches none of the options, use the currently selected
    // option, assuming it's available; otherwise use the first option
    return selectedOption || 0;
  }

  /** Callback handler to remember what the currently selected option is. In addition to that the `formData` is updated
   * to remove properties that are not part of the newly selected option schema, and then the updated data is passed to
   * the `onChange` handler.
   *
   * @param option -
   */
  onOptionChange = (option: any) => {
    const selectedOption = parseInt(option, 10);
    const { formData, onChange, options, registry } = this.props;
    const { schemaUtils } = registry;
    const newOption = schemaUtils.retrieveSchema(
      options[selectedOption],
      formData
    );

    // If the new option is of type object and the current data is an object,
    // discard properties added using the old option.
    let newFormData: T | undefined = undefined;
    if (
      guessType(formData) === "object" &&
      (newOption.type === "object" || newOption.properties)
    ) {
      newFormData = Object.assign({}, formData);

      const optionsToDiscard = options.slice();
      optionsToDiscard.splice(selectedOption, 1);

      // Discard any data added using other options
      for (const option of optionsToDiscard) {
        if (option.properties) {
          for (const key in option.properties) {
            if (key in newFormData) {
              unset(newFormData, key);
            }
          }
        }
      }
    }
    // Call getDefaultFormState to make sure defaults are populated on change.
    onChange(
      schemaUtils.getDefaultFormState(options[selectedOption], newFormData) as T
    );

    this.setState({
      selectedOption: parseInt(option, 10),
    });
  };

  /** Renders the `AnyOfField` selector along with a `SchemaField` for the value of the `formData`
   */
  render() {
    const {
      name,
      baseType,
      disabled = false,
      readonly = false,
      hideError = false,
      errorSchema = {},
      formData,
      formContext,
      idPrefix,
      idSeparator,
      idSchema,
      onBlur,
      onChange,
      onFocus,
      options,
      registry,
      uiSchema,
      schema,
    } = this.props;

    const { widgets, fields } = registry;
    const { SchemaField: _SchemaField } = fields;
    const { selectedOption } = this.state;
    const { widget = "select", ...uiOptions } = getUiOptions<T, F>(uiSchema);
    const Widget = getWidget<T, F>({ type: "number" }, widget, widgets);

    const option = options[selectedOption] || null;
    let optionSchema;

    if (option) {
      // If the subschema doesn't declare a type, infer the type from the
      // parent schema
      optionSchema = option.type
        ? option
        : Object.assign({}, option, { type: baseType });
    }

    const enumOptions = options.map((option: RJSFSchema, index: number) => ({
      label: option.title || `Option ${index + 1}`,
      value: index,
    }));

    return (
      <div className="panel panel-default panel-body">
        <div className="form-group">
          <Widget
            id={`${idSchema.$id}${
              schema.oneOf ? "__oneof_select" : "__anyof_select"
            }`}
            schema={{ type: "number", default: 0 }}
            onChange={this.onOptionChange}
            onBlur={onBlur}
            onFocus={onFocus}
            value={selectedOption}
            options={{ enumOptions }}
            registry={registry}
            formContext={formContext}
            {...uiOptions}
            label=""
          />
        </div>
        {option !== null && (
          <_SchemaField
            name={name}
            schema={optionSchema}
            uiSchema={uiSchema}
            errorSchema={errorSchema}
            idSchema={idSchema}
            idPrefix={idPrefix}
            idSeparator={idSeparator}
            formData={formData}
            formContext={formContext}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            registry={registry}
            disabled={disabled}
            readonly={readonly}
            hideError={hideError}
          />
        )}
      </div>
    );
  }
}

export default AnyOfField;

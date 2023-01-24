import React, { Component } from "react";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import {
  getUiOptions,
  getWidget,
  deepEquals,
  FieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  ERRORS_KEY,
} from "@rjsf/utils";

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
class AnyOfField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> extends Component<FieldProps<T, S, F>, AnyOfFieldState> {
  /** Constructs an `AnyOfField` with the given `props` to initialize the initially selected option in state
   *
   * @param props - The `FieldProps` for this template
   */
  constructor(props: FieldProps<T, S, F>) {
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
    prevProps: Readonly<FieldProps<T, S, F>>,
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
    formData: T | undefined,
    options: S[]
  ) {
    const { schemaUtils } = this.props.registry;

    const option = schemaUtils.getClosestMatchingOption(
      formData,
      options,
      selectedOption
    );
    if (option > 0) {
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
  onOptionChange = (option?: string) => {
    const { selectedOption } = this.state;
    const { formData, onChange, options, registry } = this.props;
    const { schemaUtils } = registry;
    const intOption = option !== undefined ? parseInt(option, 10) : -1;
    if (intOption === selectedOption) {
      return;
    }
    const newOption =
      intOption >= 0
        ? schemaUtils.retrieveSchema(options[intOption], formData)
        : undefined;
    const oldOption =
      selectedOption >= 0
        ? schemaUtils.retrieveSchema(options[selectedOption], formData)
        : undefined;

    let newFormData = schemaUtils.sanitizeDataForNewSchema(
      newOption,
      oldOption,
      formData
    );
    if (newFormData && newOption) {
      // Call getDefaultFormState to make sure defaults are populated on change. Pass "excludeObjectChildren"
      // so that only the root objects themselves are created without adding undefined children properties
      newFormData = schemaUtils.getDefaultFormState(
        newOption,
        newFormData,
        "excludeObjectChildren"
      ) as T;
    }
    onChange(newFormData, undefined, this.getFieldId());

    this.setState({ selectedOption: intOption });
  };

  getFieldId() {
    const { idSchema, schema } = this.props;
    return `${idSchema.$id}${
      schema.oneOf ? "__oneof_select" : "__anyof_select"
    }`;
  }

  /** Renders the `AnyOfField` selector along with a `SchemaField` for the value of the `formData`
   */
  render() {
    const {
      baseType,
      disabled = false,
      errorSchema = {},
      formContext,
      onBlur,
      onFocus,
      options,
      registry,
      uiSchema,
    } = this.props;

    const { widgets, fields } = registry;
    const { SchemaField: _SchemaField } = fields;
    const { selectedOption } = this.state;
    const {
      widget = "select",
      placeholder,
      autofocus,
      autocomplete,
      ...uiOptions
    } = getUiOptions<T, S, F>(uiSchema);
    const Widget = getWidget<T, S, F>({ type: "number" }, widget, widgets);
    const rawErrors = get(errorSchema, ERRORS_KEY, []);
    const fieldErrorSchema = omit(errorSchema, [ERRORS_KEY]);

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
            id={this.getFieldId()}
            schema={{ type: "number", default: 0 } as S}
            onChange={this.onOptionChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled || isEmpty(enumOptions)}
            multiple={false}
            rawErrors={rawErrors}
            errorSchema={fieldErrorSchema}
            value={selectedOption}
            options={{ enumOptions, ...uiOptions }}
            registry={registry}
            formContext={formContext}
            placeholder={placeholder}
            autocomplete={autocomplete}
            autofocus={autofocus}
            label=""
          />
        </div>
        {option !== null && (
          <_SchemaField {...this.props} schema={optionSchema} />
        )}
      </div>
    );
  }
}

export default AnyOfField;

import React, { Component } from "react";
import PropTypes from "prop-types";
import * as types from "../../types";
import {
  getUiOptions,
  getWidget,
  guessType,
  retrieveSchema,
  getDefaultFormState,
  mergeDefaultsWithFormData,
  getMatchingOption,
  deepEquals,
} from "../../utils";

class AnyOfField extends Component {
  constructor(props) {
    super(props);

    const { formData, options } = this.props;

    this.state = {
      selectedOption: this.getMatchingOption(formData, options),
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !deepEquals(this.props.formData, prevProps.formData) &&
      this.props.idSchema.$id === prevProps.idSchema.$id
    ) {
      const matchingOption = this.getMatchingOption(
        this.props.formData,
        this.props.options
      );

      if (!prevState || matchingOption === this.state.selectedOption) {
        return;
      }

      this.setState({
        selectedOption: matchingOption,
      });
    }
  }

  getMatchingOption(formData, options) {
    const { rootSchema } = this.props.registry;

    let option = getMatchingOption(formData, options, rootSchema);
    if (option !== 0) {
      return option;
    }
    // If the form data matches none of the options, use the currently selected
    // option, assuming it's available; otherwise use the first option
    return this && this.state ? this.state.selectedOption : 0;
  }

  onOptionChange = option => {
    const selectedOption = parseInt(option, 10);
    const { formData, onChange, options, registry } = this.props;
    const { rootSchema } = registry;
    const newOption = retrieveSchema(
      options[selectedOption],
      rootSchema,
      formData
    );

    // Populate all the defaults for the newly selected value
    let newFormData = getDefaultFormState(
      options[selectedOption],
      undefined,
      rootSchema
    );

    // If the new option is of type object and the current data is an object,
    // discard properties added using the old option.
    if (
      guessType(formData) === "object" &&
      (newOption.type === "object" || newOption.properties)
    ) {
      let previousOptionFormData = {};

      if (this.state.selectedOption !== selectedOption) {
        const previousOption = options[this.state.selectedOption];
        // get previous options with values cleared out
        previousOptionFormData = getDefaultFormState(
          previousOption,
          undefined,
          rootSchema,
          {
            useUndefinedDefaults: true,
          }
        );
        // clear out previous option form data; retain defaults from new option
        newFormData = mergeDefaultsWithFormData(
          previousOptionFormData,
          newFormData
        );
      }
      // preserve any extra form data that was not in previous or current option
      newFormData = mergeDefaultsWithFormData(formData, newFormData);
    }
    onChange(newFormData);

    this.setState({
      selectedOption: parseInt(option, 10),
    });
  };

  render() {
    const {
      baseType,
      disabled,
      errorSchema,
      formData,
      idPrefix,
      idSchema,
      onBlur,
      onChange,
      onFocus,
      options,
      registry,
      uiSchema,
      schema,
    } = this.props;

    const _SchemaField = registry.fields.SchemaField;
    const { widgets } = registry;
    const { selectedOption } = this.state;
    const { widget = "select", ...uiOptions } = getUiOptions(uiSchema);
    const Widget = getWidget({ type: "number" }, widget, widgets);

    const option = options[selectedOption] || null;
    let optionSchema;

    if (option) {
      // If the subschema doesn't declare a type, infer the type from the
      // parent schema
      optionSchema = option.type
        ? option
        : Object.assign({}, option, { type: baseType });
    }

    const enumOptions = options.map((option, index) => ({
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
            {...uiOptions}
          />
        </div>

        {option !== null && (
          <_SchemaField
            schema={optionSchema}
            uiSchema={uiSchema}
            errorSchema={errorSchema}
            idSchema={idSchema}
            idPrefix={idPrefix}
            formData={formData}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            registry={registry}
            disabled={disabled}
          />
        )}
      </div>
    );
  }
}

AnyOfField.defaultProps = {
  disabled: false,
  errorSchema: {},
  idSchema: {},
  uiSchema: {},
};

if (process.env.NODE_ENV !== "production") {
  AnyOfField.propTypes = {
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    baseType: PropTypes.string,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: types.registry.isRequired,
  };
}

export default AnyOfField;

import React, { Component } from "react";
import PropTypes from "prop-types";
import * as types from "../../types";
import { guessType } from "../../utils";
import { isValid } from "../../validate";

class AnyOfField extends Component {
  constructor(props) {
    super(props);

    const { formData, options } = this.props;

    this.state = {
      selectedOption: this.getMatchingOption(formData, options),
    };
  }

  componentWillReceiveProps(nextProps) {
    const matchingOption = this.getMatchingOption(
      nextProps.formData,
      nextProps.options
    );

    if (matchingOption === this.state.selectedOption) {
      return;
    }

    this.setState({ selectedOption: matchingOption });
  }

  getMatchingOption(formData, options) {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      // If the schema describes an object then we need to add slightly more
      // strict matching to the schema, because unless the schema uses the
      // "requires" keyword, an object will match the schema as long as it
      // doesn't have matching keys with a conflicting type. To do this we use an
      // "anyOf" with an array of requires. This augmentation expresses that the
      // schema should match if any of the keys in the schema are present on the
      // object and pass validation.
      if (option.properties) {
        // Create an "anyOf" schema that requires at least one of the keys in the
        // "properties" object
        const requiresAnyOf = {
          anyOf: Object.keys(option.properties).map(key => ({
            required: [key],
          })),
        };

        let augmentedSchema;

        // If the "anyOf" keyword already exists, wrap the augmentation in an "allOf"
        if (option.anyOf) {
          // Create a shallow clone of the option
          const { ...shallowClone } = option;

          if (!shallowClone.allOf) {
            shallowClone.allOf = [];
          } else {
            // If "allOf" already exists, shallow clone the array
            shallowClone.allOf = shallowClone.allOf.slice();
          }

          shallowClone.allOf.push(requiresAnyOf);

          augmentedSchema = shallowClone;
        } else {
          augmentedSchema = Object.assign({}, option, requiresAnyOf);
        }

        // Remove the "required" field as it's likely that not all fields have
        // been filled in yet, which will mean that the schema is not valid
        delete augmentedSchema.required;

        if (isValid(augmentedSchema, formData)) {
          return i;
        }
      } else if (isValid(options[i], formData)) {
        return i;
      }
    }

    // If the form data matches none of the options, use the first option
    return 0;
  }

  onOptionChange = event => {
    const selectedOption = parseInt(event.target.value, 10);
    const { formData, onChange, options } = this.props;

    const newOption = options[selectedOption];

    // If the new option is of type object and the current data is an object,
    // discard properties added using the old option.
    if (
      guessType(formData) === "object" &&
      (newOption.type === "object" || newOption.properties)
    ) {
      const newFormData = Object.assign({}, formData);

      const optionsToDiscard = options.slice();
      optionsToDiscard.splice(selectedOption, 1);

      // Discard any data added using other options
      for (const option of optionsToDiscard) {
        if (option.properties) {
          for (const key in option.properties) {
            if (newFormData.hasOwnProperty(key)) {
              delete newFormData[key];
            }
          }
        }
      }

      onChange(newFormData);
    } else {
      onChange(undefined);
    }

    this.setState({
      selectedOption: parseInt(event.target.value, 10),
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
      safeRenderCompletion,
      uiSchema,
    } = this.props;

    const _SchemaField = registry.fields.SchemaField;
    const { selectedOption } = this.state;

    const option = options[selectedOption] || null;
    let optionSchema;

    if (option) {
      // If the subschema doesn't declare a type, infer the type from the
      // parent schema
      optionSchema = option.type
        ? option
        : Object.assign({}, option, { type: baseType });
    }

    return (
      <div className="panel panel-default panel-body">
        <div className="form-group">
          <select
            className="form-control"
            onChange={this.onOptionChange}
            value={selectedOption}
            id={`${idSchema.$id}_anyof_select`}>
            {options.map((option, index) => {
              return (
                <option key={index} value={index}>
                  {option.title || `Option ${index + 1}`}
                </option>
              );
            })}
          </select>
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
            safeRenderCompletion={safeRenderCompletion}
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

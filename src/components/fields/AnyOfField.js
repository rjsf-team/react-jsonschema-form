import React, { Component } from "react";
import PropTypes from "prop-types";
import { guessType } from "../../utils";

class AnyOfField extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedOption: 0,
    };
  }

  onOptionChange = event => {
    const selectedOption = parseInt(event.target.value, 10);
    const { formData, onChange, schema } = this.props;
    const options = schema.anyOf;

    if (guessType(formData) === "object") {
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
      disabled,
      errorSchema,
      formData,
      idPrefix,
      idSchema,
      onBlur,
      onChange,
      onFocus,
      schema,
      registry,
      safeRenderCompletion,
      uiSchema,
    } = this.props;
    const _SchemaField = registry.fields.SchemaField;
    const { selectedOption } = this.state;

    const baseType = schema.type;
    const options = schema.anyOf || [];

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

        {options.map((option, index) => {
          if (index !== selectedOption) {
            return null;
          }

          // If the subschema doesn't declare a type, infer the type from the
          // parent schema
          const optionSchema = option.type
            ? option
            : Object.assign({}, option, { type: baseType });

          return (
            <_SchemaField
              key={index}
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
          );
        })}
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
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      ArrayFieldTemplate: PropTypes.func,
      ObjectFieldTemplate: PropTypes.func,
      FieldTemplate: PropTypes.func,
      formContext: PropTypes.object.isRequired,
    }),
  };
}

export default AnyOfField;

import React, { Component } from "react";
import {
  getTemplate,
  getUiOptions,
  orderProperties,
  ErrorSchema,
  FieldProps,
  GenericObjectType,
  IdSchema,
  RJSFSchema,
  ADDITIONAL_PROPERTY_FLAG,
  PROPERTIES_KEY,
  REF_KEY,
} from "@rjsf/utils";
import get from "lodash/get";
import has from "lodash/has";
import isObject from "lodash/isObject";
import set from "lodash/set";
import unset from "lodash/unset";

/** Type used for the state of the `ObjectField` component */
type ObjectFieldState = {
  /** Flag indicating whether an additional property key was modified */
  wasPropertyKeyModified: boolean;
  /** The set of additional properties */
  additionalProperties: object;
};

/** The `ObjectField` component is used to render a field in the schema that is of type `object`. It tracks whether an
 * additional property key was modified and what it was modified to
 *
 * @param props - The `FieldProps` for this template
 */
class ObjectField<T = any, F = any> extends Component<
  FieldProps<T, F>,
  ObjectFieldState
> {
  /** Set up the initial state */
  state = {
    wasPropertyKeyModified: false,
    additionalProperties: {},
  };

  /** Returns a flag indicating whether the `name` field is required in the object schema
   *
   * @param name - The name of the field to check for required-ness
   * @returns - True if the field `name` is required, false otherwise
   */
  isRequired(name: string) {
    const { schema } = this.props;
    return (
      Array.isArray(schema.required) && schema.required.indexOf(name) !== -1
    );
  }

  /** Returns the `onPropertyChange` handler for the `name` field. Handles the special case where a user is attempting
   * to clear the data for a field added as an additional property. Calls the `onChange()` handler with the updated
   * formData.
   *
   * @param name - The name of the property
   * @param addedByAdditionalProperties - Flag indicating whether this property is an additional property
   * @returns - The onPropertyChange callback for the `name` property
   */
  onPropertyChange = (name: string, addedByAdditionalProperties = false) => {
    return (value: T, newErrorSchema?: ErrorSchema<T>) => {
      const { formData, onChange, errorSchema } = this.props;
      if (value === undefined && addedByAdditionalProperties) {
        // Don't set value = undefined for fields added by
        // additionalProperties. Doing so removes them from the
        // formData, which causes them to completely disappear
        // (including the input field for the property name). Unlike
        // fields which are "mandated" by the schema, these fields can
        // be set to undefined by clicking a "delete field" button, so
        // set empty values to the empty string.
        value = "" as unknown as T;
      }
      const newFormData = { ...formData, [name]: value };
      onChange(
        newFormData,
        errorSchema &&
          errorSchema && {
            ...errorSchema,
            [name]: newErrorSchema,
          }
      );
    };
  };

  /** Returns a callback to handle the onDropPropertyClick event for the given `key` which removes the old `key` data
   * and calls the `onChange` callback with it
   *
   * @param key - The key for which the drop callback is desired
   * @returns - The drop property click callback
   */
  onDropPropertyClick = (key: string) => {
    return (event: DragEvent) => {
      event.preventDefault();
      const { onChange, formData } = this.props;
      const copiedFormData = { ...formData };
      unset(copiedFormData, key);
      onChange(copiedFormData);
    };
  };

  /** Computes the next available key name from the `preferredKey`, indexing through the already existing keys until one
   * that is already not assigned is found.
   *
   * @param preferredKey - The preferred name of a new key
   * @param formData - The form data in which to check if the desired key already exists
   * @returns - The name of the next available key from `preferredKey`
   */
  getAvailableKey = (preferredKey: string, formData: T) => {
    const { uiSchema } = this.props;
    const { duplicateKeySuffixSeparator = "-" } = getUiOptions<T, F>(uiSchema);

    let index = 0;
    let newKey = preferredKey;
    while (newKey in formData) {
      newKey = `${preferredKey}${duplicateKeySuffixSeparator}${++index}`;
    }
    return newKey;
  };

  /** Returns a callback function that deals with the rename of a key for an additional property for a schema. That
   * callback will attempt to rename the key and move the existing data to that key, calling `onChange` when it does.
   *
   * @param oldValue - The old value of a field
   * @returns - The key change callback function
   */
  onKeyChange = (oldValue: any) => {
    return (value: any, newErrorSchema: ErrorSchema<T>) => {
      if (oldValue === value) {
        return;
      }
      const { formData, onChange, errorSchema } = this.props;

      value = this.getAvailableKey(value, formData);
      const newFormData: GenericObjectType = {
        ...(formData as GenericObjectType),
      };
      const newKeys: GenericObjectType = { [oldValue]: value };
      const keyValues = Object.keys(newFormData).map((key) => {
        const newKey = newKeys[key] || key;
        return { [newKey]: newFormData[key] };
      });
      const renamedObj = Object.assign({}, ...keyValues);

      this.setState({ wasPropertyKeyModified: true });

      onChange(
        renamedObj,
        errorSchema &&
          errorSchema && {
            ...errorSchema,
            [value]: newErrorSchema,
          }
      );
    };
  };

  /** Returns a default value to be used for a new additional schema property of the given `type`
   *
   * @param type - The type of the new additional schema property
   */
  getDefaultValue(type?: RJSFSchema["type"]) {
    switch (type) {
      case "string":
        return "New Value";
      case "array":
        return [];
      case "boolean":
        return false;
      case "null":
        return null;
      case "number":
        return 0;
      case "object":
        return {};
      default:
        // We don't have a datatype for some reason (perhaps additionalProperties was true)
        return "New Value";
    }
  }

  /** Handles the adding of a new additional property on the given `schema`. Calls the `onChange` callback once the new
   * default data for that field has been added to the formData.
   *
   * @param schema - The schema element to which the new property is being added
   */
  handleAddClick = (schema: RJSFSchema) => () => {
    if (!isObject(schema.additionalProperties)) {
      return;
    }
    const { formData, onChange, registry } = this.props;
    let type = schema.additionalProperties.type;
    const newFormData = { ...formData };

    if (REF_KEY in schema.additionalProperties) {
      const { schemaUtils } = registry;
      const refSchema = schemaUtils.retrieveSchema(
        { $ref: schema.additionalProperties[REF_KEY] },
        formData
      );

      type = refSchema.type;
    }

    const newKey = this.getAvailableKey("newKey", newFormData);
    // Cast this to make the `set` work properly
    set(newFormData as GenericObjectType, newKey, this.getDefaultValue(type));

    onChange(newFormData);
  };

  /** Renders the `ObjectField` from the given props
   */
  render() {
    const {
      schema: rawSchema,
      uiSchema = {},
      formData,
      errorSchema,
      idSchema,
      name,
      required = false,
      disabled = false,
      readonly = false,
      hideError,
      idPrefix,
      idSeparator,
      onBlur,
      onFocus,
      registry,
    } = this.props;

    const { fields, formContext, schemaUtils } = registry;
    const { SchemaField } = fields;
    const schema = schemaUtils.retrieveSchema(rawSchema, formData);
    const uiOptions = getUiOptions<T, F>(uiSchema);
    const { properties: schemaProperties = {} } = schema;

    const title = schema.title === undefined ? name : schema.title;
    const description = uiOptions.description || schema.description;
    let orderedProperties: string[];
    try {
      const properties = Object.keys(schemaProperties);
      orderedProperties = orderProperties(properties, uiOptions.order);
    } catch (err) {
      return (
        <div>
          <p className="config-error" style={{ color: "red" }}>
            Invalid {name || "root"} object field configuration:
            <em>{(err as Error).message}</em>.
          </p>
          <pre>{JSON.stringify(schema)}</pre>
        </div>
      );
    }

    const Template = getTemplate<"ObjectFieldTemplate", T, F>(
      "ObjectFieldTemplate",
      registry,
      uiOptions
    );

    const templateProps = {
      title: uiOptions.title || title,
      description,
      properties: orderedProperties.map((name) => {
        const addedByAdditionalProperties = has(schema, [
          PROPERTIES_KEY,
          name,
          ADDITIONAL_PROPERTY_FLAG,
        ]);
        const fieldUiSchema = addedByAdditionalProperties
          ? uiSchema.additionalProperties
          : uiSchema[name];
        const hidden = getUiOptions<T, F>(fieldUiSchema).widget === "hidden";
        const fieldIdSchema: IdSchema<T> = get(idSchema, [name], {});

        return {
          content: (
            <SchemaField
              key={name}
              name={name}
              required={this.isRequired(name)}
              schema={get(schema, [PROPERTIES_KEY, name], {})}
              uiSchema={fieldUiSchema}
              errorSchema={get(errorSchema, name)}
              idSchema={fieldIdSchema}
              idPrefix={idPrefix}
              idSeparator={idSeparator}
              formData={get(formData, name)}
              formContext={formContext}
              wasPropertyKeyModified={this.state.wasPropertyKeyModified}
              onKeyChange={this.onKeyChange(name)}
              onChange={this.onPropertyChange(
                name,
                addedByAdditionalProperties
              )}
              onBlur={onBlur}
              onFocus={onFocus}
              registry={registry}
              disabled={disabled}
              readonly={readonly}
              hideError={hideError}
              onDropPropertyClick={this.onDropPropertyClick}
            />
          ),
          name,
          readonly,
          disabled,
          required,
          hidden,
        };
      }),
      readonly,
      disabled,
      required,
      idSchema,
      uiSchema,
      schema,
      formData,
      formContext,
      registry,
    };
    return <Template {...templateProps} onAddClick={this.handleAddClick} />;
  }
}

export default ObjectField;

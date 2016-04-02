import React, { Component, PropTypes } from "react";

import SchemaField from "./fields/SchemaField";
import TitleField from "./fields/TitleField";
import {
  toIdSchema
} from "../utils";


export default class FieldSet extends Component {
  static defaultProps = {
    uiSchema: {},
    errorSchema: {}
  }

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const _SchemaField = this.props.SchemaField || SchemaField;
    const _TitleField = this.props.TitleField || TitleField;
    const fields = Object.assign({
      SchemaField: _SchemaField,
      TitleField: _TitleField,
    }, this.props.fields);
    return {
      fields,
      widgets: this.props.widgets || {},
      definitions: this.props.schema.definitions || {},
    };
  }

  render() {
    const {schema, uiSchema, formData, errorSchema, onChange} = this.props;
    const {definitions} = schema;
    const idSchema = toIdSchema(schema, uiSchema["ui:rootFieldId"], definitions);

    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;
    return (
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          formData={formData}
          onChange={onChange}
          registry={registry}/>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  FieldSet.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    TitleField: React.PropTypes.element,
    SchemaField: React.PropTypes.element,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    widgets: PropTypes.objectOf(PropTypes.func),
    fields: PropTypes.objectOf(PropTypes.func),
    onChange: PropTypes.func
  };
}

export default FieldSet;

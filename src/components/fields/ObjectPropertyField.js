import React, { Component, PropTypes } from "react";

import { getDefaultRegistry } from "../../utils";

class ObjectPropertyField extends Component {
  static defaultProps = {
    uiSchema: {},
    errorSchema: {},
    idSchema: {},
    registry: getDefaultRegistry(),
    disabled: false,
    readonly: false,
    autofocus: false,
    isDefault: true,
  };

  constructor(props) {
    super(props);
    this.state = { present: props.required || !props.isDefault };
  }

  show = event => {
    event.preventDefault();
    this.setState({ present: true });
  };

  hide = event => {
    event.preventDefault();
    this.setState({ present: false });
  };

  render() {
    const title = this.props.schema.title === undefined
      ? this.props.name
      : this.props.schema.title;

    if (this.state.present) {
      const SchemaField = this.props.registry.fields.SchemaField;
      const { isDefault, ...props } = this.props;
      return (
        <div>
          <SchemaField {...props} />
          {this.props.required ||
            <button onClick={this.hide}>REMOVE {title}</button>}
        </div>
      );
    } else {
      return <button onClick={this.show}>ADD {title}</button>;
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  ObjectPropertyField.propTypes = {
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
      FieldTemplate: PropTypes.func,
      formContext: PropTypes.object.isRequired,
    }),
    isDefault: PropTypes.bool,
  };
}

export default ObjectPropertyField;

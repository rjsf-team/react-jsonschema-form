"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function DescriptionField(props) {
  var id = props.id,
      description = props.description;

  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return _react2.default.createElement("div", null);
  }
  if (typeof description === "string") {
    return _react2.default.createElement(
      "p",
      { id: id, className: "field-description" },
      description
    );
  } else {
    return _react2.default.createElement(
      "div",
      { id: id, className: "field-description" },
      description
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  DescriptionField.propTypes = {
    id: _react.PropTypes.string,
    description: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.element])
  };
}

exports.default = DescriptionField;
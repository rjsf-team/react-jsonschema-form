"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _ArrayField = _interopRequireDefault(require("./ArrayField"));

var _BooleanField = _interopRequireDefault(require("./BooleanField"));

var _DescriptionField = _interopRequireDefault(require("./DescriptionField"));

var _MultiSchemaField = _interopRequireDefault(require("./MultiSchemaField"));

var _NumberField = _interopRequireDefault(require("./NumberField"));

var _ObjectField = _interopRequireDefault(require("./ObjectField"));

var _SchemaField = _interopRequireDefault(require("./SchemaField"));

var _StringField = _interopRequireDefault(require("./StringField"));

var _TitleField = _interopRequireDefault(require("./TitleField"));

var _NullField = _interopRequireDefault(require("./NullField"));

var _UnsupportedField = _interopRequireDefault(require("./UnsupportedField"));

var _default = {
  AnyOfField: _MultiSchemaField["default"],
  ArrayField: _ArrayField["default"],
  BooleanField: _BooleanField["default"],
  DescriptionField: _DescriptionField["default"],
  NumberField: _NumberField["default"],
  ObjectField: _ObjectField["default"],
  OneOfField: _MultiSchemaField["default"],
  SchemaField: _SchemaField["default"],
  StringField: _StringField["default"],
  TitleField: _TitleField["default"],
  NullField: _NullField["default"],
  UnsupportedField: _UnsupportedField["default"]
};
exports["default"] = _default;
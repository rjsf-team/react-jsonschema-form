'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ErrorList = require('./ErrorList');

var _ErrorList2 = _interopRequireDefault(_ErrorList);

var _utils = require('../utils');

var _validate = require('../validate');

var _validate2 = _interopRequireDefault(_validate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Form = function (_Component) {
  _inherits(Form, _Component);

  function Form(props) {
    _classCallCheck(this, Form);

    var _this = _possibleConstructorReturn(this, (Form.__proto__ || Object.getPrototypeOf(Form)).call(this, props));

    _this.onChange = function (formData) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { validate: false };

      var mustValidate = !_this.props.noValidate && (_this.props.liveValidate || options.validate);
      var state = { status: "editing", formData: formData };
      if (mustValidate) {
        var _this$validate = _this.validate(formData),
            errors = _this$validate.errors,
            errorSchema = _this$validate.errorSchema;

        state = _extends({}, state, { errors: errors, errorSchema: errorSchema });
      }
      (0, _utils.setState)(_this, state, function () {
        if (_this.props.onChange) {
          _this.props.onChange(_this.state);
        }
      });
    };

    _this.onBlur = function () {
      if (_this.props.onBlur) {
        _this.props.onBlur(_this.state);
      }
    };

    _this.onSubmit = function (event) {
      event.preventDefault();
      _this.setState({ status: "submitted" });

      if (!_this.props.noValidate) {
        var _ret = function () {
          var _this$validate2 = _this.validate(_this.state.formData),
              errors = _this$validate2.errors,
              errorSchema = _this$validate2.errorSchema;

          if (Object.keys(errors).length > 0) {
            (0, _utils.setState)(_this, { errors: errors, errorSchema: errorSchema }, function () {
              if (_this.props.onError) {
                _this.props.onError(errors);
              } else {
                console.error("Form validation failed", errors);
              }
            });
            return {
              v: void 0
            };
          }
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }

      if (_this.props.onSubmit) {
        _this.props.onSubmit(_this.state);
      }
      _this.setState({ status: "initial", errors: [], errorSchema: {} });
    };

    _this.state = _this.getStateFromProps(props);
    return _this;
  }

  _createClass(Form, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.setState(this.getStateFromProps(nextProps));
    }
  }, {
    key: 'getStateFromProps',
    value: function getStateFromProps(props) {
      var state = this.state || {};
      var schema = "schema" in props ? props.schema : this.props.schema;
      var uiSchema = "uiSchema" in props ? props.uiSchema : this.props.uiSchema;
      var edit = typeof props.formData !== "undefined";
      var liveValidate = props.liveValidate || this.props.liveValidate;
      var mustValidate = edit && !props.noValidate && liveValidate;
      var definitions = schema.definitions;

      var formData = (0, _utils.getDefaultFormState)(schema, props.formData, definitions);

      var _ref = mustValidate ? this.validate(formData, schema) : {
        errors: state.errors || [],
        errorSchema: state.errorSchema || {}
      },
          errors = _ref.errors,
          errorSchema = _ref.errorSchema;

      var idSchema = (0, _utils.toIdSchema)(schema, uiSchema["ui:rootFieldId"], definitions);
      return {
        status: "initial",
        schema: schema,
        uiSchema: uiSchema,
        idSchema: idSchema,
        formData: formData,
        edit: edit,
        errors: errors,
        errorSchema: errorSchema
      };
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      return (0, _utils.shouldRender)(this, nextProps, nextState);
    }
  }, {
    key: 'validate',
    value: function validate(formData, schema) {
      var validate = this.props.validate;

      return (0, _validate2.default)(formData, schema || this.props.schema, validate);
    }
  }, {
    key: 'renderErrors',
    value: function renderErrors() {
      var _state = this.state,
          status = _state.status,
          errors = _state.errors;
      var showErrorList = this.props.showErrorList;


      if (status !== "editing" && errors.length && showErrorList != false) {
        return _react2.default.createElement(_ErrorList2.default, { errors: errors });
      }
      return null;
    }
  }, {
    key: 'getRegistry',
    value: function getRegistry() {
      // For BC, accept passed SchemaField and TitleField props and pass them to
      // the "fields" registry one.
      var _getDefaultRegistry = (0, _utils.getDefaultRegistry)(),
          fields = _getDefaultRegistry.fields,
          widgets = _getDefaultRegistry.widgets;

      return {
        fields: _extends({}, fields, this.props.fields),
        widgets: _extends({}, widgets, this.props.widgets),
        FieldTemplate: this.props.FieldTemplate,
        definitions: this.props.schema.definitions || {},
        formContext: this.props.formContext || {}
      };
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          children = _props.children,
          safeRenderCompletion = _props.safeRenderCompletion,
          id = _props.id,
          className = _props.className,
          name = _props.name,
          method = _props.method,
          target = _props.target,
          action = _props.action,
          autocomplete = _props.autocomplete,
          enctype = _props.enctype,
          acceptcharset = _props.acceptcharset,
          onBlur = _props.onBlur;
      var _state2 = this.state,
          schema = _state2.schema,
          uiSchema = _state2.uiSchema,
          formData = _state2.formData,
          errorSchema = _state2.errorSchema,
          idSchema = _state2.idSchema;

      var registry = this.getRegistry();
      var _SchemaField = registry.fields.SchemaField;

      return _react2.default.createElement(
        'form',
        { className: className ? className : "rjsf",
          id: id,
          name: name,
          method: method,
          target: target,
          action: action,
          autoComplete: autocomplete,
          encType: enctype,
          acceptCharset: acceptcharset,
          onSubmit: this.onSubmit },
        this.renderErrors(),
        _react2.default.createElement(_SchemaField, {
          schema: schema,
          uiSchema: uiSchema,
          errorSchema: errorSchema,
          idSchema: idSchema,
          formData: formData,
          onChange: this.onChange,
          onBlur: onBlur,
          registry: registry,
          safeRenderCompletion: safeRenderCompletion }),
        children ? children : _react2.default.createElement(
          'p',
          null,
          _react2.default.createElement(
            'button',
            { type: 'submit', className: 'btn btn-info' },
            'Submit'
          )
        )
      );
    }
  }]);

  return Form;
}(_react.Component);

Form.defaultProps = {
  uiSchema: {},
  noValidate: false,
  liveValidate: false,
  safeRenderCompletion: false
};
exports.default = Form;


if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    uiSchema: _react.PropTypes.object,
    formData: _react.PropTypes.any,
    widgets: _react.PropTypes.objectOf(_react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.object])),
    fields: _react.PropTypes.objectOf(_react.PropTypes.func),
    FieldTemplate: _react.PropTypes.func,
    onChange: _react.PropTypes.func,
    onBlur: _react.PropTypes.func,
    onError: _react.PropTypes.func,
    showErrorList: _react.PropTypes.bool,
    onSubmit: _react.PropTypes.func,
    id: _react.PropTypes.string,
    className: _react.PropTypes.string,
    name: _react.PropTypes.string,
    method: _react.PropTypes.string,
    target: _react.PropTypes.string,
    action: _react.PropTypes.string,
    autocomplete: _react.PropTypes.string,
    enctype: _react.PropTypes.string,
    acceptcharset: _react.PropTypes.string,
    noValidate: _react.PropTypes.bool,
    liveValidate: _react.PropTypes.bool,
    safeRenderCompletion: _react.PropTypes.bool,
    formContext: _react.PropTypes.object
  };
}
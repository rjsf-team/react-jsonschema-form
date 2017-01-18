"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function ArrayFieldTitle(_ref) {
  var TitleField = _ref.TitleField,
      idSchema = _ref.idSchema,
      title = _ref.title,
      required = _ref.required;

  if (!title) {
    // See #312: Ensure compatibility with old versions of React.
    return _react2.default.createElement("div", null);
  }
  var id = idSchema.$id + "__title";
  return _react2.default.createElement(TitleField, { id: id, title: title, required: required });
}

function ArrayFieldDescription(_ref2) {
  var DescriptionField = _ref2.DescriptionField,
      idSchema = _ref2.idSchema,
      description = _ref2.description;

  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return _react2.default.createElement("div", null);
  }
  var id = idSchema.$id + "__description";
  return _react2.default.createElement(DescriptionField, { id: id, description: description });
}

function IconBtn(props) {
  var _props$type = props.type,
      type = _props$type === undefined ? "default" : _props$type,
      icon = props.icon,
      className = props.className,
      otherProps = _objectWithoutProperties(props, ["type", "icon", "className"]);

  return _react2.default.createElement(
    "button",
    _extends({ type: "button", className: "btn btn-" + type + " " + className }, otherProps),
    _react2.default.createElement("i", { className: "glyphicon glyphicon-" + icon })
  );
}

var ArrayField = function (_Component) {
  _inherits(ArrayField, _Component);

  function ArrayField(props) {
    _classCallCheck(this, ArrayField);

    var _this = _possibleConstructorReturn(this, (ArrayField.__proto__ || Object.getPrototypeOf(ArrayField)).call(this, props));

    _this.onAddClick = function (event) {
      event.preventDefault();
      var items = _this.state.items;
      var _this$props = _this.props,
          schema = _this$props.schema,
          registry = _this$props.registry;
      var definitions = registry.definitions;

      var itemSchema = schema.items;
      if ((0, _utils.isFixedItems)(schema) && (0, _utils.allowAdditionalItems)(schema)) {
        itemSchema = schema.additionalItems;
      }
      _this.asyncSetState({
        items: items.concat([(0, _utils.getDefaultFormState)(itemSchema, undefined, definitions)])
      });
    };

    _this.onDropIndexClick = function (index) {
      return function (event) {
        event.preventDefault();
        _this.asyncSetState({
          items: _this.state.items.filter(function (_, i) {
            return i !== index;
          })
        }, { validate: true }); // refs #195
      };
    };

    _this.onReorderClick = function (index, newIndex) {
      return function (event) {
        event.preventDefault();
        event.target.blur();
        var items = _this.state.items;

        _this.asyncSetState({
          items: items.map(function (item, i) {
            if (i === newIndex) {
              return items[index];
            } else if (i === index) {
              return items[newIndex];
            } else {
              return item;
            }
          })
        }, { validate: true });
      };
    };

    _this.onChangeForIndex = function (index) {
      return function (value) {
        _this.asyncSetState({
          items: _this.state.items.map(function (item, i) {
            return index === i ? value : item;
          })
        });
      };
    };

    _this.onSelectChange = function (value) {
      _this.asyncSetState({ items: value });
    };

    _this.state = _this.getStateFromProps(props);
    return _this;
  }

  _createClass(ArrayField, [{
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(nextProps) {
      this.setState(this.getStateFromProps(nextProps));
    }
  }, {
    key: "getStateFromProps",
    value: function getStateFromProps(props) {
      var formData = Array.isArray(props.formData) ? props.formData : null;
      var definitions = this.props.registry.definitions;

      return {
        items: (0, _utils.getDefaultFormState)(props.schema, formData, definitions) || []
      };
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      return (0, _utils.shouldRender)(this, nextProps, nextState);
    }
  }, {
    key: "isItemRequired",
    value: function isItemRequired(itemsSchema) {
      return itemsSchema.type === "string" && itemsSchema.minLength > 0;
    }
  }, {
    key: "asyncSetState",
    value: function asyncSetState(state) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { validate: false };

      (0, _utils.setState)(this, state, function () {
        _this2.props.onChange(_this2.state.items, options);
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _props = this.props,
          schema = _props.schema,
          uiSchema = _props.uiSchema;

      if ((0, _utils.isFilesArray)(schema, uiSchema)) {
        return this.renderFiles();
      }
      if ((0, _utils.isFixedItems)(schema)) {
        return this.renderFixedArray();
      }
      if ((0, _utils.isMultiSelect)(schema)) {
        return this.renderMultiSelect();
      }
      return this.renderNormalArray();
    }
  }, {
    key: "renderNormalArray",
    value: function renderNormalArray() {
      var _this3 = this;

      var _props2 = this.props,
          schema = _props2.schema,
          uiSchema = _props2.uiSchema,
          errorSchema = _props2.errorSchema,
          idSchema = _props2.idSchema,
          name = _props2.name,
          required = _props2.required,
          disabled = _props2.disabled,
          readonly = _props2.readonly,
          autofocus = _props2.autofocus;

      var title = schema.title === undefined ? name : schema.title;
      var items = this.state.items;
      var _props$registry = this.props.registry,
          definitions = _props$registry.definitions,
          fields = _props$registry.fields;
      var TitleField = fields.TitleField,
          DescriptionField = fields.DescriptionField;

      var itemsSchema = (0, _utils.retrieveSchema)(schema.items, definitions);

      var _getUiOptions = (0, _utils.getUiOptions)(uiSchema),
          _getUiOptions$addable = _getUiOptions.addable,
          addable = _getUiOptions$addable === undefined ? true : _getUiOptions$addable;

      return _react2.default.createElement(
        "fieldset",
        {
          className: "field field-array field-array-of-" + itemsSchema.type },
        _react2.default.createElement(ArrayFieldTitle, {
          TitleField: TitleField,
          idSchema: idSchema,
          title: title,
          required: required }),
        schema.description ? _react2.default.createElement(ArrayFieldDescription, {
          DescriptionField: DescriptionField,
          idSchema: idSchema,
          description: schema.description }) : null,
        _react2.default.createElement(
          "div",
          { className: "row array-item-list" },
          items.map(function (item, index) {
            var itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
            var itemIdPrefix = idSchema.$id + "_" + index;
            var itemIdSchema = (0, _utils.toIdSchema)(itemsSchema, itemIdPrefix, definitions);
            return _this3.renderArrayFieldItem({
              index: index,
              canMoveUp: index > 0,
              canMoveDown: index < items.length - 1,
              itemSchema: itemsSchema,
              itemIdSchema: itemIdSchema,
              itemErrorSchema: itemErrorSchema,
              itemData: items[index],
              itemUiSchema: uiSchema.items,
              autofocus: autofocus && index === 0
            });
          })
        ),
        addable ? _react2.default.createElement(AddButton, {
          onClick: this.onAddClick,
          disabled: disabled || readonly }) : null
      );
    }
  }, {
    key: "renderMultiSelect",
    value: function renderMultiSelect() {
      var _props3 = this.props,
          schema = _props3.schema,
          idSchema = _props3.idSchema,
          uiSchema = _props3.uiSchema,
          disabled = _props3.disabled,
          readonly = _props3.readonly,
          autofocus = _props3.autofocus;
      var items = this.state.items;
      var _props$registry2 = this.props.registry,
          widgets = _props$registry2.widgets,
          definitions = _props$registry2.definitions;

      var itemsSchema = (0, _utils.retrieveSchema)(schema.items, definitions);
      var enumOptions = (0, _utils.optionsList)(itemsSchema);

      var _getUiOptions$enumOpt = _extends({}, (0, _utils.getUiOptions)(uiSchema), { enumOptions: enumOptions }),
          _getUiOptions$enumOpt2 = _getUiOptions$enumOpt.widget,
          widget = _getUiOptions$enumOpt2 === undefined ? "select" : _getUiOptions$enumOpt2,
          options = _objectWithoutProperties(_getUiOptions$enumOpt, ["widget"]);

      var Widget = (0, _utils.getWidget)(schema, widget, widgets);
      return _react2.default.createElement(Widget, {
        id: idSchema && idSchema.$id,
        multiple: true,
        onChange: this.onSelectChange,
        options: options,
        schema: schema,
        value: items,
        disabled: disabled,
        readonly: readonly,
        autofocus: autofocus });
    }
  }, {
    key: "renderFiles",
    value: function renderFiles() {
      var _props4 = this.props,
          schema = _props4.schema,
          uiSchema = _props4.uiSchema,
          idSchema = _props4.idSchema,
          name = _props4.name,
          disabled = _props4.disabled,
          readonly = _props4.readonly,
          autofocus = _props4.autofocus;

      var title = schema.title || name;
      var items = this.state.items;
      var widgets = this.props.registry.widgets;

      var _getUiOptions2 = (0, _utils.getUiOptions)(uiSchema),
          _getUiOptions2$widget = _getUiOptions2.widget,
          widget = _getUiOptions2$widget === undefined ? "files" : _getUiOptions2$widget,
          options = _objectWithoutProperties(_getUiOptions2, ["widget"]);

      var Widget = (0, _utils.getWidget)(schema, widget, widgets);
      return _react2.default.createElement(Widget, {
        options: options,
        id: idSchema && idSchema.$id,
        multiple: true,
        onChange: this.onSelectChange,
        schema: schema,
        title: title,
        value: items,
        disabled: disabled,
        readonly: readonly,
        autofocus: autofocus });
    }
  }, {
    key: "renderFixedArray",
    value: function renderFixedArray() {
      var _this4 = this;

      var _props5 = this.props,
          schema = _props5.schema,
          uiSchema = _props5.uiSchema,
          errorSchema = _props5.errorSchema,
          idSchema = _props5.idSchema,
          name = _props5.name,
          required = _props5.required,
          disabled = _props5.disabled,
          readonly = _props5.readonly,
          autofocus = _props5.autofocus;

      var title = schema.title || name;
      var items = this.state.items;
      var _props$registry3 = this.props.registry,
          definitions = _props$registry3.definitions,
          fields = _props$registry3.fields;
      var TitleField = fields.TitleField;

      var itemSchemas = schema.items.map(function (item) {
        return (0, _utils.retrieveSchema)(item, definitions);
      });
      var additionalSchema = (0, _utils.allowAdditionalItems)(schema) ? (0, _utils.retrieveSchema)(schema.additionalItems, definitions) : null;

      var _getUiOptions3 = (0, _utils.getUiOptions)(uiSchema),
          _getUiOptions3$addabl = _getUiOptions3.addable,
          addable = _getUiOptions3$addabl === undefined ? true : _getUiOptions3$addabl;

      var canAdd = addable && additionalSchema;

      if (!items || items.length < itemSchemas.length) {
        // to make sure at least all fixed items are generated
        items = items || [];
        items = items.concat(new Array(itemSchemas.length - items.length));
      }

      return _react2.default.createElement(
        "fieldset",
        { className: "field field-array field-array-fixed-items" },
        _react2.default.createElement(ArrayFieldTitle, {
          TitleField: TitleField,
          idSchema: idSchema,
          title: title,
          required: required }),
        schema.description ? _react2.default.createElement(
          "div",
          { className: "field-description" },
          schema.description
        ) : null,
        _react2.default.createElement(
          "div",
          { className: "row array-item-list" },
          items.map(function (item, index) {
            var additional = index >= itemSchemas.length;
            var itemSchema = additional ? additionalSchema : itemSchemas[index];
            var itemIdPrefix = idSchema.$id + "_" + index;
            var itemIdSchema = (0, _utils.toIdSchema)(itemSchema, itemIdPrefix, definitions);
            var itemUiSchema = additional ? uiSchema.additionalItems || {} : Array.isArray(uiSchema.items) ? uiSchema.items[index] : uiSchema.items || {};
            var itemErrorSchema = errorSchema ? errorSchema[index] : undefined;

            return _this4.renderArrayFieldItem({
              index: index,
              canRemove: additional,
              canMoveUp: index >= itemSchemas.length + 1,
              canMoveDown: additional && index < items.length - 1,
              itemSchema: itemSchema,
              itemData: item,
              itemUiSchema: itemUiSchema,
              itemIdSchema: itemIdSchema,
              itemErrorSchema: itemErrorSchema,
              autofocus: autofocus && index === 0
            });
          })
        ),
        canAdd ? _react2.default.createElement(AddButton, {
          onClick: this.onAddClick,
          disabled: disabled || readonly }) : null
      );
    }
  }, {
    key: "renderArrayFieldItem",
    value: function renderArrayFieldItem(_ref3) {
      var index = _ref3.index,
          _ref3$canRemove = _ref3.canRemove,
          canRemove = _ref3$canRemove === undefined ? true : _ref3$canRemove,
          _ref3$canMoveUp = _ref3.canMoveUp,
          canMoveUp = _ref3$canMoveUp === undefined ? true : _ref3$canMoveUp,
          _ref3$canMoveDown = _ref3.canMoveDown,
          canMoveDown = _ref3$canMoveDown === undefined ? true : _ref3$canMoveDown,
          itemSchema = _ref3.itemSchema,
          itemData = _ref3.itemData,
          itemUiSchema = _ref3.itemUiSchema,
          itemIdSchema = _ref3.itemIdSchema,
          itemErrorSchema = _ref3.itemErrorSchema,
          autofocus = _ref3.autofocus;
      var SchemaField = this.props.registry.fields.SchemaField;
      var _props6 = this.props,
          disabled = _props6.disabled,
          readonly = _props6.readonly,
          uiSchema = _props6.uiSchema;

      var _orderable$removable$ = _extends({
        orderable: true,
        removable: true
      }, uiSchema["ui:options"]),
          orderable = _orderable$removable$.orderable,
          removable = _orderable$removable$.removable;

      var has = {
        moveUp: orderable && canMoveUp,
        moveDown: orderable && canMoveDown,
        remove: removable && canRemove
      };
      has.toolbar = Object.keys(has).some(function (key) {
        return has[key];
      });
      var btnStyle = { flex: 1, paddingLeft: 6, paddingRight: 6, fontWeight: "bold" };

      return _react2.default.createElement(
        "div",
        { key: index, className: "array-item" },
        _react2.default.createElement(
          "div",
          { className: has.toolbar ? "col-xs-9" : "col-xs-12" },
          _react2.default.createElement(SchemaField, {
            schema: itemSchema,
            uiSchema: itemUiSchema,
            formData: itemData,
            errorSchema: itemErrorSchema,
            idSchema: itemIdSchema,
            required: this.isItemRequired(itemSchema),
            onChange: this.onChangeForIndex(index),
            registry: this.props.registry,
            disabled: this.props.disabled,
            readonly: this.props.readonly,
            autofocus: autofocus })
        ),
        has.toolbar ? _react2.default.createElement(
          "div",
          { className: "col-xs-3 array-item-toolbox" },
          _react2.default.createElement(
            "div",
            { className: "btn-group", style: { display: "flex", justifyContent: "space-around" } },
            has.moveUp || has.moveDown ? _react2.default.createElement(IconBtn, { icon: "arrow-up", className: "array-item-move-up",
              tabIndex: "-1",
              style: btnStyle,
              disabled: disabled || readonly || !has.moveUp,
              onClick: this.onReorderClick(index, index - 1) }) : null,
            has.moveUp || has.moveDown ? _react2.default.createElement(IconBtn, { icon: "arrow-down", className: "array-item-move-down",
              tabIndex: "-1",
              style: btnStyle,
              disabled: disabled || readonly || !has.moveDown,
              onClick: this.onReorderClick(index, index + 1) }) : null,
            has.remove ? _react2.default.createElement(IconBtn, { type: "danger", icon: "remove", className: "array-item-remove",
              tabIndex: "-1",
              style: btnStyle,
              disabled: disabled || readonly,
              onClick: this.onDropIndexClick(index) }) : null
          )
        ) : null
      );
    }
  }, {
    key: "itemTitle",
    get: function get() {
      var schema = this.props.schema;

      return schema.items.title || schema.items.description || "Item";
    }
  }]);

  return ArrayField;
}(_react.Component);

ArrayField.defaultProps = {
  uiSchema: {},
  idSchema: {},
  registry: (0, _utils.getDefaultRegistry)(),
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false
};


function AddButton(_ref4) {
  var onClick = _ref4.onClick,
      disabled = _ref4.disabled;

  return _react2.default.createElement(
    "div",
    { className: "row" },
    _react2.default.createElement(
      "p",
      { className: "col-xs-3 col-xs-offset-9 array-item-add text-right" },
      _react2.default.createElement(IconBtn, { type: "info", icon: "plus", className: "btn-add col-xs-12",
        tabIndex: "0", onClick: onClick,
        disabled: disabled })
    )
  );
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = {
    schema: _react.PropTypes.object.isRequired,
    uiSchema: _react.PropTypes.shape({
      "ui:options": _react.PropTypes.shape({
        addable: _react.PropTypes.bool,
        orderable: _react.PropTypes.bool,
        removable: _react.PropTypes.bool
      })
    }),
    idSchema: _react.PropTypes.object,
    errorSchema: _react.PropTypes.object,
    onChange: _react.PropTypes.func.isRequired,
    formData: _react.PropTypes.array,
    required: _react.PropTypes.bool,
    disabled: _react.PropTypes.bool,
    readonly: _react.PropTypes.bool,
    autofocus: _react.PropTypes.bool,
    registry: _react.PropTypes.shape({
      widgets: _react.PropTypes.objectOf(_react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.object])).isRequired,
      fields: _react.PropTypes.objectOf(_react.PropTypes.func).isRequired,
      definitions: _react.PropTypes.object.isRequired,
      formContext: _react.PropTypes.object.isRequired
    })
  };
}

exports.default = ArrayField;
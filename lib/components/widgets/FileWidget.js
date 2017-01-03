"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("../../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", ";name=" + name + ";base64");
}

function processFile(file) {
  var name = file.name,
      size = file.size,
      type = file.type;

  return new Promise(function (resolve, reject) {
    var reader = new window.FileReader();
    reader.onload = function (event) {
      resolve({
        dataURL: addNameToDataURL(event.target.result, name),
        name: name,
        size: size,
        type: type
      });
    };
    reader.readAsDataURL(file);
  });
}

function processFiles(files) {
  return Promise.all([].map.call(files, processFile));
}

function FilesInfo(props) {
  var filesInfo = props.filesInfo;

  if (filesInfo.length === 0) {
    return null;
  }
  return _react2.default.createElement(
    "ul",
    { className: "file-info" },
    filesInfo.map(function (fileInfo, key) {
      var name = fileInfo.name,
          size = fileInfo.size,
          type = fileInfo.type;

      return _react2.default.createElement(
        "li",
        { key: key },
        _react2.default.createElement(
          "strong",
          null,
          name
        ),
        " (",
        type,
        ", ",
        size,
        " bytes)"
      );
    })
  );
}

function extractFileInfo(dataURLs) {
  return dataURLs.filter(function (dataURL) {
    return typeof dataURL !== "undefined";
  }).map(function (dataURL) {
    var _dataURItoBlob = (0, _utils.dataURItoBlob)(dataURL),
        blob = _dataURItoBlob.blob,
        name = _dataURItoBlob.name;

    return {
      name: name,
      size: blob.size,
      type: blob.type
    };
  });
}

var FileWidget = function (_Component) {
  _inherits(FileWidget, _Component);

  function FileWidget(props) {
    _classCallCheck(this, FileWidget);

    var _this = _possibleConstructorReturn(this, (FileWidget.__proto__ || Object.getPrototypeOf(FileWidget)).call(this, props));

    _this.defaultProps = {
      multiple: false
    };

    _this.onChange = function (event) {
      var _this$props = _this.props,
          multiple = _this$props.multiple,
          onChange = _this$props.onChange;

      processFiles(event.target.files).then(function (filesInfo) {
        var state = {
          values: filesInfo.map(function (fileInfo) {
            return fileInfo.dataURL;
          }),
          filesInfo: filesInfo
        };
        (0, _utils.setState)(_this, state, function () {
          if (multiple) {
            onChange(state.values);
          } else {
            onChange(state.values[0]);
          }
        });
      });
    };

    _this.onBlur = function (event) {
      if (_this.props.onBlur) {
        _this.props.onBlur(event);
      }
    };

    var value = props.value;

    var values = Array.isArray(value) ? value : [value];
    _this.state = { values: values, filesInfo: extractFileInfo(values) };
    return _this;
  }

  _createClass(FileWidget, [{
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      return (0, _utils.shouldRender)(this, nextProps, nextState);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _props = this.props,
          multiple = _props.multiple,
          id = _props.id,
          readonly = _props.readonly,
          disabled = _props.disabled,
          autofocus = _props.autofocus;
      var filesInfo = this.state.filesInfo;

      return _react2.default.createElement(
        "div",
        null,
        _react2.default.createElement(
          "p",
          null,
          _react2.default.createElement("input", {
            ref: function ref(_ref) {
              return _this2.inputRef = _ref;
            },
            id: id,
            type: "file",
            disabled: readonly || disabled,
            onChange: this.onChange,
            onBlur: this.onBlur,
            defaultValue: "",
            autoFocus: autofocus,
            multiple: multiple })
        ),
        _react2.default.createElement(FilesInfo, { filesInfo: filesInfo })
      );
    }
  }]);

  return FileWidget;
}(_react.Component);

FileWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  FileWidget.propTypes = {
    multiple: _react.PropTypes.bool,
    value: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.arrayOf(_react.PropTypes.string)]),
    autofocus: _react.PropTypes.bool
  };
}

exports.default = FileWidget;
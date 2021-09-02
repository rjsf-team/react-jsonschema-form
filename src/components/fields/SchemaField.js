import { ADDITIONAL_PROPERTY_FLAG } from "../../utils";
import IconButton from "../IconButton";
import jsonLogic from "json-logic-js";
import React from "react";
import PropTypes from "prop-types";
import includes from "core-js/library/fn/array/includes";
import * as types from "../../types";
import {
  isMultiSelect,
  isSelect,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry,
  mergeObjects,
  getUiOptions,
  isFilesArray,
  deepEquals,
  getSchemaType,
} from "../../utils";
import UnsupportedField from "./UnsupportedField";

const REQUIRED_FIELD_SYMBOL = "*";
const COMPONENT_TYPES = {
  array: "ArrayField",
  boolean: "BooleanField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  null: "NullField",
};

function getFieldComponent(schema, uiSchema, idSchema, fields) {
  const field = uiSchema["ui:field"];
  if (typeof field === "function" || typeof field === "object") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }

  const componentName = COMPONENT_TYPES[getSchemaType(schema)];

  // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
  // render a field and let the MultiSchemaField component handle the form display
  if (!componentName && (schema.anyOf || schema.oneOf)) {
    return () => null;
  }

  return componentName in fields
    ? fields[componentName]
    : () => {
      return (
        <UnsupportedField
          schema={schema}
          idSchema={idSchema}
          reason={`Unknown field type ${schema.type}`}
        />
      );
    };
}

function Label(props) {
  const { label, required, id, _realtimepositionField } = props;
  if (!label) {
    return null;
  }
  const renderFocusUserAvatar = () => {
    if (_realtimepositionField && Object.keys(_realtimepositionField).length > 0) {
      const queryArr = [];
      Object.keys(_realtimepositionField).map((key) => {
        queryArr.push(<div class="UserAvatar ml-1" style={{ display: 'inline-flex' }}>
          <div class="UserAvatar--inner"
            style={{ lineHeight: '15px', textAlign: 'center', borderRadius: '100%', maxWidth: '15px', width: '15px', maxHeight: '15px', height: '15px' }}>
            <img class="UserAvatar--img" title={_realtimepositionField[key].name} src={`//www.gravatar.com/avatar/${_realtimepositionField[key].md5_email}?d=identicon`}
              alt="G.Balraj User3" style={{ display: 'block', borderRadius: '100%', width: '15px', height: '15px' }} />
          </div>
        </div>);

      });
      return queryArr;

    }
  }
  return (
    <label className="control-label" htmlFor={id}>
      {label}
      {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
      {renderFocusUserAvatar()}
    </label>
  );
}

function LabelInput(props) {
  const { id, label, onChange } = props;
  return (
    <input
      className="form-control"
      type="text"
      id={id}
      onBlur={event => onChange(event.target.value)}
      defaultValue={label}
    />
  );
}

function Help(props) {
  const { help } = props;
  if (!help) {
    return null;
  }
  if (typeof help === "string") {
    return <p className="help-block">{help}</p>;
  }
  return <div className="help-block">{help}</div>;
}

function ErrorList(props) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return null;
  }

  return (
    <div>
      <ul className="error-detail bs-callout bs-callout-info list-unstyled ml-1 mt-1">
        {errors
          .filter(elem => !!elem)
          .map((error, index) => {
            return (
              <li className="text-danger" key={index}>
                {error}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
function DefaultTemplate(props) {
  const {
    id,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
    labelOnlyPermission,
    EditAndLabelOnlyPermission,
    arrayLabelOnlyPermission,
    _realtimepositionField
  } = props;
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }
  return (
    <WrapIfAdditional {...props}>
      {!labelOnlyPermission && !EditAndLabelOnlyPermission && !arrayLabelOnlyPermission &&
        <>
          {displayLabel && <Label label={label} required={required} id={id} _realtimepositionField={_realtimepositionField}/>}
          {displayLabel && description ? description : null}
          {children}
          {errors}
          {help}
        </>
      }
      {((labelOnlyPermission || EditAndLabelOnlyPermission || arrayLabelOnlyPermission)) &&
        <dl>
          {displayLabel && <dt> {label} </dt>}
          <dd>{children}</dd>
        </dl>
      }
    </WrapIfAdditional>
  );
}
if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: PropTypes.string,
    classNames: PropTypes.string,
    _realtimepositionField: PropTypes.any,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
    errors: PropTypes.element,
    rawErrors: PropTypes.arrayOf(PropTypes.string),
    help: PropTypes.element,
    rawHelp: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    description: PropTypes.element,
    rawDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    displayLabel: PropTypes.bool,
    fields: PropTypes.object,
    formContext: PropTypes.object,
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

function WrapIfAdditional(props) {
  const {
    id,
    classNames,
    disabled,
    label,
    onKeyChange,
    onDropPropertyClick,
    readonly,
    required,
    schema,
  } = props;
  const keyLabel = `${label} Key`; // i18n ?
  const additional = schema.hasOwnProperty(ADDITIONAL_PROPERTY_FLAG);

  if (!additional) {
    return <div className={classNames}>{props.children}</div>;
  }

  return (
    <div className={classNames}>
      <div className="row">
        <div className="col-xs-5 form-additional">
          <div className="form-group">
            <Label label={keyLabel} required={required} id={`${id}-key`} />
            <LabelInput
              label={label}
              required={required}
              id={`${id}-key`}
              onChange={onKeyChange}
            />
          </div>
        </div>
        <div className="form-additional form-group col-xs-5">
          {props.children}
        </div>
        <div className="col-xs-2">
          <IconButton
            type="danger"
            icon="remove"
            className="array-item-remove btn-block"
            tabIndex="-1"
            style={{ border: "0" }}
            disabled={disabled || readonly}
            onClick={onDropPropertyClick(label)}
          />
        </div>
      </div>
    </div>
  );
}
function resolveObjectPathData(path, obj) {
  return path.split('.').reduce(function (prev, curr) {
    return prev ? prev[curr] : null
  }, obj || self)
}
function SchemaFieldRender(props) {
  const {
    uiSchema,
    permission,
    isAuth,
    formData,
    taskData,
    errorSchema,
    idPrefix,
    name,
    onKeyChange,
    onDropPropertyClick,
    required,
    originalArrayData,
    registry = getDefaultRegistry(),
    wasPropertyKeyModified = false,
    updatedFields,
    updatedFieldClassName,
    realtimeUserPositionField,
    isDataLoaded,
    AuthID,
    EditorType,
    TaskID,
    timezone,
    roleId,
    isEditTrigger,
    arrayLabelOnlyPermission,
    subForms
  } = props;
  const { definitions, fields, formContext } = registry;
  const FieldTemplate =
    uiSchema["ui:FieldTemplate"] || registry.FieldTemplate || DefaultTemplate;
  let idSchema = props.idSchema;
  const schema = retrieveSchema(props.schema, definitions, formData);
  idSchema = mergeObjects(
    toIdSchema(schema, null, definitions, formData, idPrefix),
    idSchema
  );
  // Checking Role Based actions
  let readonlyPermission = false;
  let labelOnlyPermission = false;
  let EditAndLabelOnlyPermission = false;
  if (permission && permission[roleId]) {
    if (permission[roleId][0] !== undefined && includes(Object.values(permission[roleId][0]), name) && name) {
      return null;
    } else if (permission[roleId][1] !== undefined && includes(Object.values(permission[roleId][1]), name) && name && !originalArrayData) {
      labelOnlyPermission = true;
    } else if (permission[roleId][2] !== undefined && includes(Object.values(permission[roleId][2]), name) && name && !originalArrayData) {
      readonlyPermission = true;
    } else if (permission[roleId][4] !== undefined && includes(Object.values(permission[roleId][4]), name) && formData && name && originalArrayData) {
      if (originalArrayData['id'] !== undefined && originalArrayData['id'] != '-1') {
        labelOnlyPermission = true;
      }
    } else if (permission[roleId][6] !== undefined && includes(Object.values(permission[roleId][6]), name) && formData && name && originalArrayData && originalArrayData['user_id']) {
      if (originalArrayData['id'] !== undefined && originalArrayData['id'] != '-1' && parseInt(originalArrayData['user_id']) !== parseInt(AuthID)) {
        labelOnlyPermission = true;
      } else if (originalArrayData['id'] !== undefined && originalArrayData['id'] != '-1' && parseInt(originalArrayData['user_id']) === parseInt(AuthID)) {
        EditAndLabelOnlyPermission = true;
      }
    }
    else if (permission[roleId][7] !== undefined && includes(Object.values(permission[roleId][7]), name) && formData && name && originalArrayData && originalArrayData['user_id']) {
      EditAndLabelOnlyPermission = true;
    }
  }
  if(isAuth === false){
    readonlyPermission = true;
  }
  if (taskData && uiSchema["ui:conditional"] && jsonLogic.apply(uiSchema["ui:conditional"], taskData) === false) {
    return null;
  }
  const FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
  const { DescriptionField } = fields;
  const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  const readonly = Boolean(
    props.readonly ||
    uiSchema["ui:readonly"] ||
    props.schema.readOnly ||
    schema.readOnly ||
    readonlyPermission
  );
  const autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);
  if (Object.keys(schema).length === 0) {
    return null;
  }

  const uiOptions = getUiOptions(uiSchema);
  let { label: displayLabel = true } = uiOptions;
  if (schema.type === "array") {
    displayLabel =
      isMultiSelect(schema, definitions) ||
      isFilesArray(schema, uiSchema, definitions);
  }
  if (schema.type === "object") {
    displayLabel = false;
  }
  if (schema.type === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }
  const { __errors, ...fieldErrorSchema } = errorSchema;

  // See #439: uiSchema: Don't pass consumed class names to child components

  let field = '';
  if (labelOnlyPermission && !arrayLabelOnlyPermission) {
    displayLabel = true;
    if (schema.type == "array" && formData && formData.length > 0) {
      if (uiSchema && (uiSchema["ui:ArrayFieldTemplate"] || uiSchema["ui:field"])) {
        let Template = uiSchema["ui:ArrayFieldTemplate"] || uiSchema["ui:field"];
        return (<Template {...props} labelonly={true} />);
      } else {
        let tmpForData = [];
        formData.forEach((value) => {
          if (uiSchema["ui:labelKey"] && uiSchema["ui:labelKey"] !== undefined) {
            let LabelValue = resolveObjectPathData(uiSchema["ui:labelKey"], value);
            tmpForData.push(LabelValue);
          } else {
            tmpForData.push(value);
          }
        });
        tmpForData = tmpForData.join(', ');
        field = (
          <>{tmpForData}</>
        );
      }
    } else if (uiSchema["ui:widget"] && typeof uiSchema["ui:widget"] === "function" || uiSchema["ui:field"] && typeof uiSchema["ui:field"] === "function") {
      let Template = uiSchema["ui:field"] ? uiSchema["ui:field"] : uiSchema["ui:widget"];
      return (<Template {...props} labelonly={true} />);
    } else {
      field = (
        <>{formData}</>
      );
    }
  } else if ((schema.type === "number" || schema.type === "string") && arrayLabelOnlyPermission) {
    displayLabel = (formData) ? true : false;
    field = (
      <>{formData}</>
    );
  } else if (EditAndLabelOnlyPermission) {
    field = (<>
      {!isEditTrigger &&
        <>{formData}</>
      }
      {isEditTrigger &&
        <div>
          <FieldComponent
            {...props}
            idSchema={idSchema}
            schema={schema}
            uiSchema={{ ...uiSchema, classNames: undefined }}
            permission={permission}
            isAuth={isAuth}
            isDataLoaded={isDataLoaded}
            AuthID={AuthID}
            EditorType={EditorType}
            TaskID={TaskID}
            timezone={timezone}
            subForms={subForms}
            roleId={roleId}
            isEditTrigger={isEditTrigger}
            arrayLabelOnlyPermission={arrayLabelOnlyPermission}
            disabled={disabled}
            readonly={readonly}
            autofocus={autofocus}
            errorSchema={fieldErrorSchema}
            formContext={formContext}
            rawErrors={__errors}
          />
        </div>
      }
    </>);
  } else {
    field = (
      <FieldComponent
        {...props}
        idSchema={idSchema}
        schema={schema}
        uiSchema={{ ...uiSchema, classNames: undefined }}
        permission={permission}
        isAuth={isAuth}
        isDataLoaded={isDataLoaded}
        AuthID={AuthID}
        EditorType={EditorType}
        TaskID={TaskID}
        timezone={timezone}
        subForms={subForms}
        roleId={roleId}
        isEditTrigger={isEditTrigger}
        arrayLabelOnlyPermission={arrayLabelOnlyPermission}
        disabled={disabled}
        readonly={readonly}
        autofocus={autofocus}
        errorSchema={fieldErrorSchema}
        formContext={formContext}
        rawErrors={__errors}
      />
    );
  }
  const { type } = schema;
  const id = idSchema.$id;

  // If this schema has a title defined, but the user has set a new key/label, retain their input.
  let label;
  if (wasPropertyKeyModified) {
    label = name;
  } else {
    label = uiSchema["ui:title"] || props.schema.title || schema.title || name;
  }

  const description =
    uiSchema["ui:description"] ||
    props.schema.description ||
    schema.description;
  const errors = __errors;
  const help = uiSchema["ui:help"];
  const hidden = uiSchema["ui:widget"] === "hidden";
  let tmpClassName = "";
  let _realtimepositionField = {};
  if (updatedFields !== undefined && updatedFields.indexOf(name) !== -1) {
    tmpClassName = updatedFieldClassName;
  }
  if (realtimeUserPositionField !== undefined && Object.keys(realtimeUserPositionField).length && realtimeUserPositionField[name]) {
    _realtimepositionField = realtimeUserPositionField[name];
  }
  const classNames = [
    "form-group",
    "field",
    `field-${type}`,
    errors && errors.length > 0 ? "field-error has-error has-danger" : "",
    uiSchema.classNames,
    tmpClassName,
  ]
    .join(" ")
    .trim();

  const fieldProps = {
    description: (
      <DescriptionField
        id={id + "__description"}
        description={description}
        formContext={formContext}
      />
    ),
    rawDescription: description,
    help: <Help help={help} />,
    rawHelp: typeof help === "string" ? help : undefined,
    errors: <ErrorList errors={errors} />,
    rawErrors: errors,
    id,
    label,
    hidden,
    onKeyChange,
    onDropPropertyClick,
    required,
    disabled,
    readonly,
    displayLabel,
    classNames,
    formContext,
    fields,
    schema,
    uiSchema,
    permission,
    isAuth,
    isDataLoaded,
    AuthID,
    EditorType,
    TaskID,
    timezone,
    roleId,
    labelOnlyPermission,
    EditAndLabelOnlyPermission,
    arrayLabelOnlyPermission,
    formData,
    subForms,
    _realtimepositionField
  };

  const _AnyOfField = registry.fields.AnyOfField;
  const _OneOfField = registry.fields.OneOfField;
  return (
    <>
      <FieldTemplate {...fieldProps}>
        {field}
        {/*
        If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
        render the selection and let `StringField` component handle
        rendering
      */}
        {schema.anyOf && !isSelect(schema) && (
          <_AnyOfField
            disabled={disabled}
            errorSchema={errorSchema}
            taskData={taskData}
            formData={formData}
            idPrefix={idPrefix}
            idSchema={idSchema}
            onBlur={props.onBlur}
            onOptionFilter={props.onOptionFilter}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.anyOf}
            baseType={schema.type}
            registry={registry}
            safeRenderCompletion={props.safeRenderCompletion}
            schema={schema}
            uiSchema={uiSchema}
            permission={permission}
            isAuth={isAuth}
            isDataLoaded={isDataLoaded}
            AuthID={AuthID}
            EditorType={EditorType}
            TaskID={TaskID}
            timezone={timezone}
            subForms={subForms}
            roleId={roleId}
          />
        )}

        {schema.oneOf && !isSelect(schema) && (
          <_OneOfField
            disabled={disabled}
            errorSchema={errorSchema}
            taskData={taskData}
            formData={formData}
            idPrefix={idPrefix}
            idSchema={idSchema}
            onBlur={props.onBlur}
            onOptionFilter={props.onOptionFilter}
            onOptionResponse={props.onOptionResponse}
            onChange={props.onChange}
            onFocus={props.onFocus}
            options={schema.oneOf}
            baseType={schema.type}
            registry={registry}
            safeRenderCompletion={props.safeRenderCompletion}
            schema={schema}
            uiSchema={uiSchema}
            permission={permission}
            isAuth={isAuth}
            isDataLoaded={isDataLoaded}
            AuthID={AuthID}
            EditorType={EditorType}
            TaskID={TaskID}
            timezone={timezone}
            subForms={subForms}
            roleId={roleId}
          />
        )}
      </FieldTemplate>
    </>
  );
}

class SchemaField extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // if schemas are equal idSchemas will be equal as well,
    // so it is not necessary to compare
    return !deepEquals(this.props, nextProps);
    /* return !deepEquals(
      { ...this.props, idSchema: undefined },
      { ...nextProps, idSchema: undefined }
    ); */
  }

  render() {
    return SchemaFieldRender(this.props);
  }
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: types.registry.isRequired,
  };
}

export default SchemaField;

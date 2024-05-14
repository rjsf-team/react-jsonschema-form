/** Below are the list of all the keys into various elements of a RJSFSchema or UiSchema that are used by the various
 * utility functions. In addition to those keys, there are the special `ADDITIONAL_PROPERTY_FLAG` and
 * `RJSF_ADDITIONAL_PROPERTIES_FLAG` flags that is added to a schema under certain conditions by the `retrieveSchema()`
 * utility.
 */
export const ADDITIONAL_PROPERTY_FLAG = '__additional_property';
export const ADDITIONAL_PROPERTIES_KEY = 'additionalProperties';
export const ALL_OF_KEY = 'allOf';
export const ANY_OF_KEY = 'anyOf';
export const CONST_KEY = 'const';
export const DEFAULT_KEY = 'default';
export const DEFINITIONS_KEY = 'definitions';
export const DEPENDENCIES_KEY = 'dependencies';
export const ENUM_KEY = 'enum';
export const ERRORS_KEY = '__errors';
export const ID_KEY = '$id';
export const IF_KEY = 'if';
export const ITEMS_KEY = 'items';
export const JUNK_OPTION_ID = '_$junk_option_schema_id$_';
export const NAME_KEY = '$name';
export const ONE_OF_KEY = 'oneOf';
export const PROPERTIES_KEY = 'properties';
export const REQUIRED_KEY = 'required';
export const SUBMIT_BTN_OPTIONS_KEY = 'submitButtonOptions';
export const REF_KEY = '$ref';
/**
 * @deprecated Replace with correctly spelled constant `RJSF_ADDITIONAL_PROPERTIES_FLAG`
 */
export const RJSF_ADDITONAL_PROPERTIES_FLAG = '__rjsf_additionalProperties';
export const RJSF_ADDITIONAL_PROPERTIES_FLAG = '__rjsf_additionalProperties';
export const ROOT_SCHEMA_PREFIX = '__rjsf_rootSchema';
export const UI_FIELD_KEY = 'ui:field';
export const UI_WIDGET_KEY = 'ui:widget';
export const UI_OPTIONS_KEY = 'ui:options';
export const UI_GLOBAL_OPTIONS_KEY = 'ui:globalOptions';

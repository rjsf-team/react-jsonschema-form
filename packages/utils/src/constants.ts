import type { JSONSchema7TypeName } from 'json-schema';

/** Below are the list of all the keys into various elements of a RJSFSchema or UiSchema that are used by the various
 * utility functions. In addition to those keys, there are the special `ADDITIONAL_PROPERTY_FLAG`,
 * `GUESSED_TYPE_FLAG`, `RJSF_REF_KEY`, `RJSF_REF_CYCLE_KEY` and `RJSF_PROVENANCE_KEY` Symbols that are added to a
 * schema under certain conditions by the `retrieveSchema()` utility, the `EXTRA_KEYS_ELSEWHERE_FLAG` Symbol that
 * `getRenderedOptionSchema()` adds, and the `PINNED_TYPE_FLAG` Symbol that the fallback UI adds. Using Symbols keeps
 * these internal markers invisible to JSON serialisation and JSON Schema validators (AJV, ATA, etc.), which only
 * enumerate string-keyed properties.
 */
export const ADDITIONAL_ITEMS_KEY = 'additionalItems';
export const ADDITIONAL_PROPERTY_FLAG = Symbol('__additional_property');
export const ADDITIONAL_PROPERTIES_KEY = 'additionalProperties';
export const ALL_OF_KEY = 'allOf';
export const ANY_OF_KEY = 'anyOf';
export const CONST_KEY = 'const';
export const CONTAINS_KEY = 'contains';
export const DEFAULT_KEY = 'default';
export const DEFINITIONS_KEY = 'definitions';
export const DEPENDENCIES_KEY = 'dependencies';
export const DEPENDENT_REQUIRED_KEY = 'dependentRequired';
export const DEPENDENT_SCHEMAS_KEY = 'dependentSchemas';
export const ELSE_KEY = 'else';
export const ENUM_KEY = 'enum';
export const ERRORS_KEY = '__errors';
/** Marks a schema whose field takes no extra key for an `additionalProperties` it leaves out, whatever
 * `additionalPropertiesWhenAbsent` says, since another field at its data path takes them: an option rendered beside its
 * object parent's own field, or an object whose selected option renders a field of its own beside the options it offers
 * in turn
 */
export const EXTRA_KEYS_ELSEWHERE_FLAG = Symbol('__extra_keys_elsewhere');
export const GUESSED_TYPE_FLAG = Symbol('__guessed_type');
export const ID_KEY = '$id';
export const IF_KEY = 'if';
export const ITEMS_KEY = 'items';
export const NOT_KEY = 'not';
export const ONE_OF_KEY = 'oneOf';
export const PATTERN_PROPERTIES_KEY = 'patternProperties';
/** Marks a schema whose `type` the fallback UI's type selector pinned to the one it is on, so that an `anyOf`/`oneOf`
 * option of another type still takes the whole field, as it does under the type list the schema was pinned from (see
 * `rendersOwnFieldBesideOption()`)
 */
export const PINNED_TYPE_FLAG = Symbol('__pinned_type');
export const PREFIX_ITEMS_KEY = 'prefixItems';
export const PROPERTIES_KEY = 'properties';
export const READONLY_KEY = 'readonly';
export const REQUIRED_KEY = 'required';
export const SUBMIT_BTN_OPTIONS_KEY = 'submitButtonOptions';
export const REF_KEY = '$ref';
export const THEN_KEY = 'then';
export const UNEVALUATED_ITEMS_KEY = 'unevaluatedItems';
export const UNEVALUATED_PROPERTIES_KEY = 'unevaluatedProperties';
export const RJSF_REF_KEY = Symbol('__rjsf_ref');
export const RJSF_REF_CYCLE_KEY = Symbol('__rjsf_ref_cycle');
/** Records, on every subschema `retrieveSchema()` hands out, where the subschema came from. Only `retrieveSchema()`
 * writes or reads what it holds. It is exported so that a test can strip it, as RJSF's own test setup does, and
 * compare a retrieved schema with the same schema written by hand.
 */
export const RJSF_PROVENANCE_KEY = Symbol('__rjsf_provenance');
export const SCHEMA_KEY = '$schema';
export const DEFAULT_ID_PREFIX = 'root';
export const DEFAULT_ID_SEPARATOR = '_';
/** The path of the discriminator value returned by the schema endpoint.
 * The discriminator is the value in a `oneOf` that determines which option is selected.
 */
export const DISCRIMINATOR_PATH = ['discriminator', 'propertyName'];
/** The name of the `formContext` attribute in the React JSON Schema Form Registry
 */
export const FORM_CONTEXT_NAME = 'formContext';

/** The name of the `layoutGridLookupMap` attribute in the form context
 */
export const LOOKUP_MAP_NAME = 'layoutGridLookupMap';
const RJSF_PREFIX_KEY = '__rjsf';
export const RJSF_ADDITIONAL_PROPERTIES_FLAG = `${RJSF_PREFIX_KEY}_additionalProperties`;
export const ROOT_SCHEMA_PREFIX = `${RJSF_PREFIX_KEY}_rootSchema`;
/** The start of the `$id` an option's scoring copy gives a part it holds once, and of every `$ref` naming it, which
 * `withRootIdRefPrefix()` leaves as written. Only a query, it resolves against the `$id` around it, so a `$ref` to the
 * root, which a validator prefixes with the id it registers the root under, resolves inside the part as it does
 * outside it, as long as that id names its document by no more than its last path segment. Only a `$ref` naming such a
 * part whole, `?rjsf-copy=<hash>`, is supported: the live and precompiled validators need not resolve one with a
 * fragment after it alike. A `$recursiveRef` or `$dynamicRef` the part holds is copied as written, so it resolves
 * against the part's `$id`, as one anywhere in a scoring target resolves against the target rather than the root:
 * scoring doesn't resolve those keywords as the root does.
 */
export const SHARED_COPY_ID = '?rjsf-copy=';
export const UI_FIELD_KEY = 'ui:field';
export const UI_WIDGET_KEY = 'ui:widget';
export const UI_OPTIONS_KEY = 'ui:options';
export const UI_GLOBAL_OPTIONS_KEY = 'ui:globalOptions';
export const UI_DEFINITIONS_KEY = 'ui:definitions';

/** The JSON Schema version strings
 */
export const JSON_SCHEMA_DRAFT_2019_09 = 'https://json-schema.org/draft/2019-09/schema';
export const JSON_SCHEMA_DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema';

/** Every type name JSON Schema defines, in the order the fallback UI offers them for a schema that allows any type
 */
export const JSON_SCHEMA_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
] as const satisfies JSONSchema7TypeName[];

/** Prefixes the index that the `realValue` option value format encodes an option as when its `String()` can't identify
 * it, such as an object, array or `null` option, so that index can't collide with a primitive option whose `String()`
 * is the same number
 */
export const ENUM_OPTION_INDEX_PREFIX = '__rjsf_index:';

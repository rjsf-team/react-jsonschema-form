import { ComponentType, PureComponent, ReactNode } from 'react';
import {
  ANY_OF_KEY,
  ErrorSchema,
  FieldProps,
  FormContextType,
  GenericObjectType,
  getDiscriminatorFieldFromSchema,
  getTemplate,
  getTestIds,
  getUiOptions,
  hashObject,
  ID_KEY,
  IdSchema,
  lookupFromFormContext,
  mergeObjects,
  ONE_OF_KEY,
  PROPERTIES_KEY,
  READONLY_KEY,
  RJSFSchema,
  Registry,
  SchemaUtilsType,
  StrictRJSFSchema,
  UI_OPTIONS_KEY,
  UiSchema,
} from '@rjsf/utils';
import cloneDeep from 'lodash/cloneDeep';
import flatten from 'lodash/flatten';
import get from 'lodash/get';
import has from 'lodash/has';
import includes from 'lodash/includes';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isEqual from 'lodash/isEqual';
import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import set from 'lodash/set';

/** The enumeration of the three different Layout GridTemplate type values
 */
export enum GridType {
  ROW = 'ui:row',
  COLUMN = 'ui:col',
  COLUMNS = 'ui:columns',
  CONDITION = 'ui:condition',
}

/** The enumeration of the different operators within a condition
 */
export enum Operators {
  ALL = 'all',
  SOME = 'some',
  NONE = 'none',
}

/** Type used to represent an object that contains anything */
type ConfigObject = Record<string, any>;

export interface GridProps extends GenericObjectType {
  /** The optional operator to use when comparing a field's value with the expected value for `GridType.CONDITION`
   */
  operator?: Operators;
  /** The optional name of the field from which to get the value for `GridType.CONDITION`
   */
  field?: string;
  /** The optional expected value against which to compare the field's value using the `operator`
   */
  value?: unknown;
}

export type GridSchemaType = {
  /** The limited set of props which are keyed using the `GridType` enumeration and return an object
   */
  [gridType in GridType]?: object;
};

/** The types which comprise the possibilities for the `layoutGridSchema` prop
 */
export type LayoutGridSchemaType = GridSchemaType | ConfigObject | string;

export interface LayoutGridFieldProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends FieldProps<T, S, F> {
  /** Optional string or object used to describe the current level of the `LayoutGridField`
   */
  layoutGridSchema?: LayoutGridSchemaType;
}

/** The constant representing the main layout grid schema option name in the `uiSchema`
 */
export const LAYOUT_GRID_UI_OPTION = 'layoutGrid';

/** The constant representing the main layout grid schema option name in the `uiSchema`
 */
export const LAYOUT_GRID_OPTION = `ui:${LAYOUT_GRID_UI_OPTION}`;

/** The constant representing the global UI Options object potentially contained within the `uiSchema`
 */
export const UI_GLOBAL_OPTIONS = 'ui:global_options';

/** Type used to return options list and whether it has a discriminator */
type OneOfOptionsInfoType<S extends StrictRJSFSchema = RJSFSchema> = { options: S[]; hasDiscriminator: boolean };

/** Type used to represent a React-based rendering component */
type RenderComponent = ComponentType<any>;

/** Type used to determine what are the UIComponent and props from the grid schema */
type UIComponentPropsType = {
  /** The name of the component */
  name: string;
  /** The render component if specified */
  UIComponent: RenderComponent | null;
  /** Any uiProps associated with the render component */
  uiProps: ConfigObject;
  /** The special case where the component is immediately rendered */
  rendered: ReactNode;
};

/** Returns either the `value` if it is non-nullish or the fallback
 *
 * @param [value] - The potential value to return if it is non-nullish
 * @param [fallback] - The fallback value to return if `value` is nullish
 * @returns - `value` if it is non-nullish otherwise `fallback`
 */
function getNonNullishValue<T = unknown>(value?: T, fallback?: T): T | undefined {
  return value ?? fallback;
}

/** The `LayoutGridField` will render a schema, uiSchema and formData combination out into a GridTemplate in the shape
 * described in the uiSchema. To define the grid to use to render the elements within a field in the schema, provide in
 * the uiSchema for that field the object contained under a `ui:LayoutGridField` element. E.g. (as a JSON object):
 *
 * ```
 * {
 *   "field1" : {
 *     "ui:field": "LayoutGridField",
 *     "ui:LayoutGridField": {
 *       "ui:row": { ... }
 *     }
 *   }
 * }
 * ```
 *
 * The outermost level of a `LayoutGridField` is the `ui:row` that defines the nested rows, columns, and/or condition
 * elements (i.e. "grid elements") in the grid. This definition is either a simple "grid elements" OR an object with
 * native `GridTemplate` implementation specific props and a `children` array of "grid elements". E.g. (as JSON objects):
 *
 * Simple `ui:row` definition, without additional `GridTemplate` props:
 * ```
 *  "ui:row": [
 *    { "ui:row"|"ui:column"|"ui:condition": ... },
 *    ...
 *  ]
 * ```
 *
 * Complex `ui:row` definition, with additional `GridTemplate` (this example uses @mui/material/Grid2 native props):
 * ```
 *  "ui:row": {
 *    "spacing": 2,
 *    "size": { md": 4 },
 *    "alignContent": "flex-start",
 *    "className": "GridRow",
 *    "children": [
 *      { "ui:row"|"ui:column"|"ui:condition": ... },
 *      ...
 *    ]
 *  }
 * ```
 *
 * NOTE: Special note about the native `className` prop values. All className values will automatically be looked up in
 *       the `formContext.lookupMap` in case they have been defined using a CSS-in-JS approach. In other words, from the
 *       example above, if the `Form` was constructed with a `lookupMap` set to `{ GridRow: cssInJs.GridRowClass }`
 *       then when rendered, the native `GridTemplate` will get the `className` with the value from
 *       `cssInJs.GridRowClass`. This automatic lookup will happen for any of the "grid elements" when rendering with
 *       `GridTemplate` props. If multiple className values are present, for example:
 *       `{ className: 'GridRow GridColumn' }`, the classNames are split apart, looked up individually, and joined
 *       together to form one className with the values from `cssInJs.GridRowClass` and `cssInJs.GridColumnClass`.
 *
 * The `ui:col` grid element is used to specify the list of columns within a grid row. A `ui:col` element can take on
 * several forms: 1) a simple list of dotted-path field names within the root field; 2) a list of objects containing the
 * dotted-path field `name` any other props that are gathered into `ui:options` for the field; 3) a list with a one-off
 * `render` functional component with or without a non-field `name` identifier and any other to-be-spread props; and
 * 4) an object with native `GridTemplate` implementation specific props and a `children` array with 1) or 2) or even a
 * nested `ui:row` or a `ui:condition` containing a `ui:row` (although this should be used carefully). E.g.
 * (as JSON objects):
 *
 * Simple `ui:col` definition, without additional `GridTemplate` props and form 1 only children:
 * ```
 * "ui:col": ["innerField", "inner.grandChild", ...]
 * ```
 *
 * Complicated `ui:col` definition, without additional `GridTemplate` props and form 2 only children:
 * ```
 * "ui:col": [
 *    { "name": "innerField", "fullWidth": true },
 *    { "name": "inner.grandChild", "convertOther": true },
 *    ...
 *  ]
 * ```
 *
 * More complicated `ui:col` definition, without additional `GridTemplate` props and form 2 children, one being a
 * one-off `render` functional component without a non-field `name` identifier
 * ```
 * "ui:col": [
 *   "innerField",
 *     {
 *       "render": "WizardNavButton",
 *       "isNext": true,
 *       "size": "large"
 *     }
 *  ]
 *  ```
 *
 * Most complicated `ui:col` definition, additional `GridTemplate` props and form 1, 2 and 3 children  (this example
 * uses @mui/material/Grid2 native props):
 * ```
 * "ui:col": {
 *    "size": { "md": 4 },
 *    "className": "GridColumn",
 *    "children": [
 *      "innerField",
 *      { "name": "inner.grandChild", "convertOther": true },
 *      { "name": "customRender", "render": "CustomRender", toSpread: "prop-value" }
 *      { "ui:row|ui:condition": ... }
 *      ...
 *    ]
 *    }
 * ```
 *
 * NOTE: If a `name` prop does not exist or its value does not match any field in a schema, then it is assumed to be a
 *       custom `render` component. If the `render` prop does not exist, a null render will occur. If `render` is a
 *       string, its value will be looked up in the `formContext.lookupMap` first before defaulting to a null render.
 *
 * The `ui:columns` grid element is syntactic sugar to specify a set of `ui:col` columns that all share the same set of
 * native `GridTemplate` props. In other words rather than writing the following configuration that renders a
 * `<GridTemplate>` element with 3 `<GridTemplate column className="GridColumn col-md-4">` nodes and 2
 * `<GridTemplate column className="col-md-6">` nodes within it (one for each of the fields contained in the `children`
 * list):
 *
 * ```
 * "ui:row": {
 *   "children": [
 *     {
 *       "ui:col": {
 *         "className": "GridColumn col-md-4",
 *         "children": ["innerField"],
 *       }
 *     },
 *     {
 *       "ui:col": {
 *         "className": "GridColumn col-md-4",
 *         "children": ["inner.grandChild"],
 *       }
 *     },
 *     {
 *       "ui:col": {
 *         "className": "GridColumn col-md-4",
 *         "children": [{ "name": "inner.grandChild2" }],
 *       }
 *     },
 *     {
 *       "ui:col": {
 *         "className": "col-md-6",
 *         "children": ["innerField2"],
 *       }
 *     },
 *     {
 *       "ui:col": {
 *         "className": "col-md-6",
 *         "children": ["inner.grandChild3"],
 *       }
 *     },

 *   ]
 * }
 * ```
 *
 * One can write this instead:
 * ```
 * "ui:row": {
 *   "children": [
 *     {
 *       "ui:columns": {
 *         "className": "GridColumn col-md-4",
 *         "children": ["innerField", "inner.grandChild", { "name": "inner.grandChild2", "convertOther": true }],
 *       }
 *     },
 *     {
 *       "ui:columns": {
 *         "className": "col-md-6",
 *         "children": ["innerField2", "inner.grandChild3"],
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * NOTE: This syntax differs from
 *       `"ui:col": { "className": "col-md-6", "children": ["innerField2", "inner.grandChild3"] }` in that
 *       the `ui:col` will render the two children fields inside a single `<GridTemplate "className": "col-md-6",>`
 *       element.
 *
 * The final grid element, `ui:condition`, allows for conditionally displaying "grid elements" within a row based on the
 * current value of a field as it relates to a (list of) hard-coded value(s). There are four elements that make up a
 * `ui:condition`: 1) the dotted-path `field` name within the root field that makes up the left-side of the condition;
 * 2) the hard-coded `value` (single or list) that makes up the right-side of the condition; 3) the `operator` that
 * controls how the left and right sides of the condition are compared; and 4) the `children` array that defines the
 * "grid elements" to display if the condition passes.
 *
 * A `ui:condition` uses one of three `operators` when deciding if a condition passes: 1) The `all` operator will pass
 * when the right-side and left-side contains all the same value(s); 2) the `some` operator will pass when the
 * right-side and left-side contain as least one value in common; 3) the `none` operator will pass when the right-side
 * and left-side do not contain any values in common. E.g. (as JSON objects):
 *
 * Here is how to render an if-then-else for `field2` which is an enum that has 3 known values and supports allowing
 * any other value:
 * ```
 * "ui:row": [
 *   {
 *     "ui:condition": {
 *       "field": "field2",
 *       "operator": "all",
 *       "value": "value1",
 *       "children": [
 *         { "ui:row": [...] },
 *       ],
 *     }
 *   },
 *   {
 *     "ui:condition": {
 *       "field": "field2",
 *       "operator": "some",
 *       "value": ["value2", "value3"],
 *       "children": [
 *         { "ui:row": [...] },
 *       ],
 *     }
 *   },
 *   {
 *     "ui:condition": {
 *       "field": "field2",
 *       "operator": "none",
 *       "value": ["value1", "value2", "value3"],
 *       "children": [
 *         { "ui:row": [...] },
 *       ],
 *     }
 *   }
 * ]
 * ```
 */
export default class LayoutGridField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> extends PureComponent<LayoutGridFieldProps<T, S, F>> {
  static defaultProps = {
    layoutGridSchema: undefined,
  };

  static TEST_IDS = getTestIds();
  /** Computes the uiSchema for the field with `name` from the `uiProps` and `uiSchema` provided. The field UI Schema
   * will always contain a copy of the global options from the `uiSchema` (so they can be passed down) as well as
   * copying them into the local ui options. When the `forceReadonly` flag is true, then the field UI Schema is
   * updated to make "readonly" be true. When the `schemaReadonly` flag is true AND the field UI Schema does NOT have
   * the flag already provided, then we also make "readonly" true. We always make sure to return the final value of the
   * field UI Schema's "readonly" flag as `uiReadonly` along with the `fieldUiSchema` in the return value.
   *
   * @param field - The name of the field to pull the existing UI Schema for
   * @param uiProps - Any props that should be put into the field's uiSchema
   * @param [uiSchema] - The optional UI Schema from which to get the UI schema for the field
   * @param [schemaReadonly] - Optional flag indicating whether the schema indicates the field is readonly
   * @param [forceReadonly] - Optional flag indicating whether the Form itself is in readonly mode
   */
  static computeFieldUiSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    field: string,
    uiProps: ConfigObject,
    uiSchema?: UiSchema<T, S, F>,
    schemaReadonly?: boolean,
    forceReadonly?: boolean
  ) {
    const globalUiOptions = get(uiSchema, [UI_GLOBAL_OPTIONS], {});
    const localUiSchema = get(uiSchema, field);
    const localUiOptions = { ...get(localUiSchema, [UI_OPTIONS_KEY], {}), ...uiProps, ...globalUiOptions };
    const fieldUiSchema = { ...localUiSchema };
    if (!isEmpty(localUiOptions)) {
      set(fieldUiSchema, [UI_OPTIONS_KEY], localUiOptions);
    }
    if (!isEmpty(globalUiOptions)) {
      // pass the global uiOptions down to the field uiSchema so that they can be applied to all nested fields
      set(fieldUiSchema, [UI_GLOBAL_OPTIONS], globalUiOptions);
    }
    let { readonly: uiReadonly } = getUiOptions<T, S, F>(fieldUiSchema);
    if (forceReadonly === true || (isUndefined(uiReadonly) && schemaReadonly === true)) {
      // If we are forcing all widgets to be readonly, OR the schema indicates it is readonly AND the uiSchema does not
      // have an overriding value, then update the uiSchema to set readonly to true. Doing this will
      uiReadonly = true;
      if (has(localUiOptions, READONLY_KEY)) {
        // If the local options has the key value provided in it, then set that one to true
        set(fieldUiSchema, [UI_OPTIONS_KEY, READONLY_KEY], true);
      } else {
        // otherwise set the `ui:` version
        set(fieldUiSchema, `ui:${READONLY_KEY}`, true);
      }
    }
    return { fieldUiSchema, uiReadonly };
  }

  /** Given an `operator`, `datum` and `value` determines whether this condition is considered matching. Matching
   * depends on the `operator`. The `datum` and `value` are converted into arrays if they aren't already and then the
   * contents of the two arrays are compared using the `operator`. When `operator` is All, then the two arrays must be
   * equal to match. When `operator` is SOME then the intersection of the two arrays must have at least one value in
   * common to match. When `operator` is NONE then the intersection of the two arrays must not have any values in common
   * to match.
   *
   * @param [operator] - The optional operator for the condition
   * @param [datum] - The optional datum for the condition, this can be an item or a list of items of type unknown
   * @param [value='$0m3tH1nG Un3xP3cT3d'] The optional value for the condition, defaulting to a highly unlikely value
   *        to avoid comparing two undefined elements when `value` was forgotten in the condition definition.
   *        This can be an item or a list of items of type unknown
   * @returns - True if the condition matches, false otherwise
   */
  static conditionMatches(operator?: Operators, datum?: unknown, value: unknown = '$0m3tH1nG Un3xP3cT3d'): boolean {
    const data = flatten([datum]).sort();
    const values = flatten([value]).sort();
    switch (operator) {
      case Operators.ALL:
        return isEqual(data, values);
      case Operators.SOME:
        return intersection(data, values).length > 0;
      case Operators.NONE:
        return intersection(data, values).length === 0;
      default:
        return false;
    }
  }

  /** From within the `layoutGridSchema` finds the `children` and any extra `gridProps` from the object keyed by
   * `schemaKey`. If the `children` contains extra `gridProps` and those props contain a `className` string, try to
   * lookup whether that `className` has a replacement value in the `registry` using the `FORM_CONTEXT_LOOKUP_BASE`.
   * When the `className` value contains multiple classNames separated by a space, the lookup will look for a
   * replacement value for each `className` and combine them into one.
   *
   * @param layoutGridSchema - The GridSchemaType instance from which to obtain the `schemaKey` children and extra props
   * @param schemaKey - A `GridType` value, used to get the children and extra props from within the `layoutGridSchema`
   * @param registry - The `@rjsf` Registry from which to look up `classNames` if they are present in the extra props
   * @returns - An object containing the list of `LayoutGridSchemaType` `children` and any extra `gridProps`
   * @throws - A `TypeError` when the `children` is not an array
   */
  static findChildrenAndProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    layoutGridSchema: GridSchemaType,
    schemaKey: GridType,
    registry: Registry<T, S, F>
  ) {
    let gridProps: GridProps = {};
    let children = layoutGridSchema[schemaKey];
    if (isPlainObject(children)) {
      const { children: elements, className: toMapClassNames, ...otherProps } = children as ConfigObject;
      children = elements;
      if (toMapClassNames) {
        const classes = toMapClassNames.split(' ');
        const className = classes.map((ele: string) => lookupFromFormContext<T, S, F>(registry, ele, ele)).join(' ');
        gridProps = { ...otherProps, className };
      } else {
        gridProps = otherProps;
      }
    }
    if (!Array.isArray(children)) {
      throw new TypeError(`Expected array for "${schemaKey}" in ${JSON.stringify(layoutGridSchema)}`);
    }
    return { children: children as LayoutGridSchemaType[], gridProps };
  }

  /** Generates an idSchema for the `schema` using `@rjsf`'s `toIdSchema` util, passing the `baseIdSchema`'s `$id` value
   * as the id prefix.
   *
   * @param schemaUtils - The `SchemaUtilsType` used to call `toIdSchema`
   * @param schema - The schema to generate the idSchema for
   * @param baseIdSchema - The IdSchema for the base
   * @param formData - The formData to pass the `toIdSchema`
   * @param [idSeparator] - The param to pass into the `toIdSchema` util which will use it to join the `idSchema` paths
   * @returns - The generated `idSchema` for the `schema`
   */
  static getIdSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    schemaUtils: SchemaUtilsType<T, S, F>,
    baseIdSchema: IdSchema<T>,
    formData: FieldProps['formData'],
    schema: S = {} as S,
    idSeparator?: string
  ): FieldProps<T, S, F>['idSchema'] {
    const baseId = get(baseIdSchema, ID_KEY);
    return schemaUtils.toIdSchema(schema, baseId, formData, baseId, idSeparator);
  }

  /** Given a `dottedPath` to a field in the `initialSchema`, iterate through each individual path in the schema until
   * the leaf path is found and returned (along with whether that leaf path `isRequired`) OR no schema exists for an
   * element in the path. If the leaf schema element happens to be a oneOf/anyOf then also return the oneOf/anyOf as
   * `options`.
   *
   * @param schemaUtils - The `SchemaUtilsType` used to call `retrieveSchema`
   * @param dottedPath - The dotted-path to the field for which to get the schema
   * @param initialSchema - The initial schema to start the search from
   * @param formData - The formData, useful for resolving a oneOf/anyOf selection in the path hierarchy
   * @param initialIdSchema - The initial idSchema to start the search from
   * @param [idSeparator] - The param to pass into the `toIdSchema` util which will use it to join the `idSchema` paths
   * @returns - An object containing the destination schema, isRequired and isReadonly flags for the field and options
   *            info if a oneOf/anyOf
   */
  static getSchemaDetailsForField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    schemaUtils: SchemaUtilsType<T, S, F>,
    dottedPath: string,
    initialSchema: S,
    formData: FieldProps<T, S, F>['formData'],
    initialIdSchema: IdSchema<T>,
    idSeparator?: string
  ): {
    schema?: S;
    isRequired: boolean;
    isReadonly?: boolean;
    optionsInfo?: OneOfOptionsInfoType<S>;
    idSchema: IdSchema<T>;
  } {
    let rawSchema: S = initialSchema;
    let idSchema = initialIdSchema;
    const parts: string[] = dottedPath.split('.');
    const leafPath: string | undefined = parts.pop(); // pop off the last element in the list as the leaf
    let schema: S | undefined = schemaUtils.retrieveSchema(rawSchema, formData); // always returns an object
    let innerData = formData;
    let isReadonly: boolean | undefined = schema.readOnly;

    // For all the remaining path parts
    parts.forEach((part) => {
      // dive into the properties of the current schema (when it exists) and get the schema for the next part
      if (has(schema, PROPERTIES_KEY)) {
        rawSchema = get(schema, [PROPERTIES_KEY, part]);
        idSchema = get(idSchema, part, {}) as IdSchema<T>;
      } else if (schema && (has(schema, ONE_OF_KEY) || has(schema, ANY_OF_KEY))) {
        const xxx = has(schema, ONE_OF_KEY) ? ONE_OF_KEY : ANY_OF_KEY;
        // When the schema represents a oneOf/anyOf, find the selected schema for it and grab the inner part
        const selectedSchema = schemaUtils.findSelectedOptionInXxxOf(schema, part, xxx, innerData);
        const selectedIdSchema = LayoutGridField.getIdSchema<T, S, F>(
          schemaUtils,
          idSchema,
          formData,
          selectedSchema,
          idSeparator
        );
        rawSchema = get(selectedSchema, [PROPERTIES_KEY, part], {}) as S;
        idSchema = get(selectedIdSchema, part, {}) as IdSchema<T>;
      } else {
        rawSchema = {} as S;
      }
      // Now drill into the innerData for the part, returning an empty object by default if it doesn't exist
      innerData = get(innerData, part, {}) as T;
      // Resolve any `$ref`s for the current rawSchema
      schema = schemaUtils.retrieveSchema(rawSchema, innerData);
      isReadonly = getNonNullishValue(schema.readOnly, isReadonly);
    });

    let optionsInfo: OneOfOptionsInfoType<S> | undefined;
    let isRequired = false;
    // retrieveSchema will return an empty schema in the worst case scenario, convert it to undefined
    if (isEmpty(schema)) {
      schema = undefined;
    }
    if (schema && leafPath) {
      // When we have both a schema and a leafPath...
      if (schema && (has(schema, ONE_OF_KEY) || has(schema, ANY_OF_KEY))) {
        const xxx = has(schema, ONE_OF_KEY) ? ONE_OF_KEY : ANY_OF_KEY;
        // Grab the selected schema for the oneOf/anyOf value for the leafPath using the innerData
        schema = schemaUtils.findSelectedOptionInXxxOf(schema, leafPath, xxx, innerData);
        // Generate the idSchema for the oneOf/anyOf value then merge with the existing `idSchema`
        const rawIdSchema = LayoutGridField.getIdSchema<T, S, F>(schemaUtils, idSchema, formData, schema, idSeparator);
        idSchema = mergeObjects(rawIdSchema, idSchema) as IdSchema<T>;
      }
      isRequired = schema !== undefined && Array.isArray(schema.required) && includes(schema.required, leafPath);
      // Now grab the schema from the leafPath of the current schema properties
      schema = get(schema, [PROPERTIES_KEY, leafPath]) as S | undefined;
      // Resolve any `$ref`s for the current schema
      schema = schema ? schemaUtils.retrieveSchema(schema) : schema;
      idSchema = get(idSchema, leafPath, {}) as IdSchema<T>;
      isReadonly = getNonNullishValue(schema?.readOnly, isReadonly);
      if (schema && (has(schema, ONE_OF_KEY) || has(schema, ANY_OF_KEY))) {
        const xxx = has(schema, ONE_OF_KEY) ? ONE_OF_KEY : ANY_OF_KEY;
        // Set the options if we have a schema with a oneOf/anyOf
        const discriminator = getDiscriminatorFieldFromSchema(schema);
        optionsInfo = { options: schema[xxx] as S[], hasDiscriminator: !!discriminator };
      }
    }

    return { schema, isRequired, isReadonly, optionsInfo, idSchema };
  }

  /** Gets the custom render component from the `render`, by either determining that it is either already a function or
   * it is a non-function value that can be used to look up the function in the registry. If no function can be found,
   * null is returned.
   *
   * @param render - The potential render function or lookup name to one
   * @param registry - The `@rjsf` Registry from which to look up `classNames` if they are present in the extra props
   * @returns - Either a render function if available, or null if not
   */
  static getCustomRenderComponent<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    render: string | RenderComponent,
    registry: Registry<T, S, F>
  ): RenderComponent | null {
    let customRenderer = render;
    if (isString(customRenderer)) {
      customRenderer = lookupFromFormContext<T, S, F>(registry, customRenderer);
    }
    if (isFunction(customRenderer)) {
      return customRenderer;
    }
    return null;
  }

  /** Constructs an `LayoutGridField` with the given `props`
   *
   * @param props - The `LayoutGridField` for this template
   */
  constructor(props: LayoutGridFieldProps<T, S, F>) {
    super(props);
  }

  /** Generates an `onChange` handler for the field associated with the `dottedPath`. This handler will clone and update
   * the `formData` with the new `value` and the `errorSchema` if an `errSchema` is provided. After updating those two
   * elements, they will then be passed on to the `onChange` handler of the `LayoutFieldGrid`.
   *
   * @param dottedPath - The dotted-path to the field for which to generate the onChange handler
   * @returns - The `onChange` handling function for the `dottedPath` field
   */
  onFieldChange = (dottedPath: string) => {
    return (value: unknown, errSchema?: ErrorSchema<T>, id?: string) => {
      const { onChange, errorSchema, formData } = this.props;
      const newFormData = cloneDeep(formData || ({} as T));
      let newErrorSchema = errorSchema;
      if (errSchema && errorSchema) {
        newErrorSchema = cloneDeep(errorSchema);
        set(newErrorSchema, dottedPath, errSchema);
      }
      set(newFormData as object, dottedPath, value);
      onChange(newFormData, newErrorSchema, id);
    };
  };

  /** Extract the `name`, and optional `render` and all other props from the `gridSchema`. We look up the `render` to
   * see if can be resolved to a UIComponent. If `name` does not exist and there is an optional `render` UIComponent, we
   * set the `rendered` component with only specified props for that component in the object.
   *
   * @param gridSchema - The string or object that represents the configuration for the grid field
   * @returns - The UIComponentPropsType computed from the gridSchema
   */
  computeUIComponentPropsFromGridSchema(gridSchema?: string | ConfigObject): UIComponentPropsType {
    const { registry } = this.props;
    let name: string;
    let UIComponent: RenderComponent | null = null;
    let uiProps: ConfigObject = {};
    let rendered: ReactNode | undefined;
    if (isString(gridSchema) || isUndefined(gridSchema)) {
      name = gridSchema ?? '';
    } else {
      const { name: innerName, render, ...innerProps } = gridSchema;
      name = innerName;
      uiProps = innerProps;
      UIComponent = LayoutGridField.getCustomRenderComponent<T, S, F>(render, registry);
      if (!innerName && UIComponent) {
        rendered = <UIComponent {...innerProps} data-testid={LayoutGridField.TEST_IDS.uiComponent} />;
      }
    }
    return { name, UIComponent, uiProps, rendered };
  }

  /** Renders the `children` of the `GridType.CONDITION` if it passes. The `layoutGridSchema` for the
   * `GridType.CONDITION` is separated into the `children` and other `gridProps`. The `gridProps` are used to extract
   * the `operator`, `field` and `value` of the condition. If the condition matches, then all of the `children` are
   * rendered, otherwise null is returned.
   *
   * @param layoutGridSchema - The string or object that represents the configuration for the grid field
   * @returns - The rendered the children for the `GridType.CONDITION` or null
   */
  renderCondition(layoutGridSchema: GridSchemaType) {
    const { formData, registry } = this.props;
    const { children, gridProps } = LayoutGridField.findChildrenAndProps<T, S, F>(
      layoutGridSchema,
      GridType.CONDITION,
      registry
    );
    const { operator, field = '', value } = gridProps;
    const fieldData = get(formData, field, null);
    if (LayoutGridField.conditionMatches(operator, fieldData, value)) {
      return this.renderChildren(children);
    }
    return null;
  }

  /** Renders a material-ui `GridTemplate` as an item. The `layoutGridSchema` for the `GridType.COLUMN` is separated
   * into the `children` and other `gridProps`. The `gridProps` will be spread onto the outer `GridTemplate`. Inside
   * the `GridTemplate` all the `children` are rendered.
   *
   * @param layoutGridSchema - The string or object that represents the configuration for the grid field
   * @returns - The rendered `GridTemplate` containing the children for the `GridType.COLUMN`
   */
  renderCol(layoutGridSchema: GridSchemaType) {
    const { registry, uiSchema } = this.props;
    const { children, gridProps } = LayoutGridField.findChildrenAndProps<T, S, F>(
      layoutGridSchema,
      GridType.COLUMN,
      registry
    );
    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    const GridTemplate = getTemplate<'GridTemplate', T, S, F>('GridTemplate', registry, uiOptions);

    return (
      <GridTemplate column data-testid={LayoutGridField.TEST_IDS.col} {...gridProps}>
        {this.renderChildren(children)}
      </GridTemplate>
    );
  }

  /** Renders a material-ui `GridTemplate` as an item. The `layoutGridSchema` for the `GridType.COLUMNS` is separated
   * into the `children` and other `gridProps`. The `children` is iterated on and `gridProps` will be spread onto the
   * outer `GridTemplate`. Each child will have their own rendered `GridTemplate`.
   *
   * @param layoutGridSchema - The string or object that represents the configuration for the grid field
   * @returns - The rendered `GridTemplate` containing the children for the `GridType.COLUMNS`
   */
  renderColumns(layoutGridSchema: GridSchemaType) {
    const { registry, uiSchema } = this.props;
    const { children, gridProps } = LayoutGridField.findChildrenAndProps<T, S, F>(
      layoutGridSchema,
      GridType.COLUMNS,
      registry
    );
    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    const GridTemplate = getTemplate<'GridTemplate', T, S, F>('GridTemplate', registry, uiOptions);

    return children.map((child) => (
      <GridTemplate
        column
        key={`column-${hashObject(child)}`}
        data-testid={LayoutGridField.TEST_IDS.col}
        {...gridProps}
      >
        {this.renderChildren([child])}
      </GridTemplate>
    ));
  }

  /** Renders a material-ui `GridTemplate` as a container. The
   * `layoutGridSchema` for the `GridType.ROW` is separated into the `children` and other `gridProps`. The `gridProps`
   * will be spread onto the outer `GridTemplate`. Inside of the `GridTemplate` all of the `children` are rendered.
   *
   * @param layoutGridSchema - The string or object that represents the configuration for the grid field
   * @returns - The rendered `GridTemplate` containing the children for the `GridType.ROW`
   */
  renderRow(layoutGridSchema: GridSchemaType) {
    const { registry, uiSchema } = this.props;
    const { children, gridProps } = LayoutGridField.findChildrenAndProps<T, S, F>(
      layoutGridSchema,
      GridType.ROW,
      registry
    );
    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    const GridTemplate = getTemplate<'GridTemplate', T, S, F>('GridTemplate', registry, uiOptions);

    return (
      <GridTemplate {...gridProps} data-testid={LayoutGridField.TEST_IDS.row}>
        {this.renderChildren(children)}
      </GridTemplate>
    );
  }

  /** Iterates through all the `childrenLayoutGridSchema`, rendering a nested `LayoutGridField` for each item in the
   * list, passing all the props for the current `LayoutGridField` along, updating the `schema` by calling
   * `retrieveSchema()` on it to resolve any `$ref`s. In addition to the updated `schema`, each item in
   * `childrenLayoutGridSchema` is passed as `layoutGridSchema`.
   *
   * @param childrenLayoutGridSchema - The list of strings or objects that represents the configurations for the
   *          children fields
   * @returns - The nested `LayoutGridField`s
   */
  renderChildren(childrenLayoutGridSchema: LayoutGridSchemaType[]) {
    const { registry, schema: rawSchema, formData } = this.props;
    const { schemaUtils } = registry;
    const schema = schemaUtils.retrieveSchema(rawSchema, formData);

    return childrenLayoutGridSchema.map((layoutGridSchema) => (
      <LayoutGridField<T, S, F>
        {...this.props}
        key={`layoutGrid-${hashObject(layoutGridSchema)}`}
        schema={schema}
        layoutGridSchema={layoutGridSchema}
      />
    ));
  }

  /** Renders the field described by `gridSchema`. If `gridSchema` is not an object, then is will be assumed
   * to be the dotted-path to the field in the schema. Otherwise, we extract the `name`, and optional `render` and all
   * other props. If `name` does not exist and there is an optional `render`, we return the `render` component with only
   * specified props for that component. If `name` exists, we take the name, the initial & root schemas and the formData
   * and get the destination schema, is required state and optional oneOf/anyOf options for it. If the destination
   * schema was located along with oneOf/anyOf options then a `LayoutMultiSchemaField` will be rendered with the
   * `uiSchema`, `errorSchema`, `idSchema` and `formData` drilled down to the dotted-path field, spreading any other
   * props from `gridSchema` into the `ui:options`. If the destination schema located without any oneOf/anyOf options,
   * then a `SchemaField` will be rendered with the same props as mentioned in the previous sentence. If no destination
   * schema was located, but a custom render component was found, then it will be rendered with many of the non-event
   * handling props. If none of the previous render paths are valid, then a null is returned.
   *
   * @param gridSchema - The string or object that represents the configuration for the grid field
   * @returns - One of `LayoutMultiSchemaField`, `SchemaField`, a custom render component or null, depending
   */
  renderField(gridSchema?: ConfigObject | string) {
    const {
      schema: initialSchema,
      uiSchema,
      errorSchema,
      idSchema,
      onBlur,
      onFocus,
      formData,
      readonly,
      registry,
      idSeparator,
      layoutGridSchema, // Used to pull this out of otherProps since we don't want to pass it through
      ...otherProps
    } = this.props;
    const { fields, schemaUtils } = registry;
    const { SchemaField, LayoutMultiSchemaField } = fields;
    const uiComponentProps = this.computeUIComponentPropsFromGridSchema(gridSchema);
    if (uiComponentProps.rendered) {
      return uiComponentProps.rendered;
    }
    const { name, UIComponent, uiProps } = uiComponentProps;
    const {
      schema,
      isRequired,
      isReadonly,
      optionsInfo,
      idSchema: fieldIdSchema,
    } = LayoutGridField.getSchemaDetailsForField<T, S, F>(
      schemaUtils,
      name,
      initialSchema,
      formData,
      idSchema,
      idSeparator
    );

    if (schema) {
      const Field = optionsInfo?.hasDiscriminator ? LayoutMultiSchemaField : SchemaField;
      // Call this function to get the appropriate UISchema, which will always have its `readonly` state matching the
      // `uiReadonly` flag that it returns. This is done since the `SchemaField` will always defer to the `readonly`
      // state in the uiSchema over anything in the props or schema. Because we are implementing the "readonly" state of
      // the `Form` via the prop passed to `LayoutGridField` we need to make sure the uiSchema always has a true value
      // when it is needed
      const { fieldUiSchema, uiReadonly } = LayoutGridField.computeFieldUiSchema<T, S, F>(
        name,
        uiProps,
        uiSchema,
        isReadonly,
        readonly
      );

      return (
        <Field
          data-testid={
            optionsInfo?.hasDiscriminator
              ? LayoutGridField.TEST_IDS.layoutMultiSchemaField
              : LayoutGridField.TEST_IDS.field
          }
          {...otherProps}
          name={name}
          required={isRequired}
          readonly={uiReadonly}
          schema={schema}
          uiSchema={fieldUiSchema}
          errorSchema={get(errorSchema, name)}
          idSchema={fieldIdSchema}
          idSeparator={idSeparator}
          formData={get(formData, name)}
          onChange={this.onFieldChange(name)}
          onBlur={onBlur}
          onFocus={onFocus}
          options={optionsInfo?.options}
          registry={registry}
        />
      );
    }

    if (UIComponent) {
      return (
        <UIComponent
          data-testid={LayoutGridField.TEST_IDS.uiComponent}
          {...otherProps}
          name={name}
          required={isRequired}
          formData={formData}
          readOnly={!!isReadonly || readonly}
          errorSchema={errorSchema}
          uiSchema={uiSchema}
          schema={initialSchema}
          idSchema={idSchema}
          idSeparator={idSeparator}
          onBlur={onBlur}
          onFocus={onFocus}
          registry={registry}
          {...uiProps}
        />
      );
    }
    return null;
  }

  /** Renders the `LayoutGridField`. If there isn't a `layoutGridSchema` prop defined, then try pulling it out of the
   * `uiSchema` via `ui:LayoutGridField`. If `layoutGridSchema` is an object, then check to see if any of the properties
   * match one of the `GridType`s. If so, call the appropriate render function for the type. Otherwise, just call the
   * generic `renderField()` function with the `layoutGridSchema`.
   *
   * @returns - the rendered `LayoutGridField`
   */
  render() {
    const { uiSchema } = this.props;
    let { layoutGridSchema } = this.props;
    const uiOptions = getUiOptions<T, S, F>(uiSchema);
    if (!layoutGridSchema && LAYOUT_GRID_UI_OPTION in uiOptions && isObject(uiOptions[LAYOUT_GRID_UI_OPTION])) {
      layoutGridSchema = uiOptions[LAYOUT_GRID_UI_OPTION];
    }

    if (isObject(layoutGridSchema)) {
      if (GridType.ROW in layoutGridSchema) {
        return this.renderRow(layoutGridSchema as GridSchemaType);
      }
      if (GridType.COLUMN in layoutGridSchema) {
        return this.renderCol(layoutGridSchema as GridSchemaType);
      }
      if (GridType.COLUMNS in layoutGridSchema) {
        return this.renderColumns(layoutGridSchema as GridSchemaType);
      }
      if (GridType.CONDITION in layoutGridSchema) {
        return this.renderCondition(layoutGridSchema as GridSchemaType);
      }
    }
    return this.renderField(layoutGridSchema);
  }
}

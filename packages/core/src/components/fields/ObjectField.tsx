import type { FocusEvent } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import type {
  ErrorSchemaChange,
  FieldChange,
  FieldPath,
  FieldProps,
  FormContextType,
  Registry,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  getByPath,
  hasByPath,
  setByPath,
  unsetByPath,
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ANY_OF_KEY,
  getFreePropertyNames,
  getMatchingPatternProperties,
  getTemplates,
  getPropertySchema,
  getUiOptions,
  isFormDataAvailable,
  orderProperties,
  shouldRenderOptionalField,
  toFieldPath,
  fieldPathToId,
  ONE_OF_KEY,
  REF_KEY,
  isObject,
  mapFieldChange,
  TranslatableString,
} from '@rjsf/utils';

import { ADDITIONAL_PROPERTY_KEY_REMOVE, EMPTY_UI_SCHEMA } from '../constants.ts';
import RichDescription from '../RichDescription.tsx';

/** Returns a flag indicating whether the `name` field is required in the object schema
 *
 * @param schema - The schema to check
 * @param name - The name of the field to check for required-ness
 * @returns - True if the field `name` is required, false otherwise
 */
function isRequired<S extends StrictRJSFSchema = RJSFSchema>(schema: S, name: string) {
  return Array.isArray(schema.required) && schema.required.includes(name);
}

/** Returns a default value to be used for a new additional schema property of the given `type`
 *
 * @param translateString - The string translation function from the registry
 * @param type - The type of the new additional schema property
 */
function getDefaultValue<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(translateString: Registry<T, S, F>['translateString'], type?: RJSFSchema['type']) {
  switch (type) {
    case 'array':
      return [];
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'number':
      return 0;
    case 'object':
      return {};
    case 'string':
    default:
      // We don't have a datatype for some reason (perhaps additionalProperties was true)
      return translateString(TranslatableString.NewStringDefault);
  }
}

function isAdditionalPropertySchema(schema: unknown) {
  return Boolean((schema as RJSFMarkedSchema)?.[ADDITIONAL_PROPERTY_FLAG]);
}

function getAdditionalPropertyOrder<S extends StrictRJSFSchema = RJSFSchema>(
  schemaProperties: NonNullable<S['properties']>,
) {
  return Object.keys(schemaProperties).filter((property) => isAdditionalPropertySchema(schemaProperties[property]));
}

/** An additional property's row. Its `id` is the property's React key, kept through renames so the row, and the
 * focus in its key input, survives them (#5010). The rows' order is the order the properties render in, which the
 * data itself can't hold for integer-like names (#5156).
 */
interface AdditionalPropertyRow {
  id: string;
  name: string;
}

/** Returns `preferredKey`, or the first `preferredKey{separator}{n}` that `isTaken` doesn't report as taken
 *
 * @param preferredKey - The preferred name of the key
 * @param isTaken - Whether a key is already in use
 * @param separator - The separator between the name and the index of a de-duplicated key
 * @returns - The first key that isn't taken
 */
function firstAvailableKey(preferredKey: string, isTaken: (key: string) => boolean, separator: string) {
  let index = 0;
  let key = preferredKey;
  while (isTaken(key)) {
    index += 1;
    key = `${preferredKey}${separator}${index}`;
  }
  return key;
}

/** Suffixes a row id with a character property names don't use in practice, so the id stays clear of names */
const ROW_ID_SEPARATOR = '\u0000';

/** Matches the rows to the additional properties the data holds, returning `rows` itself when they already match. The
 * data is what names a property: a rename only proposes a name, which the form may de-duplicate against keys the
 * rows never saw or a controlled parent may decline. So when exactly one row lost its name and exactly one new name
 * arrived, which is how any single rename lands, that row takes the new name and keeps its place and React key.
 * Otherwise rows whose name left the data are dropped and each new name gets a row of its own at the end, with its
 * name as its id unless another row holds that id.
 *
 * @param rows - The rows from the previous render
 * @param names - The additional properties the data holds, in the data's order
 * @returns - The rows, one per name in `names`
 */
function reconcileAdditionalRows(rows: AdditionalPropertyRow[], names: string[]): AdditionalPropertyRow[] {
  // Most renders rename, add and remove nothing, and those allocate nothing
  if (rows.length === names.length && rows.every((row, index) => row.name === names[index])) {
    return rows;
  }
  const nameSet = new Set(names);
  const rowNames = new Set(rows.map((row) => row.name));
  const orphans = rows.filter((row) => !nameSet.has(row.name));
  const arrivals = names.filter((name) => !rowNames.has(name));
  if (orphans.length === 0 && arrivals.length === 0) {
    return rows;
  }
  if (orphans.length === 1 && arrivals.length === 1) {
    return rows.map((row) => (row === orphans[0] ? { ...row, name: arrivals[0] } : row));
  }
  const kept = rows.filter((row) => nameSet.has(row.name));
  const ids = new Set(kept.map((row) => row.id));
  for (const name of arrivals) {
    const id = firstAvailableKey(name, (candidate) => ids.has(candidate), ROW_ID_SEPARATOR);
    ids.add(id);
    kept.push({ id, name });
  }
  return kept;
}

/** Picks the name a new additional property should prefer out of the `freeNames` the schema still allows. Without an
 * `additionalProperties` schema to fall back on, a name matching none of the `patternProperties` patterns has no
 * subschema of its own and `retrieveSchema()` stubs it as the unusable `{ type: 'null' }`, so a name that does match
 * a pattern is worth more to the user than the first one the `enum` happens to list. It stays a preference rather
 * than a restriction: the schema allows every name it enumerates, and a field the user can still rename beats no new
 * property at all.
 *
 * @param schema - The object schema the property is being added to
 * @param freeNames - The allowed names no property and no form data key has taken
 * @returns - The free name to add under, or undefined when none is preferable to the first
 */
function findPreferredPropertyName<S extends StrictRJSFSchema = RJSFSchema>(schema: S, freeNames: string[]) {
  if (!schema.patternProperties || isObject(schema.additionalProperties)) {
    return undefined;
  }
  return freeNames.find((freeName) => Object.keys(getMatchingPatternProperties<S>(schema, freeName)).length > 0);
}

/** Props for the `ObjectFieldProperty` component */
interface ObjectFieldPropertyProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends Omit<FieldProps<T, S, F>, 'name'> {
  /** The name of the property within the parent object */
  propertyName: string;
  /** Flag indicating whether this property was added by the additionalProperties UI */
  addedByAdditionalProperties: boolean;
  /** Callback that handles the rename of an additionalProperties-based property key */
  handleKeyRename: (oldKey: string, newKey: string) => void;
  /** Callback that handles the removal of an additionalProperties-based property with key */
  handleRemoveProperty: (keyName: string) => void;
  /** The key names this property may be renamed to, when the parent schema's `propertyNames` constrains them */
  propertyNamesEnum?: string[];
}

/** The `ObjectFieldProperty` component is used to render the `SchemaField` for a child property of an object
 */
function ObjectFieldPropertyFn<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldPropertyProps<T, S, F>) {
  const {
    fieldPath,
    schema,
    registry,
    uiSchema,
    errorSchema,
    formData,
    onChange,
    onBlur,
    onFocus,
    disabled,
    readonly,
    required,
    hideError,
    propertyName,
    handleKeyRename,
    handleRemoveProperty,
    addedByAdditionalProperties,
    propertyNamesEnum,
  } = props;
  const [wasPropertyKeyModified, setWasPropertyKeyModified] = useState(false);
  const { globalFormOptions, fields } = registry;
  const { SchemaField } = fields;
  const innerFieldPath = toFieldPath(propertyName, fieldPath);
  const innerFieldId = fieldPathToId(innerFieldPath, globalFormOptions);

  /** The `onChange` handler installed on this property's `SchemaField`. Handles the special case where the user
   * clears a value at this property's own path when it was added as an additional property, coercing `undefined`
   * to the empty string so the property's key input survives. Every other change, including any change to a
   * descendant of this property, is forwarded to `onChange()` untouched.
   */
  const onPropertyChange = useCallback(
    (value: FieldChange<T | undefined>, path: FieldPath, newErrorSchema?: ErrorSchemaChange<T>, id?: string) => {
      // An `additionalProperties` value lives at this property's own path, so clearing its widget to `undefined`
      // would drop the key from the formData and take the key input with it. Coerce that one case to the empty
      // string, for an updater's result as well as for a value.
      // A descendant's path is this property's path plus at least one segment, so comparing to this
      // property's own path (rather than merely its length) tells apart "this property changed" from "a
      // descendant changed"; a cleared descendant must stay `undefined` so it is omitted from the formData
      // exactly like a cleared property declared in `properties` (#5222).
      const normalizedValue =
        addedByAdditionalProperties && path === innerFieldPath
          ? mapFieldChange(value, (next) => {
              if (next === undefined) {
                return '' as unknown as T;
              }
              return next;
            })
          : value;
      onChange(normalizedValue, path, newErrorSchema, id);
    },
    [onChange, addedByAdditionalProperties, innerFieldPath],
  );

  /** The key change event handler; Called when the key associated with a field is changed for an additionalProperty.
   * simply returns a function that call the `handleKeyChange()` event with the value
   */
  const onKeyRename = useCallback(
    (value: string) => {
      if (propertyName !== value) {
        setWasPropertyKeyModified(true);
      }
      handleKeyRename(propertyName, value);
    },
    [propertyName, handleKeyRename],
  );

  /** Returns a callback the handle the blur event, getting the value from the target and passing that along to the
   * `handleKeyChange` function
   */
  const onKeyRenameBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const {
        target: { value },
      } = event;
      onKeyRename(value);
    },
    [onKeyRename],
  );

  /** The property drop/removal event handler; Called when a field is removed in an additionalProperty context
   */
  const onRemoveProperty = useCallback(() => {
    handleRemoveProperty(propertyName);
  }, [propertyName, handleRemoveProperty]);

  return (
    <SchemaField
      name={propertyName}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      errorSchema={errorSchema}
      fieldPath={innerFieldPath}
      id={innerFieldId}
      formData={formData}
      wasPropertyKeyModified={wasPropertyKeyModified}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      propertyNamesEnum={propertyNamesEnum}
      onChange={onPropertyChange}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
    />
  );
}

const ObjectFieldProperty = memo(ObjectFieldPropertyFn) as typeof ObjectFieldPropertyFn;

/** The `ObjectField` component is used to render a field in the schema that is of type `object`. It tracks whether an
 * additional property key was modified and what it was modified to
 *
 * @param props - The `FieldProps` for this template
 */
export default function ObjectField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    schema: rawSchema,
    uiSchema: rawUiSchema,
    formData,
    errorSchema,
    fieldPath,
    id,
    name,
    required = false,
    disabled,
    readonly,
    hideError,
    rawErrors,
    onBlur,
    onFocus,
    onChange,
    registry,
    title,
  } = props;
  const uiSchema: UiSchema<T, S, F> = rawUiSchema ?? EMPTY_UI_SCHEMA;
  const { fields, schemaUtils, translateString, globalUiOptions, uiSchemaDefinitions } = registry;
  const { OptionalDataControlsField } = fields;
  const schema: S = useMemo(
    () => schemaUtils.retrieveSchema(rawSchema, formData, true),
    [schemaUtils, rawSchema, formData],
  );
  const uiOptions = useMemo(() => getUiOptions<T, S, F>(uiSchema, globalUiOptions), [uiSchema, globalUiOptions]);
  const schemaProperties = useMemo(() => schema.properties ?? {}, [schema.properties]);
  const schemaAdditionalProperties = useMemo(() => getAdditionalPropertyOrder<S>(schemaProperties), [schemaProperties]);
  const [storedRows, setStoredRows] = useState<AdditionalPropertyRow[]>(() =>
    schemaAdditionalProperties.map((property) => ({ id: property, name: property })),
  );
  const additionalRows = reconcileAdditionalRows(storedRows, schemaAdditionalProperties);
  if (additionalRows !== storedRows) {
    setStoredRows(additionalRows);
  }
  const definedPropertyOrder = useMemo(() => {
    const additionalPropertySet = new Set(schemaAdditionalProperties);
    return Object.keys(schemaProperties).filter((property) => !additionalPropertySet.has(property));
  }, [schemaProperties, schemaAdditionalProperties]);
  // Depended on directly rather than through `schema`, which is a fresh object for every `formData` change, so the
  // resolution below runs once per schema rather than once per keystroke anywhere in the object
  const { propertyNames } = schema;
  // Resolved so that a `propertyNames` written as a `$ref` or an `allOf` still yields its `enum`. Everything that
  // reads the allowed names does so off this one schema — the dropdowns below, `onAddProperty`, and the
  // `canExpand()` the `ObjectFieldTemplate` calls on the `schema` it is handed — so none of them can disagree with
  // the others about which names the schema allows
  const resolvedPropertyNames = useMemo(() => {
    if (!isObject(propertyNames)) {
      return undefined;
    }
    try {
      return schemaUtils.retrieveSchema(propertyNames as S);
    } catch {
      // A `$ref` that names no definition, or one that resolves circularly, is for the validator to report: nothing
      // else in the form reads `propertyNames`, so a throw here would take down an object that otherwise renders.
      // The unresolved schema stands in, enumerating nothing, which is what an unconstrained object already does
      return propertyNames as S;
    }
  }, [propertyNames, schemaUtils]);
  const resolvedSchema = useMemo(
    () => (resolvedPropertyNames ? { ...schema, propertyNames: resolvedPropertyNames } : schema),
    [resolvedPropertyNames, schema],
  );
  /** The names each property may be renamed to, keyed by its current name. A name a sibling already holds is left out
   * because renaming onto a taken name de-duplicates it to `name-1`, which `propertyNames` then rejects. A property
   * left with no name to offer — every allowed name is taken and its own is not one of them — is absent from the map,
   * so it keeps the free-text key input rather than getting a dropdown it can pick nothing from.
   */
  const allowedPropertyNames = useMemo(() => {
    // `retrieveSchema()` stubs every key of the form data in among the properties, so the properties alone already
    // name everything taken and the form data would add nothing but a dependency that changes on every keystroke
    if (getFreePropertyNames<T, S>(resolvedSchema) === undefined) {
      return undefined;
    }
    // Only an additional property is offered the dropdown, so a declared one has no use for a list of its own
    return new Map(
      getAdditionalPropertyOrder<S>(resolvedSchema.properties ?? {})
        .map((property): [string, string[]] => [
          property,
          getFreePropertyNames<T, S>(resolvedSchema, undefined, property) ?? [],
        ])
        .filter(([, allowedNames]) => allowedNames.length > 0),
    );
  }, [resolvedSchema]);

  const templateTitle = uiOptions.title ?? schema.title ?? title ?? name;
  const description = uiOptions.description ?? schema.description;
  const renderOptionalField = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T>(formData);
  let orderedProperties: string[] = [];
  const separator = uiOptions.duplicateKeySuffixSeparator ?? '-';

  /** Handles the adding of a new additional property on the given `schema`. Calls the `onChange` callback with an
   * updater that adds the new property's default data to the data the form holds, so an add made in the same tick as a
   * rename or another add applies to the data that one produced.
   */
  const onAddProperty = useCallback(() => {
    if (!(schema.additionalProperties || schema.patternProperties)) {
      return;
    }
    onChange((current) => {
      // A `propertyNames.enum` makes the generic `newKey` an invalid name, so the new property goes under an allowed
      // name that is still free. `canExpand()` hides the add button once every allowed name is taken, so getting here
      // with none left means a custom template is offering it anyway, and adding no property beats adding one the
      // schema forbids
      const freeNames = getFreePropertyNames<T, S>(resolvedSchema, current);
      if (freeNames?.length === 0) {
        return current;
      }
      const newFormData = { ...current } as T;
      const preferredKey = freeNames ? (findPreferredPropertyName<S>(schema, freeNames) ?? freeNames[0]) : 'newKey';
      const newKey = firstAvailableKey(preferredKey, (key) => hasByPath(current, key), separator);
      if (schema.patternProperties) {
        setByPath(newFormData, newKey, null);
        return newFormData;
      }
      let type: RJSFSchema['type'] = undefined;
      let constValue: RJSFSchema['const'] = undefined;
      let defaultValue: RJSFSchema['default'] = undefined;
      if (isObject(schema.additionalProperties)) {
        type = schema.additionalProperties.type;
        constValue = schema.additionalProperties.const;
        defaultValue = schema.additionalProperties.default;
        let apSchema = schema.additionalProperties;
        const wasRef = REF_KEY in apSchema;
        if (wasRef) {
          apSchema = schemaUtils.retrieveSchema({ [REF_KEY]: apSchema[REF_KEY] } as S, current);
          type = apSchema.type;
          constValue = apSchema.const;
        }
        if (!type && (ANY_OF_KEY in apSchema || ONE_OF_KEY in apSchema)) {
          type = 'object';
        }
        // Route through the normal default pipeline (the same one an existing additionalProperties entry already
        // goes through) for every additionalProperties shape — not just object/$ref — so nested schema defaults and
        // ui:initialValue/ui:emptyValue on uiSchema.additionalProperties apply the same way they do when Form first
        // mounts with that key already present in formData.
        defaultValue = schemaUtils.getDefaultFormState(
          apSchema as S,
          defaultValue as T,
          undefined,
          undefined,
          getByPath<UiSchema<T, S, F> | undefined>(uiSchema, ADDITIONAL_PROPERTIES_KEY),
          uiSchemaDefinitions,
        ) as RJSFSchema['default'];
      }
      const newValue = constValue ?? defaultValue ?? getDefaultValue<T, S, F>(translateString, type);
      setByPath(newFormData, newKey, newValue);
      return newFormData;
    }, fieldPath);
  }, [
    onChange,
    translateString,
    schemaUtils,
    fieldPath,
    separator,
    schema,
    resolvedSchema,
    uiSchema,
    uiSchemaDefinitions,
  ]);

  /** Renames an additional property's key, moving its data under the new key
   *
   * @param oldKey - The old key for the field
   * @param newKey - The new key for the field
   */
  const handleKeyRename = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey === newKey) {
        return;
      }
      // The row follows the rename to the name the rows leave free, so renames made before a re-render keep their
      // places; where the data settles on another name, `reconcileAdditionalRows()` moves the row to it
      setStoredRows((rows) => {
        const names = new Set(rows.map((row) => row.name));
        const renamedTo = firstAvailableKey(newKey, (key) => names.has(key), separator);
        return rows.map((row) => (row.name === oldKey ? { ...row, name: renamedTo } : row));
      });
      // An updater, so a second rename made before this one renders applies to the data this one produced (#5031)
      onChange((current) => {
        if (!isObject(current)) {
          return current;
        }
        const renamedTo = firstAvailableKey(newKey, (key) => hasByPath(current, key), separator);
        // Every key is taken out and put back in order, so the renamed key keeps its place
        const renamed = { ...current };
        for (const [key, value] of Object.entries(current)) {
          unsetByPath(renamed, [key]);
          setByPath(renamed, [key === oldKey ? renamedTo : key], value);
        }
        return renamed;
      }, fieldPath);
    },
    [onChange, fieldPath, separator],
  );

  /** Handles the remove click which calls the `onChange` callback with the special ADDITIONAL_PROPERTY_FIELD_REMOVE
   * value for the path plus the key to be removed
   */
  const handleRemoveProperty = useCallback(
    (key: string) => {
      onChange(ADDITIONAL_PROPERTY_KEY_REMOVE as T, toFieldPath(key, fieldPath));
    },
    [onChange, fieldPath],
  );

  const { rowIdByName, rowIds } = useMemo(() => {
    const idByName = new Map(additionalRows.map((row) => [row.name, row.id]));
    return { rowIdByName: idByName, rowIds: new Set(idByName.values()) };
  }, [additionalRows]);
  /** Returns the React key for a property: an additional property's row id, which a rename keeps, so React reuses the
   * component instance and the focus stays where it was. A declared property keys by its name, unless a row that was
   * renamed away from that name still uses it as its id.
   */
  const getStableKey = (property: string) =>
    rowIdByName.get(property) ?? (rowIds.has(property) ? `${property}${ROW_ID_SEPARATOR}` : property);

  if (!renderOptionalField || hasFormData) {
    try {
      orderedProperties = orderProperties(
        [...definedPropertyOrder, ...additionalRows.map((row) => row.name)],
        uiOptions.order,
      );
    } catch (err) {
      return (
        <div>
          <p className='rjsf-config-error' style={{ color: 'red' }}>
            <RichDescription
              description={translateString(TranslatableString.InvalidObjectField, [
                name || 'root',
                err instanceof Error ? err.message : String(err),
              ])}
              registry={registry}
              uiSchema={uiSchema}
            />
          </p>
          <pre>{JSON.stringify(schema)}</pre>
        </div>
      );
    }
  }

  const { ObjectFieldTemplate: Template } = getTemplates<T, S, F>(registry, uiOptions);
  const optionalDataControl = renderOptionalField ? (
    <OptionalDataControlsField {...props} schema={schema} />
  ) : undefined;

  const templateProps = {
    // getDisplayLabel() always returns false for object types, so just check the `uiOptions.label`
    title: uiOptions.label === false ? '' : templateTitle,
    description: uiOptions.label === false ? undefined : description,
    properties: orderedProperties.map((propertyName) => {
      const addedByAdditionalProperties = isAdditionalPropertySchema(schema.properties?.[propertyName]);
      const fieldUiSchema = getByPath<UiSchema<T, S, F> | undefined>(
        uiSchema,
        addedByAdditionalProperties ? ADDITIONAL_PROPERTIES_KEY : propertyName,
      );
      const hidden = getUiOptions<T, S, F>(fieldUiSchema).widget === 'hidden';
      const content = (
        <ObjectFieldProperty<T, S, F>
          key={getStableKey(propertyName)}
          propertyName={propertyName}
          required={isRequired<S>(schema, propertyName)}
          schema={getPropertySchema<S>(schema, propertyName)}
          uiSchema={fieldUiSchema}
          errorSchema={getByPath(errorSchema, propertyName)}
          fieldPath={fieldPath}
          formData={getByPath(formData, propertyName)}
          handleKeyRename={handleKeyRename}
          handleRemoveProperty={handleRemoveProperty}
          addedByAdditionalProperties={addedByAdditionalProperties}
          propertyNamesEnum={addedByAdditionalProperties ? allowedPropertyNames?.get(propertyName) : undefined}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          registry={registry}
          disabled={disabled}
          readonly={readonly}
          hideError={hideError}
        />
      );
      return {
        content,
        name: propertyName,
        readonly,
        disabled,
        required,
        hidden,
      };
    }),
    readonly,
    disabled,
    required,
    hideError,
    rawErrors,
    id,
    uiSchema,
    errorSchema,
    schema: resolvedSchema,
    formData,
    registry,
    optionalDataControl,
    className: renderOptionalField ? 'rjsf-optional-object-field' : undefined,
  };
  return <Template {...templateProps} onAddProperty={onAddProperty} />;
}

import type { FocusEvent, ReactNode } from 'react';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  EnumOptionsType,
  ErrorSchema,
  FieldPath,
  FieldProps,
  FormContextType,
  GenericObjectType,
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
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  allowsAdditionalProperties,
  deepEquals,
  getAdditionalPropertySchema,
  getAdditionalPropertyType,
  getFreePropertyNames,
  getMatchingPatternProperties,
  getFieldTypeForWidget,
  getTemplates,
  getPropertySchema,
  getUiOptions,
  getXxxOfOptions,
  isConstantSelect,
  isFormDataAvailable,
  isSchemaObject,
  optionsList,
  orderProperties,
  shouldRenderOptionalField,
  toFieldPath,
  fieldPathToId,
  resolveUiSchema,
  isObject,
  TranslatableString,
  uiBooleanOption,
} from '@rjsf/utils';

import useFieldView from '../../hooks/useFieldView.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE, EMPTY_UI_SCHEMA } from '../constants.ts';
import RichDescription from '../RichDescription.tsx';
import RawFormDataContext, { useReadsFormData } from './RawFormDataContext.ts';

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
>(translateString: Registry<T, S, F>['translateString'], type?: string) {
  switch (type) {
    case 'array':
      return [];
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'integer':
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

/** Returns the type a new additional property described by `subSchema` is seeded with: the type
 * `getAdditionalPropertyType()` reads out of it, or, where the `anyOf`/`oneOf` options it leaves the type to disagree
 * about one, the type of the first of those options. The stub `retrieveSchema()` builds for such a subschema names no
 * type, since choosing an option is what settles it, and `MultiSchemaField` opens on the first option until a value
 * matches another one, so that option's type is the one the field the user is handed renders and a seed of any other
 * type is a value that field cannot show.
 *
 * Both reads are given the `rootSchema`, so an option spelled as a `$ref` -- which names no type of its own, where the
 * field `MultiSchemaField` renders for it takes the type of what it refers to -- is read through the definition it
 * names, as `retrieveSchema()` reads the very same options when it stubs the property. An option that leaves the type
 * to options that disagree again leaves the seed to the `New Value` a property no schema names a type for starts at.
 *
 * @param subSchema - The schema describing the additional property, with its own `$ref`s resolved
 * @param rootSchema - The root schema an option's `$ref` names a definition of
 * @returns - The type to seed the new property with, or undefined when no option names one either
 */
function getSeedType<S extends StrictRJSFSchema = RJSFSchema>(subSchema: S, rootSchema: S): string | undefined {
  const type = getAdditionalPropertyType<S>(subSchema, rootSchema);
  if (type !== undefined) {
    return type;
  }
  const [firstOption] = getXxxOfOptions<S>(subSchema)?.options ?? [];
  return isObject(firstOption) ? getAdditionalPropertyType<S>(firstOption, rootSchema) : undefined;
}

function isAdditionalPropertySchema(schema: unknown) {
  return Boolean((schema as RJSFMarkedSchema)?.[ADDITIONAL_PROPERTY_FLAG]);
}

/** Returns whether the object declares `key` in its own `properties`, which is what decides whose schema and whose
 * `uiSchema` entry the property is rendered and seeded from. `retrieveSchema()` stubs every additional key the form
 * data holds in among the `properties` too, so a stub is told from a declared property by the flag it carries and left
 * to the keyword that described it. The name is read as an own property, since a key called `constructor` or
 * `toString` would otherwise be answered for by `Object.prototype`.
 *
 * @param schemaProperties - The `properties` of the resolved object schema
 * @param key - The property name to check
 * @returns - True when the object declares the name itself, rather than taking it as an additional property
 */
function declaresProperty<S extends StrictRJSFSchema = RJSFSchema>(
  schemaProperties: NonNullable<S['properties']>,
  key: string,
) {
  return Object.hasOwn(schemaProperties, key) && !isAdditionalPropertySchema(schemaProperties[key]);
}

function getAdditionalPropertyOrder<S extends StrictRJSFSchema = RJSFSchema>(
  schemaProperties: NonNullable<S['properties']>,
) {
  return Object.keys(schemaProperties).filter((property) => isAdditionalPropertySchema(schemaProperties[property]));
}

/** Picks the name a new additional property should prefer out of the `freeNames` the schema still allows. A name one
 * of the `patternProperties` patterns describes is one the new property takes its seed and its field from, while a name
 * they don't match is left to `additionalProperties`: an `additionalProperties: false` forbids it, an
 * `unevaluatedProperties: false` forbids it where no `additionalProperties` evaluates it, and an
 * `additionalProperties` that is `true`, or absent and so read as `true`, describes it no better than the data it comes
 * to hold — and, where it is absent, `omitExtraData` prunes it, since patterns describe no key they don't match. So a
 * described name is worth more to the user than the first one the `enum` happens to list, unless an
 * `additionalProperties` schema describes the unmatched name as fully as a pattern would, leaving a matching pattern
 * nothing to add.
 *
 * A name matched only by patterns that forbid it is no better than an unmatched one, so a matching pattern is only
 * preferred where `getAdditionalPropertySchema()` says the name is not forbidden. A name the schema forbids outright is
 * worth less than one it merely leaves undescribed, which at least renders a field for the value it holds, so an
 * allowed name is preferred over a forbidden one even when no pattern describes it — and so even where an
 * `additionalProperties` schema makes the patterns nothing to prefer, a name they forbid is still passed over for one
 * that schema describes.
 *
 * What makes a name described is read from the patterns rather than from `getAdditionalPropertySchema()` alone, which
 * answers for an `unevaluatedProperties` schema too: that keyword describes the value a pattern-unmatched name may hold
 * without describing the name itself, where a pattern describes both, so a pattern-matched name is the one the schema
 * has the most to say about.
 *
 * It stays a preference rather than a restriction: `propertyNames` enumerates the other names all the same, and a
 * property the user can still rename beats no new property at all.
 *
 * @param schema - The object schema the property is being added to
 * @param freeNames - The allowed names no property and no form data key has taken
 * @returns - The free name to add under, or undefined when none is preferable to the first
 */
function findPreferredPropertyName<S extends StrictRJSFSchema = RJSFSchema>(schema: S, freeNames: string[]) {
  if (!schema.patternProperties) {
    return undefined;
  }
  const preferMatched = !isObject(schema.additionalProperties);
  let firstAllowed: string | undefined;
  // One pass, asking each name no more than the two questions its answer needs, since every question compiles the
  // patterns again and a `propertyNames.enum` can name as many of them as it likes
  for (const freeName of freeNames) {
    if (getAdditionalPropertySchema<S>(schema, freeName) !== false) {
      if (!preferMatched || Object.keys(getMatchingPatternProperties<S>(schema, freeName)).length > 0) {
        return freeName;
      }
      firstAllowed ??= freeName;
    }
  }
  return firstAllowed;
}

/** A shallow copy of an object field's data to add a property to, a new object when the field holds none. A `type`
 * list naming `object` alongside another type can hold a value of that type, which has no properties to keep, and a
 * string spread into an object would turn each of its characters into one. The overload is the one trust point that the
 * copy, which keeps every property of `formData`, is still the field's `T`.
 */
function copyObjectData<T>(formData: T | undefined): T;
function copyObjectData(formData: unknown) {
  return isObject(formData) ? { ...formData } : {};
}

/** Props for the `ObjectFieldProperty` component */
interface ObjectFieldPropertyProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends Pick<
  FieldProps<T, S, F>,
  | 'fieldPath'
  | 'schema'
  | 'registry'
  | 'uiSchema'
  | 'errorSchema'
  | 'formData'
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'disabled'
  | 'readonly'
  | 'required'
  | 'hideError'
> {
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
  const readsFormData = useReadsFormData(ObjectFieldProperty);
  const innerFieldPath = toFieldPath(propertyName, fieldPath);
  const innerFieldId = fieldPathToId(innerFieldPath, globalFormOptions);

  /** The `onChange` handler installed on this property's `SchemaField`. Handles the special case where the user
   * clears a value at this property's own path when it was added as an additional property, coercing `undefined`
   * to the empty string so the property's key input survives. Every other change, including any change to a
   * descendant of this property, is forwarded to `onChange()` untouched.
   */
  const onPropertyChange = useCallback(
    (value: T | undefined, path: FieldPath, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      // An `additionalProperties` value lives at this property's own path, so clearing its widget to `undefined`
      // would drop the key from the formData and take the key input with it. Coerce that one case to the empty
      // string.
      // A descendant's path is this property's path plus at least one segment, so comparing to this
      // property's own path (rather than merely its length) tells apart "this property changed" from "a
      // descendant changed"; a cleared descendant must stay `undefined` so it is omitted from the formData
      // exactly like a cleared property declared in `properties` (#5222).
      let normalizedValue = value;
      if (value === undefined && addedByAdditionalProperties && path === innerFieldPath) {
        normalizedValue = '' as unknown as T;
      }
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
    <RawFormDataContext value={readsFormData ? SchemaField : undefined}>
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
    </RawFormDataContext>
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
  const { fields, schemaUtils, translateString, globalUiOptions, rootSchema, uiSchemaDefinitions } = registry;
  const { OptionalDataControlsField } = fields;
  const view = useFieldView(fieldPath, formData, ObjectField);
  /** Every return renders through this, so a template below never inherits what was said of this field */
  const vouchForProperties = (content: ReactNode) => (
    <RawFormDataContext value={view.readsFormData ? ObjectFieldProperty : undefined}>{content}</RawFormDataContext>
  );
  const readData = useCallback(() => view.readData(view.read()), [view]);

  const schema: S = useMemo(
    () => schemaUtils.retrieveSchema(rawSchema, formData, true),
    [schemaUtils, rawSchema, formData],
  );
  // Read by the callbacks a property template holds onto rather than closed over by them, as the form data is above:
  // the resolved schema changes identity whenever a key is added, renamed or removed, and a callback that changed with
  // it would re-render every property beside the one that did. Written once the render it belongs to has committed, so
  // that a render React starts and throws away cannot leave the callbacks answering from a schema resolved for form
  // data the user never saw -- they run from an event handler, which is after the commit either way
  const schemaRef = useRef(schema);
  useLayoutEffect(() => {
    schemaRef.current = schema;
  }, [schema]);
  const uiOptions = useMemo(() => getUiOptions<T, S, F>(uiSchema, globalUiOptions), [uiSchema, globalUiOptions]);
  const schemaProperties = useMemo(() => schema.properties ?? {}, [schema.properties]);
  const [lastRenamedProperty, setLastRenamedProperty] = useState<{ previousKey: string; currentKey?: string }>({
    previousKey: '',
  });
  /** The seed the add button wrote for each property it added here and nothing has written to since, which are the only
   * ones a rename re-seeds. Held in a ref rather than state: it is read and written by the add and rename handlers,
   * neither of which renders anything of it, and a property added and renamed in the same tick has to see the add. The
   * seed itself is kept beside the name because what makes a record the property's history is that the form data still
   * holds that seed under that name, which is the one question the effect below puts to every record.
   */
  const seededProperties = useRef(new Map<string, unknown>());
  // Every write to a property this object holds is a proposal: the parent may decline it, write a value of its own
  // over it, or accept it, and which of those happened is only known once the form data has come back. A record whose
  // name the data no longer holds that seed under is no longer the property's history, whatever became of it -- a
  // value the user entered, one a parent wrote, or a name a declined rename never took -- so it is dropped here rather
  // than where the proposal was made. The record a rename leaves behind under the old name is what a declined rename
  // falls back on, and it goes the moment the rename is the data's
  useLayoutEffect(() => {
    const properties = isObject(formData) ? (formData as GenericObjectType) : {};
    for (const [key, seed] of seededProperties.current) {
      if (!deepEquals(properties[key], seed)) {
        seededProperties.current.delete(key);
      }
    }
  }, [formData]);
  const schemaAdditionalProperties = useMemo(() => getAdditionalPropertyOrder<S>(schemaProperties), [schemaProperties]);
  const [additionalPropertyOrder, setAdditionalPropertyOrder] = useState(schemaAdditionalProperties);
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

  /** Computes the next available key name from the `preferredKey`, indexing through the already existing keys until one
   * that is already not assigned is found.
   *
   * @param preferredKey - The preferred name of a new key
   * @param [formData] - The form data in which to check if the desired key already exists
   * @returns - The name of the next available key from `preferredKey`
   */
  const getAvailableKey = useCallback(
    (preferredKey: string, existingFormData?: T) => {
      const { duplicateKeySuffixSeparator = '-' } = uiOptions;

      let index = 0;
      let newKey = preferredKey;
      while (hasByPath(existingFormData, newKey)) {
        index += 1;
        newKey = `${preferredKey}${duplicateKeySuffixSeparator}${index}`;
      }
      return newKey;
    },
    [uiOptions],
  );

  /** Returns the schema the object says describes `key`: the one it declares under that name, where it declares one,
   * and otherwise what `getAdditionalPropertySchema()` says of a name its `properties` don't name. The key input is
   * free text, so a property can be renamed onto a declared name, and the field that name then renders is the declared
   * property's -- reading the keywords for the undeclared names instead would seed a value that field cannot show.
   *
   * `declaresProperty()` is what tells the two apart, as it does for the `uiSchema` entry below and for the one the
   * property's field is rendered with, so none of them can disagree about whose name it is.
   */
  const schemaForKey = useCallback((key: string): S | boolean => {
    const currentSchema = schemaRef.current;
    const properties = currentSchema.properties ?? {};
    if (declaresProperty<S>(properties, key)) {
      return properties[key] as S | boolean;
    }
    return getAdditionalPropertySchema<S>(currentSchema, key);
  }, []);

  /** Returns the `uiSchema` entry the field for `key` is rendered with: the one under that name where the object
   * declares it, and the `additionalProperties` entry otherwise, read the same way the property's `SchemaField` is
   * handed its own below. A rename onto a declared name brings up the declared property's field, which reads the entry
   * under that name, so seeding from the `additionalProperties` entry instead would hand that field a
   * `ui:initialValue` written for a different schema.
   */
  const uiSchemaForKey = useCallback(
    (key: string) => {
      const properties = schemaRef.current.properties ?? {};
      return getByPath<UiSchema<T, S, F> | undefined>(
        uiSchema,
        declaresProperty<S>(properties, key) ? key : ADDITIONAL_PROPERTIES_KEY,
      );
    },
    [uiSchema],
  );

  /** Returns the value a property added or renamed to `key` starts out holding, read from the very schema the object
   * says describes that name, which is the one `retrieveSchema()` stubs the field from, so the seed and the field can't
   * disagree about the key.
   */
  const seedForKey = useCallback(
    (key: string) => {
      const keySchema = schemaForKey(key);
      if (keySchema === false) {
        // A schema that forbids the name leaves `retrieveSchema()` nothing but the `{ type: 'null' }` stub to render it
        // with, so any other seed would be a value no field can show
        return null;
      }
      if (!isSchemaObject<S>(keySchema)) {
        // A `true`, which is what an `additionalProperties` the schema leaves out reads as, describes no schema to seed
        // from, so the new property starts at the value a field with no type to render offers
        return getDefaultValue<T, S, F>(translateString);
      }
      // Resolved the way `retrieveSchema()` resolves it before stubbing, so a `$ref` and an `allOf` of matching
      // patterns are seeded from what they describe. A resolution against no data at all would answer an `if` inside
      // the subschema with an empty object, which satisfies any condition vacuously, so the schema is resolved again
      // against the `default` it turns out to carry: that default is the data the property is about to hold, and it is
      // the branch that default takes whose own defaults belong in the seed
      const describedKeySchema = schemaUtils.retrieveSchema(keySchema);
      const resolvedKeySchema =
        describedKeySchema.default === undefined
          ? describedKeySchema
          : schemaUtils.retrieveSchema(keySchema, describedKeySchema.default as T);
      const keyUiSchema = uiSchemaForKey(key);
      // The widget is read as `SchemaField` reads it, with the `ui:definitions` entry the `$ref` names merged in and
      // without `ui:globalOptions`. Read off the resolved schema, which is the one `SchemaField` is handed: that
      // carries the name of the definition it came from, where an unresolved `$ref` only names one while it sits at
      // the top of the schema, which it does not for a key described by an `allOf` of matching patterns
      const resolvedKeyUiSchema = resolveUiSchema<T, S, F>(resolvedKeySchema, keyUiSchema, {
        rootSchema,
        uiSchemaDefinitions,
      });
      const { widget, enumDisabled } = getUiOptions<T, S, F>(resolvedKeyUiSchema);
      // A schema naming a `type` list is stubbed with that list, so the field rendering the new value is the one the
      // widget picks out of it: a `textarea` on a `['null', 'number', 'string']` starts as a string rather than as a
      // `0` in the textarea. One that names no list is seeded as the field it is stubbed into renders it, which reads
      // a typeless `enum` of numbers as the number its values hold where a field's own type would call it a string
      const type = Array.isArray(resolvedKeySchema.type)
        ? getFieldTypeForWidget(resolvedKeySchema, widget)
        : getSeedType<S>(resolvedKeySchema, rootSchema);
      // A select starts on its type's zero value only when that is an option the user can pick: neither a string's
      // `'New Value'` nor a number's `0` need be, so otherwise it starts on the first one it shows enabled. The
      // `ui:enumDisabled` values match strictly, and one that isn't a list disables nothing, as the widgets read it
      let firstOption: EnumOptionsType<S> | undefined;
      if (isConstantSelect<S>(resolvedKeySchema)) {
        const enabledOptions = (optionsList<T, S, F>(resolvedKeySchema, resolvedKeyUiSchema) ?? []).filter(
          (option) =>
            !(Array.isArray(enumDisabled) && enumDisabled.some((disabledValue) => disabledValue === option.value)),
        );
        const zeroValue = getDefaultValue<T, S, F>(translateString, type);
        firstOption = enabledOptions.some((option) => deepEquals(option.value, zeroValue))
          ? undefined
          : enabledOptions[0];
      }
      // The pipeline a property the form mounted with goes through, so that a `default` nested in the subschema and a
      // `ui:initialValue`/`ui:emptyValue` under the key's own `uiSchema` entry seed the new property the way they
      // would have seeded it had the key been in the form data all along. The subschema's own `default` is handed to
      // the pipeline as the property's data, which is what merges an object `default` beside a `$ref` with the
      // defaults the referenced schema's own properties carry (#4266)
      const defaultValue = schemaUtils.getDefaultFormState(
        resolvedKeySchema,
        resolvedKeySchema.default as T,
        undefined,
        undefined,
        keyUiSchema,
        uiSchemaDefinitions,
      ) as RJSFSchema['default'];
      const newValue = resolvedKeySchema.const !== undefined ? resolvedKeySchema.const : defaultValue;
      if (newValue !== undefined) {
        return newValue;
      }
      return firstOption ? firstOption.value : getDefaultValue<T, S, F>(translateString, type);
    },
    [rootSchema, schemaForKey, schemaUtils, translateString, uiSchemaForKey, uiSchemaDefinitions],
  );

  /** Handles the adding of a new additional property on the given `schema`. Calls the `onChange` callback once the new
   * default data for that field has been added to the formData.
   */
  const onAddProperty = useCallback(() => {
    if (!allowsAdditionalProperties<S>(schema)) {
      return;
    }
    const currentFormData = readData();
    const newFormData = copyObjectData(currentFormData);
    // A `propertyNames.enum` makes the generic `newKey` an invalid name, so the new property goes under an allowed
    // name that is still free. `canExpand()` hides the add button once every allowed name is taken, so getting here
    // with none left means a custom template is offering it anyway, and adding no property beats adding one the
    // schema forbids
    const freeNames = getFreePropertyNames<T, S>(resolvedSchema, currentFormData);
    if (freeNames?.length === 0) {
      return;
    }
    const preferredKey = freeNames ? (findPreferredPropertyName<S>(schema, freeNames) ?? freeNames[0]) : 'newKey';
    const newKey = getAvailableKey(preferredKey, newFormData);
    const seed = seedForKey(newKey);
    setByPath(newFormData, newKey, seed);
    // Recorded as the property's history, which is what a rename reads to tell a seed nobody has touched from a value
    // of the user's that happens to equal one
    seededProperties.current.set(newKey, seed);

    setLastRenamedProperty((previous) =>
      previous.previousKey === newKey
        ? { currentKey: newKey, previousKey: getAvailableKey(newKey, newFormData) }
        : previous,
    );
    setAdditionalPropertyOrder((order) => [...order, newKey]);
    view.propose(newFormData, () => onChange(newFormData, fieldPath));
  }, [readData, view, onChange, fieldPath, getAvailableKey, schema, resolvedSchema, seedForKey]);

  /** Returns a callback function that deals with the rename of a key for an additional property for a schema. That
   * callback will attempt to rename the key and move the existing data to that key, calling `onChange` when it does.
   *
   * @param oldKey - The old key for the field
   * @param newKey - The new key for the field
   * @returns - The key change callback function
   */
  const handleKeyRename = useCallback(
    (oldKey: string, newKey: string) => {
      if (oldKey !== newKey) {
        const currentFormData = readData();
        const actualNewKey = getAvailableKey(newKey, currentFormData);
        const newFormData: GenericObjectType = {
          ...(currentFormData as GenericObjectType),
        };
        const newKeys: GenericObjectType = { [oldKey]: actualNewKey };
        // The seed the add button wrote was picked for a name the user had not picked yet, so a property still holding
        // it takes the one the schema describing its new name seeds instead: a `New Value` string left under a name a
        // numeric pattern describes is a value that pattern's field cannot show. Which properties those are is what
        // `seededProperties` has recorded since they were added, rather than a value that merely equals what the seed
        // would be now -- any `0`, `false` or defaulted entry equals that, the data the form mounted with included, and
        // every one of those is the user's to keep. The record goes under the new name without leaving the old one,
        // since this rename is a proposal too: a parent that declines it leaves the property under the name it already
        // had, where the record it kept lets the next rename re-seed it. The reconciliation above drops whichever of
        // the two the data turns out not to hold, so renaming a property on twice re-seeds it twice
        const seed = seededProperties.current.get(oldKey);
        const wasSeeded = seededProperties.current.has(oldKey) && deepEquals(newFormData[oldKey], seed);
        if (wasSeeded) {
          if (deepEquals(schemaForKey(oldKey), schemaForKey(actualNewKey))) {
            seededProperties.current.set(actualNewKey, seed);
          } else {
            const newSeed = seedForKey(actualNewKey);
            newFormData[oldKey] = newSeed;
            seededProperties.current.set(actualNewKey, newSeed);
          }
        }
        const keyValues = Object.keys(newFormData).map((key) => {
          // `Object.hasOwn` so a falsy rename target (e.g. `""`) isn't dropped.
          const mappedKey = Object.hasOwn(newKeys, key) ? newKeys[key] : key;
          return { [mappedKey]: newFormData[key] };
        });
        const renamedObj = Object.assign({}, ...keyValues);

        setLastRenamedProperty((previous) => ({
          previousKey: oldKey !== previous.currentKey ? oldKey : previous.previousKey,
          currentKey: actualNewKey,
        }));
        setAdditionalPropertyOrder((order) => order.map((property) => (property === oldKey ? actualNewKey : property)));
        // The errors the form holds under the old name describe the property, so they go to its new name with it
        view.propose(
          renamedObj,
          () => onChange(renamedObj, fieldPath),
          (key) => (key === oldKey ? actualNewKey : key),
        );
      }
    },
    [onChange, fieldPath, getAvailableKey, schemaForKey, seedForKey, view, readData],
  );

  /** Handles the remove click which calls the `onChange` callback with the special ADDITIONAL_PROPERTY_FIELD_REMOVE
   * value for the path plus the key to be removed
   */
  const handleRemoveProperty = useCallback(
    (key: string) => {
      setAdditionalPropertyOrder((order) => order.filter((property) => property !== key));
      onChange(ADDITIONAL_PROPERTY_KEY_REMOVE as T, toFieldPath(key, fieldPath));
    },
    [onChange, fieldPath],
  );

  /** Returns the stable React key for a property. For the most recently renamed
   * additional property, returns the previous key so that React reuses the
   * existing component instance instead of unmounting/remounting it. This
   * preserves DOM focus naturally without manual focus management.
   */
  const getStableKey = useCallback(
    (property: string) => {
      if (lastRenamedProperty.currentKey === property) {
        return lastRenamedProperty.previousKey;
      }
      return property;
    },
    [lastRenamedProperty],
  );

  if (!renderOptionalField || hasFormData) {
    try {
      const definedPropertySet = new Set(definedPropertyOrder);
      // A set, since an add or rename the parent declined leaves its key in the order, and proposing that key again
      // appends it a second time
      const orderedSet = new Set(additionalPropertyOrder);
      const currentAdditionalProperties = [...orderedSet].filter(
        (property) => Object.hasOwn(schemaProperties, property) && !definedPropertySet.has(property),
      );
      // A property in the data but not in the order was not added or renamed here: the parent supplied it, or it kept
      // the name a rename proposed away because the parent declined the rename. Either way it renders, after the ones
      // whose order is known
      const unorderedAdditionalProperties = schemaAdditionalProperties.filter((property) => !orderedSet.has(property));
      orderedProperties = orderProperties(
        [...definedPropertyOrder, ...currentAdditionalProperties, ...unorderedAdditionalProperties],
        uiOptions.order,
      );
    } catch (err) {
      return vouchForProperties(
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
        </div>,
      );
    }
  }

  const { ObjectFieldTemplate: Template } = getTemplates<T, S, F>(registry, uiOptions);
  const optionalDataControl = renderOptionalField ? (
    <OptionalDataControlsField {...props} schema={schema} />
  ) : undefined;

  // getDisplayLabel() always returns false for object types, so just check the `uiOptions.label`
  const showLabel = uiBooleanOption(uiOptions.label) ?? true;
  const templateProps = {
    title: showLabel ? templateTitle : '',
    description: showLabel ? description : undefined,
    properties: orderedProperties.map((propertyName) => {
      // Read off the schema this render resolved rather than through `uiSchemaForKey()`, which answers for the
      // callbacks from the schema the last render committed: `declaresProperty()` is the question both of them put
      const addedByAdditionalProperties = !declaresProperty<S>(schema.properties ?? {}, propertyName);
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
  return vouchForProperties(<Template {...templateProps} onAddProperty={onAddProperty} />);
}

# RJSF utility functions, constants and types

In version 5, the utility functions from `@rjsf/core/utils` were refactored into their own library called `@rjsf/utils`.
These utility functions are separated into two distinct groups.
The first, larger, group are the [functions](#non-validator-utility-functions) that do NOT require a `ValidatorType` interface be provided as one of their parameters.
The second, smaller, group are the [functions](#validator-based-utility-functions) that DO require a `ValidatorType` interface be provided as a parameter.
There is also a helper [function](#schema-utils-creation-function) used to create a `SchemaUtilsType` implementation from a `ValidatorType` implementation and `rootSchema` object.

## Constants

The `@rjsf/utils` package exports a set of constants that represent all the keys into various elements of a RJSFSchema or UiSchema that are used by the various utility functions.
In addition to those keys, there is the special `ADDITIONAL_PROPERTY_FLAG` flag that is added to a schema under certain conditions by the `retrieveSchema()` utility.

These constants can be found on GitHub [here](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/constants.ts).

## Types

Additionally, the Typescript types used by the utility functions represent nearly all the types used by RJSF.
Those types are exported for use by `@rjsf/core` and all the themes, as well as any customizations you may build.

These types can be found on GitHub [here](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/types.ts).

## Enums

There are enumerations in `@rjsf/utils` that are exported for use by `@rjsf/core` and all the themes, as well as any customizations you may build.

These enums can be found on GitHub [here](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/enums.ts).

## Non-Validator utility functions

### allowAdditionalItems()

Checks the schema to see if it is allowing additional items, by verifying that `schema.additionalItems` is an object.
The user is warned in the console if `schema.additionalItems` has the value `true`.

#### Parameters

- schema: S - The schema object to check

#### Returns

- boolean: True if additional items is allowed, otherwise false

### ariaDescribedByIds<T = any>()

Return a list of element ids that contain additional information about the field that can be used to as the aria description of the field.

#### Parameters

- id: IdSchema&lt;T> | string - Either simple string id or an IdSchema from which to extract it
- [includeExamples=false]: boolean - Optional flag, if true, will add the `examplesId` into the list

#### Returns

- string: The string containing the list of ids for use in an `aria-describedBy` attribute

### asNumber()

Attempts to convert the string into a number. If an empty string is provided, then `undefined` is returned.
If a `null` is provided, it is returned.
If the string ends in a `.` then the string is returned because the user may be in the middle of typing a float number.
If a number ends in a pattern like `.0`, `.20`, `.030`, string is returned because the user may be typing number that will end in a non-zero digit.
Otherwise, the string is wrapped by `Number()` and if that result is not `NaN`, that number will be returned, otherwise the string `value` will be.

#### Parameters

- value: string | null - The string or null value to convert to a number

#### Returns

- undefined | null | string | number: The `value` converted to a number when appropriate, otherwise the `value`

### canExpand<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Checks whether the field described by `schema`, having the `uiSchema` and `formData` supports expanding.
The UI for the field can expand if it has additional properties, is not forced as non-expandable by the `uiSchema` and the `formData` object doesn't already have `schema.maxProperties` elements.

#### Parameters

- schema: S - The schema for the field that is being checked
- [uiSchema={}]: UiSchema<T, S, F> - The uiSchema for the field
- [formData]: T | undefined - The formData for the field

#### Returns

- boolean: True if the schema element has additionalProperties, is expandable, and not at the maxProperties limit

### createErrorHandler<T = any>()

Given a `formData` object, recursively creates a `FormValidation` error handling structure around it

#### Parameters

- formData: T - The form data around which the error handler is created

#### Returns

- FormValidation&lt;T>: A `FormValidation` object based on the `formData` structure

### dataURItoBlob()

Given the `FileReader.readAsDataURL()` based `dataURI` extracts that data into an actual Blob along with the name
of that Blob if provided in the URL. If no name is provided, then the name falls back to `unknown`.

#### Parameters

- dataURI: string - The `DataUrl` potentially containing name and raw data to be converted to a Blob

#### Returns

- { blob: Blob, name: string }: An object containing a Blob and its name, extracted from the URI

### deepEquals()

Implements a deep equals using the `lodash.isEqualWith` function, that provides a customized comparator that assumes all functions are equivalent.

#### Parameters

- a: any - The first element to compare
- b: any - The second element to compare

#### Returns

- boolean: True if the `a` and `b` are deeply equal, false otherwise

### descriptionId<T = any>()

Return a consistent `id` for the field description element.

#### Parameters

- id: IdSchema&lt;T> | string - Either simple string id or an IdSchema from which to extract it

#### Returns

- string: The consistent id for the field description element from the given `id`

### englishStringTranslator()

Translates a `TranslatableString` value `stringToTranslate` into english.
When a `params` array is provided, each value in the array is used to replace any of the replaceable parameters in the `stringToTranslate` using the `%1`, `%2`, etc. replacement specifiers.

#### Parameters

stringToTranslate: TranslatableString - The `TranslatableString` value to convert to english
[params]: string[] - The optional list of replaceable parameter values to substitute to the english string

#### Returns

- string: The `stringToTranslate` itself with any replaceable parameter values substituted

### enumOptionsDeselectValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Removes the enum option value at the `valueIndex` from the currently `selected` (list of) value(s).
If `selected` is a list, then that list is updated to remove the enum option value with the `valueIndex` in `allEnumOptions`.
If it is a single value, then if the enum option value with the `valueIndex` in `allEnumOptions` matches `selected`, undefined is returned, otherwise the `selected` value is returned.

#### Parameters

- valueIndex: string | number - The index of the value to be removed from the selected list or single value
- [selected]: EnumOptionsType&lt;S>["value"] | EnumOptionsType&lt;S>["value"][] | undefined - The current (list of) selected value(s)
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions

#### Returns

- EnumOptionsType&lt;S>["value"][]: The updated `selected` list with the `value` removed from it

### enumOptionsIndexForValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the index(es) of the options in `allEnumOptions` whose value(s) match the ones in `value`.
All the `enumOptions` are filtered based on whether they are a "selected" `value` and the index of each selected one is then stored in an array.
If `multiple` is true, that array is returned, otherwise the first element in the array is returned.

#### Parameters

- value: EnumOptionsType&lt;S>["value"] | EnumOptionsType&lt;S>["value"][] - The single value or list of values for which indexes are desired
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions
- [multiple=false]: boolean - Optional flag, if true will return a list of index, otherwise a single one

#### Returns

- string | string[] | undefined: A single string index for the first `value` in `allEnumOptions`, if not `multiple`. Otherwise, the list of indexes for (each of) the value(s) in `value`.

### enumOptionsIsSelected&lt;S extends StrictRJSFSchema = RJSFSchema>()

Determines whether the given `value` is (one of) the `selected` value(s).

#### Parameters

- value: EnumOptionsType&lt;S>["value"] - The value being checked to see if it is selected
- selected: EnumOptionsType&lt;S>["value"] | EnumOptionsType&lt;S>["value"][] - The current selected value or list of values
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions

#### Returns

- boolean: true if the `value` is one of the `selected` ones, false otherwise

### enumOptionsSelectValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Add the `value` to the list of `selected` values in the proper order as defined by `allEnumOptions`.

#### Parameters

- valueIndex: string | number - The index of the value that should be selected
- selected: EnumOptionsType&lt;S>["value"][] - The current list of selected values
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions

#### Returns

- EnumOptionsType&lt;S>["value"][]: The updated list of selected enum values with `value` added to it in the proper location

### enumOptionsValueForIndex&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the value(s) from `allEnumOptions` at the index(es) provided by `valueIndex`.
If `valueIndex` is not an array AND the index is not valid for `allEnumOptions`, `emptyValue` is returned.
If `valueIndex` is an array, AND it contains an invalid index, the returned array will have the resulting undefined values filtered out, leaving only valid values or in the worst case, an empty array.

#### Parameters

- valueIndex: string | number | Array<string | number> - The index(es) of the value(s) that should be returned
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions
- [emptyValue]: EnumOptionsType&lt;S>["value"] | undefined - The value to return when the non-array `valueIndex` does not refer to a real option

#### Returns

- EnumOptionsType&lt;S>["value"] | EnumOptionsType&lt;S>["value"][] | undefined: The single or list of values specified by the single or list of indexes if they are valid. Otherwise, `emptyValue` or an empty list.

### errorId<T = any>()

Return a consistent `id` for the field error element.

#### Parameters

- id: IdSchema&lt;T> | string - Either simple string id or an IdSchema from which to extract it

#### Returns

- string: The consistent id for the field error element from the given `id`

### examplesId<T = any>()

Return a consistent `id` for the field examples element.

#### Parameters

- id: IdSchema&lt;T> | string - Either simple string id or an IdSchema from which to extract it

#### Returns

- string: The consistent id for the field examples element from the given `id`

### findSchemaDefinition&lt;S extends StrictRJSFSchema = RJSFSchema>()

Given the name of a `$ref` from within a schema, using the `rootSchema`, look up and return the sub-schema using the path provided by that reference.
If `#` is not the first character of the reference, or the path does not exist in the schema, then throw an Error.
Otherwise, return the sub-schema. Also deals with nested `$ref`s in the sub-schema.

#### Parameters

- $ref: string - The ref string for which the schema definition is desired
- [rootSchema={}]: S - The root schema in which to search for the definition

#### Returns

- S: The sub-schema within the `rootSchema` which matches the `$ref` if it exists

#### Throws

- Error indicating that no schema for that reference exists

### getDiscriminatorFieldFromSchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the `discriminator.propertyName` when defined in the `schema` if it is a string. A warning is generated when it is not a string.
Returns `undefined` when a valid discriminator is not present.

#### Parameters

- schema: S - The schema from which the discriminator is potentially obtained

#### Returns

- string | undefined: The `discriminator.propertyName` if it exists in the schema, otherwise `undefined`

### getInputProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Using the `schema`, `defaultType` and `options`, extract out the props for the `<input>` element that make sense.

#### Parameters

- schema: S - The schema for the field provided by the widget
- [defaultType]: string | undefined - The default type, if any, for the field provided by the widget
- [options={}]: UIOptionsType<T, S, F> - The UI Options for the field provided by the widget
- [autoDefaultStepAny=true]: boolean - Determines whether to auto-default step=any when the type is number and no step

#### Returns

- InputPropsType: The extracted `InputPropsType` object

### getSchemaType()

Gets the type of a given `schema`.
If the type is not explicitly defined, then an attempt is made to infer it from other elements of the schema as follows:

- schema.const: Returns the `guessType()` of that value
- schema.enum: Returns `string`
- schema.properties: Returns `object`
- schema.additionalProperties: Returns `object`
- type is an array with a length of 2 and one type is 'null': Returns the other type

#### Parameters

- schema: S - The schema for which to get the type

#### Returns

- string | string[] | undefined: The type of the schema

### getSubmitButtonOptions<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Extracts any `ui:submitButtonOptions` from the `uiSchema` and merges them onto the `DEFAULT_OPTIONS`

#### Parameters

- [uiSchema={}]: UiSchema<T, S, F> - the UI Schema from which to extract submit button props

#### Returns

- UISchemaSubmitButtonOptions: The merging of the `DEFAULT_OPTIONS` with any custom ones

### getUiOptions<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Get all passed options from ui:options, and ui:&lt;optionName>, returning them in an object with the `ui:` stripped off.
Any `globalOptions` will always be returned, unless they are overridden by options in the `uiSchema`.

#### Parameters

- [uiSchema={}]: UiSchema<T, S, F> - The UI Schema from which to get any `ui:xxx` options
- [globalOptions={}]: GlobalUISchemaOptions - The optional Global UI Schema from which to get any fallback `xxx` options

#### Returns

- UIOptionsType<T, S, F> An object containing all of the `ui:xxx` options with the `ui:` stripped off along with all `globalOptions`

### getTemplate<Name extends keyof TemplatesType<T, S, F>, T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.

#### Parameters

- name: Name - The name of the template to fetch, restricted to the keys of `TemplatesType`
- registry: Registry<T, S, F> - The `Registry` from which to read the template
- [uiOptions={}]: UIOptionsType<T, S, F> - The `UIOptionsType` from which to read an alternate template

#### Returns

- TemplatesType<T, S, F>[Name] - The template from either the `uiSchema` or `registry` for the `name`

### getWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Given a schema representing a field to render and either the name or actual `Widget` implementation, returns the
React component that is used to render the widget. If the `widget` is already a React component, then it is wrapped
with a `MergedWidget`. Otherwise an attempt is made to look up the widget inside of the `registeredWidgets` map based
on the schema type and `widget` name. If no widget component can be found an `Error` is thrown.

#### Parameters

- schema: S - The schema for the field
- widget: Widget<T, S, F> | string - Either the name of the widget OR a `Widget` implementation to use
- [registeredWidgets={}]: RegistryWidgetsType<T, S, F> - A registry of widget name to `Widget` implementation

#### Returns

- Widget<T, S, F>: The `Widget` component to use

#### Throws

- An error if there is no `Widget` component that can be returned

### guessType()

Given a specific `value` attempts to guess the type of a schema element. In the case where we have to implicitly
create a schema, it is useful to know what type to use based on the data we are defining.

#### Parameters

- value: any - The value from which to guess the type

#### Returns

- string: The best guess for the object type

### hashForSchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Stringifies the schema and returns the hash of the resulting string.

#### Parameters

- schema: S - The schema for which the hash is desired

#### Returns

- string: The string obtained from the hash of the stringified schema

### hasWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Detects whether the `widget` exists for the `schema` with the associated `registryWidgets` and returns true if it does, or false if it doesn't.

#### Parameters

- schema: S - The schema for the field
- widget: Widget<T, S, F> | string - Either the name of the widget OR a `Widget` implementation to use
- [registeredWidgets={}]: RegistryWidgetsType<T, S, F> - A registry of widget name to `Widget` implementation

#### Returns

- boolean: True if the widget exists, false otherwise

### helpId<T = any>()

Return a consistent `id` for the field help element.

#### Parameters

- id: IdSchema&lt;T> | string - Either simple string id or an IdSchema from which to extract it

#### Returns

- string: The consistent id for the field help element from the given `id`

### isConstant&lt;S extends StrictRJSFSchema = RJSFSchema>()

This function checks if the given `schema` matches a single constant value.
This happens when either the schema has an `enum` array with a single value or there is a `const` defined.

#### Parameters

- schema: S - The schema for a field

#### Returns

- boolean: True if the `schema` has a single constant value, false otherwise

### isCustomWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Checks to see if the `uiSchema` contains the `widget` field and that the widget is not `hidden`

#### Parameters

- uiSchema: UiSchema<T, S, F> - The UI Schema from which to detect if it is customized

#### Returns

- boolean: True if the `uiSchema` describes a custom widget, false otherwise

### isFixedItems&lt;S extends StrictRJSFSchema = RJSFSchema>()

Detects whether the given `schema` contains fixed items.
This is the case when `schema.items` is a non-empty array that only contains objects.

#### Parameters

- schema: S - The schema in which to check for fixed items

#### Returns

- boolean: True if there are fixed items in the schema, false otherwise

### isObject()

Determines whether a `thing` is an object for the purposes of RSJF.
In this case, `thing` is an object if it has the type `object` but is NOT null, an array or a File.

#### Parameters

- thing: any - The thing to check to see whether it is an object

#### Returns

- boolean: True if it is a non-null, non-array, non-File object

### labelValue()

Helper function that will return the value to use for a widget `label` based on `hideLabel`.
The `fallback` is used as the return value from the function when `hideLabel` is true.
Due to the implementation of theme components, it may be necessary to return something other than `undefined` to cause the theme component to not render a label.
Some themes require may `false` and others may require an empty string.

#### Parameters

- [label]: string | ReactElement | undefined - The label string or component to render when not hidden
- [hideLabel]: boolean| undefined - Flag, if true, will cause the label to be hidden
- [fallback]: undefined | false | '' - One of 3 values, `undefined` (the default), `false` or an empty string

- #### Returns

- string | boolean | undefined: `fallback` if `hideLabel` is true, otherwise `label`

### localToUTC()

Converts a local Date string into a UTC date string

#### Parameters

- dateString: string - The string representation of a date as accepted by the `Date()` constructor

#### Returns

- string | undefined: A UTC date string if `dateString` is truthy, otherwise undefined

### mergeDefaultsWithFormData<T = any, S extends StrictRJSFSchema = RJSFSchema,>()

Merges the `defaults` object of type `T` into the `formData` of type `T`

When merging defaults and form data, we want to merge in this specific way:

- objects are deeply merged
- arrays are merged in such a way that:
  - when the array is set in form data, only array entries set in form data are deeply merged; additional entries from the defaults are ignored
  - when the array is not set in form data, the default is copied over
- scalars are overwritten/set by form data

#### Parameters

- [defaults]: T | undefined - The defaults to merge
- [formData]: T | undefined - The form data into which the defaults will be merged

#### Returns

- T | undefined: The resulting merged form data with defaults

### mergeObjects()

Recursively merge deeply nested objects.

#### Parameters

- obj1: GenericObjectType - The first object to merge
- obj2: GenericObjectType - The second object to merge
- [concatArrays=false]: boolean | "preventDuplicates" - Optional flag that, when true, will cause arrays to be concatenated. Use "preventDuplicates" to merge arrays in a manner that prevents any duplicate entries from being merged.

#### Returns

@returns - A new object that is the merge of the two given objects

### mergeSchemas()

Recursively merge deeply nested schemas.
The difference between mergeSchemas and mergeObjects is that mergeSchemas only concats arrays for values under the 'required' keyword, and when it does, it doesn't include duplicate values. NOTE: Uses shallow comparison for the duplicate checking.

#### Parameters

- obj1: GenericObjectType - The first object to merge
- obj2: GenericObjectType - The second object to merge

#### Returns

- GenericObjectType: The merged schema object

### optionId()

Return a consistent `id` for the `optionIndex`s of a `Radio` or `Checkboxes` widget

#### Parameters

- id: string - The id of the parent component for the option
- optionIndex: number - The index of the option for which the id is desired

#### Returns

- string: An id for the option index based on the parent `id`

### optionsList&lt;S extends StrictRJSFSchema = RJSFSchema>()

Gets the list of options from the schema. If the schema has an enum list, then those enum values are returned.
The labels for the options will be extracted from the non-standard `enumNames` if it exists otherwise will be the same as the `value`.
If the schema has a `oneOf` or `anyOf`, then the value is the list of `const` values from the schema and the label is either the `schema.title` or the value.

NOTE: `enumNames` is deprecated and may be removed in a future major version of RJSF.

#### Parameters

- schema: S - The schema from which to extract the options list

#### Returns

- { schema?: S, label: string, value: any }: The list of options from the schema

### orderProperties()

Given a list of `properties` and an `order` list, returns a list that contains the `properties` ordered correctly.
If `order` is not an array, then the untouched `properties` list is returned.
Otherwise `properties` is ordered per the `order` list.
If `order` contains a '_' then any `properties` that are not mentioned explicity in `order` will be places in the location of the `_`.

#### Parameters

- properties: string[] - The list of property keys to be ordered
- order: string[] - An array of property keys to be ordered first, with an optional '\*' property

#### Returns

- string[]: A list with the `properties` ordered

#### Throws

- Error when the properties cannot be ordered correctly

### pad()

Returns a string representation of the `num` that is padded with leading "0"s if necessary

#### Parameters

- num: number - The number to pad
- width: number - The width of the string at which no lead padding is necessary

#### Returns

- string: The number converted to a string with leading zero padding if the number of digits is less than `width`

### parseDateString()

Parses the `dateString` into a `DateObject`, including the time information when `includeTime` is true

#### Parameters

- dateString: string - The date string to parse into a DateObject
- [includeTime=true]: boolean - Optional flag, if false, will not include the time data into the object

#### Returns

- DateObject: The date string converted to a `DateObject`

#### Throws

- Error when the date cannot be parsed from the string

### rangeSpec&lt;S extends StrictRJSFSchema = RJSFSchema>()

Extracts the range spec information `{ step?: number, min?: number, max?: number }` that can be spread onto an HTML input from the range analog in the schema `{ multipleOf?: number, minimum?: number, maximum?: number }`.

#### Parameters

- schema: S - The schema from which to extract the range spec

#### Returns

- RangeSpecType: A range specification from the schema

### replaceStringParameters()

Potentially substitutes all replaceable parameters with the associated value(s) from the `params` if available.
When a `params` array is provided, each value in the array is used to replace any of the replaceable parameters in the `inputString` using the `%1`, `%2`, etc. replacement specifiers.

#### Parameters

- inputString: string - The string which will be potentially updated with replacement parameters
- [params]: string[] - The optional list of replaceable parameter values to substitute into the english string

#### Returns

- string: The updated string with any replacement specifiers replaced

### schemaRequiresTrueValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Check to see if a `schema` specifies that a value must be true. This happens when:

- `schema.const` is truthy
- `schema.enum` == `[true]`
- `schema.anyOf` or `schema.oneOf` has a single value which recursively returns true
- `schema.allOf` has at least one value which recursively returns true

#### Parameters

- schema: S - The schema to check

#### Returns

- boolean: True if the schema specifies a value that must be true, false otherwise

### shouldRender()

Determines whether the given `component` should be rerendered by comparing its current set of props and state against the next set.
If either of those two sets are not the same, then the component should be rerendered.

#### Parameters

- component: React.Component - A React component being checked
- nextProps: any - The next set of props against which to check
- nextState: any - The next set of state against which to check

#### Returns

- True if boolean: the component should be re-rendered, false otherwise

### titleId<T = any>()

Return a consistent `id` for the field title element.

#### Parameters

- id: IdSchema&lt;T> | string - Either simple string id or an IdSchema from which to extract it

#### Returns

- string: The consistent id for the field title element from the given `id`

### toConstant&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the constant value from the schema when it is either a single value enum or has a const key.
Otherwise, throws an error.

#### Parameters

- schema: S - The schema from which to obtain the constant value

#### Returns

- string | number | boolean: The constant value for the schema

#### Throws

- Error when the schema does not have a constant value

### toDateString()

Returns a UTC date string for the given `dateObject`.
If `time` is false, then the time portion of the string is removed.

#### Parameters

- dateObject: DateObject - The `DateObject` to convert to a date string
- [time=true]: boolean - Optional flag used to remove the time portion of the date string if false

#### Returns

- string: The UTC date string

### toErrorList<T = any>()

Converts an `errorSchema` into a list of `RJSFValidationErrors`

#### Parameters

- errorSchema: ErrorSchema&lt;T> - The `ErrorSchema` instance to convert
- [fieldPath=[]]: string[] | undefined - The current field path, defaults to [] if not specified

#### Returns

- RJSFValidationErrors[]: The list of `RJSFValidationErrors` extracted from the `errorSchema`

### toErrorSchema<T = any>()

Transforms a RJSF validation errors list into an `ErrorSchema`

```ts
const changesThis = [
  { property: '.level1.level2[2].level3', message: 'err a' },
  { property: '.level1.level2[2].level3', message: 'err b' },
  { property: '.level1.level2[4].level3', message: 'err b' },
];
const intoThis = {
  level1: {
    level2: {
      2: { level3: { errors: ['err a', 'err b'] } },
      4: { level3: { errors: ['err b'] } },
    },
  },
};
```

#### Parameters

- errors: RJSFValidationError[] - The list of RJSFValidationError objects

#### Returns

- ErrorSchema&lt;T>: The `ErrorSchema` built from the list of `RJSFValidationErrors`

#### unwrapErrorHandler<T = any>()

Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError()` functions from it

#### Parameters

- errorHandler: FormValidation&lt;T> - The `FormValidation` error handling structure

#### Returns

- ErrorSchema&lt;T>: The `ErrorSchema` resulting from the stripping of the `addError()` function

### utcToLocal()

Converts a UTC date string into a local Date format

#### Parameters

- jsonDate: string - A UTC date string

#### Returns

- string: An empty string when `jsonDate` is falsey, otherwise a date string in local format

### validationDataMerge<T = any>()

Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling `toErrorList()` on the `errors` in the `validationData`.
If no `additionalErrorSchema` is passed, then `validationData` is returned.

#### Parameters

- validationData: ValidationData&lt;T> - The current `ValidationData` into which to merge the additional errors
- [additionalErrorSchema]: ErrorSchema&lt;T> | undefined - The optional additional set of errors in an `ErrorSchema`

#### Returns

- ValidationData&lt;T>: The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.

### withIdRefPrefix&lt;S extends StrictRJSFSchema = RJSFSchema>()

Recursively prefixes all `$ref`s in a schema with the value of the `ROOT_SCHEMA_PREFIX` constant.
This is used in isValid to make references to the rootSchema

#### Parameters

- schemaNode: S - The object node to which a `ROOT_SCHEMA_PREFIX` is added when a `$ref` is part of it

#### Returns

- S: A copy of the `schemaNode` with updated `$ref`s

## Validator-based utility functions

### getDefaultFormState<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Returns the superset of `formData` that includes the given set updated to include any missing fields that have computed to have defaults provided in the `schema`.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- theSchema: S - The schema for which the default state is desired
- [formData]: T | undefined - The current formData, if any, onto which to provide any missing defaults
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s
- [includeUndefinedValues=false]: boolean | "excludeObjectChildren" - Optional flag, if true, cause undefined values to be added as defaults. If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as false when computing defaults for any nested object properties.

#### Returns

- T: The resulting `formData` with all the defaults provided

### getDisplayLabel<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema` should be displayed in a UI.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- schema: S - The schema for which the display label flag is desired
- [uiSchema={}]: UiSchema<T, S, F> - The UI schema from which to derive potentially displayable information
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s
- [globalOptions={}]: GlobalUISchemaOptions - The optional Global UI Schema from which to get any fallback `xxx` options

#### Returns

- boolean: True if the label should be displayed or false if it should not

### getClosestMatchingOption<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Determines which of the given `options` provided most closely matches the `formData`.
Returns the index of the option that is valid and is the closest match, or 0 if there is no match.

The closest match is determined using the number of matching properties, and more heavily favors options with matching readOnly, default, or const values.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- rootSchema: S - The root schema, used to primarily to look up `$ref`s
- [formData]: T | undefined - The current formData, if any, used to figure out a match
- options: S[] - The list of options to find a matching options from
- [selectedOption=-1]: number - The index of the currently selected option, defaulted to -1 if not specified
- [discriminatorField]: string | undefined - The optional name of the field within the options object whose value is used to determine which option is selected

#### Returns

- number: The index of the option that is the closest match to the `formData` or the `selectedOption` if no match

### getFirstMatchingOption<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
Always returns the first option if there is nothing that matches.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- [formData]: T | undefined - The current formData, if any, used to figure out a match
- options: S[] - The list of options to find a matching options from
- rootSchema: S - The root schema, used to primarily to look up `$ref`s
- [discriminatorField]: string | undefined - The optional name of the field within the options object whose value is used to determine which option is selected

#### Returns

- number: The index of the first matched option or 0 if none is available

### getMatchingOption<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Given the `formData` and list of `options`, attempts to find the index of the option that best matches the data.
Deprecated, use `getFirstMatchingOption()` instead.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- [formData]: T | undefined - The current formData, if any, used to figure out a match
- options: S[] - The list of options to find a matching options from
- rootSchema: S - The root schema, used to primarily to look up `$ref`s
- [discriminatorField]: string | undefined - The optional name of the field within the options object whose value is used to determine which option is selected

#### Returns

- number: The index of the matched option or 0 if none is available

### isFilesArray<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Checks to see if the `schema` and `uiSchema` combination represents an array of files

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- schema: S - The schema for which check for array of files flag is desired
- [uiSchema={}]: UiSchema<T, S, F> - The UI schema from which to check the widget
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s

#### Returns

- boolean: True if schema/uiSchema contains an array of files, otherwise false

### isMultiSelect<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Checks to see if the `schema` combination represents a multi-select

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- schema: S - The schema for which check for a multi-select flag is desired
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s

#### Returns

- boolean: True if schema contains a multi-select, otherwise false

### isSelect<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Checks to see if the `schema` combination represents a select

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- theSchema: S - The schema for which check for a select flag is desired
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s

#### Returns

- boolean: True if schema contains a select, otherwise false

### mergeValidationData<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling `validator.toErrorList()` onto the `errors` in the `validationData`.
If no `additionalErrorSchema` is passed, then `validationData` is returned.

> NOTE: This is function is deprecated. Use the `validationDataMerge()` function exported from `@rjsf/utils` instead. This function will be
> removed in the next major release.

#### Parameters

- validator: ValidatorType&lt;T, S, F> - An implementation of the `ValidatorType` interface that will be used to convert an ErrorSchema to a list of errors
- validationData: ValidationData&lt;T> - The current `ValidationData` into which to merge the additional errors
- [additionalErrorSchema]: ErrorSchema&lt;T> | undefined - The additional set of errors in an `ErrorSchema`

#### Returns

- ValidationData&lt;T>: The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.

### retrieveSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Retrieves an expanded schema that has had all of its conditions, additional properties, references and dependencies
resolved and merged into the `schema` given a `validator`, `rootSchema` and `rawFormData` that is used to do the
potentially recursive resolution.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
- schema: S - The schema for which retrieving a schema is desired
- [rootSchema={}]: S - The root schema that will be forwarded to all the APIs
- [rawFormData]: T | undefined - The current formData, if any, to assist retrieving a schema

#### Returns

- RJSFSchema: The schema having its conditions, additional properties, references and dependencies resolved

### sanitizeDataForNewSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Sanitize the `data` associated with the `oldSchema` so it is considered appropriate for the `newSchema`.
If the new schema does not contain any properties, then `undefined` is returned to clear all the form data.
Due to the nature of schemas, this sanitization happens recursively for nested objects of data.
Also, any properties in the old schema that are non-existent in the new schema are set to `undefined`.

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- rootSchema: S - The root JSON schema of the entire form
- [newSchema]: S | undefined - The new schema for which the data is being sanitized
- [oldSchema]: S | undefined - The old schema from which the data originated
- [data={}]: any - The form data associated with the schema, defaulting to an empty object when undefined

#### Returns

- T: The new form data, with all the fields uniquely associated with the old schema set to `undefined`. Will return `undefined` if the new schema is not an object containing properties.

### toIdSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Generates an `IdSchema` object for the `schema`, recursively

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- schema: S - The schema for which the `IdSchema` is desired
- [id]: string | null - The base id for the schema
- [rootSchema]: S | undefined- The root schema, used to primarily to look up `$ref`s
- [formData]: T | undefined - The current formData, if any, to assist retrieving a schema
- [idPrefix='root']: string - The prefix to use for the id
- [idSeparator='_']: string - The separator to use for the path segments in the id

#### Returns

- IDSchema&lt;T>: The `IdSchema` object for the `schema`

### toPathSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Generates an `PathSchema` object for the `schema`, recursively

#### Parameters

- validator: ValidatorType<T, S, F> - An implementation of the `ValidatorType` interface that will be used when necessary
- schema: S - The schema for which the `PathSchema` is desired
- [name='']: string - The base name for the schema
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s
- [formData]: T | undefined - The current formData, if any, to assist retrieving a schema

#### Returns

- PathSchema&lt;T> - The `PathSchema` object for the `schema`

## Schema utils creation function

### createSchemaUtils<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>()

Creates a `SchemaUtilsType` interface that is based around the given `validator` and `rootSchema` parameters.
The resulting interface implementation will forward the `validator` and `rootSchema` to all the wrapped APIs.

#### Parameters

- validator: ValidatorType<T, S, F> - an implementation of the `ValidatorType` interface that will be forwarded to all the APIs
- rootSchema: S - The root schema that will be forwarded to all the APIs

#### Returns

- SchemaUtilsType<T, S, F> - An implementation of a `SchemaUtilsType` interface

## ErrorSchema builder class

### ErrorSchemaBuilder&lt;T = any>(initialSchema?: ErrorSchema&lt;T>) constructor

The `ErrorSchemaBuilder&lt;T>` is used to build an `ErrorSchema&lt;T>` since the definition of the `ErrorSchema` type is designed for reading information rather than writing it.
Use this class to add, replace or clear errors in an error schema by using either dotted path or an array of path names.
Once you are done building the `ErrorSchema`, you can get the result and/or reset all the errors back to an initial set and start again.

#### Parameters

- [initialSchema]: ErrorSchema&lt;T> | undefined - The optional set of initial errors, that will be cloned into the class

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

### ErrorSchema getter function

Returns the `ErrorSchema` that has been updated by the methods of the `ErrorSchemaBuilder`

Usage:

```ts
import { ErrorSchemaBuilder, ErrorSchema } from "@rjsf/utils";

const builder = new ErrorSchemaBuilder();

// Do some work using the builder
...

const errorSchema: ErrorSchema = builder.ErrorSchema;
```

### resetAllErrors()

Resets all errors in the `ErrorSchemaBuilder` back to the `initialSchema` if provided, otherwise an empty set.

#### Parameters

- [initialSchema]: ErrorSchema&lt;T> | undefined - The optional set of initial errors, that will be cloned into the class

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

### addErrors()

Adds the `errorOrList` to the list of errors in the `ErrorSchema` at either the root level or the location within the schema described by the `pathOfError`.
For more information about how to specify the path see the [eslint lodash plugin docs](https://github.com/wix/eslint-plugin-lodash/blob/master/docs/rules/path-style.md).

#### Parameters

- errorOrList: string | string[] - The error or list of errors to add into the `ErrorSchema`
- [pathOfError]: string | string[] | undefined - The optional path into the `ErrorSchema` at which to add the error(s)

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

### setErrors()

Sets/replaces the `errorOrList` as the error(s) in the `ErrorSchema` at either the root level or the location within the schema described by the `pathOfError`.
For more information about how to specify the path see the [eslint lodash plugin docs](https://github.com/wix/eslint-plugin-lodash/blob/master/docs/rules/path-style.md).

#### Parameters

- errorOrList: string | string[] - The error or list of errors to add into the `ErrorSchema`
- [pathOfError]: string | string[] | undefined - The optional path into the `ErrorSchema` at which to add the error(s)

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

### clearErrors()

Clears the error(s) in the `ErrorSchema` at either the root level or the location within the schema described by the `pathOfError`.
For more information about how to specify the path see the [eslint lodash plugin docs](https://github.com/wix/eslint-plugin-lodash/blob/master/docs/rules/path-style.md).

#### Parameters

- [pathOfError]: string | string[] | undefined - The optional path into the `ErrorSchema` at which to add the error(s)

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

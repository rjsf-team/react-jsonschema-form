# RJSF utility functions, constants and types

In version 5, the utility functions from `@rjsf/core/utils` were refactored into their own library called `@rjsf/utils`.
These utility functions are separated into two distinct groups.
The first, larger, group are the [functions](#non-validator-utility-functions) that do NOT require a `ValidatorType` interface be provided as one of their parameters.
The second, smaller, group are the [functions](#validator-based-utility-functions) that DO require a `ValidatorType` interface, which they receive as part of a `SchemaContext`.
There is also a helper [function](#schema-utils-creation-function) used to create a `SchemaUtilsType` implementation from a `SchemaContext` and `rootSchema` object.

## Constants

The `@rjsf/utils` package exports a set of constants that represent all the keys into various elements of a RJSFSchema or UiSchema that are used by the various utility functions.
In addition to those keys, there are the special `ADDITIONAL_PROPERTY_FLAG` and `GUESSED_TYPE_FLAG` flags that are added to a schema under certain conditions by the `retrieveSchema()` utility.
`GUESSED_TYPE_FLAG` marks the stub schema built for an `additionalProperties` entry the schema puts no constraint on at all — `true`, or a schema with no keyword that asserts something about the value, such as `enum`, `const`, `format`, a length, a range, `properties`, `items` or a subschema keyword like `allOf` or `not`: its `type` was guessed from the data the property holds rather than declared by the schema, so `sanitizeDataForNewSchema()` treats it as no type at all when the schema it is compared against is equally unconstrained, and the [fallback UI](./form-props.md#usefallbackuiforunsupportedtype) offers every type for it.
An `additionalProperties` schema that constrains the value some other way without naming a type is not marked.
There is also `JSON_SCHEMA_TYPES`, the list of every type name JSON Schema defines, in the order that fallback UI offers them.
`WIDGET_FIELD_PRESENTATION` is the `PresentationDeclaration` of a field that renders its value with a single widget and leaves every part to whoever that widget says draws it, for a theme or `@rjsf/core` to declare such a field with (see [getPresentationDeclaration()](#getpresentationdeclaration)). It is defined in [getPresentationDeclaration.ts](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/getPresentationDeclaration.ts) rather than with the other constants.
`DEFAULT_BOOLEAN_WIDGET` is the registry key the `checkbox` alias of a `boolean` resolves to (`CheckboxWidget`), so a theme can read that widget from its registry, as `registry.widgets[DEFAULT_BOOLEAN_WIDGET]`, without copying the key. It is defined next to the widget map in [getWidget.tsx](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/getWidget.tsx) rather than with the other constants.

These constants can be found on GitHub [here](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/constants.ts).

## Types

Additionally, the Typescript types used by the utility functions represent nearly all the types used by RJSF.
Those types are exported for use by `@rjsf/core` and all the themes, as well as any customizations you may build.

These types can be found on GitHub [here](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/types.ts).

**`ObjectPath`** — Used by the path utilities (`getByPath`, `setByPath`, `hasByPath`, `unsetByPath`) to address a value inside a plain object. It is `string | number | FieldPathList`. A bare **string is always a single literal key**: `'a.b'` means the key `'a.b'`, never the nested path `a` → `b`. To walk a dotted path string, split it explicitly with [toPath()](#topath) first, or pass a `FieldPathList` (`(string | number)[]`) of segments. Reads and existence checks resolve **own** properties only, so inherited members never appear as form data.

**`FieldPath`** — The identity of a field in a form: a canonical string path such as `friends[0].firstName`, with the root form as the empty string (`ROOT_FIELD_PATH`). Property names are separated by `.`, array indexes are bracketed, and `\ . [ ]` inside a property name are backslash-escaped, so the grammar is unambiguous even when property names contain dots or brackets. It is a branded `string`, so a plain string (such as a DOM id) cannot be passed where a `FieldPath` is expected; build one with [toFieldPath()](#tofieldpath) and derive the HTML id, HTML name or segment list from it with [fieldPathToId()](#fieldpathtoid), [fieldPathToName()](#fieldpathtoname) and [fieldPathToList()](#fieldpathtolist).

**`SchemaContext`** — The settings every [validator-based utility function](#validator-based-utility-functions) resolves schemas with: the `validator`, and the optional `customMergeAllOf` and `defaultFormStateBehavior` (see the `Form` documentation for the [customMergeAllOf](./form-props.md#custommergeallof) and [defaultFormStateBehavior](./form-props.md#defaultFormStateBehavior) props). Each of those functions takes it as its first parameter and passes it along whole to every schema function it calls.

**`SchemaFieldPath`** — Used when navigating a JSON Schema subtree (for example with `getFromSchema` and `findFieldInSchema` on `SchemaUtilsType`, documented under [Validator-based utility functions](#validator-based-utility-functions)). It is `string | FieldPathList`: either a dotted path or an array of segments with the same rules as `FieldPathList` (`(string | number)[]`). A numeric segment denotes an array index or an object key that is numeric. Navigation skips only `undefined` or empty-string segments, so segment **`0`** is always honored (this avoids the bug from treating `0` as a falsy path unit).

**`FormFieldState`** — What a form shows beyond its schema and data, which [`getUiRequiredErrorSchema()`](#getuirequirederrorschema) and [`omitExtraData()`](#omitextradata) read to walk the fields on screen: `selectedOption(fieldPath, options, formData, discriminator?)` returns the index of the `anyOf`/`oneOf` option the field at `fieldPath` shows among its `options`, each retrieved for `formData`, and `isExpanded(fieldPath)` whether the user expanded the collapsed `$ref` cycle there. `Form` passes its own option selections and cycle expansions.

**`ThemePresentation`**, **`PresentationDeclaration`** and **`FieldPresentation`** — A theme's record of which parts of a field (the label, description, errors and help) each of its components draws itself, rather than leaving them to the `FieldTemplate`. A `PresentationDeclaration` names the owner of each part, `'template'`, `'self'` or, for a field that renders a single widget, `'widget'`, `labelledBy`, whether a label the template draws reaches the control through its `for` or through the control's `aria-labelledby`, and `labelPlacement`, whether a label the component draws itself sits `'above'` or `'beside'` its control; a widget's is a `WidgetPresentationDeclaration`, which has no `'widget'` owner. A `ThemePresentation` holds them by registry key under `widgets` and `fields`, plus `default`, what every widget draws for a part the layer's own entry for it doesn't declare, custom and unregistered widgets included, which [mergeThemePresentation()](#mergethemepresentation) layers beneath the layer's own entry for every key, so it overrides the parts it declares in the layers beneath, even under a key one of them declares, and `fieldDefault`, what every field draws for a part its merged entry doesn't declare, custom fields included, and what a part a field leaves to its widget falls back to when it renders none; unlike `default`, it sits beneath the merged entries rather than each layer's own, so it can't override a part a lower layer declares under a key. The merged result is a `MergedThemePresentation`. Nothing is declared on a component itself: one given directly, as a `ui:field` or `ui:widget`, takes the declaration for the first key it is registered under that declares it, so a wrapper such as `memo()` can't lose it. [getPresentationDeclaration()](#getpresentationdeclaration) resolves a field's declaration and [resolveFieldPresentation()](#resolvefieldpresentation) builds its `FieldPresentation`, the plan of where each part is drawn, under which id, and the attributes its control carries, linked as `inherited` to the plan of the field above it that renders the same id.

## Enums

There are enumerations in `@rjsf/utils` that are exported for use by `@rjsf/core` and all the themes, as well as any customizations you may build.

These enums can be found on GitHub [here](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/utils/src/enums.ts).

## React components

The components `@rjsf/utils` exports are the ones a theme renders as-is, so that behavior shared by every theme lives in one place rather than being reimplemented in each of them.

### AdditionalPropertyKeySelect&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

A component that renders the key of an `additionalProperties` property as the theme's own `SelectWidget`, limited to
the key names the parent schema's [`propertyNames.enum`](../json-schema/objects.md#constraining-key-names-with-propertynames) allows.
A theme's `WrapIfAdditionalTemplate` renders it in place of its free-text key input whenever the `propertyNamesEnum`
prop it is given is defined, so each theme only has to choose where the dropdown goes.
The key has no description, help or errors of its own, so the `SelectWidget` is given a plan of its own that describes
it by none, leaves it named by the key's label its template draws beside it where `labelledByTemplate` says so, draws
that label where `hideLabel` leaves it to the select, or else names the select by that label's text through
`aria-label`.

#### Props

- id: string - The id to give the rendered widget
- label: string - The computed label for the key, as a string
- value: string - The current key of the property, which is the selected option
- propertyNamesEnum: string[] - The key names the property is allowed to take
- onKeyRename: (newKey: string) => void - Callback used to rename the property to the newly selected key name
- registry: Registry&lt;T, S, F> - The `registry` object, from which the `SelectWidget` is resolved
- [className]: string - Optional class name given to the rendered widget, for a theme that styles the key control itself
- [disabled]: boolean - Optional flag, if true, the widget is disabled
- [hideLabel]: boolean - Optional flag, if true, the widget renders no label of its own, for themes that render one themselves
- [labelledByTemplate]: boolean - Optional flag, if true, the template draws the key's label beside the widget, with a `for` naming its `id`, so the widget is given no `aria-label` over it
- [readonly]: boolean - Optional flag, if true, the widget is read-only
- [required]: boolean - Optional flag, if true, the widget is required

### DateElement&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Renders one of the six date element selectors an `AltDateWidget` is made of, using the `SelectWidget` from the registry.
Each element is a control of its own, so the `SelectWidget` receives [dateElementId()](#dateelementid) as both its `id` and its `name`, the element's translated name, from [dateElementLabel()](#dateelementlabel), as its `placeholder`, and its accessible name, from [dateElementAriaLabel()](#dateelementarialabel), as its `aria-label`.
Given its field's `presentation`, it hands the `SelectWidget` a plan of its own, which describes the element by the field's parts that render and marks it `aria-invalid` while the field's errors show, without the field's `aria-labelledby`, which would outrank the element's own name; without one, it hands it the field's description, help and error ids as its `aria-describedby`.
Every theme's `SelectWidget` gives those to the control it renders through [widgetAriaProps()](#widgetariaprops).
The `useAltDateWidgetProps()` hook returns the props for each of them, so a theme's `AltDateWidget` maps over those rather than assembling the selectors itself.

#### Props

- value: any - The value currently selected for this element, or `undefined` for none, as `getDateElementProps()` gives it; a `-1`, as a `DateObject` holds an unset part, is handed to the `SelectWidget` as `undefined` too
- [name]: string - Deprecated and ignored: the element takes [dateElementId()](#dateelementid) as its name
- rootId: string - The id of the field, from which the element derives its own id with [dateElementId()](#dateelementid)
- select: (property: keyof DateObject, value: any) => void - Records a value for one property of the `DateObject`
- type: DateElementProp['type'] - Which element this is, e.g. `year`, `month` or `day`
- range: DateElementProp['range'] - The inclusive range of values the element offers
- registry: Registry&lt;T, S, F> - The `registry` object, from which the `SelectWidget` is resolved
- onBlur: (id: string, value: any) => void - Callback for the widget's blur event
- onFocus: (id: string, value: any) => void - Callback for the widget's focus event
- [className='form-control']: string - Optional class name given to the rendered widget
- [autofocus]: boolean - Optional flag, if true, the widget autofocuses
- [disabled]: boolean - Optional flag, if true, the widget is disabled
- [readonly]: boolean - Optional flag, if true, the widget is read-only
- [label]: string - Optional label of the field, which leads the element's accessible name, as built by [dateElementAriaLabel()](#dateelementarialabel)
- [elementLabel]: string - Optional translated name of the element, for a caller that already translated it to display it; defaults to [dateElementLabel()](#dateelementlabel)
- [presentation]: FieldPresentation - Optional plan of the field, whose parts that render describe the element, and whose errors mark it `aria-invalid` while they show

### SelectedOptionDescription&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#selectedoptiondescription}

Renders the description of the `oneOf`/`anyOf` option currently selected in a single-select widget, through the `DescriptionFieldTemplate` from the registry.
A theme's `SelectWidget` renders it so that choosing an option shows what that option is for, which the widget's own description cannot say.
Nothing is rendered when the widget takes multiple values, when a `ui:label` of false turns the label off, or when the selected option's schema has no `description`.
Without its field's plan, `hideLabel` turns it off as well, and it renders under `descriptionId()`. Give it the same `presentation` and `hideLabel` as [widgetAriaProps()](#widgetariaprops), which describes the select by the element this renders: given different ones, the two can disagree on whether that element exists and on its id. Under the plan, `hideLabel` says only that the widget doesn't draw the label, which the template may; the plan's `showLabel` says instead whether `ui:label: false`, resolved through the fields above, turns it off, and it renders under [selectedOptionDescriptionId()](#selectedoptiondescriptionid), since the field's own description may render under `descriptionId()`.

#### Props

- id: string - The id of the widget, from which the description's own id is derived
- value: any - The currently selected value, matched against the `enumOptions` to find the option
- options: WidgetProps['options'] - The widget's options, whose `enumOptions` carry each option's schema
- registry: Registry&lt;T, S, F> - The `registry` object, from which the `DescriptionFieldTemplate` is resolved
- [uiSchema]: UiSchema&lt;T, S, F> - The uiSchema for the field, read for the `label` option
- [multiple]: boolean - Optional flag, if true, nothing is rendered
- [hideLabel]: boolean - Optional flag, if true and there is no `presentation`, nothing is rendered
- [presentation]: FieldPresentation - The plan of the widget's field, under which `hideLabel` is not read

## Non-Validator utility functions

### allowAdditionalItems()

Checks the schema to see if it is allowing additional items, by verifying that `schema.additionalItems` is an object.
The user is warned in the console if `schema.additionalItems` has the value `true`.

#### Parameters

- schema: S - The schema object to check

#### Returns

- boolean: True if additional items is allowed, otherwise false

### allowsAdditionalProperties&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns whether an object takes keys its own `properties` don't name, which is what makes asking [`getAdditionalPropertySchema()`](#getadditionalpropertyschemas-extends-strictrjsfschema--rjsfschema) about such a key worth it at all: `retrieveSchema()` stubs the extra keys the form data holds only for an object that takes them, `canExpand()` offers the add button only for one, and `ObjectField` adds a property only to one.

A `patternProperties` naming a pattern says the object takes them, whatever an `additionalProperties: false` beside it says about the names no pattern matches, since the names a pattern matches are the object's to take all the same.
Otherwise the keyword that describes those names answers, as long as it neither rejects them nor is missing: an object naming none of the three keywords takes any key as far as a validator is concerned, but the form has no schema to render one with and no name to add one under, so it offers none.
An empty `patternProperties` names no pattern, so it matches no name and describes no key the object could take, the way an empty `properties` declares none.

#### Parameters

- schema: S - The object schema to check

#### Returns

- boolean: True when the object takes keys beyond the ones its `properties` name

### ariaDescribedByIds()

Return a list of element ids that contain additional information about the field that can be used to as the aria description of the field.

#### Parameters

- id: string - The id of the field
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

### bracketNameGenerator()

Generates bracketed names for form fields.

#### Parameters

- path: FieldPathList - The path of field path units to use when generating the name
- idPrefix: string - The prefix to use at the start of the generated name
- [isMultiValue]: boolean | undefined - Optional flag, if true, will append `[]` to the end of the name for multi-value fields (e.g., checkboxes, multi-select)

#### Returns

- string: The generated bracketed name (e.g., `root[tasks][0][title]`, or `root[hobbies][]` for multi-value fields)

### buttonId()

Return a consistent `id` for the `btn` button element

#### Parameters

- id: string - The id of the parent component for the option
- btn: 'add' | 'copy' | 'moveDown' | 'moveUp' | 'remove' - The button type for which to generate the id

#### Returns

- string: The consistent id for the button from the given `id` and `btn` type

### callWithDeferredThrow()

Calls `callback`, and rethrows anything it throws from a `setTimeout()` instead of to the caller.
Use it for a consumer's callback that a widget or field calls from an Effect or its cleanup: a throw there happens inside React's commit phase and unmounts everything up to the nearest error boundary.
From a timer the throw escapes error boundaries instead.
A browser reports it as an uncaught error, the way it reports a throw from a DOM event handler.
A test runner reports it as an unhandled error that belongs to no test, and Node, as in server rendering, raises an `uncaughtException`.
Tests that expect such a throw need to catch the timer's error themselves; this repository's `testing/deferredThrows.ts` is an example for Vitest.

#### Parameters

- callback: () => void - The consumer's callback to call

### canExpand&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Checks whether the field described by `schema`, having the `uiSchema` and `formData` supports expanding.
The UI for the field can expand if it has additional properties, is not forced as non-expandable by the `uiSchema` and the `formData` object doesn't already have `schema.maxProperties` elements.
A `schema.propertyNames.enum` caps the object in the same way: once every name it allows is held by a property, there is no name left for a new one to be added under, so the field can no longer expand.

#### Parameters

- schema: S - The schema for the field that is being checked
- [uiSchema=\{}]: UiSchema&lt;T, S, F> - The uiSchema for the field
- [formData]: T | undefined - The formData for the field

#### Returns

- boolean: True if the schema element has additionalProperties or patternProperties keywords, is expandable, is not at the maxProperties limit and has a name its `propertyNames.enum` allows left to take

### constrainsValue()

Says whether `keyword` of a schema constrains the value the schema describes, either directly, as `enum`, `minLength` or `required` do, or by way of other subschemas, as `allOf`, `not` or `$ref` do.
`type` does not count, nor does an annotation such as `title`, an identifier such as `$id`, a container such as `$defs`, a `discriminator` or a keyword outside JSON Schema's validation vocabulary, such as an `x-` extension: none of those rejects a value.

#### Parameters

- keyword: string - The keyword

#### Returns

- boolean: True when the keyword constrains the value

### createErrorHandler&lt;T = unknown>()

Given a `formData` object, recursively creates a `FormValidation` error handling structure around it

#### Parameters

- formData: T - The form data around which the error handler is created

#### Returns

- FormValidation&lt;T>: A `FormValidation` object based on the `formData` structure

### createRootSchemaGuard&lt;S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns a guard that throws when the `schema` it is given is neither the `rootSchema` a precompiled validator was compiled from nor that schema's resolution for the `formData`.
A schema is compared once per object: one the guard accepted before is accepted again without comparing, including when it was changed since or, for a resolution, the data differs from the data it was resolved for.
A form validates with the same schema object until its schema changes, and passes the resolution for the data being validated, so the comparison runs once per schema rather than on every validation.

#### Parameters

- schemaContext: SchemaContext&lt;S, F> - The context to resolve the `rootSchema` with: the validator itself and the merge its schemas were compiled with
- rootSchema: S - The root schema the validator was compiled from

#### Returns

- (schema: S, formData?: unknown) => void: A function that takes the `schema` to validate with and the `formData` the schema may have been resolved for, and throws when the schema is neither the `rootSchema` nor its resolution

### dataURItoBlob()

Given the `FileReader.readAsDataURL()` based `dataURI` extracts that data into an actual Blob along with the name
of that Blob if provided in the URL. If no name is provided, then the name falls back to `unknown`.

#### Parameters

- dataURI: string - The `DataUrl` potentially containing name and raw data to be converted to a Blob

#### Returns

- \{ blob: Blob, name: string }: An object containing a Blob and its name, extracted from the URI

### dateElementAriaLabel()

Return the accessible name of a date element: the field's label combined with the element's translated name through `TranslatableString.DateElementAriaLabel` (`'%1, %2'` in english), so a locale controls both the order and the punctuation.
The label is kept even when the field hides it on screen, since that is when the parts of two date fields are otherwise impossible to tell apart.
Only an empty label leaves the element's name alone.

#### Parameters

- elementLabel: string - The translated name of the date element, as returned by [dateElementLabel()](#dateelementlabel)
- translateString: Registry['translateString'] - The `translateString` function from the `registry`
- [label]: string - The label of the field the date element belongs to

#### Returns

- string: The accessible name of the date element

#### Example

```typescript
dateElementAriaLabel('year', englishStringTranslator, 'When'); // 'When, year'
dateElementAriaLabel('year', englishStringTranslator, ''); // 'year'
```

### dateElementId()

Return a consistent `id` for one of the date element selectors an `AltDateWidget` renders.
`DateElement` gives its `SelectWidget` this id, so a theme can point a label at the year, month or day control rather than rebuilding the id itself.
Note that the separator here is always `_`, independent of the form's `idSeparator`.

#### Parameters

- rootId: string - The id of the `AltDateWidget` field the date element belongs to
- type: string - The type of the date element, as given by its `DateElementProp`

#### Returns

- string: The consistent id for that date element's control

#### Example

```typescript
dateElementId('root_birthday', 'year'); // 'root_birthday_year'
```

### dateElementLabel()

Return the translated name of a date element, through the `TranslatableString` for its `type`: `YearLabel`, `MonthLabel`, `DayLabel`, `HourLabel`, `MinuteLabel` or `SecondLabel`.
Any other `type` is returned as it is.

#### Parameters

- type: string - The type of the date element, as given by its `DateElementProp`
- translateString: Registry['translateString'] - The `translateString` function from the `registry`

#### Returns

- string: The translated name of the date element

### dateRangeOptions&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns a list of options for a date range between `start` and `stop`.
If the start date is greater than the end date, then the date range is reversed.
If `start` and `stop` are negative numbers (or zero), then they will be treated as relative to the current year.

#### Parameters

- start: number - The starting point of the date range
- stop: number - The ending point of the date range

#### Returns

- (EnumOptionsType&lt;S> & \{ value: number })[]: The list of EnumOptionsType for the date range between `start` and `stop`

#### Throws

- Error when `start` and `stop` aren't both %lt;= 0 or > 0

### deepEquals()

Implements a deep equals that treats all functions as equivalent and tracks circular references, so self-referential inputs do not recurse infinitely.

#### Parameters

- a: any - The first element to compare
- b: any - The second element to compare

#### Returns

- boolean: True if the `a` and `b` are deeply equal, false otherwise

### deepEqualsUndefinedAsMissing()

`deepEquals()` for which a key that is missing reads as one holding `undefined`, whichever object lacks it and at any depth, so `{ a: 1, b: undefined }` equals `{ a: 1 }`.

#### Parameters

- a: any - The first element to compare
- b: any - The second element to compare

#### Returns

- boolean: True if the `a` and `b` are deeply equal, false otherwise

### descriptionId()

Return a consistent `id` for the field description element.

#### Parameters

- id: string - The id of the field

#### Returns

- string: The consistent id for the field description element from the given `id`

### dotNotationNameGenerator()

Generates dot-notation names for form fields. Multi-value fields are handled the same as single-value fields in dot notation.

#### Parameters

- path: FieldPathList - The path of field path units to use when generating the name
- idPrefix: string - The prefix to use at the start of the generated name
- [_isMultiValue]: boolean | undefined - Optional flag (unused in dot notation)

#### Returns

- string: The generated dot-notation name (e.g., `root.tasks.0.title`)

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
- [selected]: unknown - The current (list of) selected value(s)
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions

#### Returns

- unknown: The updated list, or the unchanged single selection. A matching single selection becomes `undefined`. Narrow the result before using it as a specific type.

### enumOptionsDomValues&lt;S extends StrictRJSFSchema = RJSFSchema>()

Encodes every option of `enumOptions` for its DOM value attribute, in a single pass over the list.
A widget reads an option's value at its position, and `enumOptionValueDecoder()` and `enumOptionSelectedValue()` encode against the same list, so they agree with it.
When `format` is `'indexed'` (the default), each option's value is its index as a string.
When `format` is `'realValue'`, primitive values are converted via `String()`.
Non-primitive values (objects, arrays) fall back to their index, prefixed with `ENUM_OPTION_INDEX_PREFIX` (`__rjsf_index:`), since `String()` would produce `"[object Object]"`.
So do `null` and the empty string, since the empty string is the value of a select's empty placeholder.
The prefix keeps that index from sharing a value with a primitive option spelled as the same number, and a string that itself starts with the prefix is encoded as its index too, so it can't share a value with the option at the index it spells.
Options whose `String()` is the same, such as `1` and `'1'`, are each encoded as their index too, so every option keeps a DOM value of its own.
That includes options with the very same value, such as two `'US'` constants titled `USA` and `United States`, since options sharing a DOM value can't be told apart by any select, whether for picking one or showing which is selected; both still decode to the value they share, so a multiple widget that takes its selection from `enumOptionSelectedValue()` shows only the first of them as selected.
An `undefined` option is encoded as the empty string.

#### Parameters

- enumOptions: EnumOptionsType&lt;S>[] | undefined - The available enum options
- [format='indexed']: OptionValueFormat - How to encode the values for the DOM attribute: `'indexed'` for each option's index, `'realValue'` for the values themselves

#### Returns

- string[]: The DOM value attribute of each option, in the order of `enumOptions`

### enumOptionSelectedValue&lt;S extends StrictRJSFSchema = RJSFSchema, E = undefined>()

Computes the value to pass to a select element's `value` attribute.
When `format` is `'realValue'`, encodes form data values as `enumOptionsDomValues()` encodes the options' values.
A lone non-array value of a `multiple` selection is encoded as a one-item selection.
When `format` is `'indexed'` (the default), resolves to index-based values via `enumOptionsIndexForValue`.
Returns `emptyValue` when the current value is empty.

#### Parameters

- value: unknown - The current form data value
- enumOptions: EnumOptionsType&lt;S>[] | undefined - The available enum options
- multiple: boolean - Whether the select allows multiple selections
- [format='indexed']: OptionValueFormat - How option values are encoded on the DOM
- [emptyValue]: E - The value to return when the selection is empty

#### Returns

- string | string[] | E: The value to use for the select element's `value` attribute, a `string[]` when `multiple` and a `string` otherwise, or `emptyValue` (`undefined` when it is omitted)

### enumOptionsIndexForValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the index(es) of the options in `allEnumOptions` whose value(s) match the ones in `value`.
All the `enumOptions` are filtered based on whether they are a "selected" `value` and the index of each selected one is then stored in an array.
If `multiple` is true, that array is returned.
Otherwise the index of an option whose value is the whole `value` is returned, such as an array option's for an array `value`, falling back to the first element in that array.

#### Parameters

- value: unknown - The single value or list of values for which indexes are desired
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions
- [multiple=false]: boolean - Optional flag, if true will return a list of index, otherwise a single one

#### Returns

- string | string[] | undefined: A single string index for the first `value` in `allEnumOptions`, if not `multiple`. Otherwise, the list of indexes for (each of) the value(s) in `value`.

### enumOptionsAutofocusIndex&lt;S extends StrictRJSFSchema = RJSFSchema>()

Gets the index of the option a `RadioWidget` or `CheckboxesWidget` focuses under `ui:autofocus`. A radio group passes its value, so focus lands on its checked option, where Tab into the group lands, rather than on an unchecked one that Space would check. Otherwise, or where `ui:enumDisabled` disables the checked option, it is the first option that list leaves enabled, since a disabled option can't take focus.

#### Parameters

- enumOptions: EnumOptionsType&lt;S>[] | undefined - The widget's options
- [enumDisabled]: EnumValue[] | undefined - The `ui:enumDisabled` list of enum values that should be rendered disabled
- [autofocus=false]: boolean - Whether the widget is to take focus as it mounts
- [checkedValue]: EnumOptionsType&lt;S>['value'] - A radio group's value, whose option takes focus where it is enabled

#### Returns

- number: The index of the option to focus, or -1 where the widget takes no focus or every option is disabled

### enumOptionsIsDisabled()

Determines whether the option with the given `value` is one the `ui:enumDisabled` list disables.
The values match strictly, and an `enumDisabled` that isn't a list disables nothing.

#### Parameters

- value: unknown - The value of the enum option being checked
- [enumDisabled]: EnumValue[] | undefined - The `ui:enumDisabled` list of enum values that should be rendered disabled

#### Returns

- boolean: true if `enumDisabled` lists the `value`, false otherwise

### enumOptionsIsSelected&lt;S extends StrictRJSFSchema = RJSFSchema>()

Determines whether the given `value` is (one of) the `selected` value(s).
An array `selected` is read as a list of selections unless `multiple` is `false`, which a single-select widget passes so that an array is compared whole, as the selection of an option whose value is an array, e.g. the `[2]` of a `{ const: [2] }` constant.

#### Parameters

- value: unknown - The value being checked to see if it is selected
- selected: unknown - The current selected value or list of values
- [multiple]: boolean | undefined - Whether `selected` is a list of selections; when omitted, an array `selected` is one

#### Returns

- boolean: true if the `value` is the `selected` one, or one of them for a list of selections, false otherwise

### enumOptionsSelectValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Add the `value` to the list of `selected` values in the proper order as defined by `allEnumOptions`.
Values are compared by deep equality, so an object or array option finds its place whether or not `selected` holds the option's own instance.
A value already selected isn't added again, and a selected value that matches no option keeps its place after the ones that do.

#### Parameters

- valueIndex: string | number - The index of the value that should be selected
- selected: unknown[] - The current list of selected values
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions

#### Returns

- unknown[]: The updated list of selected enum values with `value` added to it in the proper location

### enumOptionsValueForIndex&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the value(s) from `allEnumOptions` at the index(es) provided by `valueIndex`.
If `valueIndex` is not an array AND the index is not valid for `allEnumOptions`, `emptyValue` is returned.
If `valueIndex` is an array, AND it contains an invalid index, the returned array will have the resulting undefined values filtered out, leaving only valid values or in the worst case, an empty array.

#### Parameters

- valueIndex: string | number | Array&lt;string | number> - The index(es) of the value(s) that should be returned
- [allEnumOptions=[]]: EnumOptionsType&lt;S>[] - The list of all the known enumOptions
- [emptyValue]: unknown - The value to return when the non-array `valueIndex` does not refer to a real option

#### Returns

- unknown: The selected option value, a list of selected values for an array of indexes, or `emptyValue` for an invalid single index. Narrow the result before using it as a specific type.

### enumOptionValueDecoder&lt;S extends StrictRJSFSchema = RJSFSchema>()

Decodes a string from a DOM value attribute back to a typed enum value.
When `format` is `'realValue'`, does a reverse lookup: finds the enum option that `enumOptionsDomValues()` encodes as the input string and returns the original typed value, including object, array and `null` values and options that share a `String()`, which are encoded as their prefixed index.
A bare index is not an option's position here, since it can't be told apart from a number option's own value; a widget holding a position resolves it with `enumOptionsValueForIndex()` instead.
When `format` is `'indexed'` (the default), uses index-based resolution via `enumOptionsValueForIndex`.

#### Parameters

- value: string | string[] - The string value(s) from the DOM
- enumOptions: EnumOptionsType&lt;S>[] | undefined - The available enum options
- [format='indexed']: OptionValueFormat - How the values were encoded on the DOM
- emptyValue: unknown - The value to return for empty/missing selections

#### Returns

- unknown: The original typed enum value(s)

### enumOptionValueLabel()

Returns the label for an enum option with no title of its own: its value, with a plain object or array spelled out as
JSON, since `String()` would label every one of them `[object Object]`. Any other value, such as a `Date` or a `Map`,
and any value nested in the JSON that JSON has no form for, such as a `BigInt` or a `RegExp`, is spelled the way
`String()` spells it, as RJSF's warnings spell it. A circular plain object or array falls back to `String()`, and a
value `String()` throws for is spelled as its type

#### Parameters

- value: unknown - The option's value

#### Returns

- string: The text to label the option with

### logUnsupportedDefaultForEnum&lt;S extends StrictRJSFSchema = RJSFSchema>()

Logs a warning when a single-select enum widget has a schema default that is not one of its enum options.
Multi-select widgets are ignored because they do not use the same single-value default handling.

#### Parameters

- id: string - The field id used in the warning message
- schema: S - The schema whose default value is checked
- [enumOptions]: EnumOptionsType&lt;S>[] - The enum options available to the widget
- [multiple=false]: boolean - Whether the widget allows multiple selections

### errorId()

Return a consistent `id` for the field error element.

#### Parameters

- id: string - The id of the field

#### Returns

- string: The consistent id for the field error element from the given `id`

### errorSchemaChild()

Returns the `value` under `key` when it is a child node of an `ErrorSchema`: a plain object, or an array holding the errors of an array field's items, which the walks of an `ErrorSchema` descend into.
An `__errors` array holds messages, not nodes, so a value under `__errors` is never a child.
Any other object, such as a class instance or a plain object made in another realm (an iframe, say), is not a supported node: its `__errors` still show on its field, but are not listed, do not block the submit and are not dropped with a field's raised errors.

#### Parameters

- key: string - The key the value sits under
- value: unknown - The value under `key`

#### Returns

- Record&lt;string, unknown> | unknown[] | undefined: `value` when the walks of an `ErrorSchema` descend into it, otherwise `undefined`

### examplesId()

Return a consistent `id` for the field examples element.

#### Parameters

- id: string - The id of the field

#### Returns

- string: The consistent id for the field examples element from the given `id`

### expandButtonId()

Return a consistent `id` for the expand button of a cyclic schema's expand controls

#### Parameters

- id: string - The id of the field whose cyclic schema can be expanded

#### Returns

- string: The consistent id for the expand button from the given `id`

### expandRefCycle&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the expansion of a field `retrieveSchema()` collapsed as a recursive `$ref`, flagging it with `RJSF_REF_CYCLE_KEY`: the schema to retrieve the field from, one level further, with its `$ref` path and the guard its children are checked against restarted at it, so its children collapse again at their next recurrence.
`CyclicSchemaField` expands a field the user expanded with it; a custom field rendering collapsed fields does the same.
A schema `retrieveSchema()` did not hand out is returned without the flag.

#### Parameters

- schema: S - The collapsed field's schema, as `retrieveSchema()` handed it out
- rootSchema: S - The root schema it was handed out for

#### Returns

- S: The schema to retrieve the expanded field from

### fieldLabelId()

Return a consistent `id` for the label a theme's `FieldTemplate` renders above a field's control.
A widget that a `label htmlFor` cannot name — a group of controls, since the association reaches a single control rather than the element wrapping them — points `aria-labelledby` at this id, so its accessible name is the text the user actually sees.
A single control, including a `button` a picker opens from, is named by the label's `htmlFor` alone: an `aria-labelledby` pointing here outranks that association, so under a `FieldTemplate` that renders no label with this id it would leave the control named by its own contents, or by nothing at all.
Note that this cannot be [titleId()](#titleid), which `TitleFieldTemplate` already claims for the same field.

#### Parameters

- id: string - The id of the field

#### Returns

- string: The consistent id for that field's label element

#### Example

```typescript
fieldLabelId('root_birthday'); // 'root_birthday__label'
```

### fieldPathEndsWithIndex()

Determines whether the last segment of `fieldPath` is an array index, i.e. whether the path addresses an array element.

#### Parameters

- fieldPath: FieldPath - The `FieldPath` to check

#### Returns

- boolean: True when the path addresses an array element, otherwise false

### fieldPathFromList()

Folds a `FieldPathList` into the `FieldPath` addressing the same field, the inverse of [`fieldPathToList()`](#fieldpathtolist).

#### Parameters

- fieldPathList: FieldPathList - The list of property names and array indexes to fold

#### Returns

- FieldPath: The `FieldPath` for `fieldPathList`

### fieldPathToId()

Derives the HTML `id` for `fieldPath` from the `idPrefix` and `idSeparator` in `globalFormOptions`, joining the prefix and every segment of the path with the separator.

#### Parameters

- fieldPath: FieldPath - The `FieldPath` of the field
- globalFormOptions: GlobalFormOptions - The `GlobalFormOptions` used to get the `idPrefix` and `idSeparator`

#### Returns

- string: The id for the field

### fieldPathToList()

Parses `fieldPath` back into its list of segments, with array indexes as numbers and property names unescaped.

#### Parameters

- fieldPath: FieldPath - The `FieldPath` to parse

#### Returns

- FieldPathList: The `FieldPathList` for `fieldPath`

### fieldPathToName()

Derives the HTML `name` for `fieldPath` using the `nameGenerator` in `globalFormOptions`, when one is provided.

#### Parameters

- fieldPath: FieldPath - The `FieldPath` of the field
- globalFormOptions: GlobalFormOptions - The `GlobalFormOptions` used to get the `nameGenerator` and `idPrefix`
- [isMultiValue]: boolean | undefined - Optional flag indicating this field accepts multiple values

#### Returns

- string | undefined: The name for the field, or undefined when no `nameGenerator` is configured or `fieldPath` is the root

### findSchemaDefinition&lt;S extends StrictRJSFSchema = RJSFSchema>()

**Deprecated.** Kept for callers written against 6.x; resolve a `$ref` as the form does with `schemaUtils.retrieveSchema({ $ref })` instead.

Returns the definition `$ref` names in `rootSchema`, resolved through the schema graph as the form resolves a field's `$ref`: a JSON pointer, an `$anchor` or the `$id` of an embedded resource, each resolved against the `$id`s around it, with every `$ref` below the target followed, the annotations beside a followed `$ref` read over the target's and any other keywords beside it merged with the target as the `allOf` of both.
The result is shared across calls and marked with `RJSF_REF_KEY`, so copy it rather than changing it.
Throws `Could not find a definition for …` for a `$ref` that names nothing, and `Definition for … is a circular reference` for a chain of `$ref`s that loops back on itself.

#### Parameters

- [$ref]: string - The `$ref` to resolve
- [rootSchema={}]: S - The root schema the `$ref` names a definition of

#### Returns

- S: The definition the `$ref` names

### flattenGroupedOptions&lt;S extends StrictRJSFSchema = RJSFSchema>()

Flattens the list returned by `groupEnumOptions()` back into a single list of options, in the same order they appear in that list: each group's options in place of the group, followed by any standalone options.
This is the order a widget's UI library needs when it manages its own selection or keyboard-navigation state over a flat list of items that has to stay in sync with what is actually rendered.

#### Parameters

- groupedOptions: GroupedEnumOptionsType&lt;S>[] - The list returned by `groupEnumOptions()`

#### Returns

- IndexedEnumOptionType&lt;S>[]: The options in `groupedOptions`, flattened to a single list

### getAdditionalPropertySchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the schema an object says applies to a `key` its own `properties` don't name, so that everything that renders such a property, seeds it or decides whether it is allowed at all reads one answer rather than its own.
A key one or more `patternProperties` patterns match is described by all of them together, returned as an `allOf` for the caller to resolve into the one schema that describes it, the same object for every key the same patterns match, so read it rather than change it; a `false` among them rejects the key whatever the others allow, since no value satisfies it.
A key no pattern matches is `additionalProperties`' to describe, `false` and `true` included.

An `unevaluatedProperties` answers for the key only where the object names no `additionalProperties` at all: the keys the `properties` and the `patternProperties` leave over are exactly the ones that go unevaluated, so that keyword is what then describes or rejects them.
Any `additionalProperties`, `true` and a schema alike, evaluates those keys itself, which leaves `unevaluatedProperties` nothing to say about them.
Either keyword spelled `undefined`, as a schema built by spreading tends to spell one, reads as absent the way a validator reads it, so neither hides what the other says.

#### Parameters

- schema: S - The object schema the `key` is a property of
- key: string - The property name whose schema is desired

#### Returns

- S | boolean: `false` for a key the object forbids, `true` for one it allows without describing, and otherwise the subschema describing it, whose `$ref`s are left for the caller to resolve

### getAdditionalPropertyType&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the type an additional property described by `subSchema` holds, or `undefined` for a schema that leaves the type to the value the property comes to hold.
It is what `retrieveSchema()` stubs such a property with and what `ObjectField` seeds a new one from, so the value the add button writes is one the field it renders can show.

The types come from [`getSchemaOwnTypes()`](#getschemaowntypes), so a schema that names its type says that one, a nullable `['integer', 'null']` resolves to the type a value of it can have, a typeless `enum` takes the type of its values — where `getSchemaType()` answers `string` for any of them, giving an `enum` of numbers a string it rejects — and a schema that only implies its type, `properties` implying `object`, says what every other reader of it renders it as.
The non-`null` type comes first, as it does for a nullable type: a value of it is one the field can show, where `null` leaves the user nothing to enter.

An `anyOf`/`oneOf` of options that agree on a type has that type whichever option is chosen, each option read by this same function so that an option's own typeless `enum` speaks for it too.
Options that disagree, or that name no type between them, say nothing here: choosing one is what would settle it, and a type one of them names alone would render a field for that type beside the options.

A schema whose options say nothing is read through its `allOf` entries, the first of them to name a type answering for the merge.
The schema is read as it stands: a `$ref` is not followed.
`retrieveSchema()` with `resolveAnyOfOrOneOfRefs` resolves a subschema and its options, which is how the form reads a key's subschema before asking this.

#### Parameters

- subSchema: S - The schema describing the additional property, from `additionalProperties`, a matching pattern or `unevaluatedProperties`

#### Returns

- string | undefined: The type the `subSchema` says the property holds, or undefined when only its value can say

### getArrayDescription&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getarraydescription}

Gets the description an array's template draws: the one its plan says the array draws itself, so an option repeating its field's description, which a field above draws, doesn't draw it again.
An array rendered without a plan draws its `ui:description` or schema `description`.

#### Parameters

- props: Pick&lt;ArrayFieldTemplateProps&lt;T, S, F>, 'schema' | 'uiSchema' | 'presentation'> - The template's `schema`, `uiSchema` and `presentation`

#### Returns

- string | undefined: The description the template draws, or undefined when it draws none

### getByPath&lt;R = unknown>() {#getbypath}

Gets the value at `path` of `obj`, returning `defaultValue` when the resolved value is `undefined`.
A bare string `path` is a single literal key, not a dotted path; use [toPath()](#topath) to split a dotted path string into segments first.
Every segment must be an **own** property, matching [hasByPath()](#hasbypath), so the two can be used as a guard/read pair.
Inherited members are never resolved: `getByPath({}, 'toString')` returns `defaultValue` rather than `Function.prototype.toString`. For the plain form data and schemas RJSF navigates, an inherited member is never data, and the own-property rule also makes prototype internals such as `__proto__` unreachable unless they are genuine own data keys.

An empty segment list resolves to nothing, so `defaultValue` is returned rather than `obj` itself; this matches [hasByPath()](#hasbypath), which is `false` for an empty path.

The value at a runtime-computed path cannot be known statically, so `R` is the caller's declaration of the expected type (like `Map.get()`); it defaults to `unknown`, which forces narrowing when no type is given.

#### Parameters

- obj: unknown - The object to query
- path: ObjectPath - The single key or list of path segments at which to get the value
- [defaultValue]: R - The value returned when the resolved value is `undefined`

#### Returns

- R: The resolved value, otherwise `defaultValue`

#### Example

```typescript
getByPath({ a: { b: 1 } }, ['a', 'b']); // 1
getByPath({ 'a.b': 1 }, 'a.b'); // 1, a bare string is one literal key
getByPath({ a: { b: 1 } }, toPath('a.b')); // 1
getByPath({ a: {} }, ['a', 'missing'], 'fallback'); // 'fallback'
getByPath({}, 'toString', 'fallback'); // 'fallback', inherited members are not read
getByPath({ a: 1 }, [], 'fallback'); // 'fallback', an empty path resolves to nothing
```

### getChangedFields(a: unknown, b: unknown, deep?: boolean)

Compares two objects and returns the names of the fields that have changed.
This function iterates over each field of object `a`, using `_.isEqual` to compare the field value with the corresponding field value in object `b`.
If the values are different, the field name will be included in the returned array.
A key that is missing reads as one holding `undefined`, whichever object lacks it and at any depth, so a key that only gained or lost an `undefined` value has not changed.
So does an empty slot of an array.

When `deep` is true, a field holding a nested object or a same-length array is descended into and the dotted path of the deepest field that changed is returned instead of the name of the top-level field holding it.
A key that contains a `.` or a `[` is descended into like any other: the path it produces cannot be told apart from a path through nested keys, and neither can the entry an `ErrorSchema` keeps for it, since [toErrorSchema()](#toerrorschema) spells such a name out as a path in the same way.

#### Parameters

- a: unknown - The first object, representing the original data to compare.
- b: unknown - The second object, representing the updated data to compare.
- [deep=false]: boolean - Optional flag that, when true, returns the dotted path of the deepest field that changed.

#### Returns

- string[] : An array of field names that have changed.

#### Example

```typescript
const a = { name: 'John', age: 30 };
const b = { name: 'John', age: 31 };
const changedFields = getChangedFields(a, b);
console.log(changedFields); // Output: ['age']
```

#### Example (deep)

```typescript
const a = { items: [{ qux: '', corge: '' }] };
const b = { items: [{ qux: 'a', corge: '' }] };
console.log(getChangedFields(a, b)); // Output: ['items']
console.log(getChangedFields(a, b, true)); // Output: ['items.0.qux']
```

### getDecimalSeparator(languages?: string | string[])

Determines the locale-specific decimal separator.
It uses the provided locale or the first locale in navigator.languages (if available) and falls back to "en".

#### Parameters

- languages?: string | string[] - Optional array of locales or a single locale string.

#### Returns

- string : The decimal separator character (typically '.' or ',').

#### Example

```typescript
const separator = getDecimalSeparator('fr');
console.log(separator); // Output: ','
```

### getDeprecatedHandling&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getdeprecatedhandling}

Resolves how a field has to render a schema marked `deprecated`: `label` appends a deprecation marker to the label it hands its `FieldTemplate`, `disable` disables the field, and `hide` tells the `FieldTemplate` the field is hidden.
Returns `undefined` for a schema that is not deprecated, so a `ui:deprecatedHandling` on an undeprecated schema cannot hide or disable a field on its own, and a caller can treat the three modes as the only cases.
Under `label`, the decorated label is the field's own: under a plan, which a `Form` always builds, the `FieldTemplate` and the widget below it are both handed it. A field rendered without a plan, as by a custom field, hands its widget the undecorated label.
`SchemaField` and `LayoutMultiSchemaField` both call this, and a custom field rendering its own `FieldTemplate` should too, rather than read `uiOptions.deprecatedHandling` directly — which is how the `label` default gets missed, leaving a deprecated field undecorated.

#### Parameters

- schema: S - The schema of the field, whose `deprecated` keyword gates the whole resolution
- uiOptions: UIOptionsType&lt;T, S, F> - The resolved UI options of the field, read for a `deprecatedHandling` override

#### Returns

- 'hide' | 'disable' | 'label' | undefined: The handling to apply, or `undefined` when the schema is not deprecated

### getDescribedControlAttributes()

Gets the attributes that describe a control from the parts of its field's plan: `aria-describedby` listing the ids of the parts that render, and `aria-invalid` while the field shows errors.
[resolveFieldPresentation()](#resolvefieldpresentation) builds a control's attributes with it, and so can a caller planning a control the resolver didn't, such as an option selector named by an object's heading.

#### Parameters

- describedBy: readonly string[] - The ids of the parts describing the control, in order, each once
- errors: readonly string[] - The error messages the field shows

#### Returns

- Pick&lt;ControlAttributes, 'aria-describedby' | 'aria-invalid'>: The `aria-describedby` and `aria-invalid`, each left out when there is nothing to say

### getDiscriminatorFieldFromSchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the `discriminator.propertyName` when defined in the `schema` if it is a string. A warning is generated when it is not a string.
Returns `undefined` when a valid discriminator is not present.

#### Parameters

- schema: S - The schema from which the discriminator is potentially obtained

#### Returns

- string | undefined: The `discriminator.propertyName` if it exists in the schema, otherwise `undefined`

### getControlAriaLabel()

Gets the `aria-label` of a control that takes no name from what it displays, such as a combobox trigger: the `aria-label` its caller or its field's plan gives it, else none where a label names it, either the one the widget draws itself or one the `FieldTemplate` draws, as [isNamedByTemplateLabel()](#isnamedbytemplatelabel) says, else the name [getControlFallbackName()](#getcontrolfallbackname) gives it.
An empty `aria-label` names nothing, so it falls back like a missing one.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'label' | 'hideLabel' | 'placeholder' | 'presentation' | 'registry'> - The widget's `label`, `hideLabel`, `placeholder`, `presentation` and `registry`
- [ariaLabel]: string | undefined - The `aria-label` the caller or the plan gives the control, as [widgetAriaProps()](#widgetariaprops) merges them
- [drawsOwnLabel=false]: boolean - Whether the widget draws a label that names the control, as [widgetDrawsLabelText()](#widgetdrawslabeltext) says for one that draws its field's label

#### Returns

- string | undefined: The `aria-label`, or undefined where a label names the control

#### Example

```tsx
// In a select whose trigger draws its value, beside a label the widget may draw itself
const ariaProps = widgetAriaProps(props);
const drawsLabel = widgetDrawsLabelText(props);
<SelectTrigger {...ariaProps} aria-label={getControlAriaLabel(props, ariaProps['aria-label'], drawsLabel)} />;
```

### getControlAttributes()

Gets the ARIA attributes a widget spreads onto the focusable element that carries its `id`: the `aria-labelledby`, the `aria-label` a control whose label `ui:label: false` hides is named by, the `aria-describedby` and the `aria-invalid` its field's plan gives its control, followed in `aria-describedby` by the ids of the elements the widget renders to describe that control itself, such as its examples list, each once.
A widget rendered without a plan, as one a caller renders without a `SchemaField` above it, is described by [ariaDescribedByIds()](#ariadescribedbyids).
The plan's `required` is left to the widget's own `required` prop, which a widget may turn off, as `FileWidget` does once a file is chosen.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'presentation'> - The widget's `id` and `presentation`
- [ownDescribedBy=[]]: readonly string[] - The ids of the elements the widget renders to describe its control

#### Returns

- Omit&lt;ControlAttributes, 'required'>: The attributes to spread onto the control

#### Example

```tsx
// In a widget that renders an examples list
<input id={id} {...getControlAttributes({ id, presentation }, hasExamples ? [examplesId(id)] : [])} />
```

### getControlDescribedBy()

Gets the `aria-describedby` a widget gives the focusable element that carries its `id`: the ids its field's plan describes its control by, followed by the ids of the elements the widget renders to describe that control itself, each once.
A widget rendered without a plan is described by [ariaDescribedByIds()](#ariadescribedbyids).
[getControlAttributes()](#getcontrolattributes) builds its `aria-describedby` from it; call this one where a widget needs only that attribute.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'presentation'> - The widget's `id` and `presentation`
- [ownDescribedBy=[]]: readonly string[] - The ids of the elements the widget renders to describe its control

#### Returns

- string | undefined: The `aria-describedby`, or undefined when nothing describes the control

### getControlFallbackName()

Gets the name a control takes where no label names it, for one that takes no name from what it displays, such as a combobox trigger, whose contents are its value: the field's label, else its `placeholder`, which is all an author has said about a field with no title, such as an array item, as a native input falls back to it for its name, and last the translated `prompt`.
A widget gives it as the control's `aria-label` where [isNamedByTemplateLabel()](#isnamedbytemplatelabel) says no label the template draws names the control, and its caller handed it no `aria-label` of its own.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'label' | 'placeholder' | 'registry'> - The widget's `label`, `placeholder` and `registry`
- [prompt=TranslatableString.SelectPlaceholder]: TranslatableString - The prompt a field with neither is named by

#### Returns

- string: The name

### getDateElementProps()

Given date & time information with optional yearRange & format, returns props for DateElement

#### Parameters

- date: DateObject - Object containing date with optional time information
- time: boolean - Determines whether to include time or not
- [yearRange=[1900, new Date().getFullYear() + 2]]: [number, number] - Controls the list of years to be displayed
- [format='YMD']: DateElementFormat - Controls the order in which day, month and year input element will be displayed

#### Returns

- Array of props for DateElement, each part the `date` holds as `-1`, which no one has picked yet, given an `undefined` `value`

### getDateTimeLocalValue&lt;S extends StrictRJSFSchema = RJSFSchema>()

Computes whether a date-time field's `schema.format` is `iso-date-time`, and the `value` to use for display accordingly. When `isIsoDateTime`, a stored value that happens to carry a timezone offset (legal, since that format's timezone is optional) is stripped, so it displays as the naive wall-clock time it represents instead of being converted to another timezone by a date/time picker that parses the offset as real. To be used by theme specific `DateTimeWidget` implementations.

A finite epoch number or a valid `Date` is an exact instant. It is converted to its UTC ISO string when `schema.format` requires an offset (`date-time`/`datetime`), to the day it names when `schema.format` is `date` and the instant is a UTC midnight, and to local wall-clock time for any other format. The `date` and local wall-clock results need a four-digit year the pickers can parse, so a year outside 1-9999 gives `undefined` there; the UTC ISO string keeps any year.

#### Parameters

- schema: S - The schema for the date-time field
- value: unknown - The current value of the field

#### Returns

- DateTimeLocalValueResult: The `DateTimeLocalValueResult` to be used within a `DateTimeWidget` implementation

### getErrorsToDraw&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#geterrorstodraw}

Gets the error messages a widget, or an `ArrayFieldTemplate` or `ObjectFieldTemplate`, draws itself: the messages its field's plan shows, with `ui:hideError` applied, where the plan's `presentation.errors.by` is `'self'`, and none where they are drawn elsewhere, as by the `FieldTemplate` under `'template'` or, below an `anyOf`/`oneOf` option, by the field above.
For a component rendered without a plan, as one rendered outside `SchemaField` is, it falls back to the deprecated `rawErrors` while `hideError` is off.
Read it rather than `rawErrors` or the deprecated [getVisibleErrors()](#getvisibleerrors), and [hasWidgetErrors()](#haswidgeterrors) or [hasTemplateErrors()](#hastemplateerrors) for an error state.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'rawErrors' | 'hideError' | 'presentation'> - The component's `rawErrors`, `hideError` and `presentation`

#### Returns

- readonly string[]: The messages to draw

### getExampleSuggestions&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the suggestions a text input offers for `schema`: its `examples` and `default`, as the strings a user could pick from a `<datalist>`.
Examples and a default that share a `String()` are one suggestion, e.g. `["5432", 5432]` with a default of `5432` is the single suggestion `'5432'`.
A schema without `examples` has no suggestions, and neither has one whose examples and default are all `null`, `undefined`, objects or arrays.
A `BaseInputTemplate` sets its input's `list` and adds the examples id to its `aria-describedby` only when there are suggestions, since `SchemaExamples` renders no `<datalist>` otherwise, and passes them to `SchemaExamples` as its `suggestions` prop, so both read the same list.
The same schema object gets the same array back each time, which is frozen since every caller shares it.
The suggestions are read once per schema object, so `examples` or a `default` edited in place afterwards is not seen: pass a new schema object to change them.

#### Parameters

- schema: S - The schema whose `examples` and `default` are suggested

#### Returns

- readonly string[]: The distinct suggestions, in the order of `examples` followed by the `default`

### getFieldClassNames&lt;S extends StrictRJSFSchema = RJSFSchema>()

Builds the `classNames` string a `FieldTemplate` receives for a field: the `rjsf-field` marker every field carries, the `rjsf-field-<type>` class naming what the schema holds, `rjsf-field-error` while the field has errors to show, and finally whatever `ui:classNames` the field declares, appended last so it can override the rest.
The type class comes from [`getSchemaType()`](#getschematype), so a schema with no derivable type — a discriminated `oneOf`/`anyOf` of `$ref`s, say — is spelled `rjsf-field-undefined` rather than left without a type class, as it has been since 6.x.
That spelling is this function's to change, in one place for every field that calls it, so it is not one to key a CSS rule off; key off `rjsf-field`, which every field carries whatever its schema says.
`SchemaField` and `LayoutMultiSchemaField` both call this, and a custom field rendering its own `FieldTemplate` should too: a field that spells the list itself is the one field a `rjsf-field*` CSS rule stops reaching the next time the contract gains a class.

#### Parameters

- schema: S - The schema of the field, from which the type class is derived
- hasErrors: boolean - Whether the field has errors it is displaying, which adds the `rjsf-field-error` class
- [uiClassNames]: string | undefined - The optional `ui:classNames` the field declares, appended last

#### Returns

- string: The space-separated class list for the field

### getFieldLabel&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getfieldlabel}

Computes the label of a field: the label its `FieldTemplate` shows, and the one its field component hands its widget, so the two can't disagree.
The label is the first non-empty one of the `ui:title`, the unresolved schema's `title` (the one beside a `$ref`), the resolved schema's `title`, the `title` prop and the property name, so an empty `title` falls through to the name.
The schema's `title` comes before the `title` prop, as in the label the `FieldTemplate` shows, so an array item whose `items` schema has a `title` is labelled by it rather than by the numbered title (`Tags-1`) `ArrayField` hands each item.
An `additionalProperties` entry, or one whose key the user renamed, is labelled by its key.
A deprecated field's label is decorated with the `DeprecatedLabel` marker under the `label` [deprecated handling](#getdeprecatedhandling), but only a label there is: a field with no title and no name, such as the root or an item of an array that has no name or title of its own, stays unlabelled.

#### Parameters

- schema: S - The resolved schema of the field
- uiOptions: UIOptionsType&lt;T, S, F> - The resolved UI options of the field, read for `title` and `deprecatedHandling`
- translateString: Registry&lt;T, S, F>['translateString'] - The registry's `translateString`, which decorates a deprecated field's label
- [sources={}]: FieldLabelSources&lt;S> - The other sources the label can come from: `name`, `title`, `unresolvedSchema` and `wasPropertyKeyModified`

#### Returns

- string: The label, or `''` when the field has none

### getFieldTypeForUiSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getfieldtypeforuischema}

Gets the type of the field `SchemaField` renders a schema by, as [getFieldTypeForWidget()](#getfieldtypeforwidget) does for the field's own `ui:widget` in its `uiSchema`.
Only that one picks the field, so `ui:globalOptions` is not read.

#### Parameters

- schema: S - The schema for the field
- [uiSchema]: UiSchema&lt;T, S, F> - The uiSchema for the field

#### Returns

- string | undefined: The type of the field that renders the field's own widget

### getFieldTypeForWidget&lt;S extends StrictRJSFSchema = RJSFSchema>() {#getfieldtypeforwidget}

Gets the type of the field `SchemaField` renders a schema with its `ui:widget` by. For a `type` list naming several non-null types, that is the type [getWidgetType()](#getwidgettype) picks for a named widget, so a `textarea` on a `['null', 'boolean', 'string']` is the `string` one. A `format` picks no other type's field, as it constrains only the list's string member, so an `email` on a `['number', 'string']` stays a `number`. A select over such a list is the type [getSelectFieldType()](#getselectfieldtype) gives its `type` list, as `SchemaField` renders it through that field whatever the widget. Otherwise it is the type `getSchemaType()` resolves. `SchemaField` renders the field of that type, and `getDisplayLabel()`, `getDefaultFormState()` and `FallbackField`'s type selector follow it, so the label, the defaults and the selected type of a field are those of the field on screen.

#### Parameters

- schema: S - The schema for the field
- widget: unknown - The `ui:widget` for the field, if any

#### Returns

- string | undefined: The type of the field that renders the widget

### getFreePropertyNames&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema>()

Returns the names `schema.propertyNames.enum` allows that nothing has taken yet, in the order the `enum` lists them.
A name `schema.properties` declares is taken however empty its value is, since adding under it would write into that declared property rather than create an additional one.
A name `formData` holds is taken whether or not `retrieveSchema()` has stubbed it in among the properties.
An entry that is not a string names nothing a property key could equal, so it is dropped rather than offered as a name no validator would accept.
An `undefined` return means the schema enumerates nothing at all, which is what tells "any name goes" apart from "no name is left to take" — the empty array.
An `enum` that is empty, or that lists only non-strings, allows no key whatsoever and so reads as the latter.
A `propertyNames` written as a `$ref` reads as the former, since resolving one needs a `schemaUtils` this has no access to; resolve it before calling if that matters.

#### Parameters

- schema: S - The schema whose `propertyNames.enum` names the property may take
- [formData]: T | undefined - The form data whose keys count as taken alongside the schema's own properties
- [keepName]: string | undefined - A name to count as free even when taken, the current key of a property being renamed

#### Returns

- string[] | undefined: The allowed names nothing has taken, or undefined when the schema enumerates none

### getGroupAttributes&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getgroupattributes}

Gets the ARIA attributes a widget rendering a group of controls, such as radios or checkboxes, spreads onto the group's wrapper and onto each control in it.
A label's `for` reaches a single control rather than the element wrapping a group, so the wrapper takes the `aria-labelledby` its field's plan gives the control, or the `aria-label` it gives one whose label `ui:label: false` hides, and each control the `aria-describedby` [getControlAttributes()](#getcontrolattributes) gives it.
`aria-invalid` goes where ARIA supports it: on a `radiogroup` rather than on its radios, and on each control of a `group`, such as its checkboxes, rather than on the group.
The wrapper takes the `role` as well, so `aria-invalid` always lands on the role it was placed for; spread `group` rather than setting the role separately.
A widget that draws its own label for the group, as in a theme whose widgets draw their label, passes that label's id, and the group is named by it where the plan names the group by no other label.
Under a plan the id is taken only where the plan gives the widget the label, so a widget can pass it whether or not it draws one; without a plan the caller is trusted.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'presentation'> - The widget's `id` and `presentation`
- role: GroupRole - The role of the group's wrapper, `'radiogroup'` for radios and `'group'` for anything else
- [drawnLabelId]: string | undefined - The id of the label the widget draws for the group itself, where it draws one

#### Returns

- \{ group: Pick&lt;ControlAttributes, 'aria-labelledby' | 'aria-label' | 'aria-invalid'> & \{ role: GroupRole }, option: Omit&lt;ControlAttributes, 'aria-labelledby' | 'aria-label' | 'required'> }: `group`, the `role` and attributes for the group's wrapper, and `option`, those for each control in it

#### Example

```tsx
const { group, option } = getGroupAttributes({ id, presentation }, 'radiogroup');
return (
  <div id={id} {...group}>
    {enumOptions.map((opt, i) => (
      <input key={i} type='radio' id={optionId(id, i)} {...option} />
    ))}
  </div>
);
```

A widget that draws its own label for the group draws it with no `for`, which can't name the group's wrapper, under the id it passes; [getGroupLabelling()](#getgrouplabelling) builds both.

### getGroupLabelling&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getgrouplabelling}

Gets what a widget rendering a group of controls, such as radios or checkboxes, needs to draw its own label for the group and to label the group by it: whether it draws one, the id of the field's label from [getLabelId()](#getlabelid), which it draws it under, and the attributes [getGroupAttributes()](#getgroupattributes) gives the group and each control in it, given that label's id where the widget draws one.
The label is drawn with no `for`, which can't name the group's wrapper, so the group points `aria-labelledby` at it instead, where its field's plan names the group by no other label.
A widget draws the label where [widgetDrawsLabel()](#widgetdrawslabel) says it does and it has text, so a group whose label is hidden is named by its text through the `aria-label` the plan gives it, and one with no label is left unnamed, rather than either being named by a label that isn't drawn.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'label' | 'hideLabel' | 'presentation'> - The widget's `id`, `label`, `hideLabel` and `presentation`
- role: GroupRole - The role of the group's wrapper, `'radiogroup'` for radios and `'group'` for anything else

#### Returns

- \{ drawsLabel: boolean, labelId: string, group, option }: whether the widget draws the label and the id of the field's label, which a widget leaving the label to its template can still hand its own label slot, and the `group` and `option` attributes [getGroupAttributes()](#getgroupattributes) returns

#### Example

```tsx
const { drawsLabel, labelId, group, option } = getGroupLabelling(props, 'radiogroup');
return (
  <>
    {drawsLabel && <label id={labelId}>{label}</label>}
    <div id={id} {...group}>
      {enumOptions.map((opt, i) => (
        <input key={i} type='radio' id={optionId(id, i)} {...option} />
      ))}
    </div>
  </>
);
```

### getInputProps&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Using the `schema`, `defaultType` and `options`, extract out the props for the `<input>` element that make sense.

#### Parameters

- schema: S - The schema for the field provided by the widget
- [defaultType]: string | undefined - The default type, if any, for the field provided by the widget
- [options={}]: UIOptionsType&lt;T, S, F> - The UI Options for the field provided by the widget
- [plainNativeInput=true]: boolean - Whether the theme renders a plain native `<input>`. When true, a number or integer field with no `defaultType` is rendered as a text input with a numeric `inputMode` and `pattern`, and a `number` field that resolves to a native `number` input (via `inputType` or a `defaultType` of `number`) gets `step="any"`; pass false for a theme with its own numeric widget

#### Returns

- InputPropsType: The extracted `InputPropsType` object

### getItemUiSchemaForItem&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the `uiSchema` that applies to the array item at `index`, given that item's own form data.
Unlike `getStaticItemsUiSchema()`, which is used where only the tuple position is known, this also resolves the function form of `uiSchema.items`, calling it with `item`, `index` and `formContext` exactly as `ArrayField` does while rendering.
If the function throws, the error is logged through [`logOnce()`](#logonce) and `undefined` is returned, so the caller proceeds without that item's uiSchema, matching what `ArrayField` renders in that case.

#### Parameters

- [uiSchema]: UiSchema&lt;T, S, F> - The parent (array) uiSchema, if any
- item: T - The item's own form data
- index: number - The tuple position `uiSchema.items` should apply to, when it is given as an array or a function
- [formContext]: F - The formContext to pass to the function form of `uiSchema.items`
- [arrayFieldPath]: FieldPath - The `FieldPath` of the array the item belongs to, used to name the item in the error logged when the function throws, so two arrays whose functions fail the same way at the same index are reported separately. A caller with no path to give, such as a custom `ArrayField`, can omit it, and the error names the index alone rather than a path the caller never supplied

#### Returns

- UiSchema&lt;T, S, F> | undefined: The uiSchema for the item at `index`, or undefined

### getKnownTypes()

Gets the JSON Schema types a `schema` lists, without the duplicates and the type names that are not one of `JSON_SCHEMA_TYPES`, which no field can render.
A schema whose `type` is a single name lists nothing, since a name of its own is not a list to choose from, so an empty array is returned for it.
[getUnionTypes()](#getuniontypes) is this list narrowed to the schemas that allow more than one type, and `FallbackField` uses the list itself to offer exactly the types a schema names, even when it names only one.

#### Parameters

- schema: S - The schema for which to get the listed types

#### Returns

- JSONSchema7TypeName[]: The JSON Schema types the `schema` lists, empty when it lists none

### getLabelId&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getlabelid}

Gets the id of a field's label, for a widget or template that draws it or names a control by it: the id the field's plan gives the label, whoever draws it, which is numbered with [optionLabelId()](#optionlabelid) beneath a label a field above draws under `fieldLabelId(id)`, or [fieldLabelId()](#fieldlabelid) for one rendered without a plan.
A widget that draws its own label draws it under this id, so the label and the `aria-labelledby` its plan points at the label agree.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'presentation'> - The widget's or template's `id` and `presentation`

#### Returns

- string: The id of the field's label

### getMatchingPatternProperties&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the subset of a schema's `patternProperties` specifications whose patterns match the given `key`.

#### Parameters

- schema: S - The schema whose `patternProperties` are to be filtered
- key: string - The key to match against the `patternProperties` specifications

#### Returns

- Required&lt;S['patternProperties']>: The subset of `patternProperties` specifications that match the given `key`

### getNumericInputTitle()

Builds the `title` for the `<input>` described by `inputProps`.
A `pattern` that the value fails is reported by the browser as a bare "Please match the requested format", which says nothing on a field that now looks like a plain text box; a `title` is appended to that message, so naming the expected format makes the rejection self-explanatory.
`getInputProps()` only sets a `pattern` for the numeric text input a `number`/`integer` field defaults to, and sets the `inputMode` that tells the two apart in the same place.

#### Parameters

- inputProps: InputPropsType - The `InputPropsType` returned by `getInputProps()`
- translateString: Registry['translateString'] - The `translateString` function from the `Registry`, used to localize the title

#### Returns

- string | undefined: The `title` string, or undefined when the input has no `pattern` to explain

### getOptionalDataControlsType&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the type of the field that the Optional Data Controls UI is rendered for. An `anyOf`/`oneOf` schema has no `type` of its own, so its type is the unique list of its options' types (a single type when they all agree), read from its `anyOf` when it carries both keywords, as `getXxxOfKey()` decides, and `undefined` when no option names a type; otherwise it is the schema's own type. An empty `anyOf: []`/`oneOf: []` counts as no option list, so such a schema returns its own type.
`shouldRenderOptionalField()` decides whether to render the controls from this type, and `OptionalDataControlsField` uses it to pick the empty value it adds, so the two always agree.

The type of an `anyOf`/`oneOf` schema whose options name no type of their own is provisional: it may come to take the parent's `type` into account ([#5360](https://github.com/rjsf-team/react-jsonschema-form/issues/5360)).

#### Parameters

- schema: S - The schema for the field

#### Returns

- string | string[] | undefined: The type of the field, the unique list of its `anyOf`/`oneOf` options' types, or `undefined` when neither names one

### getOptionSelectorSchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the schema of the selector property of an `anyOf`/`oneOf` option, the one the options are told apart by, as it is read for the value, title and type that tell them apart.
An option hands its properties out as written, so a selector written as a `$ref` is retrieved by `retrieve`; one written in place is read as it stands.
`findSelectedOptionInXxxOf()` and `LayoutMultiSchemaField` both read a selector this way, so the option one selects is the one the other lists.

#### Parameters

- option: S - The option, retrieved for the field's data
- selectorField: string - The name of the selector property
- retrieve: (selector: S) => S - Retrieves a selector written as a `$ref`, such as `(selector) => schemaUtils.retrieveSchema(selector, selectorData)`

#### Returns

- S | undefined: The selector's schema, or `undefined` where the option declares no schema for it

### getOptionUiSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the uiSchema for the `oneOf`/`anyOf` option at `index`, resolved the way `AnyOfField` resolves it: `uiSchema[keyword][index]` when that keyword's uiSchema is declared as an array reaching `index`, falling back to `uiSchema` itself otherwise.
Once a branch declares its own array-form uiSchema for `keyword`, a plain per-key entry on the parent uiSchema, say `uiSchema.thing.a`, is never consulted for that branch's own fields.
Using this everywhere an option is resolved, rather than only where one is rendered, is what keeps the rest of the library agreeing with what the user sees.

#### Parameters

- [uiSchema]: UiSchema&lt;T, S, F> - The parent uiSchema, if any
- keyword: typeof ONE_OF_KEY | typeof ANY_OF_KEY - Which of `oneOf`/`anyOf` `index` selects into
- index: number - The index of the selected option within `schema[keyword]`

#### Returns

- UiSchema&lt;T, S, F> | undefined: The uiSchema to use for the selected option's own fields

### getOptionValueFormat()

Resolves the effective `optionValueFormat` for enum-backed widgets.
Provides a single source of truth for the default DOM encoding format (`'indexed'`) used by `SelectWidget`, `RadioWidget`, and `CheckboxesWidget`.
Widgets should call this helper once and pass the result to `enumOptionsDomValues`, `enumOptionValueDecoder`, and `enumOptionSelectedValue` rather than reading `options.optionValueFormat` directly.

#### Parameters

- [options]: \{ optionValueFormat?: OptionValueFormat } | undefined - The widget options (typically from the `options` prop, already resolved from `ui:options` and `ui:globalOptions`)

#### Returns

- OptionValueFormat: The resolved `OptionValueFormat`, defaulting to `'indexed'` when not set

### getPresentationDeclaration&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getpresentationdeclaration}

Gets which parts of a field (its label, description, errors and help) its template draws and which the components rendering it draw themselves, from the form's merged [`ThemePresentation`](#types), by the key each component is registered under.
It reads the field component `SchemaField` resolved and the widget its caller says that field renders, and never throws where [getWidget()](#getwidget) would.

A field component's declaration is the merged `fields` entry for its key over the field default: the merged `fieldDefault` over drawing its own label and description and leaving its errors and help to the template. So a component gets the same answer however `SchemaField` chose it, by the schema's type, a `ui:field` or a `$id`; one no key named, or named by a key that declares nothing, takes the declaration of the first key it is registered under that declares it.
A field that renders its value with a single widget declares `WIDGET_FIELD_PRESENTATION` to leave its parts to that widget.
A widget's declaration is the merged `widgets` entry for its key, beneath which [mergeThemePresentation()](#mergethemepresentation) layered each layer's `default`, or the merged `default` for a key no layer declares.
An alias is looked up by the key it stands for, and a widget given as a component by the first key it is registered under that declares it, or by the `default` alone when none does.
A part a field leaves to its widget, with no widget given, falls back to the field default, so a field such as `ArrayField` that renders a single widget only for a multi-select draws its own heading otherwise.
A field that leaves its label to the widget it renders takes that widget's `labelledBy`, or else its own entry's, but never the `fieldDefault`'s, which reaches only the fields that keep their label or render no widget to leave it to.
`uncheckedIsFalse` is the widget's when the field renders one, since it describes the control, or else the field's own entry's, and is left out where nothing declares it.
A label the component draws takes the `labelPlacement` of the declaration that settled it on `'self'`: the widget's when the field leaves its label to one, or else the field's. It is left out where nothing declares it or the template draws the label.
A part nothing declares is drawn by the template. A widget `getWidget()` rejects, such as a name that is neither registered nor an alias, gets whatever is declared for it.

#### Parameters

- source: PresentationSource&lt;T, S, F> - The registry's `fields` and `widgets`, and the `presentation` [mergeThemePresentation()](#mergethemepresentation) merged, or a single layer, which gets the same answer
- subject: PresentationSubject&lt;T, S, F> - The field's `schema`, its `field` component, the `fieldKey` that named that component, if a key did, and the `widget` it renders its value with, if it renders a single one, after the field's own defaulting: a `BooleanField` given no widget or a `null` one renders `'checkbox'`. `@rjsf/core` takes a component registered under one of its widget-rendering field keys to pick its widget as its own does, so a replacement that picks another, such as a `BooleanField` defaulting to radios, declares its parts under that key

#### Returns

- ResolvedPresentationDeclaration: The owner, `'template'` or `'self'`, of each part, `labelledBy`, how a label the template draws reaches the control, `uncheckedIsFalse` where the control holds `false` left alone, and `labelPlacement` where a label the component draws is declared to sit

### getPropertySchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the sub-schema declared for `property` in the `properties` of `schema`, falling back to an empty schema when the schema has no such property.
Callers treat the properties of a schema as schemas of the same type `S`, which the `JSONSchema7` typing of `properties` cannot express, so this function owns that single assertion rather than repeating it at every lookup.

#### Parameters

- schema: S | undefined - The schema, if any, from which to read the property sub-schema
- property: string - The name of the property whose sub-schema is desired

#### Returns

- S: The sub-schema for `property`, or an empty schema when it is not declared

### getRenderedOptionSchema&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the schema an `anyOf`/`oneOf` option of `parent` is rendered with. It is the one place that decides what an option inherits from the schema holding it, so `MultiSchemaField`, `getUiRequiredErrorSchema()` and the defaults `getDefaultFormState()` computes for a field that is not an object read the same option ([#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359)).
An object parent renders its own `ObjectField` beside the option, which shows the parent's properties and other keywords, so the option takes only the parent's `required` list and its type.
That field also stubs the extra keys of the data, for the parent and the selected option together (see [`retrieveSchema()`](#retrieveschema)), so the option is rendered without its own `additionalProperties`, `patternProperties` and `unevaluatedProperties`.
Every other parent renders nothing of its own and leaves the whole field to the option, so the option takes each of the parent's keywords that describes the value, such as an array's `items` and `uniqueItems` or a string's `format`.
It leaves the parent's `anyOf`, `oneOf`, `discriminator`, `title`, `description`, `deprecated`, `default`, the identifiers `$id`, `$anchor`, `$dynamicAnchor`, `$schema` and `$vocabulary`, `$comment`, `$defs` and `definitions` on the parent, along with any Symbol-keyed marker.
The two are met keyword by keyword, so an option's `items` adds to the parent's rather than replacing them.
A bound both declare (`minItems`, `maxItems`, `minLength`, `maxLength`, `minProperties`, `maxProperties`, `minimum`, `maximum`, `exclusiveMinimum` or `exclusiveMaximum`) keeps the stricter of the two, since a value has to meet both.
It does so within each subschema keyword both declare, such as `items` or a property, and position by position within a tuple, but not within a keyword holding a value rather than a schema, such as a `const`, or one JSON Schema does not define.
`uniqueItems` holds when either asks for it, and two `required` lists ask for every name either does.
An option's `true` subschema, such as `items: true`, adds nothing to meet, so it leaves the parent's subschema in place, a tuple included, rather than replacing it.
A parent's `false` subschema, which nothing meets, likewise stays in place of the option's.
An option's `items` schema beside the parent's tuple applies to each of its positions, and to the items past it where the tuple declares `additionalItems`, as the parent's beside the option's tuple does; a tuple declaring none stays at its length, as `ArrayField` offers it no Add.
A `not`, or a conditional (`if`, `then` and `else` together), that the option declares replaces the parent's as a whole: `not: true` rejects every value, and one schema's `if` with the other's `then` is a condition neither declared.
Any other keyword both declare, such as a `format`, a `pattern`, a `multipleOf`, an `enum` or a `const` or `default` object, is the option's. An `enum` is the option's list as it stands, since its `ui:enumNames` are read by position against it, so a value the parent doesn't list stays, for validation to reject.
A pair of subschemas either of which holds a `$ref` is returned as an `allOf` of the two, since the `$ref` is resolved only where the subschema is rendered, against the root schema, and the keywords met in beside it would be layered over the ones it names; the field's `allOf` merge meets them once it is resolved.
An option naming no `type` takes the parent's, every type of a type list included, and an object parent that names none, such as one with only `properties`, passes on `object`.

#### Parameters

- parent: S - The schema holding the `anyOf`/`oneOf`, with its `$ref`s and `allOf` resolved
- option: S - The option, with its own `$ref` resolved

#### Returns

- S: The option as it is rendered, or `option` itself when the parent has nothing to pass on

### getSchemaOwnTypes()

Gets the JSON Schema types a `schema` says its value has, or `undefined` for one that says nothing about it.
The types come from whichever of these the schema provides, in order: the recognized names of a `type` list, as [getKnownTypes()](#getknowntypes) returns them; the values of a typeless `enum` or `const`, whose types the value has whichever one is chosen; and otherwise the type [getSchemaType()](#getschematype) resolves, so a schema that only implies its type — `properties` implying `object` — says what every other reader of it already renders it as.
The `enum` and `const` values are read directly rather than through `getSchemaType()`, which answers `string` for any typeless `enum` and so would leave out the `number` in an `enum` of numbers.

A schema says nothing about its value's type when its only `type` is a name JSON Schema does not define, or when the type was guessed from the form data rather than named — an `additionalProperties` entry the schema puts no constraint on, which `retrieveSchema()` marks with `GUESSED_TYPE_FLAG`.
Such a value is free to become anything, so `FallbackField` offers every type for it, and `SchemaField` lets a non-select `anyOf`/`oneOf` supply the types instead of rendering a selector over it.
`FallbackField` reads this both for the types its selector offers and for whether to offer one at all: a schema saying a single type has nothing to choose between, so the field for that type renders alone.

#### Parameters

- schema: S - The schema for which to get the types it says its value has

#### Returns

- JSONSchema7TypeName[] | undefined: The types the `schema` says its value has, or `undefined` when it says nothing about it

### getSchemaType()

Gets the type of a given `schema`.
If the type is not explicitly defined, then an attempt is made to infer it from other elements of the schema as follows:

- schema.const: Returns the `guessType()` of that value
- schema.enum: Returns `string`
- schema.properties: Returns `object`
- schema.additionalProperties: Returns `object`
- schema.patternProperties: Returns `object`
- schema.unevaluatedProperties: Returns `object`, since it describes the keys an object's other keywords leave over
- type is an array: Returns its first type other than 'null' that JSON Schema defines, since 'null' is the one type that holds no value to edit and an unrecognized name has no field to render it; failing that its first type other than 'null', and 'null' for an array listing nothing else. No single field renders every type of an array allowing several, so use [getUnionTypes()](#getuniontypes) to get them all, or [getSchemaTypeForValue()](#getschematypeforvalue) for the one a given value has

#### Parameters

- schema: S - The schema for which to get the type

#### Returns

- string | undefined: The type of the schema

### getSchemaTypeForValue()

Gets the type of a given `schema` that `value` has.
A schema whose `type` is a list allows a value of any type it lists, not just the one `getSchemaType()` resolves it to, so a value of another listed type is read as its own type: a string held by a `['null', 'object', 'string']` is a string, not an object to look for properties in.
A number held by a list naming `integer` but not `number` is that `integer`.
Any other value, an `undefined` one included, and a schema naming a single type, gets what `getSchemaType()` returns.

#### Parameters

- schema: S - The schema describing `value`
- [value]: unknown - The value whose type is wanted

#### Returns

- string | undefined: The listed type `value` has, otherwise the type of the schema

### getSelectFieldType()

Gets the type of the field that renders a select over values of the given `types`: the one non-null type JSON Schema defines that it names, or a `string` when it names several or none.
A repeated or unrecognized name is no second type, so a select over an `['integer', 'foo']` is the `integer` that `getSchemaType()` resolves it to.
Mixed types can't share a typed field (`NumberField` would cast a string option to a number), and an all-`null` select would reach `NullField`, which renders nothing, while `StringField`'s select maps each option back to its original constant, so a `string` can represent any of them.
`SchemaField` and [getFieldTypeForWidget()](#getfieldtypeforwidget) read a select's type with it.

#### Parameters

- types: readonly string[] - The `type` list of a select, or the distinct `guessType()` results of its constants

#### Returns

- string: The type of the field that renders the select

### getSelectorPresentation()

Derives the plan of the selector an `anyOf`/`oneOf` field renders to pick its option from the field's own plan.
The selector draws the parts the field's plan has the field draw itself, as a theme whose template draws no label declares, and the parts drawn elsewhere are `'above'` it. It is derived from the plan of the field rendering the options, which `SchemaField` hands none of the parts a component rendered beside the options draws itself, such as a custom field's label or an object's heading.
It is named through `aria-labelledby` by a label a `FieldTemplate` draws, since that label's `for` names the field's own control rather than the selector, or by the `aria-label` the field's control takes where `ui:label: false` hides its label, described by the field's parts that render, marked `aria-invalid` while the field shows errors, and never `required`, since it always holds an option.
`MultiSchemaField` passes it to the selector as `presentation`.

#### Parameters

- field: FieldPresentation - The plan of the field the selector picks the option of
- selectorId: string - The id of the selector

#### Returns

- FieldPresentation: The selector's plan, with no control when the field has none on screen

### getStaticItemsUiSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the plain-object form of `uiSchema.items` that applies at tuple position `index`, or `undefined` when `uiSchema.items` cannot be resolved without more context than the caller has.
`uiSchema.items` takes three forms: one object applying uniformly to every item, an array of per-tuple-position objects, or a `(itemData, index, formContext) => UiSchema` function.
The function form needs an item's data, index and form context, none of which is available where this is used — there is no item yet for a `minItems` filler or a newly added row — so it always resolves to `undefined`; use `getItemUiSchemaForItem()` instead once the item's data is in hand.
The array (tuple) form resolves to the entry at `index`, or to `undefined` when no `index` is given, there being no single position to take a uniform value from in that case.

#### Parameters

- [uiSchema]: UiSchema&lt;T, S, F> - The parent (array) uiSchema, if any
- [index]: number - The tuple position `uiSchema.items` should apply to, when it is given as an array

#### Returns

- UiSchema&lt;T, S, F> | undefined: The static `items` uiSchema for `index`, or undefined

### getSubmitButtonOptions&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Extracts any `ui:submitButtonOptions` from the `uiSchema` and merges them onto the `DEFAULT_OPTIONS`

#### Parameters

- [uiSchema={}]: UiSchema&lt;T, S, F> - the UI Schema from which to extract submit button props

#### Returns

- UISchemaSubmitButtonOptions: The merging of the `DEFAULT_OPTIONS` with any custom ones

### getTemplate&lt;Name extends keyof TemplatesType&lt;T, S, F>, T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.

#### Parameters

- name: Name - The name of the template to fetch, restricted to the keys of `TemplatesType`
- registry: Registry&lt;T, S, F> - The `Registry` from which to read the template
- [uiOptions=\{}]: UIOptionsType&lt;T, S, F> - The `UIOptionsType` from which to read an alternate template

#### Returns

- TemplatesType&lt;T, S, F>[Name] - The template from either the `uiSchema` or `registry` for the `name`

### getTemplates&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns every template in the `registry`, with each one that `uiOptions` overrides resolved the way `getTemplate()`
resolves it. Only templates the registry already holds are resolved: an override for a name the registry lacks is
left out. Destructure the templates a component renders from the result, e.g.
`const { FieldTemplate, FieldErrorTemplate } = getTemplates(registry, uiOptions)`.

#### Parameters

- registry: Registry&lt;T, S, F> - The `Registry` from which to read the templates
- [uiOptions=\{}]: UIOptionsType&lt;T, S, F> - The `UIOptionsType` from which to read alternate templates

#### Returns

- Readonly- TemplatesType&lt;T, S, F> - The templates from either the `uiSchema` or `registry`lt;TemplatesType- TemplatesType&lt;T, S, F> - The templates from either the `uiSchema` or `registry`lt;T, S, F>> - The templates from either the `uiSchema` or `registry`

### getTestIds()

Returns an object of test IDs that can only be used in test mode.
If the function is called in a test environment (`NODE_ENV === 'test'`, this is set by jest) then a Proxy object will be returned.
If a key within the returned object is accessed, if the value already exists the object will return that value, otherwise it will create that key
with a generated `uuid` value and return the generated ID.
If it is called outside of a test environment, the function will return an empty object, therefore returning `undefined` for any property within the object and excluding the prop from the rendered output of the component in which it is used.
To use this helper, you will want to generate a separate object for each component to avoid potential overlapping of ID names.
You will also want to export the object for use in tests, because the keys will be generated in the component file, and used in the test file.
Within the component file, add: `export const TEST_IDS = getTestIds();`
Then pass `TEST_IDS.examplePropertyName` as the value of the test ID attribute of the intended component.
This will allow you to use `TEST_IDS.examplePropertyName` within your tests, while keeping the test IDs out of your rendered output.

#### Returns

- TestIdShape: An object that auto-generates test ids upon request the first time and then returns the same value on subsequent calls

### getUiOptions&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Get all passed options from ui:options, and ui:&lt;optionName>, returning them in an object with the `ui:` stripped off.
Any `globalOptions` will always be returned, unless they are overridden by options in the `uiSchema`.
A global `required` is left out: `ui:required` is a field's own, since validation reads it from the field's own uiSchema alone, so a form-wide one would mark fields required that validation doesn't require.
`ui:definitions` and `ui:globalOptions` aren't options either.

#### Parameters

- [uiSchema={}]: UiSchema&lt;T, S, F> - The UI Schema from which to get any `ui:xxx` options
- [globalOptions={}]: GlobalUISchemaOptions - The optional Global UI Schema from which to get any fallback `xxx` options

#### Returns

- UIOptionsType&lt;T, S, F> An object containing all of the `ui:xxx` options with the `ui:` stripped off along with the `globalOptions` other than `required`

### getUnionTypes()

Gets the list of types a `schema` allows when it allows more than one of them, i.e. its `type` is an array of two or more non-`null` type names.
The list is the one [getKnownTypes()](#getknowntypes) returns, so type names that are not one of `JSON_SCHEMA_TYPES` are dropped, since no field can render them, as are duplicates.
A schema allowing a single type, with or without `null`, is one that [getSchemaType()](#getschematype) resolves to that type, so it is not a union and `undefined` is returned for it.
`SchemaField` uses this to route a multi-type schema to `FallbackField` when the [useFallbackUiForUnsupportedType](./form-props.md#usefallbackuiforunsupportedtype) prop is set.

#### Parameters

- schema: S - The schema for which to get the union of types

#### Returns

- JSONSchema7TypeName[] | undefined: The types the `schema` allows, or `undefined` when it does not allow more than one

### getValidationSchemas&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns every schema a form hands its validator for `rootSchema`, keyed by its [`schemaKey()`](#schemakeysextendsstrictrjsfschemarjsfschema) and carrying that key as its `$id`.
They are the root itself and, read off the schema graph, a `{ $ref: '#/<pointer>' }` naming each place each `if`, each `anyOf`/`oneOf` option and each property an option names as its discriminator sits in the root; the copy of an option that option scoring derives where the option's scope declares `properties` and something in it states a `required` or lists names under `dependencies`, or where, relaxed, something in it sets `additionalProperties: false`; for each `oneOf` option of a `dependencies` schema, the `{ type: 'object', properties: { <key>: { $ref } } }` it is matched on; and, where an option is a boolean, `{}`, the schema `SchemaField` retrieves such an option as, with `{ not: {} }`, the schema a `false` option reads as.
The list depends on the content of the root alone, never on form data, on how `allOf` is merged or on which objects the root shares, and grows with the size of the root.
A subschema the root holds in several places, as a schema module that reuses one object holds it, is listed at each, as two equal copies of it would be, and the copies and pointers made for it name what sits below it at that place, so the list for such a module serves an equal copy of it, such as its JSON, and the other way round.
A schema a merge makes, such as an option a `customMergeAllOf` rewrites, has no place in the root and is not listed.
This is what a validator package's `compileSchemaValidatorsCode()` compiles, and the key it maps each schema under is the one the validator looks it up by at runtime; see [validator-ajv8](./validator-ajv8.md).

#### Parameters

- rootSchema: S - The root schema to list the validated schemas of

#### Returns

- SchemaMap&lt;S>: The schemas, keyed by their `schemaKey()`

#### Throws

- Error when two different schemas share a key

### getValidationTarget&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the schema a validator checks `schema` with as the subschema it stands for: a `{ $ref }` naming where it sits in `rootSchema`, which the validator resolves against the root it is handed, or, for a schema with no place there, the schema itself, an `$id` it carries replaced by `<that $id>?rjsf=<its own hash>`.
Where the root holds one object in several places, the `$ref` names the first place the root holds it as an `anyOf`/`oneOf` option, or else as an `if`, which are the places [`getValidationSchemas()`](#getvalidationschemassextendsstrictrjsfschemarjsfschema) lists a `$ref` to, or else the first place the root holds it at.
That last `$ref`, to a subschema the form checks neither as an option nor as an `if`, such as a property, is not listed, so a precompiled validator has no function for it.
A validator caches the function it compiles for a schema under its `$id`, so a schema you derived from one carrying an `$id` would otherwise be answered with the original's function.
The derived `$id` keeps the original's base for a `$ref` with a path, such as `other.json`, but a `$ref` that is only a fragment, such as `#/definitions/s`, is read against the root, as a validator reads every such `$ref` it is handed, so a copy of an option carrying an `$id` that refers into its own definitions is checked against the root's.
A schema [`retrieveSchema()`](#retrieveschematunknownsextendsstrictrjsfschemarjsfschemafextendsformcontexttypeformcontexttype) handed out stands for the subschema it was resolved from, so it is checked as JSON Schema reads that subschema, not as the form merged it, where one subschema gives it its keywords; a view merged from several, such as a property declared in two `allOf` entries, is checked as the form merged it.
`MultiSchemaField` checks with it that the data still fits the option a switch chose when `transformChange` rewrites the switch.

#### Parameters

- schema: S - The schema to check data against
- rootSchema: S - The root schema it belongs to

#### Returns

- S: The schema to hand the validator

### getVisibleErrors()

Returns the list of errors that a widget or template should surface in its own UI, which is empty whenever `ui:hideError` is in effect: `rawErrors` is deliberately still provided while errors are hidden, so that custom widgets can render them their own way.
Deprecated, and kept through v7 for a component rendered without a plan: read [getErrorsToDraw()](#geterrorstodraw) instead, which gives the messages its field's plan shows, with `ui:hideError` applied, only where `presentation.errors.by` is `'self'`, since the template draws them under `'template'`, and falls back to this without a plan, and [hasWidgetErrors()](#haswidgeterrors) or [hasTemplateErrors()](#hastemplateerrors) for an error state.

#### Parameters

- props: VisibleErrorsProps - The props of the widget or template, from which `rawErrors` and `hideError` are read

#### Returns

- string[]: The errors to display, or an empty array when there are none or they are being hidden

### getWidgetDescription()

Gets the description a widget draws itself, as a checkbox does: the one its field's plan says the widget draws, with the text and id the plan gives it.
A widget rendered without a plan draws its `ui:description` or schema `description` unless `hideLabel` turns its label off, an empty `ui:description` falling back to the schema's, as a field's description and `getArrayDescription()`'s do.
Without a plan it can't tell which description the theme's `FieldTemplate` draws: `@rjsf/core`'s and `@rjsf/chakra-ui`'s draw it for a field whose `ui:widget` is the `checkbox` alias ([#4825](https://github.com/rjsf-team/react-jsonschema-form/issues/4825)), so a checkbox widget in those themes doesn't call it there, as their own `CheckboxWidget`s don't.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'options' | 'schema' | 'hideLabel' | 'presentation'> - The widget's props

#### Returns

- \{ text: string, id: string } | undefined: The text and id of the description the widget draws, or undefined when it draws none

### getWidget&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#getwidget}

Given a schema representing a field to render and either the name or actual `Widget` implementation, returns the
React component that is used to render the widget. If the `widget` is already a React component, it is returned
as-is. Otherwise an attempt is made to look up the widget inside of the `registeredWidgets` map based on the
schema type and `widget` name. The `object` and `null` types accept `select`, `radio` and `hidden`, which a select over
object constants, or one whose `type` is `null`, renders with. A schema whose `type` is a list looks the name up by the type
[getWidgetType()](#getwidgettype) picks, so a `textarea` on a `['null', 'number', 'string']` is the `string` one. If no widget component can be found an `Error` is thrown.

#### Parameters

- schema: S - The schema for the field
- widget: Widget&lt;T, S, F> | string - Either the name of the widget OR a `Widget` implementation to use
- [registeredWidgets={}]: RegistryWidgetsType&lt;T, S, F> - A registry of widget name to `Widget` implementation

#### Returns

- Widget&lt;T, S, F>: The `Widget` component to use

#### Throws

- An error if there is no `Widget` component that can be returned

### getWidgetType&lt;S extends StrictRJSFSchema = RJSFSchema>() {#getwidgettype}

Gets the type whose field renders a widget for a schema, matching the widget's alias or the registered name an alias maps to, such as `textarea` or `TextareaWidget`. That is the type the schema resolves to when it has the widget, otherwise, when that type is a `string`, `number`, `integer` or `boolean`, the first other one of those its `type` list names that does: a `textarea` on a `['null', 'number', 'string']` is the `string` one, and a `checkbox` on a `['number', 'boolean']` the `boolean` one. No `null`, `object` or `array` type is looked to, since the field of the type the list resolves to would be left rendering the widget: a `radio` of the `null` type would replace the list an `ArrayField` multi-select edits with one value. A list resolving to `object` or `array` takes only its own widgets, since form data of that type, which the list is written to hold, would otherwise be handed to a scalar widget. A select over a `type` list takes only the widgets of the field [getSelectFieldType()](#getselectfieldtype) renders it through, and only `select`, `radio` and `hidden` when that is a `string` over a list naming an `object` or `array`, so a `checkbox` on an `enum` of `['a', true]` has no type. `getWidget()` looks a widget alias up by the type it returns, and [getFieldTypeForWidget()](#getfieldtypeforwidget) builds on it for the field `SchemaField` renders.

#### Parameters

- schema: S - The schema for the field
- widget: string - The alias or registered name of the widget

#### Returns

- string | undefined: The type whose field renders the widget, or `undefined` when no type the schema allows has it

### getXxxOfKey&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the keyword whose options are rendered for the `schema`. `anyOf` wins when a schema carries both keywords, unless its list is empty and the `oneOf`'s is not.
Every reader of the options (`isSelect()`, `optionsList()`, `sanitizeDataForNewSchema()`, `findFieldInSchema()` and
the fields in `@rjsf/core`) goes through it, so they all agree on the one list that is on screen.

#### Parameters

- schema: S - The schema that may carry an `anyOf` or a `oneOf`

#### Returns

- `'anyOf'` | `'oneOf'` | undefined: `anyOf` or `oneOf` when that keyword holds an array, otherwise `undefined`

### getXxxOfOptions&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the `anyOf`/`oneOf` options that are rendered for the `schema`, along with the keyword they are read from, as [`getXxxOfKey()`](#getxxxofkeys-extends-strictrjsfschema--rjsfschema) picks it.
An empty list offers no option to render, pick defaults from or take a type from, so a schema carrying one is handled through its own type instead, the same as one carrying neither keyword — which is what reading the two keywords through this function, rather than as `anyOf ?? oneOf`, keeps every reader of the options agreeing about.

#### Parameters

- schema: S - The schema that may carry an `anyOf` or a `oneOf`

#### Returns

- `{ key: 'anyOf' | 'oneOf'; options: S[] } | undefined`: The keyword and its non-empty list of options, or `undefined` when there is no such list

### groupEnumOptions&lt;S extends StrictRJSFSchema = RJSFSchema>()

Groups `enumOptions` according to the [ui:options.optgroups](./uiSchema.md#optgroups) mapping of group label to the enum values it contains, tagging every option along the way with its original array `index` (where a widget reads the option's DOM value in [enumOptionsDomValues()](#enumoptionsdomvaluess-extends-strictrjsfschema--rjsfschema)) and its `disabled` status (from `ui:enumDisabled`).
Each theme's `SelectWidget` calls it and renders the result with whatever grouping primitive its own UI library provides.

When no `optgroups` is given, the same flat list of options is returned, just tagged, so a widget can use one rendering path whether or not grouping is in effect.

When `optgroups` is given, one group is returned per non-empty key, in the object's property order, with that group's options in the order they were listed in its value array.
Enum values not claimed by any group are appended afterwards in their original relative order.
The following cases are handled rather than being allowed to break a render:

- A group value matching no remaining option is skipped, and a group left with no options is omitted entirely, so no group renders as an empty heading
- A group whose value is not an array at all is ignored the same way
- When several options share a `value`, each reference to that value claims the next not-yet-claimed option with it, by index, rather than collapsing them into one
- A group value that is not an exact match for an option's `value` also matches a primitive one by its string form (so `'1'` groups the enum value `1`), the same way `ui:enumOrder` does, since a uiSchema authored as JSON often stringifies them. Object and array enum values only match the very same object, so a JSON-authored uiSchema cannot group them.

Note that JavaScript orders integer-like keys (e.g. `'2024'`) ahead of all other keys, in ascending numeric order, regardless of the order they were written in, so those groups come first.

#### Parameters

- enumOptions: EnumOptionsType&lt;S>[] | undefined - The available enum options
- [optgroups]: Record&lt;string, EnumValue[]> - The `ui:options.optgroups` mapping of group label to the enum values it contains
- [enumDisabled]: EnumValue[] - The `ui:enumDisabled` list of enum values that should be rendered disabled

#### Returns

- GroupedEnumOptionsType&lt;S>[]: The ordered list of standalone options and/or option groups to render

### hasByPath()

Determines whether `obj` has an **own** property at `path`.
A bare string `path` is a single literal key, not a dotted path; use [toPath()](#topath) to split a dotted path string into segments first.
Every segment is checked with `Object.hasOwn()`, so inherited properties report `false` — `hasByPath({}, 'toString')` is `false`. [getByPath()](#getbypath) applies the same own-property rule, so the two can be used as a guard/read pair.

#### Parameters

- obj: unknown - The object to query
- path: ObjectPath - The single key or list of path segments to check for

#### Returns

- boolean: True if the own property exists at `path`, otherwise false

#### Example

```typescript
hasByPath({ a: { b: undefined } }, ['a', 'b']); // true, the key exists
hasByPath({ a: { b: 1 } }, 'a.b'); // false, there is no key named 'a.b'
hasByPath({}, 'toString'); // false, inherited properties are not own properties
```

### hashObject()

Stringifies an `object` and returns the hash of the resulting string.
Sorts object fields in consistent order before stringify to prevent different hash ids for the same object.

#### Parameters

- object: object - The object for which the hash is desired

#### Returns

- string: The string obtained from the hash of the stringified object

### hashString()

Hashes a string using the algorithm based on Java's hashing function.

#### Parameters

- string: string - The string for which to get the hash

#### Returns

- string: The resulting hash of the string in hex format

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

### hasAdditionalKeyLabel()

Whether a `WrapIfAdditionalTemplate` labels the key input of an `additionalProperties` entry, which it does wherever the entry's value is labelled, whether the template or the value's own component draws that label, so the key lines up with it.
Without a plan, as for a template rendered outside `SchemaField`, it follows `displayLabel`.

#### Parameters

- props: Pick&lt;WrapIfAdditionalTemplateProps&lt;T, S, F>, 'displayLabel' | 'presentation'> - The `displayLabel` and `presentation` of the `WrapIfAdditionalTemplate`

#### Returns

- boolean: True when the key input is labelled

### hasTemplateErrors&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#hastemplateerrors}

Whether the field a template renders has errors to show, for the template's error state, such as a red outline or an invalid status: the messages its field's plan shows, with `ui:hideError` applied, or, for a template rendered without a plan, as one rendered outside `SchemaField` is, the deprecated `rawErrors` while `hideError` is off.
Read it rather than `rawErrors`, which stays through v7 only for a template rendered without a plan.

#### Parameters

- props: Pick&lt;FieldTemplateProps&lt;T, S, F>, 'rawErrors' | 'hideError' | 'presentation'> - The template's `rawErrors`, `hideError` and `presentation`

#### Returns

- boolean: True when the field has errors to show

### hasVisibleErrors()

Determines whether a widget or template has any errors to surface in its own UI, which is never the case while `ui:hideError` is in effect.
It is the boolean form of [getVisibleErrors()](#getvisibleerrors), for the components that only need to decide whether to render an error state rather than render the errors themselves.
Deprecated, and kept through v7 for a component rendered without a plan: read [hasWidgetErrors()](#haswidgeterrors) or [hasTemplateErrors()](#hastemplateerrors) instead, which read the plan and fall back to this only without one. A component drawing the messages itself reads [getErrorsToDraw()](#geterrorstodraw).

#### Parameters

- props: VisibleErrorsProps - The props of the widget or template, from which `rawErrors` and `hideError` are read

#### Returns

- boolean: True when there are errors the component should surface, otherwise false

### hasWidget&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Detects whether the `widget` exists for the `schema` with the associated `registryWidgets` and returns true if it does, or false if it doesn't.

#### Parameters

- schema: S - The schema for the field
- widget: Widget&lt;T, S, F> | string - Either the name of the widget OR a `Widget` implementation to use
- [registeredWidgets={}]: RegistryWidgetsType&lt;T, S, F> - A registry of widget name to `Widget` implementation

#### Returns

- boolean: True if the widget exists, false otherwise

### hasWidgetErrors&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#haswidgeterrors}

Whether a widget's control has errors to show, for the widget's error state, such as a red outline or an invalid status: whether its field's plan marks the control `aria-invalid`, whoever draws the messages, or, for a widget rendered without a plan, as one rendered outside `SchemaField` is, the deprecated `rawErrors` while `hideError` is off.
An `anyOf`/`oneOf` option's control is styled invalid by it while the field above draws the errors, which the option's widget isn't handed as `rawErrors`.
Read it rather than `rawErrors`, which stays through v7 only for a widget rendered without a plan.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'rawErrors' | 'hideError' | 'presentation'> - The widget's `rawErrors`, `hideError` and `presentation`

#### Returns

- boolean: True when the widget's control has errors to show

### helpId()

Return a consistent `id` for the field help element.

#### Parameters

- id: string - The id of the field

#### Returns

- string: The consistent id for the field help element from the given `id`

### isComponentType&lt;P = never>()

Determines whether a `value` given in place of a component, such as a `ui:field`, a `ui:widget` or a `LayoutGridField` cell's `render`, is one React can render as a component.
That is a function, or one of the objects `memo()`, `forwardRef()` and `lazy()` return. A React element, such as `<MyField />`, is not a component.
A component's props can't be checked at runtime, so `P` names the props the caller expects it to take, e.g. `isComponentType<WidgetProps>(value)` narrows `value` to `ComponentType<WidgetProps>`.

#### Parameters

- value: unknown - The value to check

#### Returns

- boolean: True when the value is a component, false for anything else, a React element included

### isConstant&lt;S extends StrictRJSFSchema = RJSFSchema>()

This function checks if the given `schema` matches a single constant value.
This happens when either the schema has an `enum` array with a single value or there is a `const` defined.

#### Parameters

- schema: S - The schema for a field

#### Returns

- boolean: True if the `schema` has a single constant value, false otherwise

### isConstantOptionList&lt;S extends StrictRJSFSchema = RJSFSchema>()

Checks whether `options` is a list of constant schemas (see `isConstant()`), the shape of an `anyOf` or `oneOf` rendered
as a select. An empty list passes unless `nonEmpty` is set, since every one of its options is vacuously a constant but
it offers nothing to select.

#### Parameters

- options: unknown - The `anyOf` or `oneOf` list, or anything else
- [nonEmpty=false]: boolean - Whether an empty list is rejected

#### Returns

- boolean: True if `options` is an array whose every entry is a constant schema object, and which has at least one entry
  when `nonEmpty` is set

### isConstantSelect&lt;S extends StrictRJSFSchema = RJSFSchema>()

Checks whether the value of `schema` is picked from a list of constants, whatever its `type`: an `enum`, or an
`anyOf`/`oneOf` of constants read from the keyword `getXxxOfKey()` picks. An `object` or `array` schema that passes is a
select for its whole value (see `isWholeValueSelect()`) rather than a container whose contents are edited, pruned or
sanitized. An empty list offers no option, so it passes only when `allowEmpty` is set, which is how `isSelect()` checks a schema; an empty `enum`
otherwise leaves the `anyOf`/`oneOf` to decide. Unlike `isSelect()`, `schema` is not resolved first.

#### Parameters

- schema: S - The already-resolved schema to check
- [allowEmpty=false]: boolean - Whether an empty `enum` or `anyOf`/`oneOf` counts as a select

#### Returns

- boolean: True if `schema` offers a list of constant values to choose from, which is non-empty unless `allowEmpty` is
  set

### isCustomWidget&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Checks to see if the `uiSchema` names a `widget` and that the widget is not `hidden`.
A `widget` set to `undefined` names none: it is how a `uiSchema` shadows a `widget` in `ui:globalOptions`

#### Parameters

- uiSchema: UiSchema&lt;T, S, F> - The UI Schema from which to detect if it is customized

#### Returns

- boolean: True if the `uiSchema` describes a custom widget, false otherwise

### isEnumOptionsGroup&lt;S extends StrictRJSFSchema = RJSFSchema>()

A type guard that determines whether an element of the list returned by `groupEnumOptions()` is a group of options rather than a standalone option.
It checks both that `options` is an array and that no numeric `index` is present, because `enumOptions` is caller-supplied and `groupEnumOptions()` spreads each option through untouched: an option carrying a non-array `options` value would crash the widget rendering it, and one carrying an array-valued `options` (react-select's group shape, say) would silently render as an empty group in place of the option itself.
`groupEnumOptions()` tags every standalone option with a numeric `index` and never puts one on a group, so that tag tells the two apart no matter what the caller supplied.

#### Parameters

- item: GroupedEnumOptionsType&lt;S> - An element from the list returned by `groupEnumOptions()`

#### Returns

- boolean: True if `item` is an `EnumOptionsGroupType`, false otherwise

### isFixedItems&lt;S extends StrictRJSFSchema = RJSFSchema>()

Detects whether the given `schema` contains fixed items.
This is the case when `schema.items` is a non-empty array that only contains objects.

#### Parameters

- schema: S - The schema in which to check for fixed items

#### Returns

- boolean: True if there are fixed items in the schema, false otherwise

### isFormDataAvailable&lt;T = unknown>()

Determines whether the given `formData` represents valid form data, such as a primitive type, an array, or a non-empty object.

#### Parameters

- formData: T - The data to check

#### Returns

- boolean: True if `formData` is not undefined, null, a primitive type or an array or an empty object

### isLabelledByTemplate()

Whether the field's label is drawn outside its component: by its template, or `above` it by a field above rendering the same id, as the template of an `anyOf`/`oneOf` field draws the label of its selected option.
An `above` label counts whoever draws it, so a container's heading above a level with no control counts too.
A widget whose contents would otherwise name it, such as a button displaying its value, reads this to know its name comes from outside.

#### Parameters

- presentation: FieldPresentation - The field's plan

#### Returns

- boolean: True when the label is drawn by the template or above

### isNamedByTemplateLabel()

Whether a label the `FieldTemplate` draws names a widget's control, so the widget needs no name of its own.
Under its field's plan, that is a label the template draws, here or for a field above rendering the same id, as [isLabelledByTemplate()](#islabelledbytemplate) says.
Without a plan the widget answers from what it is handed: a label that isn't hidden, with text.
A template draws no other text in its place, neither the property name, which `SchemaField` already made the label of a field with no title, nor a required field's `*` alone, which would name the control "star".

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'label' | 'hideLabel' | 'presentation'> - The widget's `label`, `hideLabel` and `presentation`

#### Returns

- boolean: True when a label the template draws names the control

### isObject()

Determines whether a `thing` is an object for the purposes of RSJF.
In this case, `thing` is an object if it has the type `object` but is NOT null, an array or a File.

#### Parameters

- thing: any - The thing to check to see whether it is an object

#### Returns

- boolean: True if it is a non-null, non-array, non-File object

### isPlainObject()

Determines whether `thing` is a plain object, i.e. one created by the `Object` constructor or with a `null` prototype.
Unlike [isObject()](#isobject), class instances such as `Error` are not plain objects, which matters when recursively walking a structure whose nested values are expected to be plain data.

#### Parameters

- thing: unknown - The thing to check to see whether it is a plain object

#### Returns

- boolean: True if it is a plain object, otherwise false. When true, `thing` is narrowed to `Record<string, unknown>`

### isSchemaObject&lt;S extends StrictRJSFSchema = RJSFSchema>()

Narrows a schema definition, which the JSON Schema types also allow to be a boolean, and which can be absent, to the schema type the callers walk.
A boolean or missing subschema describes no value of its own, so it has nothing to walk into: `true` allows anything and `false` allows nothing.

#### Parameters

- schemaDef: unknown - The schema definition to check

#### Returns

- boolean: True when the definition is a schema object rather than a boolean shorthand or absent, narrowing it to `S`

### isValueEmpty()

Returns true when a form value is considered empty: `null`, `undefined`, or `''` (empty string), an empty array (`[]`), or a plain object whose every own value is itself empty (checked recursively). Scalar values such as `0` and `false` are not considered empty.

#### Parameters

- value: unknown - The value to check

#### Returns

- boolean: True if the value is considered empty, false otherwise

### isWholeValueSelect&lt;S extends StrictRJSFSchema = RJSFSchema>()

Checks whether `schema` is a select over object or array constants, which holds one of them as a whole rather than
being a container whose contents are edited, filled in with defaults, pruned or sanitized. That is a non-empty select
(see `isConstantSelect()`) whose `type` is `object` or `array`, or which declares no `type` and offers an object or
array constant, since `SchemaField` renders a typeless select over such values as a select too.

#### Parameters

- schema: S - The already-resolved schema to check

#### Returns

- boolean: True if `schema` is a select whose value is an object or array picked as a whole

### keywordShape()

Classifies one of a schema's own entries by the shape of the subschemas its keyword's value holds: `'map'` for a map of names, which are data, to subschemas, such as `properties`, `'array'` for an array of them, such as `allOf`, `'single'` for one, such as `not`, and `undefined` for a keyword holding data or annotations, such as `const`, `default` or `title`.
A draft-07 tuple `items` is an array and any other `items` a single subschema.
It is how the schema graph walks a schema, so a validator package that rewrites a schema's subschemas walks them as the form does.

#### Parameters

- key: string - The keyword
- value: unknown - The keyword's value

#### Returns

- 'map' | 'array' | 'single' | undefined: The shape of the subschemas the value holds, if any

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

### localTimeToOffsetTime()

Appends the browser's current local UTC offset to a bare `time` string (`HH:MM` or `HH:MM:SS`), producing a `time` compliant with the JSON Schema `time` format (RFC 3339 `full-time`), which requires a timezone. The wall-clock value itself is left untouched; only the offset annotation is added.

#### Parameters

- time: string - A time string without a timezone offset

#### Returns

- string: The `time` string suffixed with `Z` (UTC) or a `+HH:MM`/`-HH:MM` offset

### localToUTC()

Converts a local Date string into a UTC date string

#### Parameters

- dateString: unknown - The string representation of a date as accepted by the `Date()` constructor, or a `datetime-local` value whose year has five or six digits. The input writes such a year as plain digits, `10000-07-01T00:01`, which `Date` reads only in the signed six-digit form, so it is expanded to `+010000-07-01T00:01` before parsing; any other text goes to `Date` as written

#### Returns

- string | null | undefined: A UTC date string if `dateString` is truthy and names a valid date; `undefined` for an empty value, and `null` for a value `Date` can't read, as `toJSON()` gives for an invalid date. Years 1-9999 are the supported range, as in `getDateTimeLocalValue()`; a five or six digit year is read all the same, up to the last instant `Date` holds, 275760-09-13T00:00Z, so the string it gives keeps that year and fails `date-time` validation instead of `null` wiping the value

### logOnce()

Logs `message` (followed by `error`, when there is one) through `console.warn()` or `console.error()`, but only the first time that combination of `level`, `message` and `error` is seen, so a warning raised while rendering isn't repeated on every re-render.
The `error` is compared by its `String()` form, falling back to its type when that can't be converted, so two values with the same string count as one message; a message that has to be told apart from another must say so itself, as the field warnings do by naming the field.
A message that identifies nothing, or only something as generic as a `dependencies` key, is reported for whichever schema reaches it first and stays silent for the rest until the page is reloaded — `getUiOptions()`, `allowAdditionalItems()`, `getDiscriminatorFieldFromSchema()`, `logUnsupportedDefaultForEnum()` (which names the field by id only, since widgets don't receive a `fieldPath`) and the `dependencies` `oneOf` warning in `retrieveSchema()` are in that position.
What has been logged is remembered for the whole page, or the whole process when rendering on the server, so two forms that make the same mistake at the same field id — that is, under the same `idPrefix` — report it once between them.
Messages are remembered in two generations of 2,000: when the current one fills it becomes the previous one and a fresh one takes its place, so a message stays deduped for at least another 2,000 distinct messages and the number remembered stays bounded at twice that.
How much memory that takes follows what is logged, since a remembered message holds the `message` and the `String()` of the `error`.
A message that outlives both generations is logged again, and a render producing more than 4,000 distinct messages isn't deduped at all, since none of them survives long enough to be seen a second time.
Warnings are raised per field rather than per mistake, so a misconfigured item schema counts once per array row.
If your tests assert on a message logged through this function, call `resetLogOnce()` before each one, otherwise only the first test to trigger it will see it logged.
An app that swaps schemas at runtime needs it for the same reason the playground does: a wizard whose steps reuse the same field ids, a schema editor or a form builder would otherwise have the second schema's warnings held back by the first's.

#### Parameters

- message: string - The message to log
- [level='warn']: LogOnceLevel - Which console method to log through, either `'warn'` or `'error'`
- [error]: unknown - The error, or any other value, to pass to the console method after the `message`

### lookupFromFormContext&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType, R = unknown>()

Given a React JSON Schema Form registry or formContext object, return the value associated with `toLookup`.
This might be contained within the lookup map in the formContext.
If no such value exists, return the `fallback` value.

#### Parameters

- regOrFc: Registry&lt;T, S, F> | Registry&lt;T, S, F>['formContext'] - The @rjsf registry or form context in which the lookup will occur
- toLookup: string - The name of the field in the lookup map in the form context to get the value for
- [fallback]: R - The fallback value to use if the form context does not contain a value for `toLookup`

#### Returns

- R: The value associated with `toLookup` in the form context or `fallback`

### mergeDefaultsWithFormData&lt;T = unknown>()

Merges the `defaults` object of type `T` into the `formData` of type `T`

When merging defaults and form data, we want to merge in this specific way:

- objects are deeply merged
- arrays are merged in such a way that:
  - when the array is set in form data, only array entries set in form data are deeply merged; additional entries from the defaults are ignored unless `mergeExtraArrayDefaults` is true, in which case the extras are appended onto the end of the form data
  - when the array is not set in form data, the default is copied over
- scalars are overwritten/set by form data unless the form data is `undefined` or `null` and there is a default, or is `NaN`, AND `defaultSupercedesUndefined` is true, or unless `overrideFormDataWithDefaults` is true and the form data is neither `undefined` nor `null`, in which case the default replaces it
- a non-object default is ignored when form data is an object, whatever the flags, so `mergeDefaultsWithFormData('x', { b: 2 })` returns `{ b: 2 }`

#### Parameters

- [defaults]: T | undefined - The defaults to merge
- [formData]: T | undefined - The form data into which the defaults will be merged
- [mergeExtraArrayDefaults=false]: boolean - If true, any additional default array entries are appended onto the formData
- [defaultSupercedesUndefined=false]: boolean - If true, an `undefined` or `null` form data value with a default, or a `NaN` one, will be overwritten by the default value
- [overrideFormDataWithDefaults=false]: boolean - If true, the default value will overwrite the form data value, except that an `undefined` or `null` form data value is kept unless `defaultSupercedesUndefined` is true, a form data key or array entry that doesn't exist in the defaults keeps its value, and object or array form data is never replaced, only merged with a default of the same kind. A default that is present but `undefined` still replaces a scalar form data value. This is useful when we have already merged formData with defaults and want to add an additional field from formData that does not exist in defaults.

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

### mergeThemePresentation()

Merges the `ThemePresentation`s of a form's layers, the way `@rjsf/core` merges its own components with a theme's and a theme's with the `Form`'s props.
Declarations are merged part by part rather than replaced whole, so a theme declaring that its `CheckboxWidget` draws its errors keeps `@rjsf/core`'s declaration that it draws its label.
A part declared `undefined` is left to the layers beneath it, and a part no layer declares is left out of the merged entry, so spreading one over another declaration can't erase a part.
A layer's `default` is layered beneath that layer's own entry for every widget key any layer declares, and the layered `default`s are what a widget no layer declares draws.
So a theme's or the `Form` props' `default` overrides the parts it declares in the layers beneath it, even under a key one of them declares, while parts it doesn't declare keep theirs.
The layers' `fieldDefault`s are layered over one another only, since the field default sits beneath the merged field entries.
Neither a `default` nor a `fieldDefault` keeps an `uncheckedIsFalse` its layer gives it anyway, as a theme written in JavaScript can, since it describes one control and is declared under the key of the widget, or of a field drawing the control itself.

#### Parameters

- ...layers: (ThemePresentation | undefined)[] - The presentations to merge, from the bottom; `undefined` entries are skipped

#### Returns

- MergedThemePresentation: The merged `default`, `widgets`, `fields` and `fieldDefault`

### normalizeUri()

Normalizes a URI for comparison, as the schema graph compares the URIs of the resources a root holds: the scheme and host are lowercased, a default port and dot segments are dropped, and percent-encoded unreserved characters are decoded.
A validator package that has to tell which resource of the root a `$ref` names uses it, with [resolveUri()](#resolveuri), to read the `$ref` as the form does.

#### Parameters

- uri: string - The URI to normalize

#### Returns

- string: The URI in the form two spellings of the same URI share

### optionalControlsId()

Return a consistent `id` for the optional data controls `element`

#### Parameters

- id: string - The id of the parent component for the option
- element: 'Add' | 'Msg' | 'Remove' - The element type for which to generate the id

#### Returns

- string: The consistent id for the optional data controls element from the given `id` and `element` type

### optionDescriptionId()

Return a consistent `id` for the description a selected `anyOf`/`oneOf` option or the fallback UI's value field renders of its own, beneath a field that renders a different description under [descriptionId()](#descriptionid) for the same `id`.
Each further level showing a description of its own beneath those is numbered, so an option of an option that shows its own takes `optionDescription2`.
`@rjsf/core` doesn't render under this id yet; it is the id [resolveFieldPresentation()](#resolvefieldpresentation) plans for it.

#### Parameters

- id: string - The id of the field
- [depth=1]: number - How many fields above rendering the same `id` show a description of their own

#### Returns

- string: The consistent id for the option's own description element from the given `id` and `depth`

### optionLabelId()

Return a consistent `id` for the label a selected `anyOf`/`oneOf` option or the fallback UI's value field draws of its own, beneath a field whose own component already draws a label under the id it would take, such as the option selector drawing an `anyOf` field's label beside an option whose widget draws its own.
Each further level drawing a label beneath those is numbered, so an option of an option that draws its own takes `optionLabel2`.
It is the id [resolveFieldPresentation()](#resolvefieldpresentation) plans for it, which [getGroupLabelling()](#getgrouplabelling) draws a group's label under.

#### Parameters

- id: string - The id of the field
- [depth=1]: number - How many fields above rendering the same `id` draw a label

#### Returns

- string: The consistent id for the option's own label element from the given `id` and `depth`

### optionHelpId()

Return a consistent `id` for the help a selected `anyOf`/`oneOf` option or the fallback UI's value field renders of its own, beneath a field that renders a different help under [helpId()](#helpid) for the same `id`.
Each further level showing a help of its own beneath those is numbered, so an option of an option that shows its own takes `optionHelp2`.
`@rjsf/core` doesn't render under this id yet; it is the id [resolveFieldPresentation()](#resolvefieldpresentation) plans for it.

#### Parameters

- id: string - The id of the field
- [depth=1]: number - How many fields above rendering the same `id` show a help of their own

#### Returns

- string: The consistent id for the option's own help element from the given `id` and `depth`

### optionId()

Return a consistent `id` for the `optionIndex`s of a `Radio` or `Checkboxes` widget

#### Parameters

- id: string - The id of the parent component for the option
- optionIndex: number - The index of the option for which the id is desired

#### Returns

- string: An id for the option index based on the parent `id`

### noop()

A function that does nothing and returns `undefined`, useful as a placeholder for an optional callback or as the implementation of a mocked function.

#### Returns

- void

### offsetTimeToLocalTime()

Strips a trailing timezone offset (`Z` or `+HH:MM`/`-HH:MM`) from a `time` string, returning the bare `HH:MM:SS` portion suitable for a native `<input type="time">`, which does not understand offsets.

#### Parameters

- time: string - A time string, optionally suffixed with a timezone offset

#### Returns

- string: The `time` string with any trailing offset removed

### omitConsumedStyling&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the `uiSchema` to hand a field's children with the class names and style the field's own `FieldTemplate` has already consumed removed from it, in all four spellings: `ui:classNames`, a bare `classNames`, `ui:style` and the `ui:options.classNames`/`ui:options.style` equivalents.
A child reading these off the `uiSchema` it receives would apply the same classes and style a second time, inside the wrapper already carrying them ([#439](https://github.com/rjsf-team/react-jsonschema-form/issues/439)).
The original object is returned whenever there is nothing to strip, so a field memoizing the result keeps the identity it had for the forms — the overwhelming majority — that declare no styling on the field at all.
`SchemaField` and `LayoutMultiSchemaField` both call this for the `uiSchema` they pass down; a custom field that renders its own `FieldTemplate` and reads `ui:classNames`/`ui:style` off its `uiSchema` should do the same.

#### Parameters

- [uiSchema]: UiSchema&lt;T, S, F> | undefined - The uiSchema of the field whose `FieldTemplate` consumed the styling

#### Returns

- UiSchema&lt;T, S, F> | undefined: The uiSchema for the field's children, stripped of the consumed styling

### optionsList&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Gets the list of options from the `schema`. If the schema has an enum list, then those enum values are returned.
If `ui:enumOrder` is provided, the options will be reordered accordingly.

If the schema has a `oneOf` or `anyOf` (`anyOf` wins when it has both, as it does in `isSelect()`), then the value is the list of either:

- The `const` values from the schema if present, except for an option that declares the property a selector names. When the options aren't all constants and there is no selector, there is no list and `undefined` is returned
- If the schema has a discriminator (or the uiSchema a `ui:optionsSchemaSelector`), the value of that property, read from every option when they aren't all constants, and otherwise from each constant option that declares it

An option is labelled with the first of its names. One with no name is labelled by `fallbackLabel`, or with its value (as JSON for an object or array) when there is no `fallbackLabel` or it returns `undefined`:

- An `enum` value's name is its non-empty `ui:enumNames` entry in the `uiSchema`
- A `oneOf`/`anyOf` option's name is the `ui:title` of its entry in `uiSchema.anyOf`/`uiSchema.oneOf`, then the `title` of its selector property when there is one, then its own `title`. An empty title is kept as the label

#### Parameters

- schema: S - The schema from which to extract the options list
- [uiSchema]: UiSchema&lt;T, S, F> - The optional uiSchema from which to get alternate labels for the options
- [fallbackLabel]: (value: unknown) => string | undefined - Labels an option that has no name. It is called once for each such option, before `ui:enumOrder` drops any, and for no other option. An option it returns `undefined` for is labelled with its value

#### Returns

- \{ schema?: S, label: string, value: unknown }[] | undefined: The list of options from the schema, or `undefined` when it has none

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

### padTimeSeconds()

Appends `:00` seconds to a bare time-of-day (`HH:MM`) or the time portion of a naive local date-time string (`...THH:MM`) that is missing them, since RFC 3339 requires seconds for both the `time` and `date-time` formats (independent of whether a timezone offset is present or required).

#### Parameters

- value: string - A time or date-time string, with or without seconds

#### Returns

- string: The value with `:00` appended if it was missing seconds, otherwise unchanged

### parseDateString()

Parses the `dateString` into a `DateObject`, including the time information when `includeTime` is true

#### Parameters

- dateString: string - The date string to parse into a DateObject
- [includeTime=true]: boolean - Optional flag, if false, will not include the time data into the object

#### Returns

- DateObject: The date string converted to a `DateObject`

#### Throws

- Error when the date cannot be parsed from the string

### propertyToPath()

Converts the `property` of a validation error into its list of path segments, the way `toErrorSchema()` keys the errors it builds.
It is [toPath()](#topath) for a `property` that may be missing: a missing `property`, or one naming the root element (`''` or `'.'`), gives an empty path.

#### Parameters

- [property]: string | undefined - The `property` of an `RJSFValidationError`, such as `'.level1.level2[2].level3'`

#### Returns

- string[]: The list of path segments, such as `['level1', 'level2', '2', 'level3']`

#### Example

```typescript
propertyToPath('.level1.level2[2].level3'); // ['level1', 'level2', '2', 'level3']
propertyToPath(undefined); // []
propertyToPath('.'); // []
```

### rangeSpec&lt;S extends StrictRJSFSchema = RJSFSchema>()

Extracts the range spec information `{ step?: number, min?: number, max?: number }` that can be spread onto an HTML input from the range analog in the schema `{ multipleOf?: number, minimum?: number, maximum?: number }`.

#### Parameters

- schema: S - The schema from which to extract the range spec

#### Returns

- RangeSpecType: A range specification from the schema

### rendersOwnFieldBesideOption&lt;S extends StrictRJSFSchema = RJSFSchema>()

Whether the field of `schema` renders a field of its own beside its selected `anyOf`/`oneOf` option, as an object's `ObjectField` does ([#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359)).
Such a field shows its own properties and other keywords, so its option is read merged with the whole field; every other field leaves the whole field to the option as [getRenderedOptionSchema()](#getrenderedoptionschema) renders it.
`getRenderedOptionSchema()`, the defaults `getDefaultFormState()` computes, the `getUiRequiredErrorSchema()` walk and `MultiSchemaField` all read it to choose between the two, so none of them renders one option and seeds or walks another.

#### Parameters

- schema: S - The schema holding the options

#### Returns

- boolean: True when the field renders a field of its own beside the option

### replaceEqualDeep&lt;T>()

Returns `next` with every subtree that is deeply equal to the corresponding subtree of `prev` replaced by the `prev` instance, so consumers comparing by reference (such as `React.memo` with shallow comparison) see unchanged data as unchanged.
When the whole value is unchanged, `prev` itself is returned.
Sharing happens for plain objects and arrays; equal-valued `Date`s and React elements of the same type, key and props retain the previous instance; any other object type is treated as opaque and `next` is kept.
Neither argument is mutated: when a container is only partially unchanged, a new container holding the retained children is returned.
This is structural sharing, as TanStack Query's `replaceEqualDeep` does for fetch results. `Form` applies it to the state it builds for a change, and `SchemaUtils.retrieveSchema()` to a recomputed schema.

#### Parameters

- prev: unknown - The previous value whose references should be retained where possible
- next: T - The newly computed value

#### Returns

- T: `prev` when the values are deeply equal, otherwise `next` (or a copy of it) sharing every unchanged subtree with `prev`

### replaceStringParameters()

Potentially substitutes all replaceable parameters with the associated value(s) from the `params` if available.
When a `params` array is provided, each value in the array is used to replace any of the replaceable parameters in the `inputString` using the `%1`, `%2`, etc. replacement specifiers.

#### Parameters

- inputString: string - The string which will be potentially updated with replacement parameters
- [params]: string[] - The optional list of replaceable parameter values to substitute into the english string

#### Returns

- string: The updated string with any replacement specifiers replaced

### resetLogOnce()

Forgets every message `logOnce()` has already logged, so each will be logged again the next time it is seen.
Tests need it so each one sees its own warnings.
An app that swaps schemas at runtime needs it for the same reason the playground does: a wizard whose steps reuse the same field ids, a schema editor or a form builder would otherwise have the second schema's warnings held back by the first's.

### resolveConstantOptions&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns `schema` with the own `$ref` of each of its `anyOf`/`oneOf` options resolved when that makes every option a constant, the shape a select is read from, and `schema` itself otherwise.
`retrieveSchema()` hands an option written as a `$ref` out as it stands, for the field that renders it to retrieve, except a select's: a select renders no field per option, so the schema it hands out holds a select's constants resolved this way. `getDisplayLabel()`, `getDefaultFormState()`, `omitExtraData()` and `sanitizeDataForNewSchema()` read the options of a schema that did not come from `retrieveSchema()` through this before `optionsList()` labels them or a select over object or array constants is told from a container.
The result is made once per schema and shared.

#### Parameters

- schema: S - The schema that may offer options written as `$ref`s
- rootSchema: S - The root schema the references name definitions of

#### Returns

- S: The schema with its constant options resolved, or `schema` itself

#### Throws

- Error for an option's reference that resolves to nothing, as retrieving that option does

### resolveDefaultWidget&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Computes the widget name a field falls back to when no `ui:widget` is specified, along with the `enumOptions` (if any) that back a `select`-like fallback.
The default is `select` when `schema` has enumerable options, the schema's `format` when a widget is registered for it under that name or as an alias of the type the schema resolves to, or `text` otherwise.
A select's constants written as `$ref`s are listed from the retrieved schema, which holds them resolved.

#### Parameters

- schema: S - The retrieved schema for the field
- uiSchema: UiSchema&lt;T, S, F> | undefined - The uiSchema for the field
- schemaUtils: SchemaUtilsType&lt;T, S, F> - The `SchemaUtilsType` used to detect whether `schema` has enumerable options
- [registeredWidgets={}]: RegistryWidgetsType&lt;T, S, F> - A registry of widget name to `Widget` implementation

#### Returns

- \{ defaultWidget: string, enumOptions: EnumOptionsType&lt;S>[] | undefined }: The default widget name and the `enumOptions`, if any, computed along the way

### resolveFieldPresentation()

Builds a field's plan (`FieldPresentation`) of what draws its label, description, help and errors, and the attributes its control carries, from the declaration [getPresentationDeclaration()](#getpresentationdeclaration) resolved and the field's own text.
It predicts nothing: whether a part shows is decided from the decisions passed in, so a template and a widget reading the plan agree on it.
Each part is placed `template` or `self` by its declared owner, `above` when a field above rendering the same id already draws it, or `none`.

- The label shows where it has text and `showLabel` allows it. A label its template draws needs a control to name. It is `above`, under the id and text of the label drawn there, when the template of a field above rendering the same id already draws it, whoever would draw it here, so a widget that draws its own label doesn't name the control a second time; a level with no control, such as a container whose label is its own heading, keeps its label only when no field above already draws its text, or else is `above` under the id of the label that does. A label with a control to name takes [fieldLabelId()](#fieldlabelid); a heading takes [titleId()](#titleid), the id every title template renders it under, so a heading kept beneath a label above has an id of its own. A label of its own with a control to name takes [optionLabelId()](#optionlabelid) instead when a field above draws a label under the id it would take, numbered by how many fields above draw one. The control points `aria-labelledby` at a label its template draws, or one above, when its declaration says so, when the control above was pointed at that label too, since its template may then draw it with no `for`, or when its id isn't the one that label's `for` names. The label's `requiredMarker` follows `required` whether or not there is a control, so a container's heading is marked too, and an `above` label carries the marker of the label drawn above along with its text and id, while the control's own `required` stays this level's.
- The description and help show where they have text, the description only where `showLabel` allows it, since `ui:label: false` hides both. Text any field above already shows is `above`, as is a part with no text under a field above that shows one. Text is compared with `===`, so an element `ui:help` is matched only by the same element, which an option inheriting its field's `uiSchema` carries; to repeat one in an option's own `uiSchema`, reuse the one element rather than writing the JSX again. Text of its own takes [optionDescriptionId()](#optiondescriptionid) or [optionHelpId()](#optionhelpid) when a field above shows text under the id it would take, numbered by how many fields above show text of their own, so each level's text has an id of its own.
- The errors are the field's own with `hideError` applied, or, under a field above, that field's, which it draws.
- The control is described by the parts that render, here or above, which the plan lists as `describedBy`, and is `aria-invalid` whenever errors show. A field below rendering the same id inherits `describedBy`, so a widget adds the ids of the elements it renders to describe its own control, such as its `examplesId()` list, with [getControlAttributes()](#getcontrolattributes) rather than through the plan.
- The plan records `showLabel` as resolved, so a widget reads whether `ui:label: false` hides its field's label and description from it. A control whose label it hides, with no label above naming it, takes the label's text as its `aria-label`, since hiding the label is a choice of layout, not of the control's name, or the `aria-label` of the nearest field above rendering the same id whose label is hidden too, as an option's control is named by its field's label while it shows; `getGroupAttributes()` puts it on a group's wrapper. A control the template labels and whose declaration says `labelledBy: 'aria-labelledby'` points `aria-labelledby` at the id its plan gives the label: [fieldLabelId()](#fieldlabelid), or [optionLabelId()](#optionlabelid) beneath a label a field above draws under that id.

#### Parameters

- inputs: FieldPresentationInputs - The `id`, the `declaration`, the `label` from [getFieldLabel()](#getfieldlabel), and the optional `showLabel` (resolved by the caller: the field's own `ui:label`, else the one the field above rendering the same id resolved to, since an option's `uiSchema` given per option doesn't carry the field's; a level's description is hidden by its own `showLabel` alone, not by a field above hiding the same text), `description`, `help`, `errors`, `hideError`, `hasControl`, `required` (the label's marker and the control's native attribute alike), `inherited` plan of the field above and `componentId` (the id the field's own component renders under, when it renders beside the field's `anyOf`/`oneOf` options under an `XxxOf` id, which the parts it draws itself take their ids from)

#### Returns

- FieldPresentation: The field's plan

### resolveUiSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Resolves the uiSchema for a given schema, considering `ui:definitions` stored in the registry.
Called at runtime for each field. When the schema contains a `$ref`, looks up the corresponding uiSchema definition from `registry.uiSchemaDefinitions` and merges it with local overrides.
For schemas with `oneOf`/`anyOf` branches, also populates `uiSchema[keyword][i]` for branches whose `$ref` matches a definition, so `MultiSchemaField` can read dropdown option titles.

Resolution order (later sources override earlier):

1. `ui:definitions[$ref]` - base definition from registry
2. `localUiSchema` - local overrides at current path

#### Parameters

- schema: S - The JSON schema (may contain `$ref` or `RJSF_REF_KEY`)
- localUiSchema: UiSchema&lt;T, S, F> | undefined - The uiSchema at the current path (local overrides)
- registry: Registry&lt;T, S, F> - The registry containing `uiSchemaDefinitions`

#### Returns

- UiSchema&lt;T, S, F>: The resolved uiSchema with definitions merged in

### resolveUri()

Resolves the URI-reference `ref` against the base URI `base` as RFC 3986 does, accepting a relative `base` as a schema's `$id` may be, and returns `ref` as written for a base it cannot resolve against, such as an opaque `urn:` base with a relative-path `ref`.
It is how the schema graph reads a `$ref` or a nested `$id` against the resource around it.

#### Parameters

- base: string - The base URI, possibly relative or empty
- ref: string - The URI-reference to resolve

#### Returns

- string: The resolved URI

### resolveWidget&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the widget `getWidget()` returns as the `Widget` of an object, throwing the same errors. Destructure
it in a component, e.g. `const { Widget } = resolveWidget(schema, widget, registry.widgets)`.

#### Parameters

- schema: RJSFSchema - The schema for the field
- [widget]: Widget&lt;T, S, F> | string - Either the name of the widget OR a `Widget` implementation to use
- [registeredWidgets={}]: RegistryWidgetsType&lt;T, S, F> - A registry of widget name to `Widget` implementation

#### Returns

- \{ Widget: Widget&lt;T, S, F> }: An object whose `Widget` is the `Widget` component to use

#### Throws

- An error if there is no `Widget` component that can be returned

### rootSchemaIdOf&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the id a validator registers the root schema under, which is the prefix [withRootIdRefPrefix()](#withrootidrefprefixsextendsstrictrjsfschemarjsfschema) gives a local `$ref`: the root's own `$id` less any fragment, which names a place in the document rather than the document a pointer is read in, or the value of the `ROOT_SCHEMA_PREFIX` constant where that leaves nothing, as for no `$id`, an empty one, one that is only a fragment, such as `#root`, or one that is not a string, which an untyped caller may hand over.
So `http://example.com/root.json#foo` gives `http://example.com/root.json`.

#### Parameters

- rootSchema: S - The root schema

#### Returns

- string: The id the root is registered under

### schemaKey&lt;S extends StrictRJSFSchema = RJSFSchema>()

Returns the key a validator caches a schema's compiled validation function under, and the key [getValidationSchemas()](#getvalidationschemassextendsstrictrjsfschemarjsfschema) maps it into the compiled set under: its `$id` when it names something, and the hash of its content otherwise.
An empty `$id` names nothing, so a schema carrying one is keyed by its hash rather than sharing the empty key with every other such schema.
Two schemas sharing a key must validate the same way, so a schema derived from another in a way that changes its meaning carries an `$id` derived from its own content.

#### Parameters

- schema: S - The schema for which the validator cache key is desired

#### Returns

- string: The `$id` of the schema if it has a non-empty one, otherwise the hash of the schema

### schemaParser&lt;S extends StrictRJSFSchema = RJSFSchema>()

**Deprecated.** Another name for [`getValidationSchemas()`](#getvalidationschemassextendsstrictrjsfschemarjsfschema), kept for callers written against 6.x.
It returns the same list, which changed with the rename, so code calling it still has to regenerate its precompiled validators.

#### Parameters

- rootSchema: S - The root schema to list the validated schemas of

#### Returns

- SchemaMap&lt;S>: The schemas, keyed by `schemaKey()`

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

### selectedOptionDescriptionId()

Return a consistent `id` for the description of the option a select widget has selected, which describes that option rather than the field, so it can't share the field's [descriptionId()](#descriptionid).
[`SelectedOptionDescription`](#selectedoptiondescription) renders under it when its field's plan reaches it, and under `descriptionId()` without one.

#### Parameters

- id: string - The id of the field

#### Returns

- string: The consistent id for the selected option's description element from the given `id`

### selectOptionUiSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the uiSchema for the option at `index` from an already-resolved array of per-option uiSchemas: `optionsUiSchema[index]` when that array reaches `index`, falling back to `uiSchema` itself otherwise.
This is the lookup half of `getOptionUiSchema()`, split out for a caller that has already derived, and memoized, its own `optionsUiSchema` array — `AnyOfField` and `MultiSchemaField` do, reusing it across a render — so it is not re-derived from `uiSchema` on every lookup.

#### Parameters

- optionsUiSchema: UiSchema&lt;T, S, F>[] | undefined - The already-resolved array of per-option uiSchemas, if any
- [uiSchema]: UiSchema&lt;T, S, F> - The parent uiSchema, if any, used as the fallback
- index: number - The index of the selected option within `optionsUiSchema`; a negative index, meaning no option is selected, always falls back to `uiSchema`

#### Returns

- UiSchema&lt;T, S, F> | undefined: The uiSchema to use for the selected option's own fields

### setByPath&lt;O>()

Sets `value` at `path` of `obj`, mutating and returning `obj`.
A bare string `path` is a single literal key, not a dotted path; use [toPath()](#topath) to split a dotted path string into segments first.
Missing intermediate containers are created: arrays when the next segment is a valid array index, plain objects otherwise, or always plain objects when `createIntermediateObjects` is true.
Every key of a plain object is written as an own property, a `__proto__` segment in any position included, which is defined through [setOwn()](#setown) rather than assigned, so no write reaches the prototype setter. `constructor` and `prototype` are legal JSON Schema property names and are written normally: intermediate containers are read as own properties only, so `['constructor', 'prototype', 'x']` shadows `constructor` with a fresh object instead of reaching `Object.prototype`.

#### Parameters

- obj: O - The object to modify
- path: ObjectPath - The single key or list of path segments at which to set the value
- value: unknown - The value to set
- [createIntermediateObjects=false]: boolean - When true, always create plain objects for missing intermediate containers, even for numeric path segments

#### Returns

- O: The mutated `obj`

#### Example

```typescript
setByPath({}, ['a', 'b'], 1); // { a: { b: 1 } }
setByPath({}, ['a', 0], 1); // { a: [1] }, a numeric next segment creates an array
setByPath({}, ['a', 0], 1, true); // { a: { 0: 1 } }, createIntermediateObjects forces an object
setByPath({}, 'a.b', 1); // { 'a.b': 1 }, a bare string is one literal key
```

### setOwn()

Writes `value` at `key` of a plain object `obj` as an own, enumerable data property, mutating `obj`.
A plain assignment to a `__proto__` key, which JSON-sourced data can hold, would reach the prototype setter and re-point `obj`'s prototype instead of adding the key, so that key is written through `Object.defineProperty`; every other key is assigned, so on an object whose prototype has a setter for the key, or that already holds the key as a non-enumerable property, it runs that setter or keeps those attributes.

#### Parameters

- obj: GenericObjectType - The object to write to
- key: string | number - The key to write, a path segment's array index included
- value: unknown - The value to store at `key`

#### Example

```typescript
const data = {};
setOwn(data, '__proto__', { x: 1 }); // data has an own __proto__ key, and its prototype is still Object.prototype
```

### shouldRenderOptionalField&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Determines whether the field information from the combination of `schema` and `required` along with the
`enableOptionalDataFieldForType` settings from the global UI options in the `registry` all indicate that this field
should be rendered with the Optional Data Controls UI. The root field never is.

#### Parameters

- registry: Registry&lt;T, S, F> - The `registry` object
- schema: S - The schema for the field
- required - Flag indicating whether the field is required
- uiSchema: UiSchema&lt;T, S, F> | undefined - The uiSchema for the field, if any
- fieldPath: FieldPath - The `FieldPath` of the field, which is `ROOT_FIELD_PATH` for the root field

#### Returns

- boolean: True if the field should be rendered with the optional field UI, otherwise false

### sortedJSONStringify()

Stringifies an `object`, sorts object fields in consistent order before stringifying it.

#### Parameters

- object: object - The object for which the sorted stringify is desired

#### Returns

- string: The stringified object with keys sorted in a consistent order

### templateDrawsDescription&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#templatedrawsdescription}

Whether a `FieldTemplate` draws the description it is handed: where the field's plan says the template draws it, or, for a template rendered without a plan, as one rendered outside `SchemaField` is, where it draws the label, since the deprecated `displayLabel` gates both there.

#### Parameters

- props: Pick&lt;FieldTemplateProps&lt;T, S, F>, 'displayLabel' | 'presentation'> - The template's `displayLabel` and `presentation`

#### Returns

- boolean: True when the template draws the description

### templateDrawsLabel&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#templatedrawslabel}

Whether a `FieldTemplate` draws its field's label: where the field's plan says the template draws it, or, for a template rendered without a plan, as one rendered outside `SchemaField` is, where the deprecated `displayLabel` says so.
Read it rather than `displayLabel`, which stays through v7 only for a template rendered without a plan.

#### Parameters

- props: Pick&lt;FieldTemplateProps&lt;T, S, F>, 'displayLabel' | 'presentation'> - The template's `displayLabel` and `presentation`

#### Returns

- boolean: True when the template draws the label

### templateDrawsPlannedLabel&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#templatedrawsplannedlabel}

Whether a `FieldTemplate` in a theme whose widgets draw their own label draws the field's label: only where the field's plan gives the label to the template and there is label text to draw.
Unlike [`templateDrawsLabel()`](#templatedrawslabel), it draws none for a template rendered without a plan: such a theme's widgets then draw their own label, which one drawn from the deprecated `displayLabel` would repeat.

#### Parameters

- props: Pick&lt;FieldTemplateProps&lt;T, S, F>, 'label' | 'presentation'> - The template's `label` and `presentation`

#### Returns

- boolean: True when the template draws the label

### templateLabelFor&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#templatelabelfor}

The `for` of the label a `FieldTemplate` draws: the field's `id`, except where the field's plan names the control through `aria-labelledby`, as for a group of radios or checkboxes, whose wrapper carries the `id` and isn't an element a `for` can label.
That label names the control through its own `presentation.label.id` instead.

#### Parameters

- props: Pick&lt;FieldTemplateProps&lt;T, S, F>, 'id' | 'presentation'> - The template's `id` and `presentation`

#### Returns

- string | undefined: The `for` of the template's label, or undefined when it should have none

### templateMarksRequired&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#templatemarksrequired}

Whether a `FieldTemplate` marks the label it draws as required: where the field's plan says so, which leaves the marker off a control declared `uncheckedIsFalse` whose schema doesn't demand `true` ([#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388)), or, for a template rendered without a plan, where the field is `required`.

#### Parameters

- props: Pick&lt;FieldTemplateProps&lt;T, S, F>, 'required' | 'presentation'> - The template's `required` and `presentation`

#### Returns

- boolean: True when the template's label carries the required marker

### titleDrawsOptionalDataControl&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#titledrawsoptionaldatacontrol}

Whether an `ArrayFieldTemplate` or `ObjectFieldTemplate` lays out its optional data control in its heading, the one it draws for the `title` its field hands it.
A readonly or disabled container, and one drawing no heading, as under `ui:label: false` or where a field above draws the text, lays the control out with its items or properties instead, so the control isn't dropped with the heading.

#### Parameters

- props: Pick&lt;ContainerFieldTemplateProps&lt;T, S, F>, 'title' | 'readonly' | 'disabled'> - The template's `title`, `readonly` and `disabled`

#### Returns

- boolean: True when the heading lays out the optional data control

### titleId()

Return a consistent `id` for the field title element.

#### Parameters

- id: string - The id of the field

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

### toErrorList&lt;T = unknown>()

Converts an `errorSchema` into a list of `RJSFValidationErrors`.
The errors of an array's items are listed whether the `errorSchema` keys them by index in an object, as `toErrorSchema()` does, or holds them in an array

#### Parameters

- errorSchema: ErrorSchema&lt;T> - The `ErrorSchema` instance to convert
- [fieldPath=[]]: string[] | undefined - The current field path, defaults to [] if not specified

#### Returns

- RJSFValidationErrors[]: The list of `RJSFValidationErrors` extracted from the `errorSchema`

### toErrorSchema&lt;T = unknown>() {#toerrorschema}

Transforms a RJSF validation errors list into an `ErrorSchema`

```ts
const changesThis = [
  { property: '.level1.level2[2].level3', message: 'err a', stack: '.level1.level2[2].level3 err a' },
  { property: '.level1.level2[2].level3', message: 'err b', stack: '.level1.level2[2].level3 err b' },
  { property: '.level1.level2[4].level3', message: 'err b', stack: '.level1.level2[4].level3 err b' },
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

### toFieldPath()

Appends `segment` to `parentPath`, returning the `FieldPath` of the child field. Property names are separated by `.` and array indexes are bracketed, so `toFieldPath('firstName', toFieldPath(0, toFieldPath('friends')))` is `friends[0].firstName`. A property name containing `\`, `.`, `[` or `]` is backslash-escaped. `''` is a property name like any other, so `toFieldPath('', toFieldPath('a'))` is `a.` and `toFieldPath('')` is a lone `.`, which keeps a root-level property named `''` distinct from the root path itself.

#### Parameters

- segment: string | number - The property name or array index of the field
- [parentPath=ROOT_FIELD_PATH]: FieldPath - The optional `FieldPath` of the parent field

#### Returns

- FieldPath: The `FieldPath` of the field

### toPath()

Converts a dotted path string, such as the `property` of a validation error, into its list of path segments.
Array indexes may be written bracketed (`'a[0].b'`) or dotted (`'a.0.b'`), and empty segments — from a leading `.`, a trailing `.` or a `..` run — are dropped.
Only the grammar RJSF itself produces is supported: dots and brackets are always separators, so quoted keys are not recognized and keys containing dots must be addressed with a segment list instead of a string.

#### Parameters

- path: string - The string path to convert, such as `'.level1.level2[2].level3'`

#### Returns

- string[]: The list of path segments, such as `['level1', 'level2', '2', 'level3']`

#### Example

```typescript
toPath('.level1.level2[2].level3'); // ['level1', 'level2', '2', 'level3']
toPath('a.0.b'); // ['a', '0', 'b']
getByPath(formData, toPath(error.property)); // the usual pairing with the path utilities
```

### uiBooleanOption()

Reads a boolean `ui:` option, such as `ui:required`, `ui:hideError` or `ui:label`, the way JavaScript reads a condition.
uiSchemas are often untyped JSON, so an option typed `boolean` may hold `0`, `1`, `null` or a string at runtime.

`null` becomes `false`. For options where `null` means unset, such as `ui:disabled`, `ui:readonly` and `ui:autofocus`, apply the inherited fallback before calling this helper: `uiBooleanOption(option ?? inheritedValue)`.

#### Parameters

- value: unknown - The option's value, as read from the uiSchema

#### Returns

- boolean | undefined: `undefined` when the value is `undefined`, so callers can fall back with `??`, otherwise `Boolean(value)`

#### Example

```typescript
uiBooleanOption(getUiOptions(uiSchema).required) ?? schemaRequired; // schemaRequired when unset
uiBooleanOption(0); // false
uiBooleanOption('false'); // true, a non-empty string is truthy
```

### unsetByPath()

Removes the own property at `path` of `obj`, mutating `obj`.
A bare string `path` is a single literal key, not a dotted path; use [toPath()](#topath) to split a dotted path string into segments first.

#### Parameters

- obj: unknown - The object to modify
- path: ObjectPath - The single key or list of path segments at which to remove the property

#### Returns

- boolean: True if the property was removed or did not exist, otherwise false. A non-configurable property returns false rather than throwing in strict mode

#### Example

```typescript
const obj = { a: { b: 1 } };
unsetByPath(obj, ['a', 'b']); // true, obj is now { a: {} }
unsetByPath(obj, ['a', 'missing']); // true, nothing to remove
```

### unwrapErrorHandler&lt;T = unknown>()

Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError()` functions from it.
An array of the handlers of an array field's items, which a `customValidate` may return, is unwrapped into the object keyed by index that `toErrorSchema()` builds.
A `null` or `undefined` child, such as the entry such an array holds for an item without errors, is left out.
What sits under `__errors` is a leaf, as every other walk of an `ErrorSchema` reads it.

#### Parameters

- errorHandler: FormValidation&lt;T> - The `FormValidation` error handling structure

#### Returns

- ErrorSchema&lt;T>: The `ErrorSchema` resulting from the stripping of the `addError()` function

### useAltDateWidgetProps&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Hook which encapsulates the logic needed to render an `AltDateWidget` with optional `time` elements. It contains
the `state` of the current date(/time) selections in the widget. It returns a `UseAltDateWidgetResult` object
that contains the `elements: DateElementProp[]`, three callbacks needed to change one of the rendered `elements`
and to handle the clicking of the `clear` and `setNow` buttons, and `buttonsDisabled`, which is true when the widget is
disabled or read-only, so those buttons can be rendered disabled.

#### Parameters

- props: WidgetProps&lt;T, S, F> - The `WidgetProps` for the `AltDateWidget`

#### Returns

- UseAltDateWidgetResult: The `UseAltDateWidgetResult` to be used within a `AltDateWidget` implementation

### useFileWidgetProps()

Hook which encapsulates the logic needed to read and convert a `value` of `File` or `File[]` into the
`filesInfo: FileInfoType[]` and the two callback implementations needed to change the list or to remove a
`File` from the list. To be used by theme specific `FileWidget` implementations.

#### Parameters

- value: string | string[] | undefined | null - The current value of the `FileWidget`
- onChange: (value: string | null | (string | null)[]) => void - The onChange handler for the `FileWidget`
- [multiple=false] - Flag indicating whether the control supports multiple selections

#### Returns

- UseFileWidgetPropsResult: The `UseFileWidgetPropsResult` to be used within a `FileWidget` implementation

### useOptionFocusHandlers&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Hook which builds the focus and blur handlers of the options of a widget that renders one focusable element per option,
such as a `CheckboxesWidget`. Each handler reports its option's value from `enumOptions`, rather than decoding the
focused element's DOM `value`, so it holds whether or not a theme's component forwards that attribute. To be used by
theme specific `CheckboxesWidget` implementations.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'options' | 'onFocus' | 'onBlur'> - The `id`, `options`, `onFocus` and
  `onBlur` from the `WidgetProps` of the widget

#### Returns

- UseOptionFocusHandlersResult: The `focusHandlers` and `blurHandlers` arrays, holding the `onFocus` and `onBlur` handler of each option by its position

### useSelectFocusHandlers&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Hook which builds the focus and blur handlers of a select widget whose focused element carries no option value of its
own, such as a trigger button or a custom combobox. The widget's `value` is already form data rather than a DOM value,
so it's reported as it is, with no selection read as the `emptyValue` option the way a native select reports its
decoded empty selection. To be used by theme specific `SelectWidget` implementations.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'id' | 'value' | 'options' | 'onFocus' | 'onBlur'> - The `id`, `value`,
  `options`, `onFocus` and `onBlur` from the `WidgetProps` of the `SelectWidget`

#### Returns

- UseSelectFocusHandlersResult: The `handleFocus` and `handleBlur` callbacks that report the widget's form data value

### useTimeWidgetProps&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Hook which encapsulates the logic needed to compute the local (offset-free) display value of a `time` widget, and to
transform a newly entered value into a value compliant with the JSON Schema `time` format (RFC 3339 `full-time`,
which requires seconds and a timezone) or, when `schema.format` is `iso-time`, into one still padded with seconds but
without a forced timezone, since that format's timezone is optional. To be used by theme specific `TimeWidget`
implementations.

#### Parameters

- props: WidgetProps&lt;T, S, F> - The `WidgetProps` for the `TimeWidget`

#### Returns

- UseTimeWidgetPropsResult: The `UseTimeWidgetPropsResult` to be used within a `TimeWidget` implementation

### utcToLocal()

Converts a UTC date string, an epoch number or a `Date` into a local Date format

#### Parameters

- jsonDate: unknown - A UTC date string, an epoch number in milliseconds or a `Date`. Any other value is handed to the `Date` constructor, so an object whose `valueOf()` gives an epoch, such as a moment, dayjs or Luxon object or a `Date` from another realm, converts too. A string goes through `Date`'s string parsing, so an epoch written as text, such as `'0'`, isn't read as an epoch; what text outside the ISO format means is up to the engine, and V8 reads `'0'` as the year 2000

#### Returns

- string: An empty string when `jsonDate` is `undefined`, `null`, a boolean or a `Boolean` object, when `Date` can't convert it (a bigint, a symbol or an object with no primitive value), when it doesn't parse to a valid date, or when its local year is before 1. Otherwise a date string in local format

### validationDataMerge&lt;T = unknown>()

Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling `toErrorList()` on the `errors` in the `validationData`.
The existing `errors` are always kept, also when their `errorSchema` is empty, as it is when a `transformErrors` clears every `message`.
An array either `ErrorSchema` holds for the items of an array field is returned as the object keyed by index that `toErrorSchema()` builds, so it neither replaces the other's errors for those items nor is appended to an array of them, and the result has that shape whether or not there is anything to merge.
A `null` or `undefined` either `ErrorSchema` holds for an item or field without errors is left out of the merge rather than replacing the other's errors there.
If no `additionalErrorSchema` is passed, or one that holds nothing, then `validationData` itself is returned when its `errorSchema` holds no such array and no `null` or `undefined`.

#### Parameters

- validationData: ValidationData&lt;T> - The current `ValidationData` into which to merge the additional errors
- [additionalErrorSchema]: ErrorSchema&lt;T> | undefined - The optional additional set of errors in an `ErrorSchema`
- [preventDuplicates=false]: boolean - Optional flag, if true, leaves out of both the merged `ErrorSchema` and the appended errors the messages the existing `errorSchema` already holds under the same keys

#### Returns

- ValidationData&lt;T>: The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.

### widgetAriaProps()

Return the `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-invalid` a `SelectWidget` gives the element a screen reader focuses, all of which belong on that element.
A select its field's plan reaches takes the attributes [getControlAttributes()](#getcontrolattributes) gives its control, with the ids its caller passed, then the selected option's description id, added to the plan's describers, each id once, and the caller's `aria-label` over the plan's unless it is empty.
A select rendered inside another widget, such as each date part of an `AltDateWidget`, has an id of its own that no help or error element is rendered for, so `DateElement` gives it a plan of its own, through which it is described by its field's parts.
Without a plan, the caller's ids, even an empty `aria-describedby`, replace the `ariaDescribedByIds(props.id)` a select rendered without one falls back to, whose ids no element may have.
The selected option's description id, [selectedOptionDescriptionId()](#selectedoptiondescriptionid) under its field's plan and `descriptionId(props.id)` without one, is added only while the select shows that description, the one element it renders itself: a date part, a `multiple` select, one whose label is hidden and one whose selected option has no description render none, and its id may be another field's description id.
Every theme's `SelectWidget` gives the result to its control, and a replacement `SelectWidget` should do the same; no other widget is required to.

#### Parameters

- props: WidgetAriaPropsInput&lt;T, S, F> - The widget's props, of which `id`, `presentation`, `aria-label`, `aria-describedby` and those `SelectedOptionDescription` reads (`multiple`, `hideLabel`, `options`, `registry`, `uiSchema` and `value`) are used

#### Returns

- \{ 'aria-label'?: string, 'aria-describedby'?: string, 'aria-labelledby'?: string, 'aria-invalid'?: true }: The props to spread on the focused element

#### Example

```typescript
// `props` are the `WidgetProps` of a `SelectWidget` with the id `root`, rendered by a field
widgetAriaProps(props); // { 'aria-label': undefined, 'aria-describedby': 'root__error root__description root__help' }
// `partProps` are those of the year select of an `AltDateWidget`, which its `DateElement` names and describes
widgetAriaProps(partProps); // { 'aria-label': 'When, year', 'aria-describedby': 'root_when__error root_when__description root_when__help' }
```

### widgetDrawsLabel&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#widgetdrawslabel}

Whether a widget draws its field's label itself: where the field's plan says the widget draws it, or, for a widget rendered without a plan, unless the deprecated `hideLabel` turns it off.
Read it rather than `hideLabel`, which stays through v7 only for a widget rendered without a plan.
A field with no label can still leave its description to the widget, so a widget that draws its own description takes it from [getWidgetDescription()](#getwidgetdescription) rather than gating it on this.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'hideLabel' | 'presentation'> - The widget's `hideLabel` and `presentation`

#### Returns

- boolean: True when the widget draws the label

### widgetDrawsLabelText&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>() {#widgetdrawslabeltext}

Whether a widget draws a label of its own with text in it: where [widgetDrawsLabel()](#widgetdrawslabel) says it draws its field's label and that label has text.
A label holding only a required field's `*` would name the control "star", so a widget draws none in its place.

#### Parameters

- props: Pick&lt;WidgetProps&lt;T, S, F>, 'label' | 'hideLabel' | 'presentation'> - The widget's `label`, `hideLabel` and `presentation`

#### Returns

- boolean: True when the widget draws a label with text

### withIdRefPrefix&lt;S extends StrictRJSFSchema = RJSFSchema>()

Recursively prefixes every `$ref` local to the root document, one starting with `#`, with the value of the `ROOT_SCHEMA_PREFIX` constant.
This is used in isValid to make references to the rootSchema

#### Parameters

- schemaNode: S - The object node to which a `ROOT_SCHEMA_PREFIX` is added when a `$ref` is part of it

#### Returns

- S: A copy of the `schemaNode` with updated `$ref`s

### withRootIdRefPrefix&lt;S extends StrictRJSFSchema = RJSFSchema>()

Recursively prefixes every `$ref` local to the root document, one starting with `#`, with the id a validator registers `rootSchema` under, as [rootSchemaIdOf()](#rootschemaidofsextendsstrictrjsfschemarjsfschema) returns it: the root's own `$id` less any fragment, or the value of the `ROOT_SCHEMA_PREFIX` constant where that leaves nothing.
So `withRootIdRefPrefix({ $ref: '#/if' }, { $id: 'http://example.com/root.json#' })` gives `{ $ref: 'http://example.com/root.json#/if' }`.
A relative `$ref`, such as `kinds.json#/definitions/cat`, is resolved against that id, unless the id is `ROOT_SCHEMA_PREFIX`, so it names the resource the root embeds rather than one beside the schema holding it.
A validator applies it to a schema it validates beside `rootSchema`, so that a `$ref` local to the root resolves against the root whatever the schema holding it is registered as.
A `$ref` that a subschema of `rootSchema` holds below an `$id` of its own, the subschema's or its resource's, resolves against that resource, which the subschema handed over no longer sits under, so it is spelled as the pointer to its target in the root, prefixed with the id: with `$id: 'https://example.com/root.json'` and `$defs: { pet: { $id: 'pet.json', $defs: { cat: { const: 'cat' } }, properties: { kind: { $ref: '#/$defs/cat' } } } }`, the `kind` subschema gives `{ $ref: 'https://example.com/root.json#/$defs/pet/$defs/cat' }`.

#### Parameters

- schemaNode: S - The object node to which the prefix is added when a `$ref` is part of it
- rootSchema: S - The root schema the local `$ref`s name
- [rootId=rootSchemaIdOf(rootSchema)]: string - The id the validator registers `rootSchema` under, where it is not the one `rootSchemaIdOf()` gives

#### Returns

- S: A copy of the `schemaNode` with updated `$ref`s

## Validator-based utility functions

Every function in this group takes a [`SchemaContext`](#types) as its first parameter, holding the `validator` along with the `customMergeAllOf` and `defaultFormStateBehavior` settings of the form.
The function passes that `SchemaContext` along whole to every other schema function it calls, so those settings reach every schema it resolves.

```ts
const context: SchemaContext = { validator, customMergeAllOf, defaultFormStateBehavior };

const resolvedSchema = retrieveSchema(context, schema, rootSchema, formData);
const defaults = getDefaultFormState(context, { schema, formData, rootSchema });
```

`getDefaultFormState()` takes the rest of its parameters as a props object, since so many of them are optional; the others keep theirs positional.

### findFieldInSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Finds the field at the given path within the root or a nested `schema` node, following `oneOf` / `anyOf` using `formData` where needed. If nothing matches the path, `{ field: undefined, isRequired: undefined }` is returned. When a leaf is found, the result includes whether that leaf is required under its parent.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S - The root schema that will be forwarded to all the APIs
- schema: S - The node within the JSON schema in which to search
- path: SchemaFieldPath - Dotted path or segment list to the desired field; see [`SchemaFieldPath`](#types)
- [formData={}]: T - The form data that is used to determine which anyOf/oneOf option to descend

#### Returns

- FoundFieldType&lt;S>: An object that contains the field and its required state. If no field can be found then `{ field: undefined, isRequired: undefined }` is returned.

### findSelectedOptionInXxxOf&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Finds the option inside the `schema['any/oneOf']` list which has the `properties[selectorField].default` or `properties[selectorField].const` that matches the `formData[selectorField]` value.
For the purposes of this function, `selectorField` is either `schema.discriminator.propertyName` or `fallbackField`.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S | undefined - The root schema that will be forwarded to all the APIs
- schema: S - The schema element in which to search for the selected anyOf/oneOf option
- fallbackField: string - The field to use as a backup selector field if the schema does not have a required field
- xxx: 'anyOf' | 'oneOf' - Either `anyOf` or `oneOf`, defines which value is being sought
- [formData={}]: T - The form data that is used to determine which anyOf/oneOf option to descend

#### Returns

- S | undefined: The anyOf/oneOf option that matches the selector field in the schema or undefined if nothing is selected

### getDefaultFormState&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Returns the superset of `formData` that includes the given set updated to include any missing fields that have computed to have defaults provided in the `schema`.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs; its `defaultFormStateBehavior` controls how the defaults are computed, see the `Form` documentation for the [defaultFormStateBehavior](./form-props.md#defaultFormStateBehavior) prop
- props: GetDefaultFormStateProps&lt;T, S, F> - The props for this function:
  - schema: S - The schema for which the default state is desired
  - [formData]: T | undefined - The current formData, if any, onto which to provide any missing defaults
  - [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s
  - [includeUndefinedValues=false]: boolean | "excludeObjectChildren" - Optional flag, if true, cause undefined values to be added as defaults. If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as false when computing defaults for any nested object properties.
  - [initialDefaultsGenerated]: boolean - Optional flag, indicates whether or not initial defaults have been generated
  - [uiSchema]: UiSchema&lt;T, S, F> - Optional uiSchema, used to apply `ui:emptyValue` and `ui:initialValue` as defaults
  - [uiSchemaDefinitions]: UiSchemaDefinitions&lt;S, F> - Optional `ui:definitions`, defaulting to `uiSchema['ui:definitions']`; pass it explicitly when `uiSchema` is a sub-uiSchema that doesn't carry the root's own `ui:definitions`

#### Returns

- T | T[] | null | undefined: The resulting `formData` with all the defaults provided. A missing value of a `type: 'null'` schema, or one the data holds as `undefined`, is filled in as `null`, whatever `emptyObjectFields` says, as its `allOf` or `if` resolves it, except for an `anyOf`/`oneOf` option of `type: 'null'`, which renders no field, and inside an optional object the `enableOptionalDataFieldForType` UI option renders without its fields; so the result is `null` for such a root

### getClosestMatchingOption&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Determines which of the given `options` provided most closely matches the `formData`.
An option whose discriminator property's `const` or `enum` holds the data's value wins outright; otherwise the one option the data matches is returned when exactly one does.
Otherwise the options the data matches, or all of them when it matches none, are the candidates, and the one scoring best is returned.
A tie goes to the `selectedOption` when it is a candidate and to the first candidate otherwise, so an option the data does not match is never returned while another matches it.

The score is the number of matching properties, more heavily favoring options with matching default or const values.
A property written as a `$ref` is scored as the definition it names, and each `$ref` scoring follows resolves in the resource of the declaration holding it, including one in a property declared both beside a `$ref` and in the definition it names.
A property holding an `anyOf`/`oneOf` of its own scores what the option picked among those scores, plus one where the data matches it.
The pick is remembered per option list and data object, so a recursion through option lists matches each level once.
Within one call it is reused without looking at the data again, since a validator's `isValid()` must not change the data it checks.
A later call reuses it only while the data still holds what a copy kept with it holds, so data mutated in place between calls is matched for what it holds now; that comparison costs time in proportion to the data below the option list, once per call.
An object other than an array or a plain object, such as a `Date`, is kept in the copy as it is, so a pick for data holding one is reused only within the call that made it.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S - The root schema, used to primarily to look up `$ref`s
- [formData]: T | undefined - The current formData, if any, used to figure out a match
- options: S[] - The list of options to find a matching options from
- [selectedOption=-1]: number - The index of the currently selected option, defaulted to -1 if not specified
- [discriminatorField]: string | undefined - The optional name of the field within the options object whose value is used to determine which option is selected

#### Returns

- number: The index of the option that is the closest match to the `formData`, or the `selectedOption` when there are no options

### getDisplayLabel&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema` should be displayed in a UI.
Deprecated, and kept through v7 for a field rendered without a plan: a field's plan, from [resolveFieldPresentation()](#resolvefieldpresentation), says what draws its label; `SchemaField` no longer derives `displayLabel` from this.
An `object` or `array` schema whose `anyOf`/`oneOf` is a list of constants renders as one select for the whole value, so it keeps its label.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- schema: S - The schema for which the display label flag is desired
- [uiSchema={}]: UiSchema&lt;T, S, F> - The UI schema from which to derive potentially displayable information
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s
- [globalOptions]: GlobalUISchemaOptions | undefined - The optional Global UI Schema from which to get any fallback `xxx` options

#### Returns

- boolean: True if the label should be displayed or false if it should not

### getFromSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Reads the value at `path` within a schema, additionally retrieving `$ref`s as needed to resolve schemas containing potentially nested `$ref`s.
The `path` accepts a [`SchemaFieldPath`](#types) (dotted string or `FieldPathList`-style segment array).

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S - The root schema that will be forwarded to all the APIs
- schema: S - The current node within the JSON schema recursion
- path: SchemaFieldPath - Dotted path or segment list to the desired field; see [`SchemaFieldPath`](#types)
- defaultValue: T | S - The value to return if a value is not found for the `pathList` path

#### Returns

- T | S: The inner schema from the `schema` for the given `path` or the `defaultValue` if not found

### getFirstMatchingOption&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
Always returns the first option if there is nothing that matches.
Each option is matched as the subschema of the root it stands for — the option itself, or the one [`retrieveSchema()`](#retrieveschematunknownsextendsstrictrjsfschemarjsfschemafextendsformcontexttypeformcontexttype) handed it out for — and as JSON Schema reads it, so the validator is handed a `{ $ref }` naming where the option sits in the root.
An object option is matched more strictly than it describes itself: the data has to hold a key the option declares, a key named by the `properties` or `patternProperties` of the option, of its `$ref` target, its `allOf` entries, its `then`/`else` or its `dependencies` schemas, which is checked without the validator.
An option whose `properties` name nothing matches only where it takes keys they don't name, such as one describing a map.
Where something in that scope declares `properties`, every `required` in the scope, and every `dependencies` entry listing names, is dropped for scoring, since a key the user has yet to fill in would fail it: an option stating one is validated as a copy without them, which names the subschemas below it by `$ref`s into the root and carries no `$id`.
An option whose scope declares no `properties`, such as `{ required: ['email'] }`, is validated with its `required`, which is what it is chosen by.
With a `discriminatorField`, an option matches without the validator where a declaration of its property of that name states a `const` or `enum`, every declaration stating one holds the data's value, and every other declaration holds no keyword constraining a value but a `type` allowing it. Any other option naming the property, such as one declaring it by a `pattern`, a `$ref` or an `allOf` beside an `enum` in a shared base, is matched by the validator on that property alone.
The property is read from every declaration of it that applies whatever the data, so with `allOf: [{ $ref: Base }, { properties: { petType: { const: 'cat' } } }]`, where `Base` declares `petType` as any string, the option holds `petType: 'cat'` and no other value.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` whose `validator` is used to match the options
- [formData]: T | undefined - The current formData, if any, used to figure out a match
- options: S[] - The list of options to find a matching options from
- rootSchema: S - The root schema, used to primarily to look up `$ref`s
- [discriminatorField]: string | undefined - The optional name of the field within the options object whose value is used to determine which option is selected

#### Returns

- number: The index of the first matched option or 0 if none is available

### getUiRequiredErrorSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Walks the `rootSchema`, resolved node by node against `formData` exactly as `SchemaField` does while rendering, and the `uiSchema`, resolved through `ui:definitions` the same way, returning an `ErrorSchema` carrying a required error for every field marked [`ui:required`](./uiSchema.md#required) whose value is missing.
The schema handed to the validator is left untouched, so this behaves identically on the submit and live-validation paths and with a precompiled validator, which cannot be given a schema the compile step never saw.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S - The root schema to walk
- [uiSchema]: UiSchema&lt;T, S, F> - The uiSchema the `ui:required` flags are read from
- [formData]: T - The current formData, whose missing values the errors are raised for
- [uiSchemaDefinitions=uiSchema['ui:definitions']]: UiSchemaDefinitions&lt;S, F> - The `ui:definitions` a `$ref`'d uiSchema is resolved through
- [globalUiOptions]: GlobalUISchemaOptions - The global uiSchema options, read as the fields themselves read them
- [formContext]: F - The formContext to pass to the function form of `uiSchema.items`
- [fieldState]: FormFieldState&lt;S> - The option each field shows and the cycles the user expanded, so the walk follows the option on screen and descends into an expanded cycle. Without it, a field's option is the one its data matches best, and nothing below a collapsed cycle is walked

#### Returns

- ErrorSchema&lt;T>: An `ErrorSchema` holding a required error for every missing `ui:required` field

### isFilesArray&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Checks to see if the `schema` and `uiSchema` combination represents an array of files, either because the uiSchema asks for the `files` widget by name or because the schema's `items` resolve to a string of `data-url` format.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- schema: S - The schema for which check for array of files flag is desired
- [uiSchema={}]: UiSchema&lt;T, S, F> - The UI schema from which to check the widget
- [rootSchema]: S - The root schema, used primarily to look up `$ref`s

#### Returns

- boolean: True if schema/uiSchema contains an array of files, otherwise false

### isMultiSelect&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Checks to see if the `schema` combination represents a multi-select

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- schema: S - The schema for which check for a multi-select flag is desired
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s

#### Returns

- boolean: True if schema contains a multi-select, otherwise false

### isSelect&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Checks to see if the `schema` combination represents a select: an `enum`, or an `anyOf`/`oneOf` whose options are all constants (see `isConstantOptionList()`).
When the schema has both keywords, `anyOf` is the one checked (see `getXxxOfKey()`), as it is in `optionsList()`.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- theSchema: S - The schema for which check for a select flag is desired
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s

#### Returns

- boolean: True if schema contains a select, otherwise false

### retrieveSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Retrieves the schema of one field: the `schema` with its own `$ref`, `allOf`, `if`/`then`/`else`, `dependencies` and the patterns its properties match merged in for the `rawFormData`, and the additional properties of that data stubbed among its `properties`.
The schema is resolved one level at a time: a `$ref` under `properties`, `items` or an `anyOf`/`oneOf` option is handed out as it stands, for the caller to retrieve when it renders that subschema.
Every subschema handed out carries where it came from, so retrieving it resolves it as the field it is: a recursive `$ref` under `properties` is handed out flagged with `RJSF_REF_CYCLE_KEY`, [`expandRefCycle()`](#expandrefcycle) expands it by one level, and retrieving a schema `retrieveSchema()` returned gives the same schema back.
A copy carrying `RJSF_REF_CYCLE_KEY: false` is retrieved like any other copy of the field it was made from.
A `schema` the root does not hold is parsed once per content and kept for as long as the root, so one built from form data keeps an entry for each distinct value until the root changes.
Like the root, it must not be changed once handed in: calls handed the same content share its result.

With a `selectedOption`, the extra keys of the data are stubbed once, for the field and the option selected among the options of the keyword `getXxxOfKey()` reads together.
A key the option declares is left to the option, which renders it.
The field takes the option's extra-key keywords beside its own: `additionalProperties` and `unevaluatedProperties` become the `allOf` of the two, one side's where the other declares none or allows any key, and `false` where either is, and the option's `patternProperties` join the field's, a pattern both declare becoming the `allOf` of its two subschemas.
Every other key is stubbed as the field's keywords and the option's describe it, each side read on its own and the two `allOf`ed, so a key either side forbids is stubbed as `{ type: 'null' }` whatever the other allows.
The options of an object field are handed out without stubs; a field of any other type renders no field of its own beside the option, so it leaves the option to stub its own extra keys.
Without a `selectedOption`, the extra keys are stubbed for the field alone, a key an option declares included.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- schema: S - The schema for which retrieving a schema is desired
- [rootSchema={}]: S - The root schema that will be forwarded to all the APIs
- [rawFormData]: T | undefined - The current formData, if any, to assist retrieving a schema
- [resolveAnyOfOrOneOfRefs=false]: boolean - Whether to resolve the `anyOf`/`oneOf` options too, each as `retrieveSchema()` resolves it
- [selectedOption]: number | undefined - The index of the `anyOf`/`oneOf` option selected for the field, whose extra keys are then stubbed with it

#### Returns

- RJSFSchema: The schema having its conditions, additional properties, references and dependencies resolved

The stub it creates for a property held by the `rawFormData` but described only by an `additionalProperties` with no `type`, `$ref`, `anyOf` or `oneOf` keeps what that `additionalProperties` says about the value — an `enum`, a `format`, a length or a range, and annotations such as `title` or `readOnly` — and adds the type of the data that property holds.
It leaves out the subschema keywords (`allOf`, `not`, `if`, ...), since one naming another type than the data could not be merged with the guessed type, and the identifiers (`$id`, `$anchor`, ...), since every stubbed property would otherwise share them, and it only keeps a `default` of the same type as the data.
It is additionally marked with the `GUESSED_TYPE_FLAG` symbol, recording that the type was guessed rather than declared, when that `additionalProperties` constrains the property in no way at all, i.e. it is `true` or has no keyword asserting something about the value.
Any keyword that asserts nothing, such as an annotation, an identifier, `$defs`, `contentEncoding`, or one it does not recognize, leaves the property unconstrained.

### omitExtraData&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Takes a schema and formData and returns a copy of the formData with any fields not defined in the schema removed.
This is useful for ensuring that only data that is relevant to the schema is preserved.
Objects with `additionalProperties` keyword set to `true` will not have their extra fields removed.

Known limitation: a property declared both beside a `$ref` and in the definition it names, or an option an `allOf` merge rebuilds, is a schema no `$id` resource holds, so a `$ref` inside it that a resource of its own wrote is resolved against the root.
Filtering through it throws `Could not find a definition for …`, or reads the root's definition of the same name.

```ts
const schema = {
  type: 'object',
  properties: {
    child1: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
    child2: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      additionalProperties: true,
    },
  },
};

const formData = {
  child1: {
    name: 'John Doe',
    extraField: 'This should be removed',
  },
  child2: {
    name: 'Jane Doe',
    extraField: 'This should NOT be removed',
  },
};

const filteredFormData = omitExtraData({ validator }, schema, schema, formData);
console.log(filteredFormData);
/*
{
  child1: {
    name: "John Doe",
  },
  child2: {
    name: "Jane Doe",
    extraField: "This should NOT be removed",
  },
}
*/
```

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- schema: S - The schema to use for filtering the formData
- [rootSchema]: S | undefined - The root schema, used to primarily to look up `$ref`s
- [formData]: T | undefined - The formData to filter
- [fieldState]: FormFieldState&lt;S> - The option each field shows, so a field offering `anyOf`/`oneOf` options keeps the data its shown option describes. Without it, the option the data matches best

An optional object whose filtered content is all empty is pruned, and an `anyOf` over empty data applies every branch.

#### Returns

- T: The new form data, with any fields not defined in the schema removed

### sanitizeDataForNewSchema&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Sanitize the `data` associated with the `oldSchema` so it is considered appropriate for the `newSchema`.
If the new schema does not contain any properties, then `undefined` is returned to clear all the form data.
Due to the nature of schemas, this sanitization happens recursively for nested objects of data.
Also, any properties in the old schema that are non-existent in the new schema are set to `undefined`.
A property is considered to have changed schema when its type differs between the two, except when both types carry the `GUESSED_TYPE_FLAG`: those types were guessed from the data itself, so a difference means the data changed type rather than the schema, and the value is kept.
A new schema that declares a type of its own is the type the data has to satisfy, so a value of the type the old schema merely happened to hold is still cleared.
A value outside the new `enum` or constant options is replaced with the new `default` when that is an option, with the only option when there is one, or cleared; array items outside them are dropped.
`Form` does not call this to sanitize its data: it diffs the field trees before and after a change and judges only the fields whose constraints the change altered.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S - The root JSON schema of the entire form
- [newSchema]: S | undefined - The new schema for which the data is being sanitized
- [oldSchema]: S | undefined - The old schema from which the data originated
- [data={}]: unknown - The form data associated with the schema, defaulting to an empty object when undefined

#### Returns

- T: The new form data, with all the fields uniquely associated with the old schema set to `undefined`. Will return `undefined` if the new schema is not an object containing properties.

## Schema utils creation function

### createSchemaUtils&lt;T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>()

Creates a `SchemaUtilsType` interface that is based around the given `context` and `rootSchema` parameters.
The resulting interface implementation will forward the `context` and `rootSchema` to all the wrapped APIs.
The `rootSchema` is parsed once per object and treated as immutable: a change made to it in place is not seen, even by a new `createSchemaUtils()`, so pass a new object to change it.

#### Parameters

- context: SchemaContext&lt;S, F> - The `SchemaContext` that will be forwarded to all the APIs
- rootSchema: S - The root schema that will be forwarded to all the APIs

#### Returns

- SchemaUtilsType&lt;T, S, F> - An implementation of a `SchemaUtilsType` interface

## ErrorSchema builder class

### ErrorSchemaBuilder&lt;T = unknown>(initialSchema?: ErrorSchema&lt;T>) constructor

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
The path is either a dotted string, with optional bracketed array indexes such as `'level1.level2[2]'`, or a list of segments; see [toPath()](#topath) for the grammar a string path accepts.

#### Parameters

- errorOrList: string | string[] - The error or list of errors to add into the `ErrorSchema`
- [pathOfError]: string | (string | number)[] | undefined - The optional path into the `ErrorSchema` at which to add the error(s)

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

### setErrors()

Sets/replaces the `errorOrList` as the error(s) in the `ErrorSchema` at either the root level or the location within the schema described by the `pathOfError`.
The path is either a dotted string, with optional bracketed array indexes such as `'level1.level2[2]'`, or a list of segments; see [toPath()](#topath) for the grammar a string path accepts.

#### Parameters

- errorOrList: string | string[] - The error or list of errors to add into the `ErrorSchema`
- [pathOfError]: string | (string | number)[] | undefined - The optional path into the `ErrorSchema` at which to add the error(s)

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

### clearErrors()

Clears the error(s) in the `ErrorSchema` at either the root level or the location within the schema described by the `pathOfError`.
The path is either a dotted string, with optional bracketed array indexes such as `'level1.level2[2]'`, or a list of segments; see [toPath()](#topath) for the grammar a string path accepts.

#### Parameters

- [pathOfError]: string | (string | number)[] | undefined - The optional path into the `ErrorSchema` at which to add the error(s)

#### Returns

- ErrorSchemaBuilder&lt;T> - The instance of the `ErrorSchemaBuilder` class

<!--

INSTRUCTIONS:

For each PR, add a changelog entry that describes what your PR does. Add it to the heading
for the appropriate package it modifies and include it in this format:
- [Description] ([Link to PR])

If your PR affects multiple packages, list it multiple times under headings for each package.
If it affects more general things such as dependency updates or non-package-specific changes,
add it under a "Dev / docs / playground" section.

You should also update the heading of the latest (upcoming) version if your PR change merits
it according to semantic versioning. For example, if your PR adds a breaking change, then you
should change the heading of the (upcoming) version to include a major version bump.

-->
# 5.0.3

## @rjsf/chakra-ui
- Fixed the `SelectWidget` to allow the proper display of the selected value, fixing [#3422](https://github.com/rjsf-team/react-jsonschema-form/issues/3422)

# 5.0.2

## @rjsf/utils
- Added the `idPrefix`, `idSeparator` and `rawErrors` optional props to `FieldProps` since they were missing

## Dev / docs / playground
- Migrated latest documentation to Docusaurus, which is deployed to GitHub Pages.
- Updated readthedocs.io documentation site to guide users to the new docs site.
- Updated links in documentation and package README files to point to new site.
- Updated the `custom-widgets-field` documentation for the new `FieldProps`

# 5.0.1
- Updated the `peerDependencies` in all packages to remove the `-beta.x` tags from the `@rjsf/xxxx` packages

# 5.0.0

## @rjsf/antd
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/bootstrap-4
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/chakra-ui
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/core
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/fluent-ui
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/material-ui
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/mui
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/semantic-ui
- Updated `CheckboxesWidget`, `RadioWidget` and `SelectWidget` to use indexes as values to support `enumOptions` with object values, fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)

## @rjsf/utils
- Added `enumOptionsIndexForValue()`, `enumOptionsIsSelected()`, `enumOptionsValueForIndex()` functions to support fixing [#1494](https://github.com/rjsf-team/react-jsonschema-form/issues/1494)
  - Updated `enumOptionsDeselectValue()`, `enumOptionsSelectValue()` and `optionId()` to use indexes instead of values
  - Deleted the `processSelectValue()` that was added in the beta and is no longer needed
- Updated `getSchemaType()` to remove the inference of type from `anyOf`/`oneOf`, fixing [#3412](https://github.com/rjsf-team/react-jsonschema-form/issues/3412)

## Dev / docs / playground
- Updated the `utility-functions` documentation for the new and updated methods mentioned above, as well as deleting the documentation for `processSelectValue()`
- Updated the playground to add a new `Enum Objects` example to highlight the use of indexes for `enumOptions`
- Updated `5.x migration guide` to document the change from values to indexes for the `enumOptions` based controls.

# 5.0.0-beta.20

## @rjsf/antd
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/bootstrap-4
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/chakra-ui
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/core
- Updated `MultiSchemaField` to pass `undefined` as the value to the widget when the `selectedOption` is -1, supporting `SelectWidget` implementations that allow the user to clear the selected value of the `anyOf`/`oneOf` field.
- Updated `Form` to support receiving an optional `ref` prop.
- Updated `Form` to restore providing empty root level objects, fixing [#3391](https://github.com/rjsf-team/react-jsonschema-form/issues/3391)
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/fluent-ui
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/material-ui
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/mui
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

## @rjsf/semantic-ui
- Fixed `schema.examples` to deduplicate when `schema.default` exists in the examples, fixing [#3393](https://github.com/rjsf-team/react-jsonschema-form/issues/3393)

# 5.0.0-beta.19

## @rjsf/core
- Updated `MultiSchemaField` to cache options with refs in state and to output better labels for options without them when a title is available in either the `schema` or `uiSchema`
- Improved fix for [#2691](https://github.com/rjsf-team/react-jsonschema-form/issues/2691) to remove the breaking change caused by the original fix [#2980](https://github.com/rjsf-team/react-jsonschema-form/issues/2980) as follows:
  - Added a new `ui:fieldReplacesAnyOrOneOf` flag to the `uiSchema` that when true will allow users to opt-out of the `anyOf`/`oneOf` wrapping of a custom field

## @rjsf/utils
- Updated `toPathSchema()` to handle `oneOf`/`anyOf` by picking the closest option and generating the path for it, fixing [#2262](https://github.com/rjsf-team/react-jsonschema-form/issues/2262)
- Added new `uiSchema` only flag `ui:fieldReplacesAnyOrOneOf` that, if true allows the user to opt-out of the `anyOf`/`oneOf` wrapping of a custom field

## Dev / docs / playground
- Updated the `uiSchema` documentation for `ui:fieldReplacesAnyOrOneOf`

# 5.0.0-beta.18

## @rjsf/core
- Updated `MultiSchemaField` to utilize the new `getClosestMatchingOption()` and `sanitizeDataForNewSchema()` functions, fixing the following issues:
  - [#3236](https://github.com/rjsf-team/react-jsonschema-form/issues/3236)
  - [#2978](https://github.com/rjsf-team/react-jsonschema-form/issues/2978)
  - [#2944](https://github.com/rjsf-team/react-jsonschema-form/issues/2944)
  - [#2202](https://github.com/rjsf-team/react-jsonschema-form/issues/2202)
  - [#2183](https://github.com/rjsf-team/react-jsonschema-form/issues/2183)
  - [#2086](https://github.com/rjsf-team/react-jsonschema-form/issues/2086)
  - [#2069](https://github.com/rjsf-team/react-jsonschema-form/issues/2069)
  - [#1661](https://github.com/rjsf-team/react-jsonschema-form/issues/1661)
  - And probably others
- Updated `ObjectField` to deal with `additionalProperties` with `oneOf`/`anyOf`, fixing [#2538](https://github.com/rjsf-team/react-jsonschema-form/issues/2538)
- Updated `Form`, `MultiSchemaField`, `ObjectField` and `SchemaField` to properly support making `formData` optional, fixing [#3305](https://github.com/rjsf-team/react-jsonschema-form/issues/3305)

## @rjsf/material-ui
- Fix shrinking of `SelectWidget` label only if value is not empty, fixing [#3369](https://github.com/rjsf-team/react-jsonschema-form/issues/3369)

## @rjsf/mui
- Fix shrinking of `SelectWidget` label only if value is not empty, fixing [#3369](https://github.com/rjsf-team/react-jsonschema-form/issues/3369)

## @rjsf/utils
- Added new `getClosestMatchingOption()`, `getFirstMatchingOption()` and `sanitizeDataForNewSchema()` schema-based utility functions
  - Deprecated `getMatchingOption()` and updated all calls to it in other utility functions to use `getFirstMatchingOption()`
- Updated `stubExistingAdditionalProperties()` to deal with `additionalProperties` with `oneOf`/`anyOf`, fixing [#2538](https://github.com/rjsf-team/react-jsonschema-form/issues/2538)
- Updated `getSchemaType()` to grab the type of the first element of a `oneOf`/`anyOf`, fixing [#1654](https://github.com/rjsf-team/react-jsonschema-form/issues/1654)
- Updated all props or function parameters of the generic type `T` to allow for them to be optionally provided, fixing [#3305](https://github.com/rjsf-team/react-jsonschema-form/issues/3305)
  - This was done in both the types file and the actual implementation code

## @rjsf/validator-ajv6
- Updated places where `formData` was required as a function argument to make it optional, fixing [#3305](https://github.com/rjsf-team/react-jsonschema-form/issues/3305)

## @rjsf/validator-ajv8
- Updated places where `formData` was required as a function argument to make it optional, fixing [#3305](https://github.com/rjsf-team/react-jsonschema-form/issues/3305)

## Dev / docs / playground
- Updated the playground to `onFormDataEdited()` to only change the formData in the state if the `JSON.stringify()` of the old and new values are different, partially fixing [#3236](https://github.com/rjsf-team/react-jsonschema-form/issues/3236)
- Updated the playground `npm start` command to always use the `--force` option to avoid issues where changes made to other packages weren't getting picked up due to `vite` caching
- Updated the documentation for `utility-functions` and the `5.x upgrade guide` to add the new utility functions and to document the deprecation of `getMatchingOption()`
  - Also updated `utility-functions`, making all optional parameters without a default (as denoted by the syntax `[<parameter>]: <type>`) to add ` | undefined` onto the type to make it clear it supports passing in undefined as a value.

# 5.0.0-beta.17

## @rjsf/antd
- Enable searching in the `SelectWidget` by the label that the user sees rather than by the value
- Added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200) 
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/bootstrap-4
- Added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/chakra-ui
- Added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/core
- Updated `SchemaField` to handle the new `style` prop in the `uiSchema` similarly to `classNames`, passing it to the `FieldTemplate` and removing it from being passed down to children.
  - Also, added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper
  - This partially fixes [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/fluent-ui
- Added support for new `style` prop on `FieldTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/material-ui
- Updated `SelectWidget` to support additional `TextFieldProps` in a manner similar to how `BaseInputTemplate` does
- Added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/mui
- Updated `SelectWidget` to support additional `TextFieldProps` in a manner similar to how `BaseInputTemplate` does
- Added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/semantic-ui
- Added support for new `style` prop on `FieldTemplate` and `WrapIfAdditionalTemplate` rendering them on the outermost wrapper, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Updated `CheckboxesWidget` to treat the value as an array when selecting/deselecting values and when determining the checked state - fixing [#2141](https://github.com/rjsf-team/react-jsonschema-form/issues/2141)
- Updated all the user "input" controls to have an `aria-describedby` value built using the `ariaDescribedByIds()` function, partially fixing [#959](https://github.com/rjsf-team/react-jsonschema-form/issues/959)
  - Also updated the generation of ids for the title, description, error, examples, options and help blocks using the associated new id generation utilty functions

## @rjsf/utils
- Updated the `FieldTemplateProps`, `WrapIfAdditionalTemplateProps` and `UIOptionsBaseType` types to add `style?: StyleHTMLAttributes<any>`, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Added `enumOptionsDeselectValue()` and `enumOptionsSelectValue()` as a loose refactor of the duplicated functions in the various `CheckboxesWidget` implementations
- Updated the `FieldTemplateProps`, `WrapIfAdditionalTemplateProps` and `UIOptionsBaseType` types to add `style?: StyleHTMLAttributes<any>`, partially fixing [#1200](https://github.com/rjsf-team/react-jsonschema-form/issues/1200)
- Added new `ariaDescribedByIds()`, `descriptionId()`, `errorId()`, `examplesId()`, `helpId()` `optionId()` and `titleId()` id generator functions

## @rjsf/validator-ajv8
- Remove alias for ajv -> ajv8 in package.json. This fixes [#3215](https://github.com/rjsf-team/react-jsonschema-form/issues/3215).
- Updated `AJV8Validator#transformRJSFValidationErrors` to return more human-readable error messages.  The ajv8 `ErrorObject` message is enhanced by replacing the error message field with either the `uiSchema`'s `ui:title` field if one exists or the `parentSchema` title if one exists. Fixes [#3246](https://github.com/rjsf-team/react-jsonschema-form/issues/3246)

## Dev / docs / playground
- In the playground, change Vite `preserveSymlinks` to `true`, which provides an alternative fix for [#3228](https://github.com/rjsf-team/react-jsonschema-form/issues/3228) since the prior fix caused [#3215](https://github.com/rjsf-team/react-jsonschema-form/issues/3215).
- Updated the `custom-templates.md` and `uiSchema.md` to document the new `style` prop
- Updated the `validation.md` documentation to describe the new `uiSchema` parameter passed to the `customValidate()` and `transformError()` functions
- Updated the `utility-functions` documentation to add the new `enumOptionsDeselectValue()` and `enumOptionsSelectValue()` functions and to describe the new id generator functions
- Updated the `5.x migration guide` documentation to describe potential breaking `id` changes

# 5.0.0-beta.16

## @rjsf/antd
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)
- Updated the use of the deprecated `withConfigConsumer` with the `ConfigConsumer` component instead, fixing [#3336](https://github.com/rjsf-team/react-jsonschema-form/issues/3336)

## @rjsf/bootstrap-4
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated `CheckboxWidget` to get the `required` state of the checkbox from the `schemaRequiresTrueValue()` utility function rather than the `required` prop, fixing [#3317](https://github.com/rjsf-team/react-jsonschema-form/issues/3317)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/chakra-ui
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated `CheckboxWidget` to get the `required` state of the checkbox from the `schemaRequiresTrueValue()` utility function rather than the `required` prop, fixing [#3317](https://github.com/rjsf-team/react-jsonschema-form/issues/3317)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/core
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
  - Also, passed `registry` into the `SubmitButton` inside of the `Form` as part of this fix
- Updated `ArrayField` to pass the new `totalItems` and `canAdd` props to the `ArrayFieldItemTemplate` instances, fixing [#3315](https://github.com/rjsf-team/react-jsonschema-form/issues/3315)
  - Also refactored the near duplicate logic for `onAddClick` and `onAddIndexClick` into a new `_handleAddClick()` function, fixing [#3316](https://github.com/rjsf-team/react-jsonschema-form/issues/3316)
- Fix passing of generic types to a few helper methods, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)
- Updated the types for `ValidatorType`, `CustomValidator` and `ErrorTransformer` to add the new generics, as well as passing `uiSchema` to the `validateFormData()` call, partially fixing [#3170](https://github.com/rjsf-team/react-jsonschema-form/issues/3170)

## @rjsf/fluent-ui
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/material-ui
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/mui
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/semantic-ui
- Updated the usage of the `ButtonTemplates` to pass the new required `registry` prop, filtering it out in the actual implementations before spreading props, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated `CheckboxWidget` to get the `required` state of the checkbox from the `schemaRequiresTrueValue()` utility function rather than the `required` prop, fixing [#3317](https://github.com/rjsf-team/react-jsonschema-form/issues/3317)
  - Also fixed the `CheckboxWidget` missing label issue [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the test for the `CheckboxWidget` validating that the `schema.title` is passed as the label, fixing [#3302](https://github.com/rjsf-team/react-jsonschema-form/issues/3302)
- Updated the theme to accept generic types, exporting `generateXXX` functions for `Form`, `Theme`, `Templates` and `Widgets` to support using the theme with user-specified type generics, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/utils
- Updated the `SubmitButtonProps` and `IconButtonProps` to add required `registry` prop, fixing - [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314)
- Updated the `ArrayFieldTemplateItemType` to add the new `totalItems` and `canAdd` props, fixing [#3315](https://github.com/rjsf-team/react-jsonschema-form/issues/3315)
- Updated the `CustomValidator` and `ErrorTransformer` types to take the full set of `T`, `S`, `F` generics in order to accept a new optional `uiSchema` property, partially fixing [#3170](https://github.com/rjsf-team/react-jsonschema-form/issues/3170)
- Updated the `ValidatorType` to add the `F` generic to allow the `validateFormData()` function to take a new optional `uiSchema` parameter, partially fixing [#3170](https://github.com/rjsf-team/react-jsonschema-form/issues/3170)
  - Updated many of the schema-based utility functions to take the additional generics as well to fulfill the `ValidatorType` interface change 

## @rjsf/validator-ajv6
- Updated the `customizeValidator` and `AJV6Validator` implementations to add the `S` and `F` generics, so that `validateFormData()` can accept a new optional `uiSchema` parameter that is passed to `transformErrors()` and `customValidate()`, partially fixing [#3170](https://github.com/rjsf-team/react-jsonschema-form/issues/3170)

## @rjsf/validator-ajv8
- Updated the `customizeValidator` and `AJV8Validator` implementations to add the `F` generic, so that `validateFormData()` can accept a new optional `uiSchema` parameter that is passed to `transformErrors()` and `customValidate()`, partially fixing [#3170](https://github.com/rjsf-team/react-jsonschema-form/issues/3170)

## Dev / docs / playground
- Fixed the documentation for `ArrayFieldItemTemplate`, `SubmitButtonProps` and `IconButtonProps` as part of the fix for [#3314](https://github.com/rjsf-team/react-jsonschema-form/issues/3314) and [#3315](https://github.com/rjsf-team/react-jsonschema-form/issues/3315)
- Updated the documentation in `form-props.md` for `children`, fixing [#3322](https://github.com/rjsf-team/react-jsonschema-form/issues/3322)
- Added new `typescript.md` documentation to `Advanced Customization` describing how to use custom generics as part of the fix for [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)
- Updated the documentation in `utilty-functions.md` to add the new `F` generic to all the places which needed them 

# 5.0.0-beta.15

## @rjsf/core
- Pass the `schema` along to the `ArrayFieldItemTemplate` as part of the fix for [#3253](https://github.com/rjsf-team/react-jsonschema-form/issues/3253)
- Tweak Babel configuration to emit ES5-compatible output files, fixing [#3240](https://github.com/rjsf-team/react-jsonschema-form/issues/3240)

## @rjsf/material-ui
- Reverse the condition used in the `onChange` handler in the `RangeWidget`, fixing [#2161](https://github.com/rjsf-team/react-jsonschema-form/issues/2161)

## @rjsf/mui
- Reverse the condition used in the `onChange` handler in the `RangeWidget`, fixing [#2161](https://github.com/rjsf-team/react-jsonschema-form/issues/2161)

## @rjsf/utils
- Update the `ArrayFieldItemTemplate` to add `schema` as part of the fix for [#3253](https://github.com/rjsf-team/react-jsonschema-form/issues/3253)
- Fix improper merging of nested `allOf`s ([#3025](https://github.com/rjsf-team/react-jsonschema-form/pull/3025), [#3227](https://github.com/rjsf-team/react-jsonschema-form/pull/3227)), fixing [#2923](https://github.com/rjsf-team/react-jsonschema-form/pull/2929)
- Added a new `ErrorSchemaBuilder` class to enable building a proper `ErrorSchema` without crazy castings, fixing [#3239](https://github.com/rjsf-team/react-jsonschema-form/issues/3239)

## @rjsf/validator-ajv6
- Updated the validator to use the `ErrorSchemaBuilder` in the `toErrorSchema()` function to simplify the implementation

## @rjsf/validator-ajv8
- Updated the validator to use the `ErrorSchemaBuilder` in the `toErrorSchema()` function to simplify the implementation
- Updated the validator to properly map missing required field errors in the `ErrorSchema`, fixing [#3260](https://github.com/rjsf-team/react-jsonschema-form/issues/3260)

## Dev / docs / playground
- Fixed the documentation for `ArrayFieldItemTemplate` as part of the fix for [#3253](https://github.com/rjsf-team/react-jsonschema-form/issues/3253)
- Added documentation for `ErrorSchemaBuilder` in the `utility-functions.md`, fixing [#3239](https://github.com/rjsf-team/react-jsonschema-form/issues/3239)

# 5.0.0-beta.14

## @rjsf/antd
- No longer render extra 0 for array without errors, fixing [#3233](https://github.com/rjsf-team/react-jsonschema-form/issues/3233)

## @rjsf/core
- Added `ref` definition to `ThemeProps` fixing [#2135](https://github.com/rjsf-team/react-jsonschema-form/issues/2135)
- Updated the `onChange` handler in `Form` to use the new `preventDuplicates` mode of `mergeObjects()` when merging `extraErrors` when live validation is off, fixing [#3169](https://github.com/rjsf-team/react-jsonschema-form/issues/3169)

## @rjsf/material-ui
- Fix RangeWidget missing htmlFor and schema.title [#3281](https://github.com/rjsf-team/react-jsonschema-form/pull/3281)

## @rjsf/mui
- Fix RangeWidget missing htmlFor and schema.title [#3281](https://github.com/rjsf-team/react-jsonschema-form/pull/3281)

## @rjsf/utils
- Updated `computedDefaults` (used by `getDefaultFormState`) to skip saving the computed default if it's an empty object unless `includeUndefinedValues` is truthy, fixing [#2150](https://github.com/rjsf-team/react-jsonschema-form/issues/2150) and [#2708](https://github.com/rjsf-team/react-jsonschema-form/issues/2708)
- Expanded the `getDefaultFormState` util's `includeUndefinedValues` prop to accept a boolean or `"excludeObjectChildren"` if it does not want to include undefined values in nested objects
- Updated `mergeObjects` to add new `preventDuplicates` mode when concatenating arrays so that only unique values from the source object array are copied to the destination object array
- Fix `isObject` to correctly identify 'Date' as not an object, similar to 'File', thus preventing them from being merged with Object default values.

## Dev / docs / playground
- Removed extraneous leading space on the examples in the validation documentation, fixing [#3282](https://github.com/rjsf-team/react-jsonschema-form/issues/3282)
- Updated the documentation for `mergeObjects()` for the new `preventDuplicates` mode of concatenating arrays
- Updated the documentation for unpkg releases to the correct name fixing the confusion found in [#3262](https://github.com/rjsf-team/react-jsonschema-form/issues/3262)

# 5.0.0-beta.13

## @rjsf/playground
- Fix Vite development server [#3228](https://github.com/rjsf-team/react-jsonschema-form/issues/3228)

## @rjsf/validator-ajv8
- BREAKING CHANGE: Disable form data validation for invalid JSON Schemas. Use @rjsf/validator-ajv6 if you need to validate against invalid schemas.
- Fix additionalProperties validation [#3213](https://github.com/rjsf-team/react-jsonschema-form/issues/3213)
- Report all schema errors thrown by Ajv. Previously, we would only report errors thrown for a missing meta-schema. This behavior is unchanged for @rjsf/validator-ajv6.
- Disable Ajv strict mode by default.
- Add RJSF-specific additional properties keywords to Ajv to prevent errors from being reported in strict mode.
- For JSON Schemas with `$id`s, use a pre-compiled Ajv validation function when available.
- No longer fail to validate inner schemas with `$id`s, fixing [#2821](https://github.com/rjsf-team/react-jsonschema-form/issues/2181).

# 5.0.0-beta.12

## @rjsf/antd
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/bootstrap
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/chakra-ui
- Automatically close single-choice Select widget on selection
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/core
- BREAKING CHANGE: ShowErrorList prop changed to support `false`, `top` or `bottom`; `true` is no longer a valid value as the default changed from `true` to `top` [#634](https://github.com/rjsf-team/react-jsonschema-form/issues/634)
- Added the new generic, `S extends StrictRJSFSchema = RJSFSchema`, for `schema`/`rootSchema` to every component that needed it.
- Fix omitExtraData with field names with dots #2643
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)
- Changed the `F = any` generic to be `F extends FormContextType = any` to better support how `formContext` is defined and used, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/fluent-ui
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/material-ui
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/mui
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/semantic-ui
- Updated the tests to use the `@rjsf/validator-ajv8` fixing [#3110](https://github.com/rjsf-team/react-jsonschema-form/issues/3110)

## @rjsf/utils
- Beta-only potentially BREAKING CHANGE: Changed all types that directly or indirectly defined `schema`/`rootSchema` to add the generic `S extends StrictRJSFSchema = RJSFSchema` and use `S` as the type for them.
  - `StrictRJSFSchema` was added as the alias to `JSON7Schema` and `RJSFSchema` was modified to be `StrictRJSFSchema & GenericObjectType`
  - This new generic was added BEFORE the newly added `F = any` generic because it is assumed that more people will want to change the schema than the formContext types
  - This provides future support for the newer draft versions of the schema
- Updated the `ValidatorType` interface to add a new `rawValidation()` method for use by the playground
- Added the `FormContextType` alias to `GenericObjectType` and changing the `F = any` generic to be `F extends FormContextType = any` to better support how `formContext` is defined and used, partially fixing [#3072](https://github.com/rjsf-team/react-jsonschema-form/issues/3072)

## @rjsf/validator-ajv6
- Fixed a few type casts given the new expanded definition of the `RJSFSchema` type change
- Deprecated this library in favor of the `@rjsf/validator-ajv8`
- Refactored out the `rawValidation()` function for use by the playground

## @rjsf/validator-ajv8
- Updated the typing to add the new `S extends StrictRJSFSchema = RJSFSchema` generic and fixed up type casts
- Added the `AjvClass` prop to the `CustomValidatorOptionsType` to support using the `Ajv2019` or `Ajv2020` class implementation instead of the default `Ajv` class; fixing [#3189](https://github.com/rjsf-team/react-jsonschema-form/issues/3189)
- Refactored out the `rawValidation()` function for use by the playground

## Dev / docs / playground
- Updated the `5.x upgrade guide` and `utility-functions.md` to document the new `StrictRJSFSchema`, the `S` generic and changing the `F` generic extend
- Updated the `validation` guide to document the new `AjvClass` prop on `CustomValidatorOptionsType` and mentioning the deprecation of `@rjsf/validator-ajv6`
- Updated the playground to add support for using the AJV 8 validator with the `draft-2019-09` and `draft-2020-12` schemas and to make the `AJV8` validator the default validator, marking `AJV6` as deprecated
- Updated all the documentation to switch to Typescript notation where missing along with switching to using the `@rjsf/validator-ajv8` validator as the default
- Added a way of doing a raw Ajv validation in the playground to determine whether an issue is with RJSF or Ajv

# 5.0.0-beta.11

## @rjsf/antd
- Updated `FieldTemplate` to no longer render additional, unnecessary white space for fields that have empty `help` and `extra` information, fixing [#3147](https://github.com/rjsf-team/react-jsonschema-form/issues/3174)
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/bootstrap-4
- Make label generation consistent with other themes by refactoring the code into the `FieldTemplate` instead of having the widgets implementing the label, fixing [#2007](https://github.com/rjsf-team/react-jsonschema-form/issues/2007)
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/chakra-ui
- Added support for `chakra-react-select` v4, fixing [#3152](https://github.com/rjsf-team/react-jsonschema-form/issues/3152)
- In `SelectWidget` use `Select` from `chakra-react-select` for both single- and multiple-choice select
- In `SelectWidget` multiple-choice select display label rather than value for selected items
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/core
- Extended `Form.onChange` to optionally return the `id` of the field that caused the change, fixing [#2768](https://github.com/rjsf-team/react-jsonschema-form/issues/2768)
- Fixed a regression in earlier v5 beta versions where additional properties could not be added when `additionalProperties` was `true` ([#3719](https://github.com/rjsf-team/react-jsonschema-form/pull/3719)).
- Fixed a regression in v5 beta version where BooleanField was altering readonly props ([#3188](https://github.com/rjsf-team/react-jsonschema-form/pull/3188).
- Updated `ArrayFieldDescriptionTemplate` and `ArrayFieldTitleTemplate` to not render content when `ui:label` is false, fixing [#2535](https://github.com/rjsf-team/react-jsonschema-form/issues/2535)
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/fluent-ui
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/material-ui
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/mui
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/semantic-ui
- Updated `ArrayFieldTemplate` to always render `ArrayFieldDescriptionTemplate` since that template deals with the optional `description`
- Pass the `schema` into the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate`, fixing [#3176](https://github.com/rjsf-team/react-jsonschema-form/issues/3176)

## @rjsf/utils
- Updated the `onChange` prop on `FieldProps` and `FieldTemplateProps` to add an optional `id` parameter to the callback.
- Updated the `DescriptionFieldProps` and `TitleFieldProps` to add a new required `schema` prop. Also updated the `ArrayFieldDescriptionTemplate` and `ArrayFieldTitleTemplate` to make `description` and `title` optional while pulling all the other props but `id` from the associated type.

## Dev / docs / playground
- Added an error boundary to prevent the entire app from crashing when an error is thrown by Form. See [#3164](https://github.com/rjsf-team/react-jsonschema-form/pull/3164) for closed issues.
- Updated the playground to log the `id` of the field being changed on the `onChange` handler
- Updated `form-props.md` to describe the new `id` parameter being returned by the `Form.onChange` handler
- Updated `custom-templates.md` to add the new `schema` prop to the `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate`, `DescriptionFieldTemplate` and `TitleFieldTemplate` documentation
- Updated the `contributing.md` to describe setting up the `husky` precommit hooks for the first time `git clone` of the repo; Also added guidance for developing on underpowered computers; Finally discussed code-coverage requirements for some packages.

# 5.0.0-beta.10

## @rjsf/antd
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Added `name` to the `input` components that were missing it to support `remix`
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, protecting against non-arrays
- Converted `antd` to Typescript, indirectly fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3123)

## @rjsf/bootstrap
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Added `name` to the `input` components that were missing it to support `remix`
- Simplified the `CheckboxWidgets` code to eliminate a ternary in favor of a simple `inline={inline}` property since all the rest of the props were the same
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, removing unnecessary casts to `any` and protecting against non-arrays
- Fixed an issue where `CheckboxesWidget` incorrectly rendered inner `<form>` elements around each checkbox, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2355)

## @rjsf/chakra-ui
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Added `name` to the `input` components that were missing it to support `remix`
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, removing unnecessary casts to `any` and protecting against non-arrays

## @rjsf/core
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Added `name` to the `input` components that were missing it to support `remix`
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`
- Updated the `validate()` method on `Form` to make `schemaUtils` an optional third parameter rather than a required first parameter, making the signature backwards compatible with what was provided in previous versions.

## @rjsf/fluent-ui
- Add stubbed `WrapIfAdditionalTemplate`. `additionalProperties` is currently not supported in `@rjsf/fluent-ui` (See [#2777](https://github.com/rjsf-team/react-jsonschema-form/issues/2777)).
- Added `name` or `id` (for those fluent components not supporting name) to the `input` components that were missing it to support `remix`
- Fixed `DateTimeWidget` to properly use `BaseInputTemplate` rather than `TextWidget`
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, removing unnecessary casts and protecting against non-arrays, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2138)
- Fixed `RadioWidget` so that it supports read-only and disabled states

## @rjsf/material-ui
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Added `name` to the `input` components that were missing it to support `remix`
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, removing unnecessary casts to `any` and protecting against non-arrays

## @rjsf/mui
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Added `name` to the `input` components that were missing it to support `remix`
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, removing unnecessary casts to `any` and protecting against non-arrays

## @rjsf/semantic-ui
- Convert `WrapIfAdditional` to `WrapIfAdditionalTemplate`
- Fixed `ArrayFieldTemplate` and `ObjectFieldTemplate`'s `AddButton` to show the non-labeled version. (https://github.com/rjsf-team/react-jsonschema-form/pull/3142)
- Added `name` to the `input` components that were missing it to support `remix`, including fixing incorrect `name`s as `id`s in some situations
- Fixed `CheckboxesWidget` and `RadioWidget` to have unique `id`s for each radio element by appending the `option.value`, protecting against non-arrays
- Converted `semantic-ui` to Typescript

## @rjsf/utils
- Added `WrapIfAdditionalTemplate` and `WrapIfAdditionalTemplateProps` to simplify theming and make it easier to override Field behavior for schemas with `additionalProperties`.

# 5.0.0-beta.9

## @rjsf/antd
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/bootstrap
- Updated the `FieldErrorTemplate` to remove the explicit typing of the `error` to string to support the two options
- Updated `Theme` to use the renamed `ThemeProps` from `@rjsf/core`
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/chakra-ui
- Updated `Theme` to use the renamed `ThemeProps` from `@rjsf/core`
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/core
- Updated the `FieldErrorTemplate` to remove the explicit typing of the `error` to string to support the two options
- Implemented programmatic validation via new `validateForm()` method on `Form`, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2755, https://github.com/rjsf-team/react-jsonschema-form/issues/2552, https://github.com/rjsf-team/react-jsonschema-form/issues/2381, https://github.com/rjsf-team/react-jsonschema-form/issues/2343, https://github.com/rjsf-team/react-jsonschema-form/issues/1006, https://github.com/rjsf-team/react-jsonschema-form/issues/246)
- Renamed `WithThemeProps` to `ThemeProps` to prevent another breaking-change by returning the type back to the name it had in version 4
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)
- Updated `ArrayField` to fall back to `SchemaField` if `ArraySchemaField` is not defined, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3131)

## @rjsf/fluent-ui
- Updated `Theme` to use the renamed `ThemeProps` from `@rjsf/core`
- Pass `uiSchema` appropriately to all of the `IconButton`s and `ArrayFieldItemTemplate` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/material-ui
- Updated `Theme` to use the renamed `ThemeProps` from `@rjsf/core`
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/mui
- Updated `Theme` to use the renamed `ThemeProps` from `@rjsf/core`
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/semantic-ui
- Updated the `FieldErrorTemplate` to use the `children` variation of the `List.Item` that supports ReactElement
- Pass `uiSchema` appropriately to all of the `IconButton`s, `ArrayFieldItemTemplate` and `WrapIfAdditional` components, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## @rjsf/utils
- Updated the `FieldErrorProps` type to make it support an array of string and ReactElement
- Updated the `IconButtonProps` type to add `uiSchema`, adding the `<T = any, F = any>` generics to it and the associated `ButtonTemplates` in `TemplatesType` AND added `uiSchema` to `ArrayFieldTemplateItemType` as well, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3130)

## Dev / docs / playground
- Updated the `custom-templates.md` file to add the missing asterisk to the new `FieldErrorTemplate` and `FieldHelpTemplate`
- Updated the playground to add a new button for programmatically validating a form
- Also updated the `validation.md` documentation to describe how to programmatically validate a form
- Fixed the `chakra-ui` custom `uiSchema` documentation to make it clear they work on a per-field basis, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2865)
- Added `formElement` breaking-change documentation to the `5.x upgrade guide.md`
- Replace Webpack with Vite
- Updated documentation for `ArraySchemaField` to better represent the updated implementation, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/3131)

# 5.0.0-beta.8

## @rjsf/core
- When rendering additional properties with title, use the key of the property instead of the title.

# v5.0.0-beta.7

## @rjsf/antd
- Only show description when there really IS a description, fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/2779)
- Refactored the `FieldErrorTemplate` from inside of `FieldTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/bootstrap-4
- Refactored the `FieldErrorTemplate` and `FieldHelpTemplate` from inside of `FieldTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/chakra-ui
- Refactored the `FieldErrorTemplate` and `FieldHelpTemplate` from inside of `FieldTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/core
- Added new field `ArraySchemaField`, assigned to `SchemaField` by default, that is used by the `ArrayField` to render the `children` for each array field element
- Refactored the internal `ErrorList` and `Help` components from inside of `SchemaField` to new templates: `FieldErrorTemplate` and `FieldHelpTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/material-ui
- Refactored the `FieldErrorTemplate` and `FieldHelpTemplate` from inside of `FieldTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/mui
- Refactored the `FieldErrorTemplate` and `FieldHelpTemplate` from inside of `FieldTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/semantic-ui
- Converted `RawErrors` and `HelpField` into `FieldErrorTemplate` and `FieldHelpTemplate`, removing their explicit calls from `FieldTemplate`; fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/3104)

## @rjsf/utils
- Added new `FieldErrorProps` and `FieldHelpProps` types
- Added new `FieldErrorTemplate` and `FieldHelpTemplate` to the `TemplatesType`

## Dev / docs / playground
- Updated the `custom-templates.md` file to add documentation for the new `FieldErrorTemplate` and `FieldHelpTemplate`
- Updated the `custom-widgets-fields.md` file to add documentation for the new `ArraySchemaField` field.

# v5.0.0-beta.6

## @rjsf/bootstrap-4
- Change custom attribute to bsPrefix by @WillowP, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2648)

## @rjsf/core
- Added tests for the new `@rjsf/validator-ajv8` to the `validate_test.js` file to ensure the validation works with both validator implementations

## @rjsf/mui
- Fixed the `README.md` to correct the package name in several places to match the actual package

## @rjsf/utils
- Fixed the `README.md` to remove references to ajv6 validator, adding link to the `utility-functions.md` in the docs
- Fixed the `README.md` to correct the package name in several places to match the actual package
- Updated `getDefaultFormState()` so that oneOf and anyOf default values do not always use the first option when formData contains a better option, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2183)

## @rjsf/validator-ajv6
- Fixed the `README.md` to correct the package name in several places to match the actual package

## @rjsf/validator-ajv8
- Support for localization (L12n) on a customized validator using a `Localizer` function passed as a second parameter to `customizeValidator()`, fixing (https://github.com/rjsf-team/react-jsonschema-form/pull/846, and https://github.com/rjsf-team/react-jsonschema-form/issues/1195)
- Fixed the `README.md` to correct the package name in several places to match the actual package

## Dev / docs / playground
- Added two new validator selections, `AJV8` and `AJV8_es` to the list of available validators for the playground; Using the second one will translate error messages to spanish.
- Updated the validation documentation to clarify the case of empty strings being stored as `null` in certain cases.

# v5.0.0-beta.5

## @rjsf/validator-ajv8
- Added the new Ajv 8 based validator so that it can get published on npm

# v5.0.0-beta.4

## @rjsf/semantic-ui
- Switched `devDependencies` for React to 17.x and use `dts` to build and test the library (rather than `tsdx`)

# v5.0.0-beta.3

## @rjsf/core
- Added a `requestSubmit()` call to the `Form.submit()` function, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2104, https://github.com/rjsf-team/react-jsonschema-form/issues/3023)
- Added missing `children` property on the `FormProps` type for `Form`
- Throw an error when the required `validator` prop has not been provided to the `Form`

## @rjsf/antd
- Do not show errors if `extraErrors` has `[]` (https://github.com/rjsf-team/react-jsonschema-form/pull/2576).
- Added support for `schema.examples` in the material ui theme fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2368, https://github.com/rjsf-team/react-jsonschema-form/issues/2557)

## @rjsf/fluent-ui
- Added support for `schema.examples` in the material ui theme fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2368, https://github.com/rjsf-team/react-jsonschema-form/issues/2557)

## @rjsf/material-ui
- Added support for `schema.examples` in the material ui theme fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2368, https://github.com/rjsf-team/react-jsonschema-form/issues/2557)

## @rjsf/material-ui
- Added support for `schema.examples` in the material ui theme fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2368, https://github.com/rjsf-team/react-jsonschema-form/issues/2557)

## @rjsf/semantic-ui
- Upgraded from the `1.x` to `2.x` version of `semantic-ui-react`
- Added support for `schema.examples` in the material ui theme fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2368, https://github.com/rjsf-team/react-jsonschema-form/issues/2557)

## @rjsf/bootstrap-4
- Avoid importing the whole of `react-icons` (https://github.com/rjsf-team/react-jsonschema-form/pull/3046, https://github.com/react-icons/react-icons/issues/154)

## Dev / docs / playground
- Fixed missing `playground` import error by adding `source-map-loader`
- Fixed up the incorrectly formatted `5.x Migration Guide`
- Added a `Programmatic Submit` button on the playground form to allow users to test the ability to programmatically submit a form
- Regenerated the `package-lock.json` files using clean `node_modules` directories
- Fixed issue with playground controls in top right corner not functioning properly due to missing validator

# v5.0.0-beta.2
- Added peer dependencies to new `@rjsf/utils` library now that it is published on npm

# v5.0.0-beta.1

## Global changes across all themes:
- Node 16 is now the default node engine for all packages, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2687)
- Refactored all themes to use the new `@rjsf/utils` library functions and types
- Refactored the individual theme forms to consolidate `templates` as part of the fix for https://github.com/rjsf-team/react-jsonschema-form/issues/2526
  - All the work implementing the `BaseInputTemplate` should fix (https://github.com/rjsf-team/react-jsonschema-form/issues/2926, https://github.com/rjsf-team/react-jsonschema-form/issues/2889, https://github.com/rjsf-team/react-jsonschema-form/issues/2875, https://github.com/rjsf-team/react-jsonschema-form/issues/2223)
  - Also made the display of `title` and `description` consistent across themes, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2481, https://github.com/rjsf-team/react-jsonschema-form/issues/2363, https://github.com/rjsf-team/react-jsonschema-form/issues/2219)
  - This change also ensures that all templates are properly exported, resolving (https://github.com/rjsf-team/react-jsonschema-form/issues/2365)
- Bumped most devDependencies to the latest versions where possible
- Switched all repos `package.json` and `package-lock.json` files to be built and maintained by Node 16.
- Adding button templates help to change text for buttons (https://github.com/rjsf-team/react-jsonschema-form/issues/2082, https://github.com/rjsf-team/react-jsonschema-form/issues/2357)

## @rjsf/utils
- New package created by refactoring and converting to Typescript the `utils.js` file from `core` into independent functions.
  - Resolves (https://github.com/rjsf-team/react-jsonschema-form/issues/1655, https://github.com/rjsf-team/react-jsonschema-form/issues/2480, https://github.com/rjsf-team/react-jsonschema-form/issues/2341)
- Updated `types` from `core` in `utils` to better match the implementation across all themes
  - Included adding a bunch of new types for existing and new features
  - The type updates should fix (https://github.com/rjsf-team/react-jsonschema-form/issues/2871, https://github.com/rjsf-team/react-jsonschema-form/issues/2673, https://github.com/rjsf-team/react-jsonschema-form/issues/2347, https://github.com/rjsf-team/react-jsonschema-form/issues/2186)
- Clear errors on `formData` change when `liveOmit=true` when "additionalProperties: false" [issue 1507](https://github.com/rjsf-team/react-jsonschema-form/issues/1507) (https://github.com/rjsf-team/react-jsonschema-form/pull/2631)

## @rjsf/validator-ajv6
- New package created by refactoring and converting to Typescript the `validator.js` file from `core` into independent functions as well as a class that implements the new `ValidatorType` interface.
  - [#2693](https://github.com/rjsf-team/react-jsonschema-form/issues/2693).
- Added support for customizing the options passed to the creation of the `ajv` instance.
- A **BREAKING CHANGE** to `toErrorList()` was made so that it takes `fieldPath: string[]` rather than `fieldName='root'` as part of the fix to (https://github.com/rjsf-team/react-jsonschema-form/issues/1596)
  - The returned `errors` also now adds `property` from the `fieldPath` along with the proper path from the `property` to the `stack` message, making it consistent with the AJV errors.
    - Previously the `stack` attribute would say `root: error message`; now it says `. error message`
  - In addition, the extra information provided by AJV is no longer lost from the `errors` when merged with custom validation, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/1596).

## @rjsf/core
- Converted core to Typescript (https://github.com/rjsf-team/react-jsonschema-form/issues/583)
- `ui:emptyValue` now works with selects (https://github.com/rjsf-team/react-jsonschema-form/issues/1041)
- Refactoring `utils.js` into the new `@rjsf/utils` fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/2719)
- **BREAKING CHANGE** Fix overriding core submit button className (https://github.com/rjsf-team/react-jsonschema-form/issues/2979)
- Fix `ui:field` with anyOf or oneOf no longer rendered twice (#2890)
- **BREAKING CHANGE** Fixed `anyOf` and `oneOf` getting incorrect, potentially duplicate ids when combined with array (https://github.com/rjsf-team/react-jsonschema-form/issues/2197)
- `formContext` is now passed properly to `SchemaField`, fixes (https://github.com/rjsf-team/react-jsonschema-form/issues/2394, https://github.com/rjsf-team/react-jsonschema-form/issues/2274)
- Added `ui:duplicateKeySuffixSeparator` to customize how duplicate object keys are renamed when using `additionalProperties`.
- The `extraErrors` are now consistently appended onto the end of the schema validation-based `errors` information that is returned via the `onErrors()` callback when submit fails.
  - In addition, the extra information provided by AJV is no longer stripped from the `errors` during the merge process, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/1596).
- Fixed id generation for `RadioWidget` to no longer use random numbers fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2461)
- Correctly call the `onChange` handler in the new set of props if it changed, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/1708).
- Fixed race condition for `onChange` when `formData` is controlled prop, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/513),

## @rjsf/antd
- Fix esm build to use `@rollup/plugin-replace` to replace `antd/lib` and `rc-picker/lib` with `antd/es` and `rc-picker/es` respectively, fixing (https://github.com/rjsf-team/react-jsonschema-form/issues/2962)

## @rjsf/bootstrap-4
- Bootstrap-4 `withTheme` customizations should work properly now (https://github.com/rjsf-team/react-jsonschema-form/issues/2058)
- `ArrayFieldTemplate` refactor seems to have fixed https://github.com/rjsf-team/react-jsonschema-form/issues/2775
- Fix issues with `SelectField` (https://github.com/rjsf-team/react-jsonschema-form/issues/2616, https://github.com/rjsf-team/react-jsonschema-form/issues/2875)

## @rjsf/chakra-ui
- Properly handle the hidden field in this theme (https://github.com/rjsf-team/react-jsonschema-form/issues/2571)

## @rjsf/material-ui
- The theme for Material UI version 5 (i.e. `@rjsf/mui`) was split out of the theme for version 4 (i.e. `@rjsf/material-ui`) to resolve the following issues:
  - [#2762](https://github.com/rjsf-team/react-jsonschema-form/issues/2762)
  - [#2858](https://github.com/rjsf-team/react-jsonschema-form/issues/2858)
  - [#2905](https://github.com/rjsf-team/react-jsonschema-form/issues/2905)
  - [#2945](https://github.com/rjsf-team/react-jsonschema-form/issues/2945)
  - [#2774](https://github.com/rjsf-team/react-jsonschema-form/issues/2774)
- Material-UI TextWidget now respects `inputType` in uiSchema (https://github.com/rjsf-team/react-jsonschema-form/issues/2057)
  - Also respects `step` for `number` type (https://github.com/rjsf-team/react-jsonschema-form/issues/2488)
- Material-UI UpDownWidget now support min/max/step (https://github.com/rjsf-team/react-jsonschema-form/issues/2022)
- Properly handle the hidden field in this theme (https://github.com/rjsf-team/react-jsonschema-form/issues/2571)
- Select properly accepts true or false (https://github.com/rjsf-team/react-jsonschema-form/issues/2326)

## @rjsf/mui
- The theme for Material UI version 5 (i.e. `@rjsf/mui`) was split out of the theme for version 4 (i.e. `@rjsf/material-ui`) to resolve the following issues:
  - [#2762](https://github.com/rjsf-team/react-jsonschema-form/issues/2762)
  - [#2858](https://github.com/rjsf-team/react-jsonschema-form/issues/2858)
  - [#2905](https://github.com/rjsf-team/react-jsonschema-form/issues/2905)
  - [#2945](https://github.com/rjsf-team/react-jsonschema-form/issues/2945)
  - [#2774](https://github.com/rjsf-team/react-jsonschema-form/issues/2774)
- Material-UI TextWidget now respects `inputType` in uiSchema (https://github.com/rjsf-team/react-jsonschema-form/issues/2057)
  - Also respects `step` for `number` type (https://github.com/rjsf-team/react-jsonschema-form/issues/2488)
- Material-UI UpDownWidget now support min/max/step (https://github.com/rjsf-team/react-jsonschema-form/issues/2022)
- Properly handle the hidden field in this theme (https://github.com/rjsf-team/react-jsonschema-form/issues/2571)

## @rjsf/semantic-ui
- Fix missing error class on fields (https://github.com/rjsf-team/react-jsonschema-form/issues/2666)
- Fixed the `main` definition in `semantic-ui` to fix (https://github.com/withastro/astro/issues/4357)
- Properly handle the hidden field in this theme (https://github.com/rjsf-team/react-jsonschema-form/issues/2571)

## Dev / docs / playground
- Demonstrate use of `ui:field` with `anyOf` (#2890)
- Playground now uses webpack 5
- Corrected number field default (https://github.com/rjsf-team/react-jsonschema-form/issues/2358)

# 4.2.1
* fix typo by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2854
* Build all packages with TypeScript, including core by @nickgros in https://github.com/rjsf-team/react-jsonschema-form/pull/2799
* fix(@rjsf/chakra-ui): append SubmitButton by @terrierscript in https://github.com/rjsf-team/react-jsonschema-form/pull/2860
* fix: Pass uiSchema to custom ArrayField by @bakajvo in https://github.com/rjsf-team/react-jsonschema-form/pull/2769
* fix(@rjsf-antd): Submit button type bug (#2867) by @sarpere in https://github.com/rjsf-team/react-jsonschema-form/pull/2869
* Docs: Clarify registry object structure and that it's passed down to custom widgets by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2886
* fix: allow UISchemaSubmitButtonOptions properties to be undefined by @maxpou in https://github.com/rjsf-team/react-jsonschema-form/pull/2876
* Create FUNDING.yml by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2866
* docs: fix schema dependencies link by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2885
* chore(deps): bump core-js-pure from 3.21.1 to 3.23.3 by @dependabot in https://github.com/rjsf-team/react-jsonschema-form/pull/2902
* chore(deps): bump minimist from 1.2.5 to 1.2.6 in /packages/fluent-ui by @dependabot in https://github.com/rjsf-team/react-jsonschema-form/pull/2805
* fix(@rjsf/bootstrap-4): Change custom attribute to bsPrefix by @WillowP in https://github.com/rjsf-team/react-jsonschema-form/pull/3049

# 4.2.0

## @rjsf/core
- Feature for ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)
- Fix `ui:orderable` and `ui:removable` in arrays (#2797)
- Fix for nested allOf blocks with multiple if/then/else statements failing to render correctly (https://github.com/rjsf-team/react-jsonschema-form/pull/2839)

## Dev / docs / playground
- Enable ui options in playground, to demonstrate submit button options (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)
- Document the `material-ui` context and hook (#2757)

## @rjsf/material-ui
- SubmitButton widget to use new ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2833)
- Fixed bundler warning issue (#2762) by exporting a `@rjsf/material-ui/v4` and `@rjsf/material-ui/v5` sub-package
  - NOTE: `@rjsf/material-ui` was retained to avoid a breaking change, but using it will continue to cause bundler warnings
  - See the `README.md` for the `@rjsf/material-ui` package for updated usage information
- Fixed (#2831) for `material-ui` by removing the `DefaultChildren` passed into the themes

## @rjsf/bootstrap-4
- SubmitButton widget to use new ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)

## @rjsf/semantic-ui
- SubmitButton widget to use new ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)

## @rjsf/antd
- SubmitButton widget to use new ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)

## @rjsf/fluent-ui
- SubmitButton widget to use new ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)

# v4.1.1

## @rjsf/material-ui
- Fix bloated bundle size by individually requiring all MUI components (#2754)
- Add new `useMuiComponent()` hook as a shortcut for `useContext(MuiComponentContext)`

## @rjsf/semantic-ui
- Added support for additionalProperties schema property (#2817)
# v4.1.0

## @rjsf/core

- To improve performance, skip validating subschemas in oneOf / anyOf if formData is undefined (#2676)
- Fixed the `toIdSchema()` typescript definition to add new `idSeparator` prop along with the spelling of `idPrefix`
  - Also passed the new `idSeparator` prop through to the `AnyOfField` and `OneOfField` inside of `SchemaField`
  - Updated `ArrayField` in `@rjsf/core` to pass `idSeparator` and `idPrefix` through to `SchemaField`, fixing a small bug
- Added support for the new `ui:hideError` feature, which allows you to hide errors at a field level

## @rjsf/material-ui
- Remove `console.log()` of the import error in `MaterialUIContext` and `Mui5Context`
- Export the `MaterialComponentContext` (#2724)

## Dev / docs / playground
- Added documentation for the new `ui:hideError` feature

# v4.0.1

- Bumped the peer dependencies of `@rjsf/core` to `^4.0.0` for all of themes in `package.json`
- Also, added tests to all themes to verify that the `tagName` prop works as expected

## @rjsf/core
- Updated `Form` to support the `semantic-ui` and `material-ui` themes to allow them work when `tagName` is provided
- Support if/then/else (#2700)

## @rjsf/material-ui
- Fixed up the `Theme` and `Theme5` implementations to deal with a regression in which adding `tagName` caused the 2 themes to not work
- Only `console.log()` the import error in `MaterialUIContext` and `Mui5Context` when not in `production` to eliminate tons of warnings for released code

## @rjsf/semantic-ui
- Fixed up the `Theme` implementation to deal with a regression in which adding `tagName` caused the theme to not work

# v4.0.0

## @rjsf/core
- Add React 17 as a supported peer-dependency
- Introduce `idSeparator` prop to change the path separator used to generate field names (https://github.com/rjsf-team/react-jsonschema-form/pull/2628)
- Array fields support custom widgets (previously, only multiple-choice arrays with `enums` or `uniqueItems` support it) (https://github.com/rjsf-team/react-jsonschema-form/pull/2697)

## @rjsf/material-ui
- Added React 17 as an optional peer dependency
- Minimum version of React required to use package is now React 16.3
- Bumped required minimum versions of `@material-ui/core` and `@material-ui/icons` to the latest (`4.12.0` and `4.11.1`)
  - New exports: `MuiForm4` and `Theme4` are aliases to the material-ui version 4 `MuiForm` and `Theme`
  - The Material-UI 4 theme will fallback to a form with a message indicating `@material-ui` is not available when one (or both) of the libraries are not installed
- Added support for material-ui version 5 on top of React 17
  - Requires React 17 so will need to upgrade project
  - Added `@mui/material`, `@mui/icons-material`, `@emotion/react` and `@emotion/styled` as optional peer dependencies
  - New exports: `MuiForm5` and `Theme5` support using the Material UI 5 libraries instead of version 4
  - The Material-UI 5 theme will fallback to a form with a message indicating `@mui` is not available when one (or both) of the libraries are not installed

## @rjsf/chakra-ui
- Added support for this new theme

## Dev / docs / playground
- Upgraded playground to use React 17
- Differentiated the material-ui 4 and 5 themes
- Added chakra-ui theme

# v3.3.0

## @rjsf/semantic-ui
- "semantic-ui-react" dependency updated to v1.3.1 (https://github.com/rjsf-team/react-jsonschema-form/pull/2590)
- fixed an issue where all semantic props overwritten when a single [semantic theme-specific prop](https://react-jsonschema-form.readthedocs.io/en/latest/api-reference/themes/semantic-ui/uiSchema/) is passed in ([issue 2619](https://github.com/rjsf-team/react-jsonschema-form/issues/2619)) (https://github.com/rjsf-team/react-jsonschema-form/pull/2590)

# v3.2.1

## @rjsf/core
- Don't crash when non-object formData is passed in to a schema item with additionalProperties (https://github.com/rjsf-team/react-jsonschema-form/pull/2595)
- Upgrade jsonpointer to 5.0.0 to address security vulnerability (https://github.com/rjsf-team/react-jsonschema-form/pull/2599)
- Feature for ui:submitButtonOptions on the submit button for forms (https://github.com/rjsf-team/react-jsonschema-form/pull/2640)

# v3.2.0

## @rjsf/core
- Fix for clearing errors after updating and submitting form (https://github.com/rjsf-team/react-jsonschema-form/pull/2536)
- bootstrap-4 TextWidget wrappers now pull from registry, add rootSchema to Registry, fix FieldProps.onFocus type to match WidgetProps (https://github.com/rjsf-team/react-jsonschema-form/pull/2519)
- Added global `readonly` flag to the `Form` (https://github.com/rjsf-team/react-jsonschema-form/pull/2554)
- Fix to allow changing `additionalProperties` to falsy values (https://github.com/rjsf-team/react-jsonschema-form/pull/2540)
- Pass uiSchema to custom Boolean widget (https://github.com/rjsf-team/react-jsonschema-form/pull/2587
## @rjsf/bootstrap-4
- bootstrap-4 TextWidget wrappers now pull from registry, add rootSchema to Registry, fix FieldProps.onFocus type to match WidgetProps (https://github.com/rjsf-team/react-jsonschema-form/pull/2519)

## @rjsf/fluent-ui
- fluent-ui: Allow value of 0 in TextWidget (https://github.com/rjsf-team/react-jsonschema-form/pull/2497)

## Dev / docs / playground
- Several dependency updates
- Added global `readonly` flag to the `Form` (https://github.com/rjsf-team/react-jsonschema-form/pull/2554)
- Enable source maps in playground, for development (https://github.com/rjsf-team/react-jsonschema-form/pull/2568)

# v3.1.0

## @rjsf/core
- Properly assign label prop for MultiSelect ArrayField (https://github.com/rjsf-team/react-jsonschema-form/pull/2459)
- Take into account implicitly defined types when rendering labels for fields (https://github.com/rjsf-team/react-jsonschema-form/pull/2502)

## @rjsf/antd
- Add default Form export to @rjsf/antd (https://github.com/rjsf-team/react-jsonschema-form/pull/2514)

## @rjsf/fluent-ui
- Make material-ui and fluent-ui pull TextWidget from the registry; remove registry prop from <div> in TextWidget (https://github.com/rjsf-team/react-jsonschema-form/pull/2515)

## @rjsf/material-ui
- Make material-ui and fluent-ui pull TextWidget from the registry; remove registry prop from <div> in TextWidget (https://github.com/rjsf-team/react-jsonschema-form/pull/2515)

## @rjsf/semantic-ui
- Use getDisplayLabel to properly show labels for widgets (https://github.com/rjsf-team/react-jsonschema-form/pull/2225)
- Add submit button, email, url, date widgets (https://github.com/rjsf-team/react-jsonschema-form/pull/2224)

## Dev / docs / playground
- Several dependency updates

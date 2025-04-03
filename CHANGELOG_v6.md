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
# 6.0.0-beta.1

## @rjsf/antd

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme 

## @rjsf/chakra-ui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme

## @rjsf/core

- BREAKING CHANGE: Updated `ArrayField` to provide the `buttonsProps` to the `ArrayFieldItemTemplateType`
- Added `ArrayFieldItemButtonsTemplate` component as a refactor of all the common buttons code from all the `ArrayFieldItemTemplate` implementations, adding a unique id using the `buttonId()` function
- Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme

## @rjsf/fluent-ui

- BREAKING CHANGE: Deleted this theme in favor of `fluentui-rc`

## @rjsf/fluentui-rc

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme

## @rjsf/mui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Updated the theme to use `Grid2` instead of the deprecated `Grid`
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme

## @rjsf/semantic-ui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme

## @rjsf/utils

- BREAKING CHANGE: Refactored the `ArrayFieldItemTemplateType` to extract out all the button related props to `ArrayFieldItemButtonsTemplateType`, adding `buttonsProps: ArrayFieldItemButtonsTemplateType` as a new prop
  - Also created a deprecated alias type `ArrayFieldTemplateItemType` that points to `ArrayFieldItemTemplateType` for backwards compatibility
- Added new `GridTemplateProps` type
- BREAKING CHANGE: Added two the following new, required props to `TemplatesType`:
  - `ArrayFieldItemButtonsTemplate: ComponentType<ArrayFieldItemButtonsTemplateType<T, S, F>>;`
  - `GridTemplate: ComponentType<GridTemplateProps>`
- BREAKING CHANGE: Updated the `SchemaUtilsType` to add new validator-based functions to the interface
- Added the following new non-validator utility functions:
  - `buttonId<T>(id: IdSchema<T> | string, btn: 'add' | 'copy' | 'moveDown' | 'moveUp' | 'remove')`: used to generate consistent ids for RJSF buttons
  - `getTestIds(): TestIdShape`: Returns an object of test IDs that can only be used in test mode, helpful for writing unit tests for React components
  - `hashObject(object: unknown): string`: Stringifies an `object` and returns the hash of the resulting string
  - `hashString(string: string): string`: Hashes a string into hex format
  - `lookupFromFormContext<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(regOrFc: Registry<T, S, F> | Registry<T, S, F>['formContext'], toLookup: string, fallback?: unknown)`: Given a React JSON Schema Form registry or formContext object, return the value associated with `toLookup`
- Added the following new validator-based utility functions:
  - `findFieldInSchema<T = undefined, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(validator: ValidatorType<T, S, F>, rootSchema: S, path: string | string[], schema: S, formData?: T, experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>): FoundFieldType<S>`: Finds the field specified by the `path` within the root or recursed `schema`
  - `findSelectedOptionInXxxOf<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(validator: ValidatorType<T, S, F>, rootSchema: S, schema: S, fallbackField: string,xxx: 'anyOf' | 'oneOf', formData?: T, experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>): S | undefined`: Finds the option that matches the selector field in the `schema` or undefined if nothing is selected
  - `getFromSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(validator: ValidatorType<T, S, F>, rootSchema: S, schema: S, path: string | string[], defaultValue: T | S, experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>): T | S`: Helper that acts like lodash's `get` but additionally retrieves `$ref`s as needed to get the path for schemas
- Exported a `browser` version of the libraries with a browser-safe version of `getTestIds()`

## @rjsf/validator-ajv6

- BREAKING CHANGE: This deprecated validator has been removed

## Dev / docs / playground

- Updated the playground to remove `fluent-ui` theme
- Updated the `custom-templates.md` documentation for the changes to the `ArrayFieldTemplateItem` and add the two new templates
- Updated the `utility-functions.md` documentation to add the `buttonId()` function
- Added the `v6.x upgrade guide.md` documentation
- Updated the `playground` to add a `Layout Grid` example and made the selected example now be part of the shared export
- Replaced Lerna with Nx, updated all lerna commands to use the Nx CLI

# 6.0.0-alpha.0

## @rjsf/bootstrap-4

- BREAKING CHANGE: Package has been replaced with `@rjsf/react-bootstrap`. `react-boostrap` v1 / Bootstrap 4 are no longer supported in RJSF v6.

## @rjsf/material-ui

- BREAKING CHANGE: Removed `@rjsf/material-ui` package. Material UI v4 (`@material-ui/core`) has been deprecated since September 2021. To use Material UI v5 (`@mui/core`) with RJSF, please use the `@rjsf/mui` theme instead.

## @rjsf/react-bootstrap

- Added new package to replace `@rjsf/bootstrap-4`
- `react-bootstrap` peer dependency bumped to `^2.0.0`, corresponding to Bootstrap 5
- CheckboxesWidget: Remove deprecated prop `custom`
- IconButton: Remove deprecated `block` prop
- RangeWidget: Use `FormRange` component
- SelectWidget: Use new FormSelect component, remove `bsPrefix` prop to achieve correct styling

## Dev / docs / playground

- Updated the playground to remove `material-ui-4` theme and replace the `bootstrap-4` theme with `react-bootstrap`

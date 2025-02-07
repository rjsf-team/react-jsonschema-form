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
# 6.0.0-beta.2

## @rjsf/antd

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes

## @rjsf/chakra-ui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes

## @rjsf/core

- BREAKING CHANGE: Updated `ArrayField` to provide the `buttonsProps` to the `ArrayFieldItemTemplateType`
- Added `ArrayFieldItemButtonsTemplate` component as a refactor of all the common buttons code from all the `ArrayFieldItemTemplate` implementations, adding a unique id using the `buttonId()` function
- Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes

## @rjsf/fluent-ui

- BREAKING CHANGE: Deleted this theme in favor of `fluentui-rc`

## @rjsf/fluentui-rc

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes

## @rjsf/mui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes

## @rjsf/semantic-ui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes

## @rjsf/utils

- BREAKING CHANGE: Refactored the `ArrayFieldItemTemplateType` to extract out all the button related props to `ArrayFieldItemButtonsTemplateType`, adding `buttonsProps: ArrayFieldItemButtonsTemplateType` as a new prop
  - Also created a deprecated alias type `ArrayFieldTemplateItemType` that points to `ArrayFieldItemTemplateType` for backwards compatibility
- Added new `GridTemplateProps` type
- BREAKING CHANGE: Added two the following new, required props to `TemplatesType`:
  - `ArrayFieldItemButtonsTemplate: ComponentType<ArrayFieldItemButtonsTemplateType<T, S, F>>;`
  - `GridTemplate: ComponentType<GridTemplateProps>`
- Added a new `buttonId<T>(id: IdSchema<T> | string, btn: 'add' | 'copy' | 'moveDown' | 'moveUp' | 'remove')` used to generate consistent ids for RJSF buttons

## Dev / docs / playground

- Updated the playground to remove `fluent-ui` theme
- Updated the `custom-templates.md` documentation for the changes to the `ArrayFieldTemplateItem` and add the two new templates
- Updated the `utility-functions.md` documentation to add the `buttonId()` function
- Added the `v6.x upgrade guide.md` documentation

# 6.0.0-beta.1

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

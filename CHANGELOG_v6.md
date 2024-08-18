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

## @rjsf/bootstrap-4

- Package has been replaced with `@rjsf/react-bootstrap`. `react-boostrap` v1 / Bootstrap 4 are no longer supported in RJSF v6.

## @rjsf/material-ui

- Removed `@rjsf/material-ui` package. Material UI v4 (`@material-ui/core`) has been deprecated since September 2021. To use Material UI v5 (`@mui/core`) with RJSF, please use the `@rjsf/mui` theme instead.

## @rjsf/react-bootstrap

- Added new package to replace `@rjsf/bootstrap-4`
- `react-bootstrap` peer dependency bumped to `^2.0.0`, corresponding to Bootstrap 5
- CheckboxesWidget: Remove deprecated prop `custom`
- IconButton: Remove deprecated `block` prop
- RangeWidget: Use `FormRange` component
- SelectWidget: Use new FormSelect component, remove `bsPrefix` prop to achieve correct styling

# 5.15.1

## @rjsf/core

- fix `getFieldNames`. Now correctly defines an array of primitives.

## @rjsf/validator-ajv6

- Updated the `AJV6Validator` class to expose the internal `ajv` object, allowing access to support a fix related to [#3972](https://github.com/rjsf-team/react-jsonschema-form/issues/3972)

## @rjsf/validator-ajv8

- Updated the `AJV8Validator` class to expose the internal `ajv` object, allowing access to support a fix related to [#3972](https://github.com/rjsf-team/react-jsonschema-form/issues/3972)

## Dev / docs / playground

- Updated the documentation to describe how to use the newly exposed `ajv` variable

# 5.15.0

## @rjsf/mui

- fix gap in text and select widget outlines when `"ui:label": false` is specified.

## @rjsf/utils

- Updated `resolveAllReferences()` to use own recurse list for each object properties, fixing [#3961](https://github.com/rjsf-team/react-jsonschema-form/issues/3961)
- Added an experimental flag `allOf` to `experimental_defaultFormStateBehavior` for populating defaults when using `allOf` schemas [#3969](https://github.com/rjsf-team/react-jsonschema-form/pull/3969)

## Dev / playground

- add missing typescript project reference for `utils` in `validator-ajv6` and `validator-ajv8` packages tsconfigs
- Added a dropdown for changing the `experimental_defaultFormStateBehavior.allOf` behaviour in the playground

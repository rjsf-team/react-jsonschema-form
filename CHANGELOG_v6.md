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

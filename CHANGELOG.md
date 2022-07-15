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
# v5.0.0 (coming soon)

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

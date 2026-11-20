<!--

Add an entry for each change users can notice, following
https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/docs/docs/contributing.md#changelog

-->

# 7.0.0-beta.2

## @rjsf/core

- Fix `Form` filling an `anyOf`/`oneOf` field on its first render or `reset()` from another option than the one it shows, where under `additionalPropertiesWhenAbsent: 'allow'` an option naming neither `additionalProperties` nor `patternProperties` takes the data's extra keys, so its defaults were added or dropped ([#5886](https://github.com/rjsf-team/react-jsonschema-form/issues/5886))
- Fix `Form` hiding the add button and the extra keys of an object, or of an `anyOf`/`oneOf` option an `allOf` holding options of its own merges with, whose `additionalProperties`, or an `allOf` entry's, is `true` or `{}` ([#5886](https://github.com/rjsf-team/react-jsonschema-form/issues/5886))

## @rjsf/utils

- **BREAKING CHANGE:** Change `getClosestMatchingOption()` to score the data's keys an option's `additionalProperties` or `patternProperties` takes for an option `retrieveSchema()` handed out or one holding an `allOf`, `if` or `dependencies` too, so `getDefaultFormState()`, `findSelectedOptionInXxxOf()` and a call over options the root declares pick the option the field shows, under `additionalPropertiesWhenAbsent: 'allow'` too. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getclosestmatchingoption-scores-the-extra-keys-an-options-additionalproperties-takes-breaking-change) ([#5886](https://github.com/rjsf-team/react-jsonschema-form/issues/5886))
- Fix `retrieveSchema()` dropping an `additionalProperties` of `true` or `{}`, the object's own, an `allOf` entry's or an option's, when it merges the object's `allOf`, including the options it merges with those of an `allOf` entry ([#5886](https://github.com/rjsf-team/react-jsonschema-form/issues/5886))

# 7.0.0-beta.1 (2026-11-20)

## @rjsf/antd

- **BREAKING CHANGE:** Remove support for `antd` 5: the peer dependency range is now `^6.7.0`, since earlier antd 6 releases crash `@rjsf/antd` forms on first render or don't understand a `labelAlign` of `'start'` or `'end'`, and `ErrorList` and `CyclicSchemaExpandTemplate` always pass `Alert` its `title` prop. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantd) ([#5264](https://github.com/rjsf-team/react-jsonschema-form/pull/5264), [#5763](https://github.com/rjsf-team/react-jsonschema-form/pull/5763))
- Change `DateWidget`/`DateTimeWidget` to show a `format: "iso-date-time"` value as a naive local date-time instead of converting it to a UTC ISO string, and a stored value that carries an offset as the wall-clock time it represents ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- **BREAKING CHANGE:** Fix `BaseInputTemplate` never calling `onChangeOverride` for a numeric field: such a field now renders an `Input` with `type="number"`, so the override receives the `ChangeEvent`, as in every other theme. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantds-onchangeoverride-is-now-called-for-a-numeric-field-breaking-change) ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285), [#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303))
- Add `ui:options.optgroups` support to `SelectWidget`, grouping its options through rc-select's nested `options` ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Change `WrapIfAdditionalTemplate` to render an additional property's key as a select of the names `propertyNames.enum` allows instead of a free-text input, and fix a `deprecated` additional property offering its decoration as a key name or renaming itself to it ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` generic over the form data, and keep each component's own generic type in the `Theme`, `Templates` and `Widgets` exports instead of `any`; `generateForm()` returns a `ThemedForm<T, S, F>` and the other generators default to `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix `FieldTemplate` showing a field's `ui:help` in place of its validation errors, so a field with `ui:help` showed no error message; both now show ([#5351](https://github.com/rjsf-team/react-jsonschema-form/pull/5351), [#5326](https://github.com/rjsf-team/react-jsonschema-form/issues/5326))
- Fix `FieldTemplate` dropping a `ui:help` given as a React element, along with the field's errors ([#5351](https://github.com/rjsf-team/react-jsonschema-form/pull/5351), [#5326](https://github.com/rjsf-team/react-jsonschema-form/issues/5326))
- Add `FieldHelpTemplate` to the theme's templates, keeping help text in antd's description color rather than its error tint when the field has errors; restyling `.help-block`'s color for that case needs `!important` ([#5351](https://github.com/rjsf-team/react-jsonschema-form/pull/5351), [#5326](https://github.com/rjsf-team/react-jsonschema-form/issues/5326))
- Fix `RadioWidget`'s object options and `FieldTemplate`'s object/array selects, and make `SelectWidget` report its form data value on focus and blur ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309), [#5317](https://github.com/rjsf-team/react-jsonschema-form/issues/5317))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Fix `AltDateWidget` rendering no hour, minute or second selects for `alt-datetime`, emitting a date-only value, and letting its Now and Clear buttons change a `readonly` or `disabled` field ([#5410](https://github.com/rjsf-team/react-jsonschema-form/pull/5410))
- Fix `TextareaWidget` replacing a `ui:options.rows` of `0` with 4 rows; it now gets the browser's default height, as with `@rjsf/core`'s `TextareaWidget` ([#5387](https://github.com/rjsf-team/react-jsonschema-form/pull/5387))
- Fix `FieldErrorTemplate` giving every React element error the same `...-[object Object]` key and a repeated string error the same key twice ([#5382](https://github.com/rjsf-team/react-jsonschema-form/pull/5382))
- Fix `ObjectFieldTemplate` giving a property no column span when `formContext.colSpan` has no valid entry for it, the default span counting hidden properties, and keying a property by another widget or type than it renders with, such as a boolean shown as a select ([#5450](https://github.com/rjsf-team/react-jsonschema-form/pull/5450), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5791](https://github.com/rjsf-team/react-jsonschema-form/pull/5791), [#5447](https://github.com/rjsf-team/react-jsonschema-form/issues/5447), [#5516](https://github.com/rjsf-team/react-jsonschema-form/issues/5516))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each select is named by the label, even a hidden one, and its part, such as `When, year`, and described by the field's description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Fix `SelectWidget` not giving the `aria-label` and `aria-describedby` it is passed to its control ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Fix `CheckboxesWidget`'s options staying enabled in a `disabled` field, where a click still changed the form data, and `CheckboxesWidget`'s and `RadioWidget`'s in a `readonly` field under `readonlyAsDisabled` ([#5487](https://github.com/rjsf-team/react-jsonschema-form/pull/5487))
- Change the theme to declare its presentation, so `ui:label: false` now hides every field's description, a checkbox's included, as in every other theme, and `WrapIfAdditionalTemplate` labels the key through `hasAdditionalKeyLabel()` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldHelpTemplate` repeating the field's id for an `anyOf`/`oneOf` option's own `ui:help`; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix `TitleField` rendering the `titleId()` it is handed as a `for` naming nothing rather than as an id: it puts it on a `<span>` around the title's text, inside the `<label>`, so an object's option selector is named "Pet"; its click handler is gone ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget` carrying the native `required` attribute where the schema doesn't demand `true`, so a required `boolean` left unchecked now submits as `false` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget`'s selected option description rendering under an id other than the one the select is described by; `aria-describedby` lists it before the field's description and help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Change `BaseInputTemplate`, `PasswordWidget`, `TextareaWidget`, `DateWidget` and `CheckboxWidget` to be `aria-invalid` while errors show and described only by what renders; `RadioWidget` and `CheckboxesWidget` name their group by the label, and `RangeWidget`'s handle is named by it ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` marking a label required for a widget declared `uncheckedIsFalse` where the schema doesn't demand `true`; it now reads the plan's `label.requiredMarker` ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate`'s `descriptionLocation: 'tooltip'` pointing `aria-describedby` at a description that doesn't exist, losing a checkbox's description, and adding the icon to the control's name ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing the `ui:title` an `anyOf`/`oneOf` option repeats a second time, and dropping an optional array's data control where it draws no heading, as under `ui:label: false` ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` rendering an empty `<div>` for a selector it isn't given, as while an optional `anyOf`/`oneOf` field has no data ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` dropping the optional data control where it draws no heading, as under `ui:label: false`, and rendering an empty column where there is no control ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate` to draw a radio, checkboxes or range field's label with no `for`, as core's does, so a selector aimed at `label[for=…]` for such a field should aim at `label:has(#root_color__label)`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `RadioWidget` under `ui:autofocus` to focus its checked radio, or the first a user can choose, and `CheckboxesWidget` the first checkbox a user can choose ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `AltDateWidget`'s date parts to sit in a `group` with the field's id, named by the label, which has no `for`, each part `aria-invalid` while errors show, so `label[for="root_when"]` should be `label:has(#root_when__label)`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Fix `AltDateWidget`'s Now and Clear buttons staying enabled when the field is disabled ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `DateWidget` and `PasswordWidget` ignoring a `nameGenerator`: their input's `name` is now `htmlName`, as in the other widgets ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `WrapIfAdditionalTemplate`'s key input having no name under `ui:label: false`, `SelectWidget` not being `aria-required` for a required field, and `PasswordWidget`, `TextareaWidget`, `DateWidget` and `RadioWidget`'s radios (a read-only field's excepted) not being `required` for one ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate` to put the label id on a `<span>` around the label's text, apart from antd's `*` and `:`, so a group or slider handle named by it is named `Color` rather than `* Color:`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `BaseInputTemplate`, `PasswordWidget`, `TextareaWidget`, `DateWidget` and `WrapIfAdditionalTemplate`'s key input staying editable for a `ui:readonly` field under `readonlyAsDisabled: false`, `DateWidget` opening its popup or drawing its clear icon there ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix a read-only `RadioWidget` being `required` and changing on click ([#5544](https://github.com/rjsf-team/react-jsonschema-form/pull/5544), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `block` as the theme's `globalUiOptionsKeys`, typed by the new `AntdGlobalUISchemaOptions` and `UiSchema` types, so a global `block` reaches `RemoveButton` outside a `LayoutGridField` too ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- Fix `ObjectFieldTemplate` showing no add button for an object naming no `additionalProperties` in a form whose `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `FieldTemplate` to set its form item's error status from the field's own errors, the `hasErrors` prop, so an `anyOf`/`oneOf` option follows its own `ui:hideError`; a custom field rendering it by hand passes `hasErrors` with its `errors` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Add `aria-invalid` and a description by its row's errors to `WrapIfAdditionalTemplate`'s key input, the free-text one and the `propertyNames` select alike, while the object forbids that key, and give its `Form.Item` antd's `error` status ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Fix the widgets ignoring a `<ConfigProvider componentDisabled>`: every widget, `IconButton`'s buttons and `AltDateWidget`'s Now and Clear are disabled under it, and `SelectWidget`'s and `RangeWidget`'s hidden inputs post nothing ([#5487](https://github.com/rjsf-team/react-jsonschema-form/pull/5487), [#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5506](https://github.com/rjsf-team/react-jsonschema-form/issues/5506), [#5593](https://github.com/rjsf-team/react-jsonschema-form/issues/5593), [#5597](https://github.com/rjsf-team/react-jsonschema-form/issues/5597))
- Add antd `HiddenWidget` and `RatingWidget`s that honor `<ConfigProvider componentDisabled>` ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5506](https://github.com/rjsf-team/react-jsonschema-form/issues/5506), [#5593](https://github.com/rjsf-team/react-jsonschema-form/issues/5593), [#5597](https://github.com/rjsf-team/react-jsonschema-form/issues/5597))
- Fix a read-only `CheckboxWidget` being `required`, and a read-only `RadioWidget`, `CheckboxWidget`, `CheckboxesWidget` or `SelectWidget` left enabled not being `aria-readonly` ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5506](https://github.com/rjsf-team/react-jsonschema-form/issues/5506), [#5593](https://github.com/rjsf-team/react-jsonschema-form/issues/5593), [#5597](https://github.com/rjsf-team/react-jsonschema-form/issues/5597))
- Fix `BaseInputTemplate`, `TextareaWidget`, `PasswordWidget` and `DateWidget` ignoring `ui:autofocus` ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5597](https://github.com/rjsf-team/react-jsonschema-form/issues/5597))
- Fix `SelectWidget` and `RangeWidget` posting nothing in a native submit or `new FormData(form)`: they render hidden inputs under `htmlName`, and `SelectWidget` no longer puts `name` on its root `<div>` ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5597](https://github.com/rjsf-team/react-jsonschema-form/issues/5597))
- **BREAKING CHANGE:** Change an additional property's key input id to `root_foo__key` from `root_foo-key`, built by the new `additionalKeyId()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- **BREAKING CHANGE:** Fix `ObjectFieldTemplate` giving a column to a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget: it now leaves the property out, as it does one with its own `ui:widget: 'hidden'`. See [`@rjsf/antd` and `@rjsf/mantine` leave out a property hidden by `deprecatedHandling` or `ui:definitions`](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantd-and-rjsfmantine-leave-out-a-property-hidden-by-deprecatedhandling-or-uidefinitions-breaking-change) ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- Fix `RangeWidget`'s slider handle not being described by its field's errors, description and help, or marked `aria-invalid` while errors show ([#5715](https://github.com/rjsf-team/react-jsonschema-form/pull/5715), fixes [#5560](https://github.com/rjsf-team/react-jsonschema-form/issues/5560))
- **BREAKING CHANGE:** Change `GridTemplate` to read a column's `span` as twelfths of a row, doubled into antd's 24 columns, so `span: 12` is now a whole row rather than half; a half step such as `4.5` spans an odd 24th, one finer than a half step is rounded to the nearest one with a warning, and a `span` over 12 logs a warning to halve it; a column with a `flex` prop or a `flex`, `flexBasis` or `width` style of its own keeps it in place of its `span`, logging a warning that its `span` is ignored. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantds-gridtemplate-reads-a-columns-span-as-twelfths-breaking-change) ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a layout grid `ui:row` nested in another `ui:row` shrinking to its content rather than taking a line of its own: `GridTemplate` gives a row without a `flex`, `flexBasis`, `flexGrow` or `width` style of its own a `flex` of `1 1 100%`, ahead of the rest of its `style` ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `SelectWidget` leaving a select no label names, such as an untitled root or array item select, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ...") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a text input holding `false`, which it shows, to offer the clear button for it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget` drawing a numeric string, and posting it, at its minimum ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget` and `InputNumber` writing a number into a string field, which then failed validation and, for `InputNumber`, lost the digits past a number's precision: they now write a numeric string, as core's range input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change the number input to show nothing, and offer no clear button, for a boolean or object value ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change `PasswordWidget` to show a value of `0` or `false`, where it was empty ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `BaseInputTemplate` dropping a `pattern`, `inputMode`, `accept` or `multiple` a widget passes it as a prop, so the file input of an array took one file at a time, and a `number` field a widget passes an `onChangeOverride` getting a native number input that blocked a decimal rather than the text input the other themes render ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `AltDateWidget` to show the default years for a `yearsRange` reaching before 100, such as `[50, 2030]`, where it offered that range and wrote a year before 100 as 19xx. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-uses-the-default-years-for-a-yearsrange-reaching-before-100-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Fix `AltDateWidget` spacing its date parts by a `NaN` gutter when `formContext.rowGutter` is a pair, a responsive object or a CSS length: they now take half of each side of a pair, and half of a single gutter both ways, as they did of a number, though `Row` applies a single gutter horizontally only. A numeric string such as `'16'`, which `Row` turns into invalid CSS, now gives no spacing, as `Row` draws none for it, where it gave half its number ([#5686](https://github.com/rjsf-team/react-jsonschema-form/pull/5686))
- Add the `AntdFormContext` type, the `formContext` options the antd theme reads ([#5686](https://github.com/rjsf-team/react-jsonschema-form/pull/5686))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Fix a required `anyOf`/`oneOf` field showing two `*`s with a titled object or array option selected: only the field's label is marked now ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` and `ArrayFieldTemplate` to start an object and an array heading, like a field label above its control, and `formContext.labelAlign` to align field labels too. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantd-starts-an-object-and-an-array-heading-and-labelalign-aligns-field-labels-too-breaking-change) ([#5763](https://github.com/rjsf-team/react-jsonschema-form/pull/5763), [#5745](https://github.com/rjsf-team/react-jsonschema-form/issues/5745))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to key a property in `formContext.colSpan` by what `SchemaField` renders it as: its widget, the field its `$id` names, or an untyped `anyOf` option's type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantds-colspan-is-keyed-by-the-widget-a-property-renders-breaking-change) ([#5791](https://github.com/rjsf-team/react-jsonschema-form/pull/5791), [#5516](https://github.com/rjsf-team/react-jsonschema-form/issues/5516))
- Fix a field's `aria-describedby` listing its description before its help, while `FieldTemplate` draws the help first, below the control ([#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix `ArrayFieldTemplate` and `ObjectFieldTemplate` leaving an object's or an array's group unnamed and undescribed by the field's errors, description and help ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Add the IDs `antd-span-twelfths` and `antd-span-own-width` to the warnings for a layout grid column `span` over 12 and for one ignored beside the column's own `flex` or width, ending their messages, so [`setWarningOptions()`](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions#setwarningoptions) can make them throw ([#5868](https://github.com/rjsf-team/react-jsonschema-form/pull/5868), [#5775](https://github.com/rjsf-team/react-jsonschema-form/issues/5775))
- Fix `TitleField` keeping a title's trailing colon when `formContext.colon` is `null`, `0` or `''`, where the field's label drops it ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `BaseInputTemplate`, `CheckboxWidget`, `CheckboxesWidget`, `DateWidget`, `PasswordWidget`, `RadioWidget`, `RangeWidget`, `SelectWidget` and `TextareaWidget` not calling `onFocus` and `onBlur` for a read-only field, as `@rjsf/core` does ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `FieldErrorTemplate` drawing an empty item for an empty error message ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/bootstrap3

- Add `@rjsf/bootstrap3`, a theme that keeps the Bootstrap 3 markup `@rjsf/core` rendered through v6, with a layout grid column's `span` as its `col-xs-*` class unless it has one of its own, which it warns about, as it does about a `span` that isn't a whole number, deprecated from the start and removed in v8 ([#5635](https://github.com/rjsf-team/react-jsonschema-form/pull/5635), [#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a required `anyOf`/`oneOf` field showing two `*`s with a titled object or array option selected: only the field's label is marked now ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Fix `ArrayFieldTemplate` and `ObjectFieldTemplate` leaving an object's or an array's group undescribed by the field's errors, description and help ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- **BREAKING CHANGE:** Change `AddButton` to take the `title` it is passed, which titles an expandable object's Add button after the object, such as `Add Address`, and to fall back to `Add Item` instead of `Add`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/chakra-ui

- Fix the widgets deleting non-style keys from the uiSchema's `ui:options.chakra`: `getChakra()` returns a filtered copy rather than changing the caller's object ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Fix `ChakraUiSchema` accepting anything, since its `Omit<UiSchema, 'ui:options'>` erased every named member ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Change `BaseInputTemplate` to render a `number`/`integer` field as `<input type="text">` with a numeric `inputMode`, a `pattern` and a `title`, without `step`, `min` or `max`; set `ui:options.inputType: 'number'` or use the `updown` widget for a native number input ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` support to `SelectWidget`, grouping its options with `Select.ItemGroup`/`Select.ItemGroupLabel` ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- **BREAKING CHANGE:** Remove `chakra-react-select` from `peerDependencies`; it no longer needs to be installed alongside `@rjsf/chakra-ui`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfchakra-ui-no-longer-requires-chakra-react-select-breaking-change) ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Fix `NativeSelectWidget` ignoring `ui:enumDisabled`, leaving every option selectable ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Change `WrapIfAdditionalTemplate` to render an additional property's key as a select of the names `propertyNames.enum` allows instead of a free-text input, and fix a `deprecated` additional property offering its decoration as a key name or renaming itself to it ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Fix `BaseInputTemplate`, `CheckboxesWidget`, `NativeSelectWidget`, `SelectWidget`, `TextareaWidget` and `UpDownWidget` staying flagged `invalid` under `ui:hideError`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` flagging its `CheckboxGroup` `invalid` whenever a required field was empty, before validation and despite `ui:hideError`; it now follows the field's visible errors, which mark every checkbox `aria-invalid`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` generic over the form data, and keep each component's own generic type in the `Theme`, `Templates` and `Widgets` exports instead of `any`; `generateForm()` returns a `ThemedForm<T, S, F>` and the other generators default to `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix `RadioWidget`'s and `CheckboxesWidget`'s object options, and make `SelectWidget` report its form data value on focus and blur and offer an empty string option in the `realValue` format ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5317](https://github.com/rjsf-team/react-jsonschema-form/issues/5317))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Fix `AltDateWidget` rendering no hour, minute or second selects for `alt-datetime`, emitting a date-only value, and letting its Now and Clear buttons change a `readonly` field, or a `disabled` one rendered by a custom `FieldTemplate` ([#5410](https://github.com/rjsf-team/react-jsonschema-form/pull/5410))
- Fix `UpDownWidget` reporting `''` rather than `undefined` to `onFocus`/`onBlur` when an increment or decrement trigger is focused ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each select is named by the label, even a hidden one, and its part, such as `When, year`, and described by the field's description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `SelectWidget` to put its `aria-label` and `aria-describedby` on its trigger rather than its root ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `getChakra()` to return `JsxStyleProps` instead of `Field.RootProps`, so `Fieldset.Root` and `Field.Root` both accept it; reading a non-style member off the result, which was always `undefined`, no longer compiles ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- **BREAKING CHANGE:** Fix the `chakra` option never reaching a widget: widgets now apply it, including a `chakra` set through `ui:globalOptions` or `ui:chakra`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfchakra-ui-applies-the-chakra-option-and-getchakra-takes-the-options-breaking-change) ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- **BREAKING CHANGE:** Change `getChakra()` to take the widget's merged `options` instead of a uiSchema. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfchakra-ui-applies-the-chakra-option-and-getchakra-takes-the-options-breaking-change) ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- **BREAKING CHANGE:** Change the `chakra` option of the theme's `UiSchema` type to `JsxStyleProps`, so a non-style prop such as `invalid` or `onClick` in the root's `ui:options` no longer compiles. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfchakra-ui-applies-the-chakra-option-and-getchakra-takes-the-options-breaking-change) ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Fix `getChakra()` dropping Chakra style props that share a name with an HTML attribute, such as `color`, `width`, `height` and `display`, and remove the `@emotion/is-prop-valid` dependency ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Change the widgets to draw their own label, `CheckboxWidget` its description too, and name an `anyOf`/`oneOf` field by its option selector; `WrapIfAdditionalTemplate` labels the key through `hasAdditionalKeyLabel()` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldHelpTemplate` repeating the field's id for an `anyOf`/`oneOf` option's own `ui:help` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the fallback UI's value having no label: the theme declares `FallbackField` as drawing its own label ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget` carrying the native `required` attribute where the schema doesn't demand `true`, so a required `boolean` left unchecked now submits as `false` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget`'s trigger missing the plan's `aria-labelledby`, so an object's option selector is now named by the object's heading ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's control not being styled invalid in any widget while the field above draws its errors, and `CheckboxWidget`'s box never being styled invalid ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the widgets to put `aria-invalid` and only the descriptions that render on the element a user focuses: `BaseInputTemplate`'s, `TextareaWidget`'s, `UpDownWidget`'s and `CheckboxWidget`'s input, `RangeWidget`'s thumb, each option, `RadioWidget`'s `radiogroup` and `NativeSelectWidget` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` ignoring `ui:autofocus` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget`'s `radiogroup` being named by the field's description or an id no element had: it is named by the label it draws, by the plan's `aria-label` under `ui:label: false`, or left unnamed, and draws no label holding only a required field's `*` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` drawing no label for `RatingWidget`, `AltDateWidget`, `AltDateTimeWidget` and other widgets that leave it the label; a widget of your own under those keys that draws its own should be declared `label: 'self'` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` to put its title id on a `<span>` around the title's text, with a required heading's `*` outside it, so a selector or style targeting `#…__title` now targets the `<span>` inside the `<h5>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing the `ui:title` an `anyOf`/`oneOf` option repeats a second time, and dropping an optional array's data control where it draws no heading, as under `ui:label: false` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` rendering an empty `<div>` for a selector it isn't given, as while an optional `anyOf`/`oneOf` field has no data ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldErrorTemplate` repeating `errorId()` for each message of a field with several errors; it renders them in one element, each on its own line ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` dropping the optional data control where it draws no heading, as under `ui:label: false`, and rendering an empty grid item where there is no control ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget` rendering its select's control twice, so `select:<id>:control` appeared twice on the page ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate`'s fieldset pointing `aria-labelledby` at a legend that renders only for a description, so a control or group named by the template's label is no longer announced inside a fieldset of the same name ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change every widget's control to be named by its label and carry the field's id on the element a user focuses, and a radio group's or slider's label to have no `for`; selectors aimed at Ark's generated ids, such as `select:root_color:trigger`, should aim at the field's id. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change radio and checkbox `<input>`s to take their `optionId()`, so `focusOnFirstError` reaches them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget`'s thumb ignoring `ui:autofocus` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget`'s label missing its required `*`, its dimming for a disabled or read-only field and its invalid state while errors show, as `UpDownWidget`'s has them ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxesWidget`'s fieldset pointing `aria-labelledby` at an id no element has when it draws no label; the group carrying the field's id is named by its label, drawn outside a `<legend>` so the name is announced once ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `AltDateWidget`'s and `AltDateTimeWidget`'s label `for` naming an id no element had: the date parts' fieldset is named by the label, and each part is described by the field and `aria-invalid` while errors show ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget`'s input pointing `aria-labelledby` at a label that isn't rendered ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` and `UpDownWidget` submitting under the field's id rather than `htmlName`, and `CheckboxesWidget` ignoring `ui:autofocus`; `TitleField`'s required marker carries `chakra-field__requiredIndicator` and the `field` recipe's style, as a label's does ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget` and `RangeWidget` beneath a radio option selector repeating the field's label id, `WrapIfAdditionalTemplate`'s key select and input being unnamed under `ui:label: false`, and `NativeSelectWidget` having no `name`; it now takes `htmlName` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget`'s trigger and listbox being unnamed where no label names them: they take the field's label, placeholder or translated prompt, and a click on the label focuses the trigger instead of opening the listbox ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget` not falling back to the schema `description` for an empty `ui:description` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget`'s group not being `required` and `CheckboxesWidget`'s label missing a required `*` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget`, `UpDownWidget`, `CheckboxWidget` and `AltDateWidget`'s first date part ignoring `ui:autofocus` ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a click on `RadioWidget`'s or `RangeWidget`'s label not focusing a radio or the thumb ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `AltDateWidget`'s Now and Clear buttons staying enabled when the field is disabled ([#5545](https://github.com/rjsf-team/react-jsonschema-form/pull/5545), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `UpDownWidget` showing a stored `0` as empty, and showing the old number again after the form clears or resets it ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- Fix `UpDownWidget` reporting a change, which ran `onChange` and live validation, when it loses focus or takes Enter without being edited ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- Fix `UpDownWidget` clamping a number past ±`Number.MAX_SAFE_INTEGER` to that bound on blur, which reported a change nobody made ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- Change the theme to declare where its widgets draw their own label, `labelPlacement: 'above'` for every widget and selector and `'beside'` for the checkbox, so a custom `ArrayFieldItemTemplate` gets `displayLabel: true` for an item whose widget draws its label above it ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538))
- **BREAKING CHANGE:** Change `AltDateWidget` to hand an unset date part on as `undefined` rather than `''`, as `useAltDateWidgetProps()` now returns it, so a custom `SelectWidget`, `onFocus` and `onBlur` see `undefined`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-hands-an-unset-date-part-on-as-undefined-and-usealtdatewidgetprops-returns-buttonsdisabled-breaking-change) ([#5604](https://github.com/rjsf-team/react-jsonschema-form/pull/5604), [#5378](https://github.com/rjsf-team/react-jsonschema-form/issues/5378))
- Add `chakra` as the theme's `globalUiOptionsKeys`, so a `chakra` in `ui:globalOptions` reaches every widget's `options`, a custom widget's included; the theme's `UiSchema` type types it and takes a `UserExtensions` parameter, and `ChakraGlobalUISchemaOptions` is exported ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- Fix `ObjectFieldTemplate` showing no add button for an object naming no `additionalProperties` in a form whose `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `FieldTemplate` to set its fieldset's `invalid` state from the field's own errors, the `hasErrors` prop, so an `anyOf`/`oneOf` option follows its own `ui:hideError` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Add `aria-invalid` and a description by its row's errors to `WrapIfAdditionalTemplate`'s key input, the free-text one and the `propertyNames` select alike, while the object forbids that key ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add the `keyNotAllowed` prop `FieldTemplate` hands `WrapIfAdditionalTemplate`; a custom `WrapIfAdditionalTemplate` that spreads its leftover props onto an element should leave it out ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change an additional property's key input id to `root_foo__key` from `root_foo-key`, built by the new `additionalKeyId()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- Change `__createChakraFrameProvider` to take `{ children: ReactNode }` rather than `any` and its returned component to take `{ document?: Document }`, and to throw an error saying it must be rendered inside a frame that provides a document rather than failing on `document.head` ([#5410](https://github.com/rjsf-team/react-jsonschema-form/pull/5410))
- Fix `ObjectFieldTemplate` leaving an empty grid cell for a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- **BREAKING CHANGE:** Change `GridTemplate` to read a column's `span` as its `colSpan` unless it has a `colSpan` of its own, logging a warning that its `span` is ignored, and to lay a `ui:row` without `templateColumns`, `templateAreas`, `gridTemplate` or `grid`, as a prop or in its `style` or `css`, out on 12 tracks, each child full width unless it spans fewer, and warn about a column `span` that isn't a whole number. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layout-grid-row-without-a-column-template-lays-out-on-12-tracks-in-chakra-ui-fluentui-rc-and-shadcn-breaking-change) ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `NativeSelectWidget` leaving a select no label names, such as an untitled root or array item select, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ...") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a text input holding `false` to show that value and offer the clear button for it, where it was empty ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change an empty `RangeWidget` to leave its name out of a native form submit, and to commit its minimum when a press or a key leaves the thumb there ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget` writing a number into a string field, which then failed validation: it now writes a numeric string, as core's range input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `BaseInputTemplate` dropping a `pattern`, `inputMode`, `accept` or `multiple` a widget passes it as a prop, so the file input of an array took one file at a time ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `AltDateWidget` to show the default years for a `yearsRange` reaching before 100, such as `[50, 2030]`, where it offered that range and wrote a year before 100 as 19xx. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-uses-the-default-years-for-a-yearsrange-reaching-before-100-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- **BREAKING CHANGE:** Fix a required `anyOf`/`oneOf` field showing no `*` with a `null` or untitled object option selected, or one on the option rather than the field: the selector's label is marked now, and the option's isn't, though its control stays `required`. A custom widget drawing its own label marks it from `templateMarksRequired()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Fix `RangeWidget` reporting no value to the form's `onFocus` and `onBlur` ([#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))
- Fix `CheckboxWidget`'s `aria-describedby` listing its description before the field's help, which `FieldTemplate` draws above the checkbox ([#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to render an object's title, description and contents inside a `div` with `role="group"` carrying the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Change `ArrayFieldTemplate` to give the element around an array's title, description and items `role="group"` and the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix `FieldErrorTemplate` drawing an empty item for an empty error message ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `AddButton` to an icon button titled `Add Item`, without its visible `Add Item` text, and `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/core

- **BREAKING CHANGE:** Change `GridType` and `Operators` from `enum`s to `as const` objects with same-named union types, exported from the package root now that deep imports are removed; values and `GridType.ROW` access are unchanged, but a member used as a type must be written `typeof GridType.ROW`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#gridtype-operators-and-translatablestring-are-as-const-objects-breaking-change) ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5599](https://github.com/rjsf-team/react-jsonschema-form/issues/5599))
- **BREAKING CHANGE:** Change `withTheme()` to return a plain function component instead of a `forwardRef`-wrapped one. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-breaking-change) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260), [#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266))
- **BREAKING CHANGE:** Change `FormProps['onSubmit']`'s event type to `SubmitEvent<HTMLFormElement>` instead of `FormEvent<any>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#formpropsonsubmit-event-type-breaking-change) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260), [#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266))
- **BREAKING CHANGE:** Remove the deprecated `Form` methods `getUsedFormData()`, `getFieldNames()` and `omitExtraData()` (use `SchemaUtils.omitExtraData()`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-deprecated-apis-breaking-change) ([#5262](https://github.com/rjsf-team/react-jsonschema-form/pull/5262))
- **BREAKING CHANGE:** Remove the deprecated `removeEmptyOptionalObjects` prop. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-deprecated-apis-breaking-change) ([#5262](https://github.com/rjsf-team/react-jsonschema-form/pull/5262))
- **BREAKING CHANGE:** Remove boolean `liveValidate`/`liveOmit` values (use `'onChange'`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-deprecated-apis-breaking-change) ([#5262](https://github.com/rjsf-team/react-jsonschema-form/pull/5262))
- **BREAKING CHANGE:** Remove the deprecated `ui:rootFieldId` directive (use `idPrefix`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-deprecated-apis-breaking-change) ([#5262](https://github.com/rjsf-team/react-jsonschema-form/pull/5262))
- **BREAKING CHANGE:** Change the `extraErrorsBlockSubmit` prop to `extraErrorsAreWarnings`: `extraErrors` now block submission unless `extraErrorsAreWarnings` is `true`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#extraerrors-now-blocks-submission-by-default-breaking-change) ([#5268](https://github.com/rjsf-team/react-jsonschema-form/pull/5268), [#4964](https://github.com/rjsf-team/react-jsonschema-form/issues/4964))
- Fix a `customError` a field or widget raises through `onChange` being dropped on submit; it now blocks submission like schema errors do ([#5268](https://github.com/rjsf-team/react-jsonschema-form/pull/5268), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438))
- **BREAKING CHANGE:** Remove the private `_internalFormWrapper` prop from `FormProps` and `ThemeProps`; use `tagName` to render another element in place of `<form>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#_internalformwrapper-removed-breaking-change) ([#5271](https://github.com/rjsf-team/react-jsonschema-form/pull/5271))
- **BREAKING CHANGE:** Remove the `experimental_` prefix from `FormProps`: `experimental_defaultFormStateBehavior` is now `defaultFormStateBehavior` and `experimental_customMergeAllOf` is now `customMergeAllOf`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-the-experimental_experimental_-prefix-breaking-change) ([#5267](https://github.com/rjsf-team/react-jsonschema-form/pull/5267))
- **BREAKING CHANGE:** Change `getTestRegistry()` to be exported from the `@rjsf/core/testing` entry point, the only one that needs `@rjsf/validator-ajv8`, now an optional peer dependency. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#gettestregistry-moved-to-rjsfcoretesting-breaking-change) ([#5272](https://github.com/rjsf-team/react-jsonschema-form/pull/5272))
- **BREAKING CHANGE:** Change `TimeWidget` and `DateTimeWidget` to write a `format: "time"`/`"date-time"` value with seconds and the browser's UTC offset (`14:30:00-04:00`, not `14:30`), as RFC 3339 requires; `iso-time`/`iso-date-time` get seconds but no offset. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#timedate-time-formats-now-require-a-timezone-offset-breaking-change) ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- **BREAKING CHANGE:** Remove `getDefaultRegistry()`; use the new `generateTheme()`, `generateFields()`, `generateWidgets()`, `generateTemplates()` or `generateButtonTemplates()`, or import one of the newly exported components directly. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getdefaultregistry-removed-breaking-change) ([#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266))
- **BREAKING CHANGE:** Change the `Form.getRegistry()` static to a `buildRegistry()` export from `@rjsf/core` taking the same arguments. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#formgetregistry-is-now-the-buildregistry-export-breaking-change) ([#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266))
- **BREAKING CHANGE:** Change the `data` parameter of the `onBlur` and `onFocus` props from `any` to `unknown`, so a handler that types it (e.g. `value: string`) needs a type guard. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#generic-defaults-are-unknown-instead-of-any-breaking-change) ([#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266))
- **BREAKING CHANGE:** Change markdown to opt-in: `Form` renders plain text unless you register `templates.MarkdownTemplate` from `@rjsf/core/markdown`, and `markdown-to-jsx` is now an optional peer. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#markdown-is-an-opt-in-template) ([#5263](https://github.com/rjsf-team/react-jsonschema-form/pull/5263))
- **BREAKING CHANGE:** Change markdown rendering to no longer parse raw HTML. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#markdown-is-an-opt-in-template) ([#5263](https://github.com/rjsf-team/react-jsonschema-form/pull/5263))
- **BREAKING CHANGE:** Change `FileWidget`'s file information to follow `ui:enableMarkdownInDescription`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#markdown-is-an-opt-in-template) ([#5263](https://github.com/rjsf-team/react-jsonschema-form/pull/5263))
- **BREAKING CHANGE:** Remove `RichDescription.TEST_IDS` and `RichHelp.TEST_IDS`; use `MarkdownTemplate.TEST_IDS.markdown` from `@rjsf/core/markdown`. Add `MarkdownTemplate` to `@rjsf/core`'s component exports. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#markdown-is-an-opt-in-template) ([#5263](https://github.com/rjsf-team/react-jsonschema-form/pull/5263))
- Fix `ui:placeholder` being ignored on multi-select arrays, file arrays, custom array widgets and boolean fields ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Fix a `ui:FieldTemplate` or `ui:FieldErrorTemplate` override being ignored on a `LayoutMultiSchemaField` ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Fix `FileWidget` wiping the selection when a picker re-fires `change` with an empty file list after its dialog is cancelled; `useFileWidgetProps` now reads an empty selection as a cleared value ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- **BREAKING CHANGE:** Change fields, widgets and templates to identify a field by a `fieldPath` string (`friends[0].firstName`) and an `id` instead of `fieldPathId`, which `FieldProps['onChange']`, `childFieldPathId` and `IChangeEvent` drop. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#field-identity-is-a-fieldpath-string-instead-of-a-fieldpathid-object-breaking-change) ([#5280](https://github.com/rjsf-team/react-jsonschema-form/pull/5280), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- **BREAKING CHANGE:** Change `IChangeEvent` to a standalone interface with every member `readonly` and `formData` typed `EventFormData<T>`; copy the event's `formData` into your own state instead of assigning into the event. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ichangeevent-members-are-read-only-breaking-change) ([#5298](https://github.com/rjsf-team/react-jsonschema-form/pull/5298), [#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Change `Form` to apply `ui:emptyValue` and `ui:initialValue` to its defaults, a new array row, an added property and the properties an item of an array's `default` leaves out included, and to enforce `ui:required: true` wherever the field renders, on submit and in live validation alike, with precompiled validators too, counting `[]` on a group of checkboxes as no answer and reading the `anyOf`/`oneOf` option shown and any option inside it, whose `ui:required` defaults to the field's, and to mark a checkbox it asks of, with `aria-required`, while it holds no value ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5870](https://github.com/rjsf-team/react-jsonschema-form/pull/5870), [#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5918](https://github.com/rjsf-team/react-jsonschema-form/pull/5918), [#5894](https://github.com/rjsf-team/react-jsonschema-form/issues/5894))
- Change `SchemaField` and `LayoutGridField` to take a field's required state from its own `ui:required`, not `ui:globalOptions` or a grid cell's config ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983))
- Add a one-time warning when a falsy `ui:required`, such as `false` or `null`, makes a schema-required field optional without `ui:initialValue` or `ui:emptyValue` ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983))
- Add `CoreUiOptionsChecks`, describing `@rjsf/core`'s built-in widgets, fields and `ui:options`, to pass as `StrictUiSchema`'s `Checks` type argument ([#5275](https://github.com/rjsf-team/react-jsonschema-form/pull/5275), [#5372](https://github.com/rjsf-team/react-jsonschema-form/pull/5372), [#4916](https://github.com/rjsf-team/react-jsonschema-form/issues/4916), [#5726](https://github.com/rjsf-team/react-jsonschema-form/pull/5726), [#5610](https://github.com/rjsf-team/react-jsonschema-form/issues/5610), [#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- **BREAKING CHANGE:** Remove the `experimental_componentUpdateStrategy` prop: `Form` and `SchemaField` compare props shallowly, so function props such as `customValidate`, templates and `formContext` must be stable references. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#shallow-comparison-replaces-experimental_componentupdatestrategy-breaking-change) ([#5297](https://github.com/rjsf-team/react-jsonschema-form/pull/5297), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- **BREAKING CHANGE:** Change the `formData` passed to `onChange` and the other callbacks to share unchanged subtrees with the previous value, the `formData` you passed included; treat it as immutable. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#shallow-comparison-replaces-experimental_componentupdatestrategy-breaking-change) ([#5297](https://github.com/rjsf-team/react-jsonschema-form/pull/5297), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- Change `Form` and `LayoutGridField` to keep unchanged state and `uiSchema` references, so typing in one field re-renders no sibling ([#5297](https://github.com/rjsf-team/react-jsonschema-form/pull/5297), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- Fix a `oneOf`/`anyOf` of constants with no `type` rendering as an unsupported field; it now renders a select, inferring the `type` from the constants (boolean constants keep `boolean` and default `ui:widget` to `select`) ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- **BREAKING CHANGE:** Fix `BooleanField` ignoring a constant `anyOf` and falling back to plain Yes/No options; a boolean with constant options under both `anyOf` and `oneOf` now shows the `anyOf` titles. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-typeless-oneofanyof-of-constants-now-renders-as-a-select-breaking-change) ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- Fix `BooleanField` labelling every non-`true` constant `No`, so an untitled `oneOf` of `null`, `true` and `false` showed `null` and `false` alike ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- Fix `NumberField` dropping a leading sign while typing, so `-0.5`, `-0`, `+5` and `-.5` are no longer rewritten mid-typing; a lone `-.` now resolves to `-0` ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Change `BaseInputTemplate` to render a `number`/`integer` field as `<input type="text">` with a numeric `inputMode`, `pattern` and `title` instead of `<input type="number">`, without `step`, `min` or `max`; a widget's own `pattern` or `inputMode` still wins ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` to group `SelectWidget` options under `<optgroup>`s; a multiple select still reports its values in enum order ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301), [#1813](https://github.com/rjsf-team/react-jsonschema-form/issues/1813), [#580](https://github.com/rjsf-team/react-jsonschema-form/issues/580))
- Add a dropdown for an `additionalProperties`/`patternProperties` key when `propertyNames` enumerates the allowed names, leaving out names already used; the add button takes the first free name, preferring one a field can be rendered for and the schema doesn't forbid, and hides once all are taken. `WrapIfAdditionalTemplate` gets a `propertyNamesEnum` prop ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Add a `keyName` prop to `FieldTemplate`, from which `WrapIfAdditionalTemplate` now reads an additional property's key instead of the `label` ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix `MultiSchemaField`'s option selector and `ArrayField`'s multi-select and file widgets showing their error state under `ui:hideError`; `ArrayField` and `ObjectField` now also pass `hideError` to their templates ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Fix `LayoutMultiSchemaField` passing its `FieldTemplate` neither `rawErrors` nor `hideError`, so a layout grid field's label and control now get error styling and a custom `FieldTemplate` can tell errors are hidden. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- Add `errorSchema` to `FieldTemplateProps`, holding all the field's errors even under `ui:hideError`, so a template that renders errors itself can reach them ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- Fix a custom `ArrayFieldTemplate` receiving no `errorSchema` for an ordinary (non-tuple) array ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- Fix a schema allowing several types (`type: ['string', 'number']`), or an unconstrained `additionalProperties` entry, being stuck on one type: with `useFallbackUiForUnsupportedType` on, `SchemaField` renders `FallbackField`, whose type selector offers the allowed types ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Change `FallbackField`'s type selector to offer `integer` and `null` and start on the current data's type ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Change `FallbackField` to convert the value on a type switch without inventing data: a value with no reading in the new type clears instead of becoming `0` or `[object Object]`, a `boolean` array item or `additionalProperties` entry becomes `false`, and old errors clear ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5804](https://github.com/rjsf-team/react-jsonschema-form/pull/5804), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Fix `FallbackField`'s value field dropping the schema's other keywords (`properties`, `items`, `format`, `minimum`…) and crashing on a `ui:widget` the chosen type has no widget for ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Fix `FallbackField` rendering its label or help twice and marking its type selector required ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Fix `FallbackField` falling out of step with the allowed types or outside data, and its value field losing focus on each change ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Fix a schema pairing several types with an `anyOf`/`oneOf` keeping the options on the first type: `FallbackField` now renders the option selector within the type selector, dropping it when `null` is chosen; a list with an option naming its own `type` has that type selector only within options naming none ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5724](https://github.com/rjsf-team/react-jsonschema-form/pull/5724), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238), [#5390](https://github.com/rjsf-team/react-jsonschema-form/issues/5390))
- Fix the fallback UI renaming an untitled multi-type property `Value`, and an `object` or `boolean` union losing its `title` and `description` ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323))
- Change `FallbackField` to let a `ui:widget` given as a component render a multi-type union itself, as a `ui:field` does, instead of wrapping it in a type selector ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323))
- Fix `FallbackField`'s type selector leaving the type it is on when the user clears an `additionalProperties` entry or array item, clears it to its `ui:emptyValue`, or picks a type that clears it ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5804](https://github.com/rjsf-team/react-jsonschema-form/pull/5804), [#5784](https://github.com/rjsf-team/react-jsonschema-form/issues/5784))
- Change `FallbackField` to build its schemas and `uiSchema` only when `useFallbackUiForUnsupportedType` is on ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323))
- Fix a multi-type union with an `anyOf`/`oneOf` that renders as optional data controls showing its label before it has data, unlike the same `anyOf` without the union ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323))
- Fix the fallback UI's type selector showing a `Type` label when `ui:options.label` is `false` ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323))
- Change a `ui:widget` given as a component to render within the type selector for a schema with no type of its own (an unrecognized `type` or an unconstrained `additionalProperties` entry), rather than replacing it as for a union ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323))
- **BREAKING CHANGE:** Change clearing a custom error a field raised through `onChange(value, path, errorSchema)` to also remove it from the `ErrorListTemplate`, where it stayed until the next validation. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#clearing-a-custom-error-now-also-clears-it-from-the-error-list-breaking-change) ([#5312](https://github.com/rjsf-team/react-jsonschema-form/pull/5312))
- **BREAKING CHANGE:** Change `noValidate` to also turn off `liveValidate='onBlur'`, which used to validate and show errors regardless. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#novalidate-now-turns-off-live-validation-on-blur-breaking-change) ([#5312](https://github.com/rjsf-team/react-jsonschema-form/pull/5312))
- Remove `Form`'s internal `getStateFromProps()` method, which was never part of `FormRef` ([#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438))
- Fix `extraErrors` and a field's custom errors being added to the error list again on every change that raises a custom error while validation errors show ([#5312](https://github.com/rjsf-team/react-jsonschema-form/pull/5312), [#5041](https://github.com/rjsf-team/react-jsonschema-form/issues/5041))
- Fix a later `extraErrors` change bringing back the previous schema's validation errors after the `schema` changed or `noValidate` was set ([#5312](https://github.com/rjsf-team/react-jsonschema-form/pull/5312))
- Fix live validation of data replaced from outside, or re-run for a changed validation callback, showing different errors than typing the same value would ([#5312](https://github.com/rjsf-team/react-jsonschema-form/pull/5312), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `FormRef.validate()` to take only the form data, and drop `FormRef`'s `S` and `F` type parameters; to validate against another schema, call `schemaUtils.getValidator().validateFormData()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#formrefvalidate-takes-only-the-data-breaking-change) ([#5312](https://github.com/rjsf-team/react-jsonschema-form/pull/5312), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438))
- Fix the `ErrorList` and the `onChange` payload keeping an error the changed field no longer showed when new props were applied without live validation ([#5341](https://github.com/rjsf-team/react-jsonschema-form/pull/5341))
- Fix an `ErrorSchema` a field raises through `onChange` being lost on a path with a validator error: it replaces the validator's errors below that path, `{}` clears them, and it is not listed twice with `extraErrors` ([#5341](https://github.com/rjsf-team/react-jsonschema-form/pull/5341), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix `ArrayField` adding, copying, moving or removing an item dropping the array's own errors, such as `minItems` ([#5341](https://github.com/rjsf-team/react-jsonschema-form/pull/5341))
- Fix an additional property added from outside the form after mount not rendering ([#5339](https://github.com/rjsf-team/react-jsonschema-form/pull/5339))
- Fix a field edit being dropped when the form data root is `null` or `undefined`; it now creates the object or array the field lives in ([#5339](https://github.com/rjsf-team/react-jsonschema-form/pull/5339))
- **BREAKING CHANGE:** Remove `edit` from `IChangeEvent`; it only restated whether you passed `formData` or `initialFormData`, so check your own props. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ichangeevent-members-are-read-only-breaking-change) ([#5339](https://github.com/rjsf-team/react-jsonschema-form/pull/5339))
- Fix a throwing `customValidate`, `onChange`, `onSubmit` or `onError` taking the form down: the error comes out of the `FormRef` call or event that caused it, or is reported as uncaught for a field's change, blur or focus ([#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438))
- **BREAKING CHANGE:** Change the `T` generic's default to `unknown` and `F`'s to `FormContextType`: a handler with no type argument gets `unknown` form data, so pass a type to `Form` or `IChangeEvent`, or pass `formData` for `Form` to infer it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#generic-defaults-are-unknown-instead-of-any-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438))
- **BREAKING CHANGE:** Change `withTheme()` to return the new `ThemedForm<T, S, F>` type, a component generic over its form data like `Form`, instead of `ComponentType<FormProps<T, S, F>>`; statics such as `displayName` leave the returned type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- **BREAKING CHANGE:** Change `IChangeEvent.formData` to a required member typed `EventFormData<T>`, which `FormRef.getFormData()` also returns: `T` for an object or array root, `T | undefined` for a scalar. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#generic-defaults-are-unknown-instead-of-any-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `withTheme()` to use only the theme's `fields`, `widgets` and `templates`, ignoring other props such as `noHtml5Validate`; pass those to the themed `Form`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Change `FormRef.setFieldValue()` to take the field's value as `unknown` instead of `T`, so a typed form's ref can set a field ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438))
- Change `SchemaField` and `MultiSchemaField` to log each uiSchema misconfiguration warning once per page instead of on every render, naming the field by its id and `fieldPath` ([#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Fix a `FieldTemplate` that checks `rawHelp` dropping a `ui:help` given as a React element; `SchemaField` now passes it as `rawHelp` ([#5351](https://github.com/rjsf-team/react-jsonschema-form/pull/5351), [#5326](https://github.com/rjsf-team/react-jsonschema-form/issues/5326))
- Fix a `ui:help` on a layout grid's discriminated `oneOf`/`anyOf` cell not rendering in any theme ([#5351](https://github.com/rjsf-team/react-jsonschema-form/pull/5351), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5326](https://github.com/rjsf-team/react-jsonschema-form/issues/5326))
- Change `ObjectField` and `ArrayField` to share one frozen empty `uiSchema` when none is passed, so a custom `ObjectFieldTemplate` or `ArrayFieldTemplate` writing to it now throws a `TypeError` ([#5366](https://github.com/rjsf-team/react-jsonschema-form/pull/5366))
- Fix a re-render that only rebuilt `validator` or `customMergeAllOf` resetting data the user cleared or switched to its default; a real `validator` change now needs a new `key` ([#5376](https://github.com/rjsf-team/react-jsonschema-form/pull/5376), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556), [#5294](https://github.com/rjsf-team/react-jsonschema-form/issues/5294))
- Fix `liveValidate: 'onBlur'` showing errors before any blur when the form data was replaced from outside, and merging every `extraErrors` entry in twice there ([#5376](https://github.com/rjsf-team/react-jsonschema-form/pull/5376))
- Fix live validation dropping every `extraErrors` entry when the form data was replaced from outside ([#5376](https://github.com/rjsf-team/react-jsonschema-form/pull/5376), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix `extraErrors` and `customErrors` being duplicated when a re-render under `liveValidate: 'onChange'` changed only props such as `className` ([#5376](https://github.com/rjsf-team/react-jsonschema-form/pull/5376), [#4408](https://github.com/rjsf-team/react-jsonschema-form/issues/4408))
- Fix live validation running against the old schema after `validator`, `customMergeAllOf` or `defaultFormStateBehavior` changed ([#5376](https://github.com/rjsf-team/react-jsonschema-form/pull/5376))
- Change `ObjectField` to pass the object's own errors to `ObjectFieldTemplate` as `rawErrors`, as `ArrayField` does ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Change `SchemaField` to stop passing a field's own errors as `rawErrors` to the field beside a `oneOf`/`anyOf` selector, which shows them, while an `ArrayField` there still keeps them as it changes items; `MultiSchemaField` passes the field's `id` to `MultiSchemaFieldTemplate` ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- **BREAKING CHANGE:** Change a schema with both `anyOf` and `oneOf` to render from its `anyOf`, and a select over object or array constants to render through `StringField`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-typeless-oneofanyof-of-constants-now-renders-as-a-select-breaking-change) ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309), [#5317](https://github.com/rjsf-team/react-jsonschema-form/issues/5317))
- Fix `OptionalDataControlsField`'s Add button storing `{}` instead of `[]` for an `anyOf`/`oneOf` whose options are all arrays ([#5361](https://github.com/rjsf-team/react-jsonschema-form/pull/5361), [#5316](https://github.com/rjsf-team/react-jsonschema-form/issues/5316))
- Fix a `$id` naming `FallbackField` replacing a non-select `anyOf`/`oneOf` with an unsupported-field box while `useFallbackUiForUnsupportedType` is off; the option selector renders instead ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix `ui:fieldReplacesAnyOrOneOf` hiding the `anyOf`/`oneOf` options for a `ui:field` that resolves to `FallbackField` or to no registered field, where an object union rendered nothing ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix a `ui:field` resolving to `FallbackField` exhausting the browser's memory; it renders one type selector over one value field ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix the fallback UI's type selector offering all seven types for a schema whose `type`, `enum` or `const` narrows them ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Change the fallback UI to render a schema allowing a single type as the plain field for that type, without a type selector or the `FallbackFieldTemplate` wrapper's blank row ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix a `ui:field` or `$id` naming `FallbackField` wrapping a typeless non-select `anyOf`/`oneOf` in a selector of all seven types, where switching type changed nothing on screen but cast the value away ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix a schema that only implies its type, such as `properties` with no `type`, reached through a `ui:field` or `$id` naming `FallbackField`, rendering a selector of all seven types or nothing instead of its properties; `getSchemaOwnTypes()` now agrees with `getSchemaType()` ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix a `ui:field` that replaces the `anyOf`/`oneOf` options being rendered again inside each option that has no uiSchema of its own ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix a schema whose only allowed type is `null`, such as `['foo', 'null']` beside an `anyOf`, rendering neither its options nor a field for them with the fallback UI on ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix `realValue` options with the same `String()`, such as `1` and `'1'`, sharing a DOM value, and the examples `<datalist>` rendering duplicate keys, suggesting `null`, object or array values, or rendering when empty ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- **BREAKING CHANGE:** Change `BooleanField` to label boolean `enum` values `ui:enumNames` doesn't name Yes/No, and apply `ui:enumNames` only to `enum` values. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-boolean-enum-labels-its-values-yesno-breaking-change) ([#5364](https://github.com/rjsf-team/react-jsonschema-form/pull/5364), [#5636](https://github.com/rjsf-team/react-jsonschema-form/pull/5636), [#5727](https://github.com/rjsf-team/react-jsonschema-form/pull/5727), [#5319](https://github.com/rjsf-team/react-jsonschema-form/issues/5319))
- Change `BooleanField` to apply `ui:enumOrder` to its Yes/No options ([#5364](https://github.com/rjsf-team/react-jsonschema-form/pull/5364), [#5636](https://github.com/rjsf-team/react-jsonschema-form/pull/5636), [#5319](https://github.com/rjsf-team/react-jsonschema-form/issues/5319))
- Change `BooleanField` to keep a constant option's empty `title` ([#5364](https://github.com/rjsf-team/react-jsonschema-form/pull/5364), [#5636](https://github.com/rjsf-team/react-jsonschema-form/pull/5636), [#5319](https://github.com/rjsf-team/react-jsonschema-form/issues/5319))
- Fix the `formData` handed to `customValidate` ignoring the form's `customMergeAllOf` and `defaultFormStateBehavior` when computing defaults ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- **BREAKING CHANGE:** Fix a layout grid's discriminated `oneOf`/`anyOf` cell missing its `FieldTemplate` props: it gets the `rjsf-field*` and `ui:classNames` classes and `ui:style`, which its selector no longer gets, honors `ui:widget: 'hidden'` and renders its description. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-discriminated-cell-of-a-layout-grid-renders-through-schemafield-breaking-change) ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- Add `getFieldClassNames()` and `omitConsumedStyling()`, which `SchemaField` uses for its `FieldTemplate`'s classes and styling, so a custom field rendering its own `FieldTemplate` can match the `rjsf-field*` contract ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- **BREAKING CHANGE:** Change a layout grid's discriminated `oneOf`/`anyOf` cell to honor `ui:disabled`, in both directions, and a `deprecated` schema like any other field, through the new `getDeprecatedHandling()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-discriminated-cell-of-a-layout-grid-renders-through-schemafield-breaking-change) ([#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- Fix `IconButton` putting a React element `icon` into a `glyphicon-[object Object]` class name instead of rendering it ([#5382](https://github.com/rjsf-team/react-jsonschema-form/pull/5382))
- Fix a new `additionalProperties` entry with an `integer` or nullable `type` list (`['number', 'null']`…) defaulting to the string `New Value` instead of `0` or `false` ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379), [#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428))
- Change `RichDescription` and `RichHelp` to pass a frozen empty `uiSchema` to `MarkdownTemplate` when none is passed, so a custom `MarkdownTemplate` writing to it now throws a `TypeError` ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379))
- Fix a non-boolean falsy `ui:label`, such as `0` or `null`, not hiding an object field's title and description or the fallback UI's type selector label ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379))
- Fix a precompiled form throwing in `MultiSchemaField` when `transformChange` refuses or rewrites an option switch, and read a `then` beside the kept option as adding to it rather than overriding its keywords. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validators-are-handed-pointers-into-the-root-schema-breaking-change) ([#5371](https://github.com/rjsf-team/react-jsonschema-form/pull/5371), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556), [#5338](https://github.com/rjsf-team/react-jsonschema-form/issues/5338), [#5373](https://github.com/rjsf-team/react-jsonschema-form/issues/5373))
- Fix a `ui:field` or `LayoutGridField` cell `render` given as a `memo()`, `forwardRef()` or `lazy()` component not rendering. One that isn't a usable component now logs a warning, once per uiSchema entry however many items or extra keys it reaches, and its field renders as if no `ui:field` were given; `null` or `false` still opts the field out ([#5433](https://github.com/rjsf-team/react-jsonschema-form/pull/5433), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5823](https://github.com/rjsf-team/react-jsonschema-form/pull/5823), [#5363](https://github.com/rjsf-team/react-jsonschema-form/issues/5363), [#5658](https://github.com/rjsf-team/react-jsonschema-form/issues/5658))
- Fix a `type` list of three or more entries starting with `null`, such as `['null', 'string', 'number']`, rendering `NullField`: it renders the field of its first non-null type, or of another listed type when only that one has the field's widget, such as `StringField` for a `textarea` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Change the type selector of `useFallbackUiForUnsupportedType` to start a `type` list holding no value on the type its `ui:widget` renders, and a value of an unlisted type on a type whose field can show it, and fix a global `widget` the selected type lacks throwing `No widget` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Fix a fixed-items `ArrayField` throwing `Cannot read properties of null` for a `null` held by a `type` list such as `['null', 'array']` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Fix adding a property to an `ObjectField` holding a string, as a `type` list such as `['null', 'object', 'string']` allows, spreading the string's characters into the new object ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Change a new `additionalProperties` entry under an `enum` or a constant `anyOf`/`oneOf` to start on the first option not in `ui:enumDisabled` unless its type's default is such an option, so `enum: ['a', 'b']` starts at `'a'` rather than `New Value` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Fix checking an option of a multi-select `ArrayField` holding `null`, as a `type` list such as `['null', 'array']` allows, writing the `null` into the array beside the checked option ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Fix `ObjectField` seeding a new property with `null`, which only a `null` field can render: it now seeds from the subschema that renders it (a matching `patternProperties`, `additionalProperties` or `unevaluatedProperties`), honoring its `const`, `default` and type ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Change `ObjectField` to seed `null` for a name an `unevaluatedProperties: false` or a matching `false` `patternProperties` subschema forbids, as it did for `additionalProperties: false` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- **BREAKING CHANGE:** Change `ObjectField` to seed a new property from an `additionalProperties` with a `$ref` beside other keywords by layering those keywords over the referenced schema rather than discarding them, so `{ type: 'string', $ref: '#/definitions/aNumber' }` seeds a string. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#keywords-beside-a-ref-breaking-change) ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `ObjectField` not rendering the data's extra keys, nor offering the add button, for an object whose only keyword describing them is `unevaluatedProperties` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `ObjectField` leaving `New Value` in a field that can't show it when a new, unedited property is renamed onto a name another subschema describes, such as a numeric pattern ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `ObjectField` settling an `if` inside a new property's subschema against an empty object rather than the `default` the property is about to hold ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `FallbackField` silencing an `unevaluatedProperties: false` on a union-typed object and offering an add button for keys the schema forbids ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- **BREAKING CHANGE:** Change `Form` to a function component: type its ref as `FormRef<T>` and read data through its methods or the event rather than `state`, `setState()` or `formElement`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#reading-form-internals-through-a-ref) ([#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `Form` to apply each edit as it is made: `onChange` now runs before the inputs show the value, and a later edit in the same event builds on the one before. This also undoes some of 6.11.1's change handling. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#form-owns-its-data-breaking-change) ([#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556), [#5750](https://github.com/rjsf-team/react-jsonschema-form/pull/5750), [#5748](https://github.com/rjsf-team/react-jsonschema-form/issues/5748))
- **BREAKING CHANGE:** Change the `react` peer dependency floor from `>=19` to `>=19.2`, the release that added `<Activity>`, whose hidden content `Form` treats as unmounted. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#react-version) ([#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix a `dependencies` or `if`/`then`/`else` swap keeping the old branch's `default` for an object- or array-typed property: the new subschema's `default` now replaces a value still equal to the old one, while an edited value is kept ([#5464](https://github.com/rjsf-team/react-jsonschema-form/pull/5464), [#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5349](https://github.com/rjsf-team/react-jsonschema-form/issues/5349))
- Fix `setFieldValue('', data)` on a form that isn't live-validated keeping the errors of a replaced root string, number or array or a root that changed type, and a root object's own errors, such as `minProperties`, staying after a property changes ([#5469](https://github.com/rjsf-team/react-jsonschema-form/pull/5469), [#5034](https://github.com/rjsf-team/react-jsonschema-form/issues/5034))
- **BREAKING CHANGE:** Change an error a field raises through `onChange` to be kept apart from the validator's errors, so it survives a parent passing `formData` back and the next validation, and an empty raise clears it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-error-a-field-raises-is-kept-apart-from-the-validators-breaking-change) ([#5470](https://github.com/rjsf-team/react-jsonschema-form/pull/5470), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556), [#5347](https://github.com/rjsf-team/react-jsonschema-form/issues/5347), [#5348](https://github.com/rjsf-team/react-jsonschema-form/issues/5348))
- **BREAKING CHANGE:** Change the `errorSchema` a field passes to `onChange` to hold only the errors it raises, so one matching an `extraErrors` message survives clearing `extraErrors`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-errorschema-passed-to-onchange-holds-only-the-fields-own-errors-breaking-change) ([#5471](https://github.com/rjsf-team/react-jsonschema-form/pull/5471), [#5348](https://github.com/rjsf-team/react-jsonschema-form/issues/5348))
- Fix a field's raised errors staying behind when `ArrayField` items move, optional data or an additional property is removed or renamed, or an option switches, so a stale raise no longer blocks submit ([#5471](https://github.com/rjsf-team/react-jsonschema-form/pull/5471), [#5348](https://github.com/rjsf-team/react-jsonschema-form/issues/5348))
- Fix a field's raised error not showing at once under `noValidate` ([#5471](https://github.com/rjsf-team/react-jsonschema-form/pull/5471), [#5348](https://github.com/rjsf-team/react-jsonschema-form/issues/5348))
- Fix `Form` listing an `extraErrors` message twice, in the `ErrorList`, on its field and in the `errors` passed to `onError` and `onChange`, when the validator reports the same message at the same path ([#5443](https://github.com/rjsf-team/react-jsonschema-form/pull/5443), [#5442](https://github.com/rjsf-team/react-jsonschema-form/issues/5442))
- Fix `DateTimeWidget` showing `0` as empty, `true` as a 1970 date, and crashing on a value `Date` can't convert; an invalid date, text that isn't a date or a year before 1 now gives an empty input ([#5473](https://github.com/rjsf-team/react-jsonschema-form/pull/5473), [#5431](https://github.com/rjsf-team/react-jsonschema-form/issues/5431))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each select is named by the field's label and part, such as `When, year`, and described by its description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Fix `SelectWidget` not passing its `aria-label` and `aria-describedby` to its `<select>` ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Fix `AnyOfField` committing an option that no longer describes changed data for a render, and a `ui:title` of `null` hiding the schema `title` of a field or option label; `AnyOfField`, `LayoutMultiSchemaField` and `FallbackField` no longer opt out of the React Compiler ([#5482](https://github.com/rjsf-team/react-jsonschema-form/pull/5482))
- Change `SchemaField` to memoize the retrieved `anyOf`/`oneOf` options and `uiOptions`, so a re-render changing neither schema nor data no longer makes `AnyOfField` and `OneOfField` retrieve every option again ([#5482](https://github.com/rjsf-team/react-jsonschema-form/pull/5482))
- **BREAKING CHANGE:** Change `AnyOfField` and `OneOfField` to render the `options` they are handed as they are, since `SchemaField` now retrieves each option once; a custom field rendering them with raw option schemas has to retrieve each first. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#anyoffield-and-oneoffield-take-their-options-already-retrieved-breaking-change) ([#5482](https://github.com/rjsf-team/react-jsonschema-form/pull/5482))
- Fix `Form` clearing array and scalar values a sibling edit didn't affect, matching v6, while a conditional that flipped still filters, keeping the [#5250](https://github.com/rjsf-team/react-jsonschema-form/issues/5250) fix ([#5460](https://github.com/rjsf-team/react-jsonschema-form/pull/5460), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556), [#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5451](https://github.com/rjsf-team/react-jsonschema-form/issues/5451))
- Add the `itemLabel` array option, naming the item property, or `'.'` for strings and numbers, that titles each item's move, copy and remove buttons, such as `Remove report.pdf`; `ArrayFieldItemButtonsTemplate` receives the titles as `itemButtonProps` ([#5474](https://github.com/rjsf-team/react-jsonschema-form/pull/5474), [#4424](https://github.com/rjsf-team/react-jsonschema-form/issues/4424))
- Fix `DateTimeWidget` wiping a value whose local year has five or six digits, such as the epoch `1e15`, on edit; a year past 9999 now stays on screen and fails `date-time` format validation, following up [#5473](https://github.com/rjsf-team/react-jsonschema-form/pull/5473) ([#5510](https://github.com/rjsf-team/react-jsonschema-form/pull/5510))
- **BREAKING CHANGE:** Change a non-object field's selected `anyOf`/`oneOf` option, and one of another type than `object` under a `type` list naming `object`, to render with every keyword of the field that describes its value, not only `required` and `type`, such as `items` or `format`, while the field keeps its `title`, `description` and `default`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-non-object-fields-anyofoneof-option-renders-with-its-parents-keywords-breaking-change) ([#5484](https://github.com/rjsf-team/react-jsonschema-form/pull/5484), [#5821](https://github.com/rjsf-team/react-jsonschema-form/pull/5821), [#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359), [#5725](https://github.com/rjsf-team/react-jsonschema-form/issues/5725))
- Change `Form` to memoize its submit button, and `Label` and `SchemaExamples` to be memoized, so a keystroke no longer re-renders the `SubmitButton` template, the field label or a field's `<datalist>` of suggestions ([#5508](https://github.com/rjsf-team/react-jsonschema-form/pull/5508))
- **BREAKING CHANGE:** Change `SchemaExamples` to a `memo` component: calling it as a function, as in `{SchemaExamples({ id, schema })}`, still type-checks but throws `SchemaExamples is not a function`, so render it as an element. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#schemaexamples-is-a-memo-component-breaking-change) ([#5508](https://github.com/rjsf-team/react-jsonschema-form/pull/5508))
- **BREAKING CHANGE:** Fix the optional data controls rendering for the root field and missing a nested one: a root `anyOf`/`oneOf`'s option is no longer hidden behind an Add button, and a nested object or array a recursive `$ref: '#'` describes now gets the controls. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-root-field-never-renders-the-optional-data-controls-breaking-change) ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5426](https://github.com/rjsf-team/react-jsonschema-form/issues/5426))
- Fix `extraErrors`, raised errors or `customValidate` results holding an array for an array field's items being left out of the error list, `onError` and `focusOnFirstError`, and not blocking submit ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- **BREAKING CHANGE:** Change the `errorSchema` passed to `onChange`, `onSubmit` and templates to key an array field's item errors by index, so read it by index rather than as an array. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-array-of-item-errors-is-keyed-by-index-breaking-change) ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- Fix raised errors holding a `__proto__` property, such as a `JSON.parse()`d server response, showing on the parent field and missing from the error list ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553))
- Add the `presentation` prop to `Form` and `ThemeProps`, a `ThemePresentation` declaring which of a field's label, description, errors and help its fields and widgets draw themselves, and the `widget` `BooleanField` renders when `ui:widget` names none; `getTestRegistry()` takes it as a new last argument ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5765](https://github.com/rjsf-team/react-jsonschema-form/pull/5765), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5591](https://github.com/rjsf-team/react-jsonschema-form/issues/5591))
- Change `SchemaField` to pass each field's plan as `presentation` to the `FieldTemplate`, the field and its widget ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a deprecated root field with no title being labelled with the Deprecated marker alone ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change a field's label, description, help and errors to be drawn where its plan says, with the templates and widgets taking their `aria-*` from `getControlAttributes()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option drawing a second label, or losing its errors under a `null` option: the field's own template labels it and shows its errors whatever option is selected ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5358](https://github.com/rjsf-team/react-jsonschema-form/issues/5358), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change a custom field named by `$id`, and `NullField`, to draw their own label, and a widget a custom field hands its props to to draw none of the label, description and errors that field draws itself. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739), [#5765](https://github.com/rjsf-team/react-jsonschema-form/pull/5765), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5591](https://github.com/rjsf-team/react-jsonschema-form/issues/5591))
- **BREAKING CHANGE:** Remove `optionRendersFieldLabel()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the `anyOf`/`oneOf` option selector being described by ids that don't exist: it is named by the field's label and described by the field's description, help and errors, and a `ui:label: false` from above hides it ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's own `ui:help` repeating the field's `helpId()`: `FieldHelpTemplate` gets the plan and renders it under `optionHelpId()`; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix an object with no properties beside its `anyOf`/`oneOf` options repeating the field's label as a heading where the option selector already names the field ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the fallback UI's value field hiding the description of an `anyOf`/`oneOf` option it renders: it keeps its `ui:label` under its field's plan ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change a layout grid's discriminated `oneOf`/`anyOf` cell's selector to be labelled through `aria-labelledby` ([#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change a layout grid's discriminated `oneOf`/`anyOf` cell whose union declares `type: 'object'` to draw its label, which `ui:label: false` hides. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-discriminated-cell-of-a-layout-grid-renders-through-schemafield-breaking-change) ([#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a deprecated array's `anyOf`/`oneOf` option that repeats the field's title drawing a second, unmarked heading: an option titled as its field takes the field's label, Deprecated marker included ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the option selector repeating the label, heading, description or errors of a field rendered beside its `anyOf`/`oneOf` options, such as a custom `ui:field` or an object with properties ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the option selector of an object with properties beside its `anyOf`/`oneOf` options having no name: it is named by the object's heading through `aria-labelledby` and described by what describes the object ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a required checkbox, or a `uncheckedIsFalse` widget, carrying the native `required` attribute and a `*`, so the browser blocked submitting it unchecked: both are now set only where the schema demands `true` or the widget renders a type other than `boolean`, custom checkbox widgets included ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the option selector beside a custom `ui:field`, and the option below it, being described by ids of parts the custom field may not render ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the selected option's description colliding with the field's: `SelectWidget` passes `SelectedOptionDescription` its `hideLabel` and plan, so it renders under its own id, which `aria-describedby` lists after the field's description and before its help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix an optional `anyOf`/`oneOf` array option losing its Remove button where a field above draws its heading; `ArrayFieldTemplate` gets as `title` exactly the heading `ArrayField` draws, and `ArrayFieldTitleTemplate` draws any `title` it is handed, even under `ui:label: false` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` dropping an optional object's Add or Remove button where it draws no heading, as under `ui:label: false` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change an `anyOf`/`oneOf` option with no title to take its field's label rather than the property name, so `tags: { title: 'Tags', anyOf: [...] }` is headed "Tags", not "tags", and a `ui:title` names both the selector and the input where the theme's selector draws the label ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `RadioWidget` to mark its `radiogroup` `aria-invalid` rather than each radio, while `CheckboxesWidget` keeps it on each checkbox; both take their group's `role` from `getGroupAttributes()` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change an `anyOf`/`oneOf` field showing an option that renders no single control, such as an object, an array of items, a `null`, an alt-date or options of its own, to name it through `aria-labelledby` rather than the label's `for`, so its `FieldTemplate` label has no `for`: aim a `label[for="root_pet"]` selector at `#root_pet__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5710](https://github.com/rjsf-team/react-jsonschema-form/pull/5710), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5578](https://github.com/rjsf-team/react-jsonschema-form/issues/5578), [#5709](https://github.com/rjsf-team/react-jsonschema-form/issues/5709))
- Fix the description of a custom field given as `ui:field` or `$id` that renders `SchemaField` under its own id being drawn nowhere while its control's `aria-describedby` named it ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` and `FieldTemplate` to put `titleId()` and `fieldLabelId()` on a `<span>` around their text rather than on the `<legend>` or `<label>`, so what they name no longer includes the `*` or the optional data button; target `legend #…__title` and `label #…__label` instead. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` laying out an empty `.form-group` for a selector it isn't given, as while an optional `anyOf`/`oneOf` field has no data ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate` to draw its label with no `for` (see `templateLabelFor()`) where the control is named through `aria-labelledby`, as for `RadioWidget`'s and `CheckboxesWidget`'s group; aim a `label[for=…]` selector at its `fieldLabelId()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `focusOnFirstError` focusing the wrong element: it reaches a slider's thumb or a checkbox rather than a hidden input, focuses nothing for an object's or array's own error, and no longer jumps to a sibling such as `root_nameSuffix` or throws in a DOM without `CSS` ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` ignoring `ui:BaseInputTemplate`, staying draggable when read-only (it is now disabled), and drawing an `allowClearTextInputs` clear button that left the slider at its midpoint ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `RatingWidget` to render its stars as a `radiogroup` carrying the field's id, `aria-invalid` and `aria-required`, named by the field's label through `aria-labelledby`; a custom widget registered as `RatingWidget` should declare `labelledBy: 'for'` or `label: 'self'`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `AltDateWidget` and `AltDateTimeWidget` to wrap their date parts in a `group` carrying the field's id and named through `aria-labelledby`; aim label selectors at `#root_when__label`, and declare a custom widget under those keys `labelledBy: 'for'` or `label: 'self'`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Change `AltDateWidget` and `AltDateTimeWidget` to disable Now and Clear with the field, and to describe each date part by the field's description, help and errors, `aria-invalid` while errors show ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Fix `RadioWidget` and `CheckboxesWidget` under `ui:autofocus` focusing an option `ui:enumDisabled` disables, or an unchecked radio: they focus the checked radio, else the first option a user can choose ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RatingWidget` ignoring `ui:autofocus`: it focuses the checked star, else the first, and a disabled or read-only rating takes none ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `Form` to own its data, as an uncontrolled `<input>` does: `initialFormData` (or `formData`) seeds it on mount and on `reset()`, and a later change to `formData` is ignored with a development warning; remount under a `key` or call `setFieldValue('', data)` instead. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#form-owns-its-data-breaking-change) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `Form` to apply and show an edit before calling `onChange`, so an `onChange` that doesn't store it no longer refuses it; refuse or rewrite edits in `transformChange`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#refuse-or-rewrite-an-edit-in-transformchange) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Add the `transformChange(next, previous)` prop, a pure function deciding what a field's change or `setFieldValue()` leaves the form with: return `next` to take the edit, `previous` or a copy of it to refuse it (a copy takes an edit that changed nothing), or another value to rewrite it, which is sanitized as the edit would be; a refused option switch keeps the option shown, and a refused array reorder keeps each row with its value ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `onChange` to be called for edits only, not on mount, after a `schema`, `ui:emptyValue` or `defaultFormStateBehavior` change, or by `NullField`; defaults fill a missing `type: 'null'` value as `null`. Read the defaults through `getFormData()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#defaults-are-filled-in-without-onchange) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Change `reset()` to keep `extraErrors`, which 6.x cleared until the prop next changed, while clearing every other error; it still reports the reset through `onChange` ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change a form hidden by `<Activity>` to act as unmounted: until shown it drops field changes, blur, focus, `setFieldValue()`, `reset()` and `submit()`, and `validateForm()` skips `onError`; an unmounted form drops the same, with a development warning for the commands. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-form-inside-a-hidden-activity) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Change `submit()` to submit the current value and call `onSubmit` or `onError` before it returns, so `setFieldValue(path, value); submit()` submits the new value, checked by schema validation alone ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `ArrayField` and `ObjectField` to act on the form's current value at their `fieldPath`, so a custom field wrapping them has to pass `formData` through unchanged: a sorted or filtered copy makes them act on positions the form doesn't hold. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#custom-fields-that-wrap-arrayfield-or-objectfield) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Remove the `FormState` export, the class component's state type; `IChangeEvent` is the public shape of what reaches the callbacks. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#reading-form-internals-through-a-ref) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Change an edit without live validation to clear the validator's errors of the fields it replaced in every form, not only one passed `formData`, with moved errors following their values ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Change `onChange`'s `formData`, `transformChange`'s arguments and the seed object to be deep-frozen in development, so mutating them throws ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix a command issued from a layout Effect or a removed field's cleanup starting from an earlier commit's props, and an edit a widget makes from a layout Effect as an `<Activity>` shows the form again being dropped ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Deprecate `formData` in favour of `initialFormData`, which it is another name for: the form reads it only on mount and on `reset()`. It still works and wins when both are passed, with a development warning that `initialFormData` is ignored. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#form-owns-its-data-breaking-change) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix `submit()` and `focusOnError()` throwing for a form whose `tagName` renders something other than a `<form>`; `submit()` now submits it by dispatching a submit event to it ([#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266), [#5438](https://github.com/rjsf-team/react-jsonschema-form/pull/5438), [#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix a `transformChange`, `customValidate` or `transformErrors` that throws on a change a widget reports from an Effect unmounting the form: the throw is rethrown from a timer, the change stores nothing and its array or object move is undone ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix an array add, copy, remove or reorder that `transformChange` rewrites, such as with a sort or filter, handing one item's row, and the focus or state it holds, to another item ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix a field the user clears getting its schema `default` back when `transformChange` rewrites the edit, under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'` too ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Fix an `anyOf`/`oneOf` switch losing the chosen option when the defaults it derives, such as a `then`'s, or a `transformChange` rewrite outside the field add to the data; a switch refused or rewritten at the field is still re-matched to the data ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- Add a development warning, once, when a custom field renders `ArrayField` or `ObjectField` with other `formData` than the form holds at their `fieldPath`, such as a sorted copy ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change Expand Cycle to reveal one level of a recursive `$ref` per click (through `properties` it revealed two), with `#/definitions/%41` and alias chains stopping one level sooner. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#expand-cycle-reveals-one-level-per-click-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5501](https://github.com/rjsf-team/react-jsonschema-form/issues/5501))
- Fix a recursion through an `allOf`, a `then`, a self-referring `anyOf` option or mutually referring definitions running out of memory or overflowing the stack; array rows render all their data and an added row gets the first row's defaults ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5501](https://github.com/rjsf-team/react-jsonschema-form/issues/5501))
- **BREAKING CHANGE:** Change the `anyOf`/`oneOf` option a field shows to be form state: it survives remounts, follows array moves and property renames, and no longer switches while you type inside it; a custom `AnyOfField` or `OneOfField` has to use the new `useOptionSelection()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#option-selection-and-cycle-expansion-are-form-state) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- **BREAKING CHANGE:** Change cycle expansion to be form state: a custom `CyclicSchemaField` keeps it in the form, rendered from `expandRefCycle()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#option-selection-and-cycle-expansion-are-form-state) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- **BREAKING CHANGE:** Fix an object's extra keys rendering as a second, guessed field or twice when its `anyOf`/`oneOf` options render beside it: they are stubbed once with the selected option's `additionalProperties`, `unevaluatedProperties` and `patternProperties`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-extra-keys-are-stubbed-once-with-the-selected-option-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5461](https://github.com/rjsf-team/react-jsonschema-form/issues/5461), [#5462](https://github.com/rjsf-team/react-jsonschema-form/issues/5462))
- **BREAKING CHANGE:** Change `ObjectField` to render the schema `SchemaField` hands it, so a custom field passing another has to retrieve it first. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-extra-keys-are-stubbed-once-with-the-selected-option-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5461](https://github.com/rjsf-team/react-jsonschema-form/issues/5461), [#5462](https://github.com/rjsf-team/react-jsonschema-form/issues/5462))
- Fix switching from a `null` or empty option, or from a field holding `''`, to an object option dropping the field's own `default`, and a change holding only `undefined` values being read as such a switch ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5735](https://github.com/rjsf-team/react-jsonschema-form/pull/5735), [#5368](https://github.com/rjsf-team/react-jsonschema-form/issues/5368), [#5623](https://github.com/rjsf-team/react-jsonschema-form/issues/5623))
- **BREAKING CHANGE:** Change `Form` to sanitize its data by comparing the fields before and after a change: a field that left loses its value unless an unconstrained extra key still renders it, one whose constraints changed is judged again, an object the defaults fill key by key is judged a key at a time (and an array holding an object an item at a time, unless it holds the very `default` its old schema declares, one still holding its old filled `default` whole following the new one's rows), a value the old `default` was filled out from, to `minItems` or through a `ui:initialValue` below the field, an array item holding its array's old `default` at its index, a multi-select's aside (one a remove or move carried reads both `default`s at the index it held, so the move alone changes none), and a `readOnly` value whose `default` is replaced by another take the new `default`, each `default` read as the value the defaults fill the field with, and the rest keep theirs, so a branch swapped inside the selected option replaces the old default, and an array's items are judged by the schema their position declares; switching an `anyOf`/`oneOf` option judges each key the data held the same way, against the old option and the whole form's defaults, which can reopen saved data on the old option, and switching to an option declaring no `properties` keeps the object's own fields rather than clearing the object; changing `defaultFormStateBehavior` alone judges every field again, so a value its old settings' default filled in takes the new settings' default. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#sanitize-is-a-diff-of-the-field-trees-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5779](https://github.com/rjsf-team/react-jsonschema-form/pull/5779), [#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5806](https://github.com/rjsf-team/react-jsonschema-form/pull/5806), [#5814](https://github.com/rjsf-team/react-jsonschema-form/pull/5814), [#5820](https://github.com/rjsf-team/react-jsonschema-form/pull/5820), [#5827](https://github.com/rjsf-team/react-jsonschema-form/pull/5827), [#5837](https://github.com/rjsf-team/react-jsonschema-form/pull/5837), [#5917](https://github.com/rjsf-team/react-jsonschema-form/pull/5917), [#5465](https://github.com/rjsf-team/react-jsonschema-form/issues/5465), [#5778](https://github.com/rjsf-team/react-jsonschema-form/issues/5778), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786), [#5782](https://github.com/rjsf-team/react-jsonschema-form/issues/5782), [#5812](https://github.com/rjsf-team/react-jsonschema-form/issues/5812), [#5815](https://github.com/rjsf-team/react-jsonschema-form/issues/5815), [#5817](https://github.com/rjsf-team/react-jsonschema-form/issues/5817), [#5818](https://github.com/rjsf-team/react-jsonschema-form/issues/5818), [#5824](https://github.com/rjsf-team/react-jsonschema-form/issues/5824), [#5825](https://github.com/rjsf-team/react-jsonschema-form/issues/5825), [#5826](https://github.com/rjsf-team/react-jsonschema-form/issues/5826), [#5839](https://github.com/rjsf-team/react-jsonschema-form/issues/5839), [#5819](https://github.com/rjsf-team/react-jsonschema-form/issues/5819))
- Change `ui:required` and omitting extra data (`omitExtraData`, `liveOmit`) to read the `anyOf`/`oneOf` option a field shows rather than the best-matching one, and below a `$ref` cycle only once expanded, so `liveOmit: 'onChange'` no longer switches a field and drops its data, and a field keeps its option for the data omitting leaves on a blur or a submit ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5781](https://github.com/rjsf-team/react-jsonschema-form/pull/5781))
- **BREAKING CHANGE:** Change a field named by the schema's `$id` to render as one named by `ui:field` does, beside the `anyOf`/`oneOf` option selector or in place of the options under `ui:fieldReplacesAnyOrOneOf`, and stop the selected option rendering the named field a second time. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-field-is-named-once-per-data-path-breaking-change) ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5391](https://github.com/rjsf-team/react-jsonschema-form/issues/5391), [#5358](https://github.com/rjsf-team/react-jsonschema-form/issues/5358))
- **BREAKING CHANGE:** Change a field named by `ui:field` or `$id` to apply once per data path: a `SchemaField` it renders for its own data, and the selected option, render the default field, so wrapping `registry.fields.SchemaField` no longer runs out of memory or draws its parts twice. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-field-is-named-once-per-data-path-breaking-change) ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5377](https://github.com/rjsf-team/react-jsonschema-form/issues/5377), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a field registered under a schema's `$id` that is not a component, such as `<MyField />`, crashing the whole form; it is now ignored with a warning and the field for the schema's type renders ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5439](https://github.com/rjsf-team/react-jsonschema-form/issues/5439))
- Change `ArrayFieldItemTemplate`'s `displayLabel` to say whether a label is drawn above the item's control, so the item's buttons are placed the same whichever of `ui:field` or `$id` names its field, and stop handing a field's components and templates an ignored `ui:field` ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5734](https://github.com/rjsf-team/react-jsonschema-form/pull/5734), [#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739), [#5581](https://github.com/rjsf-team/react-jsonschema-form/issues/5581))
- Add a one-time warning when an `anyOf`/`oneOf` option's own `ui:field`, from `uiSchema.anyOf`/`uiSchema.oneOf` or its `ui:definitions` entry, is ignored below a field named for the same data path ([#5486](https://github.com/rjsf-team/react-jsonschema-form/pull/5486), [#5358](https://github.com/rjsf-team/react-jsonschema-form/issues/5358))
- **BREAKING CHANGE:** Change a custom field rendering `FallbackField` without its `presentation`, under `useFallbackUiForUnsupportedType`, to have the value field draw the label and description, where it ran out of stack or labelled the value twice or as `Value`; a field drawing its own now draws them twice. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-custom-field-rendering-fallbackfield-without-a-plan-has-the-value-field-draw-its-label-breaking-change) ([#5588](https://github.com/rjsf-team/react-jsonschema-form/pull/5588), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5389](https://github.com/rjsf-team/react-jsonschema-form/issues/5389))
- Fix keys named like `Object.prototype` members: errors under a `__proto__` property were dropped, a `ui:emptyValue` under a `__proto__` key didn't apply, renaming an additional property lost a sibling `__proto__` or the value of one renamed to it, and a `ui:layoutGrid` leaf found the inherited function ([#5564](https://github.com/rjsf-team/react-jsonschema-form/pull/5564), [#5561](https://github.com/rjsf-team/react-jsonschema-form/issues/5561))
- Fix a `ui:layoutGrid` path that indexes a tuple past its `items` finding no schema, or the last item's, rather than the tuple's `additionalItems` schema that `ArrayField` renders ([#5564](https://github.com/rjsf-team/react-jsonschema-form/pull/5564))
- **BREAKING CHANGE:** Change `ui:globalOptions` to hold only the `GlobalUISchemaOptionsKeys` RJSF reads and the keys declared in the new `globalUiOptionsKeys` prop, so a global `field`, `widget`, `title` or other field option applies to no field. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uiglobaloptions-hold-only-the-options-rjsf-reads-there-breaking-change) ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419), [#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527))
- Change every field's widget, `StringField`'s and `NumberField`'s included, to get the `ui:globalOptions` beneath its own options, and a `LayoutGridField` cell's own options to beat them ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419), [#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527))
- Fix `AnyOfField` and `OneOfField` ignoring a field's own `ui:MultiSchemaFieldTemplate`, and hand their option selector's widget the field's `uiSchema` ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- **BREAKING CHANGE:** Change `LayoutGridField` to render a discriminated `oneOf`/`anyOf` cell through `SchemaField`, honoring `ui:required`, `ui:readonly`, `ui:autofocus` and `ui:definitions` and no longer throwing with no option selected, and `LayoutMultiSchemaField` to render only the selector. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-discriminated-cell-of-a-layout-grid-renders-through-schemafield-breaking-change) ([#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419))
- Fix a layout grid handing its cells an array item's title, an autofocus or an additional property's key handlers, and labelling every cell by its name once the grid's `additionalProperties` key was renamed: a cell is labelled by its own title, else its name, only a cell's own `ui:autofocus` focuses it, and a cell named by an additional key draws no key input or remove button ([#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419))
- Change a cleared layout grid cell to be stored as `''` or its `ui:emptyValue`, a discriminated one as `''`, which fails validation until an option is picked ([#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5735](https://github.com/rjsf-team/react-jsonschema-form/pull/5735), [#5419](https://github.com/rjsf-team/react-jsonschema-form/issues/5419), [#5623](https://github.com/rjsf-team/react-jsonschema-form/issues/5623))
- Fix switching `anyOf`/`oneOf` options on an object that takes extra keys leaving the old option's keys in the data as `undefined`, rendered as empty additional-property rows and counted against `maxProperties` and `propertyNames` ([#5618](https://github.com/rjsf-team/react-jsonschema-form/pull/5618))
- Fix `Form` computing an `anyOf`/`oneOf` field's defaults from the option its data matches best rather than the one shown, which after a switch could fill a key the shown option declares with `null` ([#5618](https://github.com/rjsf-team/react-jsonschema-form/pull/5618))
- Fix `customValidate` being handed an earlier `anyOf`/`oneOf` option's defaults after a switch, rather than the shown option's ([#5618](https://github.com/rjsf-team/react-jsonschema-form/pull/5618), [#5781](https://github.com/rjsf-team/react-jsonschema-form/pull/5781), [#5629](https://github.com/rjsf-team/react-jsonschema-form/issues/5629))
- Fix `Form` computing a root `anyOf`/`oneOf` field's defaults from the best-matching option rather than the one shown after a switch at the root, which filled a key the new option declares with `null` ([#5618](https://github.com/rjsf-team/react-jsonschema-form/pull/5618))
- Fix `liveOmit` and live validation keeping a root `anyOf`/`oneOf` field's earlier option for data `setFieldValue()` sets, which pruned keys the shown option declares and handed `customValidate` the earlier option's defaults ([#5618](https://github.com/rjsf-team/react-jsonschema-form/pull/5618))
- Add the `additionalPropertiesWhenAbsent` prop, `'forbid'` by default; under `'allow'` an object naming neither `additionalProperties` nor `unevaluatedProperties` gets an add button, renders its extra keys and keeps them under `omitExtraData` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `ObjectFieldTemplate`'s add button, `ObjectField`'s add and `SchemaField`'s layout of an `anyOf`/`oneOf` union to follow `additionalPropertiesWhenAbsent`, reading the object joined with the shown option ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `SchemaField` to render an object `anyOf`/`oneOf` union with no `properties` of its own with its own heading beside the option while, joined with the shown option, it holds an extra key or offers its add button, and as a pure union otherwise ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix every theme's `ObjectFieldTemplate` but core's drawing an empty frame beside the options of a pure `anyOf`/`oneOf` union; `SchemaField` no longer renders an `ObjectField` there ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix an object `anyOf`/`oneOf` whose selected option offers options of its own rendering each extra key twice with two add buttons, not at all, or a declared property again as an extra key; each now renders once, with one add button ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change the option field that takes an object's extra keys to follow the object's `maxProperties`, `propertyNames`, `expandable` option and `uiSchema.additionalProperties` entry ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix `omitExtraData`/`liveOmit` disagreeing with the form about an object's `anyOf`/`oneOf` option, keeping an extra key the shown option forbids, which failed the submit with nothing on screen, and dropping a property the shown option renders ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- **BREAKING CHANGE:** Change `BooleanField` to order its constant `anyOf`/`oneOf` options by `ui:enumOrder`, dropping a value the order doesn't list unless it has `'*'`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uienumorder-orders-constant-anyofoneof-options-breaking-change) ([#5636](https://github.com/rjsf-team/react-jsonschema-form/pull/5636), [#4298](https://github.com/rjsf-team/react-jsonschema-form/issues/4298))
- Change `SchemaField` to hand `FieldTemplate` and `WrapIfAdditionalTemplate` the field's `hasErrors`, so an `anyOf`/`oneOf` option's wrapper follows its own `ui:hideError` for `has-error` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Fix an `anyOf`/`oneOf` option that shows its errors while the field above hides them marking its control invalid with no message; it now draws them through its `FieldTemplate` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- **BREAKING CHANGE:** Change a field a `ui:field` component renders for its own data to take its errors from the field naming it, so where it shows errors that field hides, it draws them and is `aria-invalid` rather than styled in error with no message. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Change `ObjectField` and `ArrayField` to hand their template the container's `hasErrors`, so an `anyOf`/`oneOf` option's container follows its own `ui:hideError` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Change a field a `ui:field` component renders for its own data to hand the selected `anyOf`/`oneOf` option it renders the errors from the field naming it, so the option follows its own `ui:hideError` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- **BREAKING CHANGE:** Change `ObjectField` to say on an additional property's row that its key is not allowed whenever `additionalProperties`, `unevaluatedProperties` or `patternProperties` forbid it, without waiting for validation, and `SchemaField` to hand the row's templates the new `keyNotAllowed` prop. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-forbidden-extra-key-says-so-on-its-row-breaking-change) ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Change `WrapIfAdditionalTemplate` to mark a forbidden additional property's key input, free-text or `propertyNames` select, `aria-invalid` and describe it by the row's errors, through `getAdditionalKeyAttributes()` ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Change `SchemaField`, `CyclicSchemaField` and the `anyOf`/`oneOf` field to warn about an invalid template override, naming the uiSchema entry it sits in, such as `the uiSchema.anyOf[1].b entry of "root"` below an option's own entry, or the `ui:definitions` entry holding it, such as `the ui:definitions['#/$defs/Foo'] entry of "root"`, and render the registry's template instead ([#5526](https://github.com/rjsf-team/react-jsonschema-form/pull/5526), [#5823](https://github.com/rjsf-team/react-jsonschema-form/pull/5823), [#5432](https://github.com/rjsf-team/react-jsonschema-form/issues/5432), [#5658](https://github.com/rjsf-team/react-jsonschema-form/issues/5658), [#5871](https://github.com/rjsf-team/react-jsonschema-form/pull/5871), [#5829](https://github.com/rjsf-team/react-jsonschema-form/issues/5829))
- Fix `BaseInputTemplate` spreading the widget's `label` onto the `<input>` as a `label` attribute ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5587](https://github.com/rjsf-team/react-jsonschema-form/issues/5587))
- **BREAKING CHANGE:** Change `ArrayField` to hand each item's field component the item's own errors as `rawErrors` rather than the array's, so a custom `ArraySchemaField` drawing `rawErrors` draws the item's errors, and one also handing its `errorSchema` to a `SchemaField` draws them twice. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-custom-arrayschemafield-is-handed-each-items-own-errors-as-rawerrors-breaking-change) ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5594](https://github.com/rjsf-team/react-jsonschema-form/issues/5594))
- Change `NullField` and the unsupported-field box to draw their title inside an unstyled `<fieldset>` named through `aria-labelledby`, so the group is named in every theme and a `<legend>` title no longer sits outside a `<fieldset>` ([#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5562](https://github.com/rjsf-team/react-jsonschema-form/issues/5562))
- **BREAKING CHANGE:** Change ids so a nested `anyOf`/`oneOf` selector gets its own (`root_pet__anyof_select2`), a key input is `root_foo__key` and the component beside options `root_pet__XxxOf`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626), [#5574](https://github.com/rjsf-team/react-jsonschema-form/issues/5574))
- Fix `focusOnFirstError` missing a field whose name holds whitespace and focusing a sibling such as `root_when_year` ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626), [#5574](https://github.com/rjsf-team/react-jsonschema-form/issues/5574))
- Fix adding an additional property whose schema offers `anyOf`/`oneOf` options seeding `'New Value'` or another value its option doesn't allow; it is seeded as its first option would be, at any depth, following a `$ref` or `allOf` and `ui:enumDisabled` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330), [#5441](https://github.com/rjsf-team/react-jsonschema-form/issues/5441))
- **BREAKING CHANGE:** Change `onSubmit` to accept a returned promise: while it is pending the form ignores another submit and gives the submit button `pending` and `aria-disabled`, `FormRef.reset()` ends it, and `onSubmit` returns `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-promise-onsubmit-returns-makes-the-form-pending-breaking-change) ([#5649](https://github.com/rjsf-team/react-jsonschema-form/pull/5649))
- **BREAKING CHANGE:** Change `@rjsf/core` to need `react-dom` `>=19.2` as a peer dependency. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#react-dom-is-a-peer-dependency-of-rjsfcore-breaking-change) ([#5649](https://github.com/rjsf-team/react-jsonschema-form/pull/5649))
- **BREAKING CHANGE:** Change an optional object or array whose `anyOf`/`oneOf` options name no type to render behind the Optional Data Controls' Add button when `enableOptionalDataFieldForType` names its type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-anyofoneof-option-naming-no-type-takes-its-fields-type-for-the-optional-data-controls-breaking-change) ([#5657](https://github.com/rjsf-team/react-jsonschema-form/pull/5657), [#5360](https://github.com/rjsf-team/react-jsonschema-form/issues/5360))
- **BREAKING CHANGE:** Add `dirty`, `dirtyFields` and `submitCount` to `IChangeEvent` and the new `FormRef.getStatus()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ichangeevent-has-required-dirty-dirtyfields-touched-touchedfields-and-submitcount-and-formref-a-required-getstatus-breaking-change) ([#5653](https://github.com/rjsf-team/react-jsonschema-form/pull/5653), [#504](https://github.com/rjsf-team/react-jsonschema-form/issues/504), [#4098](https://github.com/rjsf-team/react-jsonschema-form/issues/4098), [#4411](https://github.com/rjsf-team/react-jsonschema-form/issues/4411))
- **BREAKING CHANGE:** Change `FormRef.reset(saved)` to set the seed and baseline the form is clean against, so `reset` passed straight as an event handler now seeds the form with the event. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#formrefreset-passed-as-an-event-handler-seeds-the-form-with-the-event-breaking-change) ([#5653](https://github.com/rjsf-team/react-jsonschema-form/pull/5653), [#504](https://github.com/rjsf-team/react-jsonschema-form/issues/504), [#4098](https://github.com/rjsf-team/react-jsonschema-form/issues/4098), [#4411](https://github.com/rjsf-team/react-jsonschema-form/issues/4411))
- **BREAKING CHANGE:** Add `touched` and `touchedFields` to `IChangeEvent` and `FormRef.getStatus()`, marking each field whose widget reported a blur. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ichangeevent-has-required-dirty-dirtyfields-touched-touchedfields-and-submitcount-and-formref-a-required-getstatus-breaking-change) ([#5654](https://github.com/rjsf-team/react-jsonschema-form/pull/5654), [#512](https://github.com/rjsf-team/react-jsonschema-form/issues/512), [#4874](https://github.com/rjsf-team/react-jsonschema-form/issues/4874))
- Add the `liveErrors` prop, whose `'field'` shows a live-validated field's errors only once the user changed or blurred it, or after a submit ([#5654](https://github.com/rjsf-team/react-jsonschema-form/pull/5654), [#512](https://github.com/rjsf-team/react-jsonschema-form/issues/512), [#4874](https://github.com/rjsf-team/react-jsonschema-form/issues/4874))
- Add a `classMap` prop to `Form` and `ThemeProps`, one class name per element `@rjsf/core` renders, which replaces that element's class or, given as a function of it, extends it, and `getTestRegistry()` takes one too ([#5634](https://github.com/rjsf-team/react-jsonschema-form/pull/5634), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- **BREAKING CHANGE:** Change `@rjsf/core` to render unstyled markup: no Bootstrap 3 classes, and marker classes prefixed `rjsf-`; `@rjsf/bootstrap3` keeps the Bootstrap 3 markup. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfcore-renders-unstyled-markup-bootstrap-3-moved-to-rjsfbootstrap3-breaking-change) ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- **BREAKING CHANGE:** Change `IconButton` to draw an inline SVG icon in place of a glyphicon. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfcore-renders-unstyled-markup-bootstrap-3-moved-to-rjsfbootstrap3-breaking-change) ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add the optional `@rjsf/core/rjsf.css`, which lays the form out, and `@rjsf/core/rjsf-theme.css`, which gives it a default look ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5673](https://github.com/rjsf-team/react-jsonschema-form/pull/5673), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `data-invalid` to a field's label, description and help while the field shows its own errors, so a theme can style that state ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `data-disabled` to a disabled or read-only checkbox or radio option, so a theme can style it ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `data-display-label` and `data-has-description` to an array item whose field draws a label above its control or has a description, so a theme can line the item's buttons up with its control ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Fix `TitleField` rendering a `<legend>` outside a `<fieldset>`, in a layout grid's header, where it now renders a `<div class="rjsf-title">` ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Fix `ObjectFieldTemplate`'s `hidden` flag for a property `SchemaField` hides through `deprecatedHandling: 'hide'`, a `ui:definitions` hidden widget or a hidden `$ref` cycle ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- **BREAKING CHANGE:** Remove the Expand button `CyclicSchemaField` rendered for a `$ref` cycle whose field one level further renders hidden, which expanded to nothing visible. See [A `$ref` cycle whose field renders hidden has no Expand button](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-ref-cycle-whose-field-renders-hidden-has-no-expand-button-breaking-change) ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- Add `LAYOUT_GRID_OPTION`, `LAYOUT_GRID_UI_OPTION` and the `GridProps`, `GridSchemaType`, `LayoutGridSchemaType` and `LayoutGridFieldProps` types to the package's exports, which only a deep import reached before ([#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5599](https://github.com/rjsf-team/react-jsonschema-form/issues/5599))
- Fix `focusOnFirstError` stopping at an element that ignores `focus()`, such as one CSS hides, an `inert` one or one in a closed `<details>`, instead of moving on to the field's next control ([#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5599](https://github.com/rjsf-team/react-jsonschema-form/issues/5599))
- **BREAKING CHANGE:** Fix the Add button of `enableOptionalDataFieldForType` doing nothing on an optional object whose default is `{}`, such as one with only `additionalProperties`: an object holding `{}` now counts as added. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-empty-object-counts-as-added-data-for-the-optional-data-controls-breaking-change) ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427))
- **BREAKING CHANGE:** Fix an optional object with `anyOf`/`oneOf` options rendering two sets of `enableOptionalDataFieldForType` controls, of which only the object's worked; it now renders one, in its heading, and hides the selected option until Add. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-empty-object-counts-as-added-data-for-the-optional-data-controls-breaking-change) ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427))
- **BREAKING CHANGE:** Change an `anyOf`/`oneOf` switch to leave the new option's optional objects out of the data, behind their Add buttons, rather than writing `{}` for them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-empty-object-counts-as-added-data-for-the-optional-data-controls-breaking-change) ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427))
- Fix an object `ui:required` makes required, while `enableOptionalDataFieldForType` names `object`, leaving the `null`s of its `type: 'null'` properties out of the form's defaults, so an empty form failed the `ui:required` check on submit ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672))
- **BREAKING CHANGE:** Fix a disabled or read-only array item's move, copy and remove buttons staying enabled. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-disabled-or-read-only-array-item-disables-its-own-buttons-breaking-change) ([#5676](https://github.com/rjsf-team/react-jsonschema-form/pull/5676), [#2504](https://github.com/rjsf-team/react-jsonschema-form/issues/2504))
- Fix `ArrayFieldItemTemplate`'s `hasDescription` missing a `ui:description` that a `ui:definitions` entry for the items' `$ref` gives them, so a theme lays out such an item's toolbar and label as one with a description ([#5676](https://github.com/rjsf-team/react-jsonschema-form/pull/5676))
- **BREAKING CHANGE:** Change `ArrayFieldItemTemplate`'s `disabled` and `readonly` to the same values as its buttons, the item's lock as well as the array's. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-disabled-or-read-only-array-item-disables-its-own-buttons-breaking-change) ([#5676](https://github.com/rjsf-team/react-jsonschema-form/pull/5676), [#2504](https://github.com/rjsf-team/react-jsonschema-form/issues/2504))
- Add `FieldLabel`, the label core's `FieldTemplate` draws, to the exports, so a custom template can draw the label core's layout lines up with ([#5673](https://github.com/rjsf-team/react-jsonschema-form/pull/5673), [#5667](https://github.com/rjsf-team/react-jsonschema-form/issues/5667))
- Fix a field whose `anyOf`/`oneOf` is empty rendering an empty select or an option selector with nothing to choose instead of the field for its `type` ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675), [#5365](https://github.com/rjsf-team/react-jsonschema-form/issues/5365))
- Fix a field cleared under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`, a key a custom `ui:field` clears inside the object it writes included, getting its default back on a later change, one made while the form is `disabled` or `readonly` too ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675), [#5810](https://github.com/rjsf-team/react-jsonschema-form/pull/5810), [#5365](https://github.com/rjsf-team/react-jsonschema-form/issues/5365), [#5717](https://github.com/rjsf-team/react-jsonschema-form/issues/5717))
- Fix `AnyOfField` and `OneOfField` throwing when named through `ui:field`: they now read their options, constants included, from the schema ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675))
- Fix an `object` chosen for an empty `anyOf`/`oneOf` in the fallback UI getting no key/value controls ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675), [#5365](https://github.com/rjsf-team/react-jsonschema-form/issues/5365))
- **BREAKING CHANGE:** Change `setFieldValue(path, undefined)` under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'` to fill in the field's `default`, as `setFieldValue('', data)` does, where it left the field empty. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#setfieldvalue-fills-in-the-defaults-of-the-value-it-writes) ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675), [#5810](https://github.com/rjsf-team/react-jsonschema-form/pull/5810))
- **BREAKING CHANGE:** Change a cleared field whose `type`, `const`, `enum` (or the constants of its `anyOf`/`oneOf`), `maxItems` or `default` changes, the default read as the value the defaults fill it with, the defaults its own properties declare included, to take the new field's default, whatever the `mergeDefaultsIntoFormData`, where it stayed empty. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-cleared-field-gives-way-or-stays-as-its-field-does) ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675), [#5820](https://github.com/rjsf-team/react-jsonschema-form/pull/5820), [#5827](https://github.com/rjsf-team/react-jsonschema-form/pull/5827), [#5917](https://github.com/rjsf-team/react-jsonschema-form/pull/5917), [#5815](https://github.com/rjsf-team/react-jsonschema-form/issues/5815), [#5817](https://github.com/rjsf-team/react-jsonschema-form/issues/5817), [#5818](https://github.com/rjsf-team/react-jsonschema-form/issues/5818), [#5825](https://github.com/rjsf-team/react-jsonschema-form/issues/5825), [#5839](https://github.com/rjsf-team/react-jsonschema-form/issues/5839))
- **BREAKING CHANGE:** Change an `anyOf`/`oneOf` field of constants with a `default` to stay cleared under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`, where its default came back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-cleared-field-gives-way-or-stays-as-its-field-does) ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675))
- **BREAKING CHANGE:** Change a `transformChange` that drops a cleared key to lose the clear under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`, so the default comes back, where a missing key counted as cleared. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-cleared-field-gives-way-or-stays-as-its-field-does) ([#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675))
- Add a warning, logged once, when a layout grid's `ui:row` has a `span`, which only a `ui:col` or `ui:columns` reads, or a column's `span` isn't a whole number, which `GridTemplate`'s grid can't lay out; the `ui:row` one names the uiSchema entry it sits in, such as an `anyOf`/`oneOf` option's own entry, so each option entry's mistake warns ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5823](https://github.com/rjsf-team/react-jsonschema-form/pull/5823), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651), [#5658](https://github.com/rjsf-team/react-jsonschema-form/issues/5658))
- **BREAKING CHANGE:** Change `LayoutGridField` to hand every `GridTemplate` a `fieldId`, the id of a column's first field or else of the field whose layout grid it renders, which a custom `GridTemplate` spreading its props onto an element must now leave off it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-custom-gridtemplate-is-handed-a-fieldid-breaking-change) ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a layout grid `ui:row`'s `span` reaching `GridTemplate`, which could put it on the row's element as a `span` attribute ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a `ui:field` wrapping `SchemaField` around an `anyOf`/`oneOf` drawing the field's label twice, the first with a `for` naming no element, and its help twice ([#5710](https://github.com/rjsf-team/react-jsonschema-form/pull/5710), [#5709](https://github.com/rjsf-team/react-jsonschema-form/issues/5709))
- Fix an untitled `anyOf`/`oneOf` field's option selector having no accessible name; it is named as an untitled `SelectWidget` or `RadioWidget` is ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix `SelectWidget` leaving a select no label names, such as an untitled root or array item select, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ...") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix a `ui:widget` on a field with `anyOf`/`oneOf` options throwing `No widget` when its option selector or the option shown has no implementation of it: the widget is now dropped for that control ([#5724](https://github.com/rjsf-team/react-jsonschema-form/pull/5724), [#5390](https://github.com/rjsf-team/react-jsonschema-form/issues/5390))
- Fix a `type` list whose first type is `object` rendering its `properties` beside an `anyOf`/`oneOf` option of another type, where editing one replaced the option's value ([#5724](https://github.com/rjsf-team/react-jsonschema-form/pull/5724), [#5390](https://github.com/rjsf-team/react-jsonschema-form/issues/5390))
- **BREAKING CHANGE:** Change an `anyOf`/`oneOf` option selector to stay a select for a `text`, `updown` or `range` `ui:widget` its options inherit, rather than showing the option index as a number to edit. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-option-selector-stays-a-select-for-a-text-updown-or-range-uiwidget-its-options-inherit-breaking-change) ([#5724](https://github.com/rjsf-team/react-jsonschema-form/pull/5724), [#5390](https://github.com/rjsf-team/react-jsonschema-form/issues/5390))
- Add one-time warnings when `ui:enumNames` is ignored beside constant `anyOf`/`oneOf` options, an `enum` hides their titles, or an `anyOf` hides a titled `oneOf`, naming the option a field sits below, so each option's mistake warns ([#5727](https://github.com/rjsf-team/react-jsonschema-form/pull/5727), [#5823](https://github.com/rjsf-team/react-jsonschema-form/pull/5823), [#5398](https://github.com/rjsf-team/react-jsonschema-form/issues/5398), [#5658](https://github.com/rjsf-team/react-jsonschema-form/issues/5658), [#5871](https://github.com/rjsf-team/react-jsonschema-form/pull/5871), [#5829](https://github.com/rjsf-team/react-jsonschema-form/issues/5829))
- **BREAKING CHANGE:** Change a `type` list resolving to `object` or `array`, such as `['null', 'object', 'string']`, to render the field of another listed type when only that one has the `ui:widget`, instead of ignoring a `textarea` or throwing `No widget`. A value that is an object or array keeps its own field. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-type-list-follows-its-uiwidget-to-the-field-and-class-it-renders-breaking-change) ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446))
- **BREAKING CHANGE:** Change a `type` list's `rjsf-field-<type>` class to name the field rendered, so a `textarea` on a `['null', 'number', 'string']` is `rjsf-field-string`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-type-list-follows-its-uiwidget-to-the-field-and-class-it-renders-breaking-change) ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446))
- Fix a widget registered under a built-in alias, such as `widgets={{ textarea: MyWidget }}`, switching a `type` list to the alias's type, handing it a value and defaults of the wrong type ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446))
- Fix `ui:required` under a `type` list depending on the list's order: a property is now required by the field on screen, which under `useFallbackUiForUnsupportedType` is the one its type selector is on ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5785](https://github.com/rjsf-team/react-jsonschema-form/pull/5785), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446), [#5729](https://github.com/rjsf-team/react-jsonschema-form/issues/5729))
- **BREAKING CHANGE:** Fix `RatingWidget` drawing stars past the schema's `maximum`, or throwing on a negative one: stars now run from `minimum` up to `maximum`, at most as many as the `stars` option, so `maximum: 3` alone draws 0 to 3. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ratingwidget-stars-run-from-minimum-to-maximum-breaking-change) ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix `RatingWidget` posting a rating of `0` as an empty value in a native submit or `new FormData(form)` ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix `RatingWidget` making every star a tab stop with no arrow keys: the group is now one tab stop, on the checked star or the first, the arrow keys move to and check the next or previous star, and Space no longer scrolls the page ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix `RatingWidget` filling its first star for a `null` value, as if it were rated ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix `RatingWidget` not telling assistive technology that a disabled or read-only rating can't be changed ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix an `anyOf`/`oneOf` `null` option of an `additionalProperties` entry being stored as `''`, which blocked submit or reloaded as another option; it is stored as `null` ([#5735](https://github.com/rjsf-team/react-jsonschema-form/pull/5735), [#5623](https://github.com/rjsf-team/react-jsonschema-form/issues/5623))
- **BREAKING CHANGE:** Change an `additionalProperties` entry to show no Optional Data Controls, whose Remove stored `''` and blocked submit. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-additionalproperties-entry-never-renders-the-optional-data-controls-breaking-change) ([#5735](https://github.com/rjsf-team/react-jsonschema-form/pull/5735), [#5623](https://github.com/rjsf-team/react-jsonschema-form/issues/5623))
- Fix an option nested in an option of an `additionalProperties` entry snapping back to the previous choice when switched to ([#5735](https://github.com/rjsf-team/react-jsonschema-form/pull/5735), [#5623](https://github.com/rjsf-team/react-jsonschema-form/issues/5623))
- Fix the fallback UI moving a boolean's label and description across the type selector depending on how `ui:widget` names its checkbox; a boolean widget declared to draw its own label now draws it below the type selector, as the checkbox does ([#5734](https://github.com/rjsf-team/react-jsonschema-form/pull/5734), [#5581](https://github.com/rjsf-team/react-jsonschema-form/issues/5581))
- Fix an `additionalProperties` key renamed onto a declared property reading the key as its label until another key was renamed or the form remounted; it now reads that property's title straight away ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix renaming an `additionalProperties` key remounting the field of the key renamed before it, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix tabbing out of an `additionalProperties` key input after renaming it losing keyboard focus when the rename remounted the field, as one onto a declared property's name does; it moves to that field ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix `onMoveUpItem` and `onMoveDownItem` throwing and leaving the item where it was when a template calls them after the click event has finished dispatching, such as after an `await` ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- Fix `onAddClick` inserting the new item at the start of the array, or at a number's index, when the button it is passed to calls `onClick` with a second argument, such as MUI's `ToggleButton` ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- **BREAKING CHANGE:** Change `onAddClick`, `onAddItem`, `onCopyItem`, `onRemoveItem`, `onMoveUpItem` and `onMoveDownItem` to do nothing where the button can't act, such as on a disabled or read-only array, under `ui:orderable: false` or for the first item up, when a template calls them directly, and `buttonsProps.canAdd` to tell whether `onAddItem` acts. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-array-items-handlers-do-only-what-its-buttons-can-breaking-change) ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- Fix `onAddClick` filling a tuple's missing fixed item with an `additionalItems` value instead of a value of that item's own schema ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- Fix the add button throwing on an array whose `items` is a list holding a boolean, which renders its items with an empty schema ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- **BREAKING CHANGE:** Change Copy to show only from a tuple's last fixed item on, so the fixed items before it lose their toolbar, and `itemLabel` to stop counting those items in its numbers. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#copy-shows-only-from-a-tuples-last-fixed-item-on-breaking-change) ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- **BREAKING CHANGE:** Change the `templates` prop of `Form`, and a theme's `templates` passed to `withTheme()`, to check a declared template against its own props, where it accepted any component, and to type one read back from it as its `SlotComponent`, where it was a `ComponentType<any>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-templates-prop-of-form-and-withtheme-checks-declared-templates-breaking-change) ([#5679](https://github.com/rjsf-team/react-jsonschema-form/pull/5679))
- Change `getTestRegistry()` to take its `templates` as a `PartialTemplatesType`, as the `templates` prop of `Form` does, so a `ButtonTemplates` in them may leave buttons out ([#5679](https://github.com/rjsf-team/react-jsonschema-form/pull/5679))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RatingWidget` for a rating stored as a numeric string, which now marks its star checked, focuses it and is written back as a string ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a number field's text input holding `false`, and a textarea holding `0` or `false`, to show that value, where they were empty, and a text input holding `false` to offer the clear button for it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change `RangeWidget`'s readout beside the slider to show a boolean value as `true` or `false`, where it showed nothing, and to separate an array's items with commas ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix the submit button crashing when a JSON uiSchema sets `ui:submitButtonOptions.props` to `null`, or to anything else that isn't an object ([#5683](https://github.com/rjsf-team/react-jsonschema-form/pull/5683))
- Change `NumberField` to stop taking a string `value` prop, such as `'3.'`, as the pending text of a custom field that renders it ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` replacing an `accept` a widget passes it as a prop with `ui:options.accept` ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root, and the key input enabled in a disabled or read-only form, where editing it renamed the key ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `BaseInputTemplate` to put a `multiple` it is passed on a file input only, as `ArrayField` passes one to the widget of every multi-select, so an `email` input no longer takes several addresses. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#baseinputtemplate-puts-multiple-only-on-a-file-input-breaking-change) ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Add `CoreBaseInputTemplateProps`, the props core's `BaseInputTemplate` takes with the `<input>` attributes it forwards, to type the registry's `BaseInputTemplate` a widget passes them to ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `RatingWidget` showing no stars for a `stars` option that isn't a number, which now shows the default 5 stars, and for a schema `maximum` that isn't a number, which now uses `stars` ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Change `FileWidget` to leave out of `accept` whatever in the `accept` option isn't a string or is blank, where it stringified anything truthy, so `true` gave `accept="true"` and `' '` gave `accept=" "` ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `AltDateWidget` to show the default years for a `yearsRange` reaching before 100, such as `[50, 2030]`, where it offered that range and wrote a year before 100 as 19xx. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-uses-the-default-years-for-a-yearsrange-reaching-before-100-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Fix `TimeWidget` hiding a value's zero seconds for a numeric-string `multipleOf` below 60, such as `'30'`, which a numeric one keeps ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` and `SchemaField` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button, labelled by its `title` rather than its key. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Fix a `LayoutGridField` cell or `ui:condition` crashing the form on a value the types don't allow, such as a `null`, `''`, `undefined`, `false` or number cell, or a `field` that isn't a string or number ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Change the values of the exported `GridProps` and of an object `LayoutGridSchemaType` from `any` to `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Change a `LayoutGridField` with no `ui:layoutGrid` object, such as one missing or misspelled, a cell that names no field and whose `render` doesn't resolve, such as `{ name: '' }`, and a `ui:condition` with no `field` to render nothing and log a warning, where they rendered every field of the schema again, or a `none` condition's children. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layoutgridfield-with-no-layout-or-a-cell-or-condition-naming-no-field-renders-nothing-breaking-change) ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Change `ui:options.field` and `ui:options.fieldReplacesAnyOrOneOf`, which the docs exclude from `ui:options`, to be ignored with a console warning, so use `ui:field` and `ui:fieldReplacesAnyOrOneOf`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uioptions-ignores-field-and-the-other-keys-it-doesnt-take-breaking-change) ([#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739))
- **BREAKING CHANGE:** Fix a required `anyOf`/`oneOf` field showing two `*`s with a titled object or array option selected: only the field's label is marked now, so `ObjectFieldTemplate`'s and `ArrayFieldTemplate`'s `required` says whether their heading is marked. The field follows the option shown: an option that accepts what it holds left alone, such as a checkbox with no `const: true`, shows no `*`, and an option's own `ui:required` shows one. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Fix a `LayoutGridField` cell beside a `oneOf`/`anyOf`, or in options with no discriminator, rendering nothing, a cell in an option missing its required marker or `readOnly`, and a cell in options with no discriminator switching option as the user edits it ([#5746](https://github.com/rjsf-team/react-jsonschema-form/pull/5746), [#5783](https://github.com/rjsf-team/react-jsonschema-form/pull/5783), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392), [#5747](https://github.com/rjsf-team/react-jsonschema-form/issues/5747))
- **BREAKING CHANGE:** Change a `LayoutGridField` cell naming a property declared both beside `anyOf`/`oneOf` and in an option to read it from beside them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-property-declared-beside-anyofoneof-and-in-an-option-is-read-from-beside-them-breaking-change) ([#5746](https://github.com/rjsf-team/react-jsonschema-form/pull/5746), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- **BREAKING CHANGE:** Change a `LayoutGridField` `{ name, render }` cell whose name is a property beside `anyOf`/`oneOf`, or of options with no discriminator, to render the field rather than `render`, as a cell naming a plain property does, unless the options render beside the grid. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layoutgridfield-cell-naming-a-property-beside-anyofoneof-or-of-options-with-no-discriminator-renders-the-field-breaking-change) ([#5746](https://github.com/rjsf-team/react-jsonschema-form/pull/5746), [#5783](https://github.com/rjsf-team/react-jsonschema-form/pull/5783), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392), [#5747](https://github.com/rjsf-team/react-jsonschema-form/issues/5747))
- **BREAKING CHANGE:** Change a `LayoutGridField` cell that names a nested field, such as `person.pick`, to hand its field, widget and templates the property name `pick` as `name`, so a cell with no title is labelled `pick`, as outside a grid, and an array item cell such as `list.0` is labelled `list-0`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layout-grid-cell-is-named-by-its-property-name-not-its-dotted-path-breaking-change) ([#5751](https://github.com/rjsf-team/react-jsonschema-form/pull/5751), [#5605](https://github.com/rjsf-team/react-jsonschema-form/issues/5605))
- Add a `checkbox` `ui:widget` for a string with a string `const`, which sets the field to the `const` when checked and clears it when unchecked, or writes `ui:emptyValue` where one is set, where it threw `No widget 'checkbox' for type 'string'`, and make `CheckboxWidget` named by its key, or another widget declared `uncheckedIsFalse` such as `@rjsf/daisyui`'s `toggle`, write the `const` rather than `true`/`false` ([#5753](https://github.com/rjsf-team/react-jsonschema-form/pull/5753), [#3882](https://github.com/rjsf-team/react-jsonschema-form/issues/3882))
- Fix `MultiSchemaField` removing an empty object the user added with the Optional Data Controls' Add button when switching `anyOf`/`oneOf` options, in an array item after one the switch dropped, including when it also cut the array to its `maxItems` ([#5754](https://github.com/rjsf-team/react-jsonschema-form/pull/5754), [#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773), [#5768](https://github.com/rjsf-team/react-jsonschema-form/issues/5768))
- Fix `MultiSchemaField` adding `{}` for an optional object the data didn't hold, or held as `null`, when switching `anyOf`/`oneOf` options, which failed validation where the object requires properties, and showing a cleared nested key only the old option declared as an empty extra-key row ([#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773), [#5768](https://github.com/rjsf-team/react-jsonschema-form/issues/5768))
- **BREAKING CHANGE:** Change a `LayoutGridField` cell naming a property of discriminated `anyOf`/`oneOf` options that render beside the grid to render nothing, or its `render`, rather than a second input with the same id. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layoutgridfield-cell-naming-a-property-of-discriminated-options-beside-the-grid-renders-nothing-breaking-change) ([#5783](https://github.com/rjsf-team/react-jsonschema-form/pull/5783), [#5747](https://github.com/rjsf-team/react-jsonschema-form/issues/5747))
- Fix `MultiSchemaField` leaving a nested property empty when switching `anyOf`/`oneOf` options to one whose `const`, `enum` or read-only `default` rejects its value, or that constrains a property the user cleared differently, rather than filling it with the new option's default, which failed validation where the property is required ([#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777))
- Change `MultiSchemaField` to keep a field the user cleared empty when switching `anyOf`/`oneOf` options to one that constrains it the same way, where an `enum` with a `default` or a single value filled it back in ([#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777))
- Add `renderedAs` to each of `ObjectField`'s template `properties`, returning the field, widget and type the property renders with, and export `createSchemaFieldRenderedAs()`, which a custom field building its own `properties` sets it with ([#5791](https://github.com/rjsf-team/react-jsonschema-form/pull/5791), [#5516](https://github.com/rjsf-team/react-jsonschema-form/issues/5516))
- Fix the fallback UI labelling an object's or an array's `<fieldset>` with a `label[for]`, drawing the description above the type selector and titling the value "Value" when the field's `type` list doesn't name `object` or `array` first, or it names no type ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Fix the fallback UI's type selector beside an object or an array not being described by the field's errors and help, or marked `aria-invalid` while errors show ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Fix `ArrayFieldTemplate` and `ObjectFieldTemplate` leaving an object's or an array's group undescribed by the field's errors, description and help ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Fix `focusOnFirstError` moving into an object or an array for an error about it, such as `minProperties` or `minItems`, where its group isn't a `<fieldset>`: in `@rjsf/mantine`'s objects it focused the first field, and in the arrays, and the objects that take additional properties, of `@rjsf/chakra-ui`, `@rjsf/daisyui`, `@rjsf/fluentui-rc`, `@rjsf/mui` and `@rjsf/react-bootstrap` the add button, as it did in any theme for an array or an object whose group carries no `id`, such as a custom template's. It now focuses nothing, as a `<fieldset>`'s does ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Fix renaming an additional property's key, under a custom `ObjectFieldTemplate` that keys its rows by name, sending focus back to the key input rather than into an object value's first field ([#5813](https://github.com/rjsf-team/react-jsonschema-form/pull/5813), [#5732](https://github.com/rjsf-team/react-jsonschema-form/issues/5732))
- Fix `MultiSchemaField` clearing a whole array when switching `anyOf`/`oneOf` options to one whose items past any `prefixItems` have another type, declare no type, or also allow another or widen `integer` to `number`, rather than dropping only the items the new option rejects, and cutting an array to a `maxItems` both options declare; a `null` item the new items' `default` can fill is kept as an empty row ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `MultiSchemaField` keeping the keys only the old option declares on an object array item when switching `anyOf`/`oneOf` options to one whose items' type list names `object` beside another type, such as `['string', 'object']` ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `MultiSchemaField` dropping an `undefined` array item when switching `anyOf`/`oneOf` options to one whose items declare `type: 'array'`, an `enum` or constant options, or a type list naming `array`, such as `['array', 'string']`, which moved the items after it up a row ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `MultiSchemaField` keeping an array or object as it is when switching `anyOf`/`oneOf` options where its type list names `array` or `object` after another type, such as `['string', 'array']` or `['array', 'object']`, rather than sanitizing it as `Form` does, and replacing an array with `{}` where the list names `object` and `array` and declares `properties`; a `readOnly` new `default` no longer clears an array or object property under a type list ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `MultiSchemaField` keeping an array item that holds its items' old `default` when switching `anyOf`/`oneOf` options to one whose items declare another, rather than swapping in the new one as it does for a property ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Fix `Form` starting with and submitting `{}` for an object whose `const` names keys no property declares, such as `{ type: 'object', const: { a: 2 } }`, also after switching `anyOf`/`oneOf` options to one ([#5809](https://github.com/rjsf-team/react-jsonschema-form/pull/5809), [#5644](https://github.com/rjsf-team/react-jsonschema-form/issues/5644))
- **BREAKING CHANGE:** Change `Form` to start an optional object that only an object `const` fills behind its Add button under the Optional Data Controls, rather than filled with the `const`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-optional-object-only-an-object-const-fills-starts-behind-its-add-button-breaking-change) ([#5809](https://github.com/rjsf-team/react-jsonschema-form/pull/5809))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own, and passing it `@rjsf/core/markdown`'s `MarkdownTemplate` ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix a `Form` select whose options sit in an `allOf`, such as `allOf: [{ $ref: … }]`, jumping back to its default when another option is picked ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `Form` filling the items of an array's `default` with the `default`s and `const`s of its `items` only after its first change, rather than on mount ([#5870](https://github.com/rjsf-team/react-jsonschema-form/pull/5870), [#5831](https://github.com/rjsf-team/react-jsonschema-form/issues/5831))
- **BREAKING CHANGE:** Change `Form` to fill the items of an array's `default` from its `items` schema alone, not from an `additionalItems` beside it, which describes only the items past a tuple. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-items-of-an-arrays-default-ignore-an-additionalitems-beside-items-breaking-change) ([#5870](https://github.com/rjsf-team/react-jsonschema-form/pull/5870), [#5831](https://github.com/rjsf-team/react-jsonschema-form/issues/5831))
- **BREAKING CHANGE:** Change `Form` to start with the `then` or `else` defaults, and those of the `dependencies` `oneOf` option, that another field's `default` selects, rather than leaving them out, or holding those of the other branch, until its first change. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-default-decides-an-if-as-the-same-value-in-the-form-data-does-breaking-change) ([#5869](https://github.com/rjsf-team/react-jsonschema-form/pull/5869), [#5830](https://github.com/rjsf-team/react-jsonschema-form/issues/5830))
- Add IDs to `@rjsf/core`'s migration and layout grid warnings, ending their messages, so [`setWarningOptions()`](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions#setwarningoptions) can make them throw, and log the `Form` warnings about its data, `transformChange` and dropped `FormRef` calls through `logOnce()`, naming the form by its `id` or `idPrefix`, as in `Form "root": …`, with each form, a remounted one included, still giving each warning once ([#5868](https://github.com/rjsf-team/react-jsonschema-form/pull/5868), [#5775](https://github.com/rjsf-team/react-jsonschema-form/issues/5775))
- Fix `Form` filling an `anyOf`/`oneOf` field on its first render from another option than the one it shows, where an option's `additionalProperties` or `patternProperties` takes the data's extra keys, so `reset()` or an edit elsewhere later added or dropped that option's defaults ([#5873](https://github.com/rjsf-team/react-jsonschema-form/pull/5873), [#5832](https://github.com/rjsf-team/react-jsonschema-form/issues/5832))
- Change `BaseInputTemplate` to no longer set `placeholder` or `readonly` on a range input, where neither has an effect, and to disable a read-only one instead, as `RangeWidget` does, so a read-only `inputType: 'range'` field can't be dragged either ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `FieldErrorTemplate` dropping an error message of `0`, which untyped `extraErrors` can hold ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `CheckboxWidget` naming a required box `*`, by a label holding only its marker, where the field's label has no text ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `ObjectField` to render an object whose `ui:order` repeats `*`, or has none and leaves out a property, instead of replacing it with a `.rjsf-config-error`, placing a left-out property after the listed ones with a warning once per uiSchema entry and set of properties left out. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-incomplete-uiorder-renders-the-object-instead-of-an-error-breaking-change) ([#5891](https://github.com/rjsf-team/react-jsonschema-form/pull/5891), [#4316](https://github.com/rjsf-team/react-jsonschema-form/issues/4316))
- Fix an `anyOf`/`oneOf` option the uiSchema's `anyOf`/`oneOf` list holds no entry for, before an option that has one or that a `ui:definitions` entry gives one, rendering without the field's uiSchema, so its `ui:required` fields, for one, weren't required ([#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885))
- Fix the options of an `anyOf`/`oneOf` option the field's uiSchema list holds no entry for taking that list's entries as their own, such as another option's title or `ui:initialValue`, when rendered or switched to ([#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885))
- **BREAKING CHANGE:** Change `AddButton` to take the `title` it is passed and fall back to `Add Item` instead of `Add`, and `ObjectFieldTemplate` to spread the `addButtonProps` `ObjectField` hands it, which title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))
- **BREAKING CHANGE:** Change `Form` to start each key of an object `const` with the `const`'s value over the key's own `default` at any depth, whatever `nestedDefaultsPrecedence` says, a tuple's item defaults included, to start a nested `anyOf`/`oneOf` field in the option the value the `const` gives it matches, and to set such a key whatever `emptyObjectFields` says, as a key of a parent's `const` already is. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-object-const-wins-over-the-defaults-beneath-it-breaking-change) ([#5897](https://github.com/rjsf-team/react-jsonschema-form/pull/5897), [#5819](https://github.com/rjsf-team/react-jsonschema-form/issues/5819))
- Fix `Form` starting without the keys of an object's `const` or `default` where only `patternProperties` or `unevaluatedProperties` takes them, or without the defaults of an extra key the data holds that only they describe, and filling a key a pattern matches from the `additionalProperties` beside the pattern rather than from the pattern ([#5897](https://github.com/rjsf-team/react-jsonschema-form/pull/5897), [#5819](https://github.com/rjsf-team/react-jsonschema-form/issues/5819))
- Fix `Form` starting without, under the default `allOf: 'skipDefaults'`, the `const` of the `oneOf`/`anyOf` option that a nested field's `allOf`, or the `allOf` of the option a field shows, offers, and the `const` or `null` of each key that option declares ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `Form` to start a field with its `default` where its data holds a value that its `oneOf`/`anyOf` of constants doesn't offer, as it does for an `enum`, where it kept the value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-value-outside-a-constant-oneof-or-anyof-takes-the-fields-default-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `Form` to start a `oneOf`/`anyOf` of constants with no value and no `default` of its own from the constant its object's `default` names, as it does for an `enum`, where it took the first constant. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-constant-oneof-or-anyof-starts-from-the-constant-its-objects-default-names-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `Form` to start a `oneOf`/`anyOf` of constants with no value, or one the defaults replace such as a `NaN`, from a `default` naming none of the constants, its own or its object's, as it does for an `enum`, where it took the first constant. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-constant-oneof-or-anyof-starts-from-a-default-outside-its-constants-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `Form` to keep a value that an `enum` at the root with no `default` doesn't offer, and a `NaN` at the root with no `default`, as it does for a property, where it dropped the value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-root-keeps-a-value-outside-its-enum-and-a-nan-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `ArrayField` to render a `prefixItems` array as a tuple, a field per position, with its `items` as the rows past them, read from `uiSchema.prefixItems` and `uiSchema.items`, where it rendered "Missing items definition" or a plain list of `items`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-prefixitems-array-renders-as-a-tuple-breaking-change) ([#5900](https://github.com/rjsf-team/react-jsonschema-form/pull/5900), [#5797](https://github.com/rjsf-team/react-jsonschema-form/issues/5797))

## @rjsf/daisyui

- Fix the `getTestRegistry()` test helper silently dropping its templates and widgets; import it from `@rjsf/core/testing` ([#5272](https://github.com/rjsf-team/react-jsonschema-form/pull/5272))
- **BREAKING CHANGE:** Change `TimeWidget` to pad missing seconds and append the browser's UTC offset (`iso-time` skips the offset), and `DateTimeWidget` to write an `iso-date-time` value as a naive local date-time. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#timedate-time-formats-now-require-a-timezone-offset-breaking-change) ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- Fix an unparsable value crashing `DateTimeWidget`'s calendar ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- Remove the `fields` entry of unmodified core fields `generateTheme()` returned, as in every other theme; rendering is unchanged ([#5266](https://github.com/rjsf-team/react-jsonschema-form/pull/5266))
- Change `BaseInputTemplate` to render a `number`/`integer` field as `<input type="text">` with a numeric `inputMode`, `pattern` and `title`, without `step`, `min` or `max`; set `ui:options.inputType: 'number'` or use the `updown` widget for a native number input ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` support to `SelectWidget`'s dropdown, with a labelled header row before each group ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Fix `SelectWidget` ignoring `ui:enumDisabled`; those options are `aria-disabled` and ignore clicks and key presses ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Fix `SelectWidget` rendering a blank row for a falsy option label such as `0` or `false` ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Change `WrapIfAdditionalTemplate` to render an additional property's key as a `SelectWidget` of the names `propertyNames.enum` allows, and take the key from the new `keyName` prop, so a `deprecated` property no longer offers its decoration as a key name ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix `SelectWidget` not giving its dropdown trigger the `id` it is passed, so a label pointing at it missed the control ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix `SelectWidget`'s labels not reaching its dropdown trigger by opening it from a real `<button>` rather than a `<div role='button'>` ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` that infers `T` from `formData`, and the `Theme`, `Templates` and `Widgets` exports to keep each component's generic type; `generateForm()` returns a `ThemedForm<T, S, F>`, and `Widgets` is the widget map rather than an alias for `generateWidgets`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix `SelectWidget`, `RadioWidget` and `CheckboxesWidget` with object options under the `realValue` option value format ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309))
- Fix `FieldTemplate` dropping the label of a `boolean` rendered as anything but a checkbox or toggle, such as a `select` or `radio`, and rendering a nullable `boolean`'s title twice ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `FieldTemplate` rendering a field's description a second time under the `checkbox` and `toggle` widgets ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `FieldTemplate` rendering an empty `<label>`, and a lone required `*`, for a field with no title ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `FieldTemplate` ignoring the `hidden` prop, so a hidden additional property rendered its key input and remove button and a `deprecatedHandling: 'hide'` field rendered in full ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Remove the second, hidden `<label>` `BaseInputTemplate` rendered for its input, which labelled nothing ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `RadioWidget`, `CheckboxesWidget`, `RatingWidget` and `AltDateWidget`/`AltDateTimeWidget` going unnamed: each marks its group `role='radiogroup'`/`role='group'`, carries the field's `id` and is named by the label through `aria-labelledby` ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `DateWidget` and `DateTimeWidget`'s triggers showing `schema.title` over a `ui:title`; they are named by the field's label, announce the selected date, and show `ui:placeholder` or else the label ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `AltDateWidget`'s year/month/day labels not labelling their selects; they point at them through ids of their own ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Fix `ToggleWidget`'s label always being empty while `FieldTemplate` drew another; it renders the field's `label` and description as `CheckboxWidget` does, and sets `name` ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- **BREAKING CHANGE:** Fix `DateWidget` showing the previous day behind UTC and committing a full UTC date-time for a `format: 'date'` field; it reads and commits `YYYY-MM-DD`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- **BREAKING CHANGE:** Change both date widgets to commit `ui:emptyValue`, `undefined` by default, rather than `''` for no date, which failed the field's format. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `CheckboxWidget` and `ToggleWidget` mounting uncontrolled for an `undefined` or `null` value, so the box kept a click the form rejected ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Change `CheckboxWidget` to honor `ui:autofocus`, as `ToggleWidget` does, and both to wrap their input in a `<span>` rather than a `<div>` ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `FieldTemplate` drawing a second label beside a wrapped or replaced `CheckboxWidget` or `toggle`; it reads the registry entry ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `DateWidget` misreading a stored date-time with a lowercase `t`/`z`, an epoch number, a space separator or its own offset, and overwriting it on dismiss; an unreadable value is left alone, in `DateTimeWidget` too ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix the field's label not reaching `DateWidget` and `DateTimeWidget`'s trigger by opening the picker from a real `<button>` rather than a `<div role='button'>` ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Add the `getGroupProps()` export and re-export `@rjsf/utils`' `fieldLabelId()`, so a custom widget or `FieldTemplate` can name itself as this theme's do ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `CheckboxWidget` and `ToggleWidget` setting `required` on a box whose `false` the schema accepts, which blocked the submit without calling `onSubmit` or `onError` ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `DateTimeWidget` throwing a `RangeError` when its time input is emptied or half-typed ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `CheckboxesWidget` setting `required` on every option box, so a required array couldn't be submitted until all were checked ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `DateWidget` and `DateTimeWidget` ignoring `ui:disabled` and `ui:readonly`; a read-only trigger is `aria-disabled` and stays in the tab order ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Add `aria-describedby` to `CheckboxWidget`, `ToggleWidget` and both date widgets' triggers, so the description, errors and help are announced ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix a second press on a date picker's trigger, or its label, reopening the picker instead of closing it and committing the day ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `FieldTemplate` drawing a second label for `ui:widget: 'toggle'` on a non-`boolean` schema ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix both date widgets keeping the date Escape closed the picker on, which the next close committed ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- **BREAKING CHANGE:** Change both date pickers to store a value only when the user chose a date, where dismissing a picker rewrote the field, such as a date-time in a `format: 'date'` field becoming another day. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `DateWidget` reading a date-time stored in a `date` or `iso-date-time` field, and `DateTimeWidget` one stored in a `date` field, as the day its instant lands on in the reader's zone rather than the day its text names, so a midday-UTC value showed the wrong day beyond UTC±12 ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5760](https://github.com/rjsf-team/react-jsonschema-form/pull/5760), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318), [#5395](https://github.com/rjsf-team/react-jsonschema-form/issues/5395))
- **BREAKING CHANGE:** Change both date pickers to commit the shape the field's `format` declares, a date for `date`, a UTC ISO string for `date-time` and a naive local date-time for `iso-date-time`, whichever of `ui:widget: 'date'` or `'date-time'` renders it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix both date pickers' triggers rendering empty and nameless with no value, `ui:placeholder` or title; they show the translated `AriaDateLabel`, "Select a date" ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix both date pickers reopening after Escape on the month the user abandoned rather than the stored value's ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `CheckboxWidget` and `ToggleWidget` dropping the required marker of a required field whose schema is not a `boolean` ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Change both date pickers to bind their document `keydown` and `mousedown` listeners only while the popup is open ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix group widgets and date picker triggers going unnamed when the field's `title` is `''`; they find the label that falls back to the property name ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix both date pickers not closing on Escape or an outside press inside an iframe, and Escape dropping focus to the body rather than returning it to the trigger ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix both date pickers' closed triggers showing the last date chosen rather than the one the form holds ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `DateTimeWidget` rendering an empty trigger for an epoch number or `Date` value and overwriting it at the first pick ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Remove the `#date-picker-portal` element `DateWidget` created on `document.body` on every mount ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `SelectWidget`'s accessible name ending in the dropdown arrow's glyph where no label points at it ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- **BREAKING CHANGE:** Change `FieldTemplate` to apply `ui:classNames` and `ui:style` once, on the `WrapIfAdditionalTemplate` wrapper, where the classes were drawn twice and the style landed on an inner div, and never as an `undefined` class; a custom `WrapIfAdditionalTemplate` now has to apply `style`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyui-applies-uiclassnames-and-uistyle-on-the-field-wrapper-breaking-change) ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- Fix `TextareaWidget` replacing a `ui:options.rows` of `0` with 5 rows ([#5387](https://github.com/rjsf-team/react-jsonschema-form/pull/5387))
- Fix `FieldTemplate` drawing a second label for a `checkbox` widget on a `type` list such as `['number', 'boolean']`, and `CheckboxWidget`/`ToggleWidget` marking such a required checkbox more than a required `boolean`'s ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Fix date pickers reporting `onBlur` before the close commit, two focuses on opening and two blurs on an outside press; opening and closing report one `onFocus` and one `onBlur`, Done and Escape return focus to the trigger, and a press on the trigger in an iframe closes the popup ([#5437](https://github.com/rjsf-team/react-jsonschema-form/pull/5437))
- Change `FieldTemplate` to tell whether a widget draws its own label without resolving the widget component; a boolean alias such as `radio` whose registry key holds the checkbox or toggle now also gets the template's label and description ([#5456](https://github.com/rjsf-team/react-jsonschema-form/pull/5456))
- **BREAKING CHANGE:** Change `AltDateWidget`'s date parts to be named by the field's label and part, such as `When, year`, described by the field's description, help and errors, and `aria-invalid` while errors show; visible labels are translated and no longer capitalized. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Change `SelectWidget` to pass its `aria-label` and `aria-describedby` to its button ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Fix `FieldErrorTemplate`'s errors not being announced with the field: the one element holding the messages carries the `errorId()` widgets point at, and an empty message is left out ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `FieldErrorTemplate` to render nothing when handed no errors, rather than an empty wrapper ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the date pickers' Done button and `DateTimeWidget`'s time input label to go through `translateString`, as `TranslatableString.DoneLabel` and `TranslatableString.TimeLabel` ([#5482](https://github.com/rjsf-team/react-jsonschema-form/pull/5482))
- Fix `CheckboxesWidget` and `RadioWidget` ignoring `ui:enumDisabled`, and dim a disabled option's label without a pointer cursor ([#5487](https://github.com/rjsf-team/react-jsonschema-form/pull/5487), [#5408](https://github.com/rjsf-team/react-jsonschema-form/issues/5408))
- Add item names to `ArrayFieldItemButtonsTemplate`'s button titles and aria-labels when an array sets the `itemLabel` option ([#5474](https://github.com/rjsf-team/react-jsonschema-form/pull/5474))
- Fix `SelectWidget` showing a hardcoded, untranslated `'Select...'` with nothing selected and no placeholder or label; it reads `TranslatableString.SelectPlaceholder` (default `'Select ...'`) ([#5512](https://github.com/rjsf-team/react-jsonschema-form/pull/5512), [#5498](https://github.com/rjsf-team/react-jsonschema-form/issues/5498))
- Change the theme to declare its presentation: the toggle draws its own label and description, the rating and date parts are labelled through `aria-labelledby`, and `getGroupProps()`, `FieldTemplate`, the boolean inputs and `WrapIfAdditionalTemplate` follow the field's plan ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldHelpTemplate` repeating the field's help id for an `anyOf`/`oneOf` option's own `ui:help`; it renders under the help id of the field's plan; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix `SelectWidget` naming an `anyOf`/`oneOf` option selector by the option it displays; it is named by its field's label or the object's heading ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the toggle to count a required boolean as required only where its schema demands `true` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget` to render the selected option's description under the id the select is described by, listed in `aria-describedby` before the field's description and help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix `RadioWidget` and `RatingWidget` not marking their `radiogroup` `aria-invalid` while the field has errors; `getGroupProps()` gives the group's `role` and `aria-invalid` ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the widgets' focused controls ignoring the field's state: `BaseInputTemplate`, `TextareaWidget`, `RangeWidget`, `TimeWidget`, the checkbox and toggle are `aria-invalid` while errors show and described only by rendered elements, and the `RadioWidget`, `CheckboxesWidget` and `RatingWidget` options by the field's description, help and errors ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` and `RadioWidget` ignoring `ui:autofocus` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `SelectWidget`'s trigger to a `combobox` named by the field's label, placeholder or translated prompt, holding the displayed option, `aria-invalid` while errors show and described by the field's description, help and errors; query it by role `combobox`, not `button`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget`'s trigger to be the widget's one tab stop, opening and moving through its listbox with the arrows, Home, End, Enter, Space and Escape ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5722](https://github.com/rjsf-team/react-jsonschema-form/pull/5722), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5575](https://github.com/rjsf-team/react-jsonschema-form/issues/5575))
- **BREAKING CHANGE:** Change the `DateWidget` and `DateTimeWidget` trigger to a `combobox` controlling the calendar `dialog`, named by the field's label, placeholder or translated date prompt, holding the displayed date, `aria-invalid` while errors show and described by the field's parts; query it by role `combobox`, not `button`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the `DateWidget` and `DateTimeWidget` trigger to open the picker on the selected day or today on Down Arrow ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget` describing a `propertyNames` key select by `__error`, `__description` and `__help` ids no element has ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate`'s label to take its id, `for` and `*` from the field's plan: a radio, checkboxes, rating or alt-date group's label has no `for` (aim at `label:has(#root_color__label)`), and a `uncheckedIsFalse` widget is starred only where the schema demands `true`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` to put the title id on a `<span>` around the title's text, so an option selector named by it no longer takes in the optional data control's button; aim `div#root__title` selectors at `span#root__title`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `TitleField` to draw the `title` it is handed, keeping a `(deprecated)` decoration ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing an `anyOf`/`oneOf` option's repeated `ui:title` a second time, and dropping an optional array's data control along with the heading; `ArrayFieldTitleTemplate` draws the heading whenever it is handed a `title` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` dropping the optional data control when it draws no heading; it is laid out with the properties, as in `@rjsf/core` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` rendering an empty `<div>` where it is given no selector, as while an optional `anyOf`/`oneOf` field has no data ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a disabled or readonly `SelectWidget` committing an option chosen from the keyboard; its trigger and options are `aria-disabled` and the options dimmed ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate`'s empty-array message ignoring a custom `translateString`; it reads `TranslatableString.EmptyArray` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RatingWidget` ignoring a form's `nameGenerator`; its radios take `htmlName` as their `name` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` and `ArrayFieldTitleTemplate` to mark a required object's or array's heading `*` outside the title id's text, and `ArrayFieldTitleTemplate` to put that id on a `<span>` inside its `<h3>`. Aim `h3#root_tags__title` selectors at `span#root_tags__title`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxesWidget`'s first choosable checkbox, `TextareaWidget`, `TimeWidget`, an enabled `SelectWidget`, `AltDateWidget`'s first part and the `DateWidget` and `DateTimeWidget` triggers ignoring `ui:autofocus`, and make a multiple `SelectWidget`'s listbox `aria-multiselectable` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` and `TimeWidget` ignoring a form's `nameGenerator`; their inputs take `htmlName` as their `name` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` showing a stored `0` at the schema's `default` or mid-range, and React's uncontrolled-input warning when a field with no value and no `default` moves ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate`'s label to put its id on a `<span>` around the label's text, so a group or option selector named by it excludes the `*`; aim `label#root_color__label` selectors at `label #root_color__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget`'s and the date widgets' triggers to be `aria-required` for a required field, and `WrapIfAdditionalTemplate` to name the key input through `aria-label` under `ui:label: false` ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add the `getGroupAndOptionProps()` export, which, handed the `registry`, also returns the `requiredCue` a required group of checkboxes is named by ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Fix `RatingWidget` giving `ui:autofocus` to its first star rather than the checked one, where Tab into the group lands ([#5546](https://github.com/rjsf-team/react-jsonschema-form/pull/5546), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `DateWidget`'s calendar popup being painted before it is positioned when it opens ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- Fix `DaisyUIFrameProvider` storing a chosen `dataTheme` during render and missing a theme stored by another provider, `useTheme()`'s `setTheme()` or another tab; it shows it as soon as it is stored ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- **BREAKING CHANGE:** Change `useTheme()` to follow the stored theme whoever stores it, inside a `ThemeProvider` or not, and to name a `DaisyUIFrameProvider`'s chosen `dataTheme`; outside a provider it names the stored theme or `cupcake`, and its `setTheme()` stores one. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-usetheme-reads-the-stored-theme-and-themecontext-is-removed-breaking-change) ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- **BREAKING CHANGE:** Remove `ThemeContext`, and change `ThemeProvider` to hold no theme. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-usetheme-reads-the-stored-theme-and-themecontext-is-removed-breaking-change) ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- Fix `DateWidget`'s calendar popup staying put when a scrolling panel or dialog around the field scrolls; it follows its trigger ([#5563](https://github.com/rjsf-team/react-jsonschema-form/pull/5563))
- Add the `daisy` global UI option, typed by the new `DaisyGlobalUISchemaOptions` and `UiSchema` types, so `FieldTemplate` reads a global `daisy` where a field sets none; the type rejects extensions named `color`, `size` or `colorGradient` ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- Fix `ObjectFieldTemplate` hiding the add button for an object naming no `additionalProperties` when `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `FieldTemplate` to pass the field's new `hasErrors` on to `WrapIfAdditionalTemplate` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Fix `WrapIfAdditionalTemplate` not marking a forbidden additional property's key input invalid; the free-text input and the `propertyNames` select are `aria-invalid` and described by the row's errors ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add the `keyNotAllowed` prop `FieldTemplate` hands `WrapIfAdditionalTemplate`; a custom one that spreads leftover props onto an element should leave it out ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change an additional property's key input id from `root_foo-key` to `root_foo__key`, and the date-time picker's time input id to `root_when__time`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- **BREAKING CHANGE:** Change the theme to render `@rjsf/core`'s templates and widgets through a daisyUI `classMap` wherever its own were copies of them, and remove those copies; a `Form` built from `generateTemplates()` passes the new `generateClassMap()` too. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyui-renders-cores-components-through-its-class-map-breaking-change) ([#5639](https://github.com/rjsf-team/react-jsonschema-form/pull/5639), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `data-invalid` to the label and description the checkbox and toggle widgets draw while the field shows its own errors, as `@rjsf/core`'s `CheckboxWidget` does ([#5639](https://github.com/rjsf-team/react-jsonschema-form/pull/5639), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Fix `ObjectFieldTemplate` leaving an empty grid cell for a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- **BREAKING CHANGE:** Change `DateWidget`'s and `DateTimeWidget`'s popup to one `.date-picker-popup` dialog placed by inline styles, which scrolling panels, modals and short viewports no longer clip, offset or put out of reach. See [`@rjsf/daisyui`'s date and label markup changed](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-date-and-label-markup-changed-breaking-change) ([#5633](https://github.com/rjsf-team/react-jsonschema-form/pull/5633), [#5396](https://github.com/rjsf-team/react-jsonschema-form/issues/5396))
- Fix `DateWidget`'s and `DateTimeWidget`'s popup closing on a press inside it, such as on a day, in a form rendered in a shadow root ([#5633](https://github.com/rjsf-team/react-jsonschema-form/pull/5633), [#5396](https://github.com/rjsf-team/react-jsonschema-form/issues/5396))
- **BREAKING CHANGE:** Remove the undocumented `src/styles.css` and the `tailwindcss` dependency only it used; an app that loaded the file by its path loads Tailwind and daisyUI from its own stylesheet. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyui-no-longer-ships-srcstylescss-or-depends-on-tailwindcss-breaking-change) ([#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5599](https://github.com/rjsf-team/react-jsonschema-form/issues/5599))
- Fix an array item's buttons and an additional property's key input and remove button sitting off the field's input when its label is taller than one line, and an additional property's key and value labels running past a narrow form's edge ([#5673](https://github.com/rjsf-team/react-jsonschema-form/pull/5673), [#5667](https://github.com/rjsf-team/react-jsonschema-form/issues/5667))
- Fix `DateWidget`'s and `DateTimeWidget`'s control sitting 16px further from its label than the other widgets' controls, and so below an array item's buttons and an additional property's key input and remove button; the 16px under it goes too, as the other widgets leave none ([#5673](https://github.com/rjsf-team/react-jsonschema-form/pull/5673))
- Fix a layout grid column's `span` having no effect: `GridTemplate` sizes the column to that many twelfths of its row, unless it has a `flex`, `flexBasis` or `width` style or a `basis-*` or `w-*` class of its own, logging a warning that its `span` is ignored ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a layout grid `ui:row` nested in another `ui:row` shrinking to its content rather than taking a line of its own: `GridTemplate` adds `w-full` to the default row classes ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a `FieldTemplate`, `CheckboxWidget` or `ToggleWidget` label wider than a narrow layout grid column painting over the next column: the label now wraps, breaking a long word if it has to ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Add type-ahead to `SelectWidget`: typing moves to the first option a user can reach whose label starts with what was typed, opening the list if it was closed, and repeating one letter steps through the labels starting with it ([#5722](https://github.com/rjsf-team/react-jsonschema-form/pull/5722), [#5575](https://github.com/rjsf-team/react-jsonschema-form/issues/5575))
- **BREAKING CHANGE:** Fix `RatingWidget` drawing stars past the schema's `maximum`, or throwing on a negative one: stars now run from `minimum` up to `maximum`, at most as many as the `stars` option, so `maximum: 3` alone draws 0 to 3. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ratingwidget-stars-run-from-minimum-to-maximum-breaking-change) ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix `RatingWidget` reporting a star with a fractional value, under a fractional `minimum`, as the whole number below it ([#5731](https://github.com/rjsf-team/react-jsonschema-form/pull/5731), [#5598](https://github.com/rjsf-team/react-jsonschema-form/issues/5598))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix `RatingWidget` for a rating stored as a numeric string, which now marks its star checked, focuses it and is written back as a string ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a number field's text input holding `false`, and a textarea holding `0` or `false`, to show that value, where they were empty, and a text input holding `false` to offer the clear button for it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `BaseInputTemplate` replacing an `accept` a widget passes it as a prop with `ui:options.accept` ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `BaseInputTemplate` to put a `multiple` it is passed on a file input only, as `ArrayField` passes one to the widget of every multi-select, so an `email` input no longer takes several addresses. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#baseinputtemplate-puts-multiple-only-on-a-file-input-breaking-change) ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `RatingWidget` showing no stars for a `stars` option that isn't a number, which now shows the default 5 stars, and for a schema `maximum` that isn't a number, which now uses `stars` ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `RatingWidget` and `ToggleWidget` to ignore a `size` or `color` option that isn't a string or is blank, so `size: 5` no longer gives `toggle-5`, and to trim one. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyui-ignores-a-size-color-or-colorgradient-of-another-type-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `RatingWidget` to draw the color gradient only for a `colorGradient` of `true`, where any truthy value, such as `1`, `'true'` or `'false'`, drew it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyui-ignores-a-size-color-or-colorgradient-of-another-type-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Fix a required `anyOf`/`oneOf` field showing two `*`s with a titled object or array option selected: only the field's label is marked now ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Change `FieldTemplate` rendered without a plan to leave the label to a `checkbox` on a string with a string `const`, which draws its own ([#5753](https://github.com/rjsf-team/react-jsonschema-form/pull/5753), [#3882](https://github.com/rjsf-team/react-jsonschema-form/issues/3882))
- Fix `DateWidget` and `DateTimeWidget` showing a stored value in year 0 as the year 1: a value outside the years 1 to 9999 now shows no date ([#5760](https://github.com/rjsf-team/react-jsonschema-form/pull/5760), [#5395](https://github.com/rjsf-team/react-jsonschema-form/issues/5395))
- **BREAKING CHANGE:** Change `ArrayFieldTemplate` and `ObjectFieldTemplate` to give the element around an object's or an array's title, description and contents `role="group"` and the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix `SelectWidget`'s list of options having no accessible name: while shown, it is now named by the field's label, else its `ui:placeholder`, else "Select ...". See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfdaisyuis-selectwidget-names-its-open-list-of-options-by-the-fields-label-breaking-change) ([#5807](https://github.com/rjsf-team/react-jsonschema-form/pull/5807), [#5792](https://github.com/rjsf-team/react-jsonschema-form/issues/5792))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Change `__createDaisyUIFrameProvider` to fill at least the frame's height, so its theme colors the page below a short form ([#5858](https://github.com/rjsf-team/react-jsonschema-form/pull/5858), [#4856](https://github.com/rjsf-team/react-jsonschema-form/issues/4856))
- Add a `storeTheme` option to `__createDaisyUIFrameProvider` that, set to `false`, shows a chosen theme without storing it as the theme shown where none is chosen ([#5858](https://github.com/rjsf-team/react-jsonschema-form/pull/5858), [#4856](https://github.com/rjsf-team/react-jsonschema-form/issues/4856))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix `SelectWidget`'s multiple select putting a focusable checkbox inside each option, which ARIA doesn't allow ([#5881](https://github.com/rjsf-team/react-jsonschema-form/pull/5881))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`, and the Add button, core's, to fall back to `Add Item` instead of `Add`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/fluentui-rc

- Change `BaseInputTemplate` to render a `number`/`integer` field as a text input with a numeric `inputMode`, `pattern` and `title`, without `step`, `min` or `max`, instead of `<input type="number">`; set `ui:options.inputType: 'number'` or use the `updown` widget for a native number input ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` support to `SelectWidget`, rendered with `OptionGroup` ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Add a `SelectWidget` for an additional property's key when `propertyNames.enum` lists the allowed names, and fix a `deprecated` additional property offering its decoration as a key name or renaming itself to it; `WrapIfAdditionalTemplate` takes the key from the new `keyName` prop ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix `SelectWidget` dropping the `className` it is passed instead of adding it to its `Dropdown` ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Fix `SelectWidget` staying in the error state under `ui:hideError`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` that infers `T` from `formData`, and `Theme`, `Templates` and `Widgets` to keep each component's generic type; `generateForm()` returns a `ThemedForm<T, S, F>`, and the other `generate*()` functions default to `unknown`/`FormContextType`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix `SelectWidget`, `RadioWidget` and `CheckboxesWidget` with object options under the `realValue` option value format ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value, and make `CheckboxesWidget` report the focused option on focus and blur ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Fix `WrapIfAdditionalTemplate` rendering a literal `undefined` class when a custom field passes no `classNames` ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each is named by the field's label and part, such as `When, year`, even with the label hidden, and described by the field's description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `SelectWidget` to pass its `aria-label` and `aria-describedby` to its dropdown and to drop the empty label of an unlabelled optional field ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change the theme to declare its presentation: its widgets draw their own label, its checkbox its description too, and an `anyOf`/`oneOf` field is named by its option selector; `FieldTemplate`, `CheckboxWidget` and `WrapIfAdditionalTemplate` draw the description and key label where the field's plan says ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldHelpTemplate` repeating the field's help id for an `anyOf`/`oneOf` option's own `ui:help`; it renders under the help id of the field's plan; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix `FallbackField`'s value having no label; its own widget labels it ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget` to render the selected option's description under the id the select is described by, listed in `aria-describedby` before the field's description and help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix an `anyOf`/`oneOf` option's `SelectWidget` not being styled invalid while the field above draws its errors ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the widgets' focused controls ignoring the field's state: the `BaseInputTemplate`, `TextareaWidget`, `CheckboxWidget` and `RangeWidget` inputs and the `RadioWidget` and `CheckboxesWidget` options are described only by rendered elements and `aria-invalid` while errors show (`RadioWidget` on its `radiogroup`) ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` ignoring `ui:autofocus`, and make `CheckboxesWidget` autofocus its first choosable checkbox ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Fix `RadioWidget` and `CheckboxesWidget` groups having no accessible name: each is named by its label (drawn with no `for`) through `aria-labelledby`, or by `aria-label` under `ui:label: false`, and `CheckboxesWidget`'s group carries the field's id; aim `label[for="root_color"]` at `#root_color__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate`'s `Field` to stop passing `required` to its controls, which made every checkbox of a required `CheckboxesWidget`, and any `uncheckedIsFalse` control, required and starred; a custom widget relying on it must set `required` itself, as `RadioWidget` and `RangeWidget` now do. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget` drawing its own label where the field's plan gives it none, as under `ui:label: false` or below a label drawn above it ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget`'s label and `WrapIfAdditionalTemplate`'s key label pointing their `for` at an id no element had; they point at the dropdown's button and the key input, and a nested `anyOf`/`oneOf` select no longer repeats its parent's label id ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget`'s slider input using the field's id as its `name`, so `nameGenerator` didn't reach it, and ignoring `ui:autofocus` ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` never drawing the field's label, so a custom widget declared `label: 'template'` had none; it draws it with the plan's id, `for` and required marker ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `@rjsf/core`'s `RatingWidget`, `AltDateWidget` and `AltDateTimeWidget` to be declared `label: 'template'`, so a widget of yours registered under those keys that draws its own label should be declared `label: 'self'` ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` to put the title id on a `<span>` around the title's text inside the `<h5>`, with a required heading's `*` outside it, so an object's option selector is named "Pet" without the optional data control's text. Aim `#…__title` selectors and styles at that `<span>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing an `anyOf`/`oneOf` option's repeated `ui:title` a second time, and dropping an optional array's data control along with the heading ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` dropping the optional data control when it draws no heading; it is laid out with the properties, as in `@rjsf/core` ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` rendering an empty `<div>` where it is given no selector, as while an optional `anyOf`/`oneOf` field has no data ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldErrorTemplate` repeating `errorId()` on each message of a field with several errors; it renders them in one list under that id ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget`, `CheckboxesWidget`, `SelectWidget`, `RangeWidget`, `TextareaWidget` and `BaseInputTemplate` drawing a label of only `*` for a required field with no label text; an unlabelled `SelectWidget` is named by the field's label, placeholder or translated prompt ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `@rjsf/core`'s `AltDateWidget` date parts, rendered through this theme's `SelectWidget`, never showing the error state while the field's errors show ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Fix `WrapIfAdditionalTemplate`'s key input having no name under `ui:label: false`, nested `anyOf` option selectors being named by the outer one's label, and `CheckboxWidget` hiding the schema `description` for an empty `ui:description` ([#5547](https://github.com/rjsf-team/react-jsonschema-form/pull/5547), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the widgets to declare where they draw their own label (`labelPlacement: 'above'`, or `'beside'` for the checkbox), so `ArrayFieldItemTemplate` keeps an item's buttons level with the control below a label drawn above it ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538))
- Fix `ObjectFieldTemplate` hiding the add button for an object naming no `additionalProperties` when `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix an `anyOf`/`oneOf` option's `FieldTemplate` following the field above's `ui:hideError` rather than its own; its `Field`'s validation state comes from the new `hasErrors` prop ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Fix `WrapIfAdditionalTemplate` not marking a forbidden additional property's key input invalid; the free-text input and the `propertyNames` select are `aria-invalid` and described by the row's errors ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add the `keyNotAllowed` prop `FieldTemplate` hands `WrapIfAdditionalTemplate`; a custom one that spreads leftover props onto an element should leave it out ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change an additional property's key input id from `root_foo-key` to `root_foo__key`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- Fix `SubmitButton` skipping an `onClick` set in `ui:submitButtonOptions.props` while a promise `onSubmit` returned is pending ([#5649](https://github.com/rjsf-team/react-jsonschema-form/pull/5649))
- Change `__createFluentUIRCFrameProvider` to take `{ children: ReactNode }` rather than `any`, and its returned component to take `{ document?: Document }` ([#5410](https://github.com/rjsf-team/react-jsonschema-form/pull/5410))
- Fix the alt-date selects carrying the `form-control` class twice ([#5634](https://github.com/rjsf-team/react-jsonschema-form/pull/5634), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Fix `ObjectFieldTemplate` leaving a gap for a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- **BREAKING CHANGE:** Change `GridTemplate` to read a column's `span` as its `gridColumn` unless it has a `gridColumn` style of its own, logging a warning that its `span` is ignored, and to lay a `ui:row` without `columns` or a `gridTemplateColumns`, `gridTemplateAreas`, `gridTemplate` or `grid` style out on 12 tracks, each child full width unless it spans fewer, and warn about a column `span` that isn't a whole number. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layout-grid-row-without-a-column-template-lays-out-on-12-tracks-in-chakra-ui-fluentui-rc-and-shadcn-breaking-change) ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `SelectWidget` and `RangeWidget` overflowing a column narrower than Fluent's minimum widths of 250px and 120px, such as a layout grid's: they now shrink to their column as the text inputs do ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a layout grid `ui:row` given its template through its `style` rendering as a block, which ignored the template: `GridTemplate` makes it a grid, unless its `style` sets a `display` of its own ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a text input or textarea holding `false` to show that value, where they were empty, and the text input to offer the clear button for it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget` writing a number into a string field, which then failed validation: it now writes a numeric string, as core's range input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix a layout grid `ui:row` whose `columns` is a track count written as `'1e1'` or `'0xa'` getting an invalid column template: it now gets `repeat(10, 1fr)` ([#5683](https://github.com/rjsf-team/react-jsonschema-form/pull/5683))
- Fix `BaseInputTemplate` dropping a `pattern`, `inputMode`, `accept` or `multiple` a widget passes it as a prop, so the file input of an array took one file at a time ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- **BREAKING CHANGE:** Fix a required `anyOf`/`oneOf` field showing no `*` with a `null` or untitled object option selected, or one on the option rather than the field: the selector's label is marked now, and the option's isn't, though its control stays `required`. A custom widget drawing its own label marks it from `templateMarksRequired()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Fix `RangeWidget` reporting its `<input>`'s string to the form's `onFocus` and `onBlur`; it reports the field's value, as the other themes do ([#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))
- **BREAKING CHANGE:** Change `ArrayFieldTemplate` and `ObjectFieldTemplate` to render an object's or an array's title, description and contents inside a `div` with `role="group"` carrying the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add a `colorScheme` option to `__createFluentUIRCFrameProvider` that shows the Teams dark theme for `'dark'`, and paint the frame's page in the theme's background in both schemes: with no `colorScheme`, the frame's `body` now gets the Teams light background, `#ffffff`, which can override a background the host gave it ([#5858](https://github.com/rjsf-team/react-jsonschema-form/pull/5858), [#4856](https://github.com/rjsf-team/react-jsonschema-form/issues/4856))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix `FieldErrorTemplate` drawing an empty item for an empty error message ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/mantine

- **BREAKING CHANGE:** Remove support for Mantine 8; the theme requires Mantine 9 and React `>=19.2`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260))
- Fix `ObjectFieldTemplate` and the fluid `GridTemplate` rendering at Mantine's default 960px centered width instead of filling the form's space ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260))
- **BREAKING CHANGE:** Fix `GridTemplate` dropping a `ui:row`/`ui:col` `gutter`, which Mantine 9 renamed `gap`: it maps `gutter` to `gap` (an explicit `gap` wins), but rename `gutter` to `gap`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260))
- **BREAKING CHANGE:** Change `TimeWidget` to pad seconds and append the local UTC offset to a `time` value, and `DateTimeWidget`/`DateTimeInput` to store a `date-time` value as a UTC ISO string with an offset; `iso-time` and `iso-date-time` stay naive. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#timedate-time-formats-now-require-a-timezone-offset-breaking-change) ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- **BREAKING CHANGE:** Fix `BaseInputTemplate` handing `onChangeOverride` a string: it receives the `ChangeEvent`, as in every other theme, and a numeric field with an override renders a `TextInput` with `type="number"`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantines-onchangeoverride-now-receives-the-change-event-breaking-change) ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285), [#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303))
- Fix `FileWidget` dropping the selected file of a non-multiple input and mishandling its clear button, and show `ui:placeholder`, with the `clearable` button hidden, until a file is chosen ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Change `BaseInputTemplate` and `FileWidget` to default `T` to `unknown` and `F` to `FormContextType`, with `S` constrained to `RJSFSchema`, instead of `any` ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Add `ui:options.optgroups` support to `SelectWidget`, through its grouped `data` ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Add a `SelectWidget` for an additional property's key when `propertyNames.enum` lists the allowed names, and fix a `deprecated` additional property offering its decoration as a key name or renaming itself to it; `WrapIfAdditionalTemplate` takes the key from the new `keyName` prop ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Fix `BaseInputTemplate` and every widget with an `error` (checkbox, checkboxes, color, date/time, file, password, radio, range, select, textarea and alt-date) showing error text and styling under `ui:hideError`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` generic over the form data, so `<Form formData={data} />` infers `T`; `Theme`, `Templates` and `Widgets` keep each component's generic type, `generateForm()` returns a `ThemedForm<T, S, F>`, and the other `generate*()` functions default to `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix `DateTimeInput`, `TimeWidget`, `SelectWidget`, `TextareaWidget`, `PasswordWidget`, `ColorWidget`, `FileWidget`, `RadioWidget`, `CheckboxesWidget`, `AltDateWidget` and `AltDateTimeWidget` not showing the description from `schema` or `options` ([#5320](https://github.com/rjsf-team/react-jsonschema-form/pull/5320))
- Change `DescriptionFieldTemplate` to inherit `line-height`, `font-weight` and `font-size` from its parent, usually Mantine's `Input.Description` ([#5320](https://github.com/rjsf-team/react-jsonschema-form/pull/5320))
- Fix `DateTimeInput` and `TimeWidget` applying `ui:options` such as `style`, `title`, `label` and `help` to the widget itself ([#5320](https://github.com/rjsf-team/react-jsonschema-form/pull/5320))
- Fix `BaseInputTemplate` rendering its description as plain text; it renders through `DescriptionFieldTemplate` and honors `ui:enableMarkdownInDescription` ([#5320](https://github.com/rjsf-team/react-jsonschema-form/pull/5320))
- **BREAKING CHANGE:** Fix the widgets discarding `aria-describedby`: inputs are described by the field's description, error and help ids. The Mantine peer floor is `>=9.6.3`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine-widgets-reference-rjsfs-ids-for-labels-and-descriptions-breaking-change) ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` and `RadioWidget` groups labelled by an unrendered id, and `RangeWidget`'s thumb and `AltDateWidget`'s date parts having no accessible name; `RangeWidget` and `AltDateWidget` render their title, description and errors in `Input.Wrapper`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine-widgets-reference-rjsfs-ids-for-labels-and-descriptions-breaking-change) ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5716](https://github.com/rjsf-team/react-jsonschema-form/pull/5716), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix a widget's errors running together on one line ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Fix widgets other than `CheckboxWidget` ignoring `descriptionProps` from `ui:options` and the Mantine theme ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- **BREAKING CHANGE:** Fix a `oneOf`/`anyOf` selector referencing no error and `CheckboxWidget` reading its error twice: Mantine's and `CheckboxWidget`'s error elements carry `<id>__error`, and `ObjectFieldTemplate` renders the object's own errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine-widgets-reference-rjsfs-ids-for-labels-and-descriptions-breaking-change) ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Fix `RangeWidget` and `AltDateWidget` never marking their inputs invalid or rendering a `success` option ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Fix `AltDateTimeWidget` showing a zero hour, minute or second as empty, and `AltDateWidget` and `AltDateTimeWidget` leaving Now and Clear enabled when disabled or read-only and ignoring `autofocus`, `onBlur` and `onFocus` ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- **BREAKING CHANGE:** Fix `RangeWidget`, `PasswordWidget`, `TimeWidget`, `ColorWidget`, `FileWidget` and `DateTimeInput` ignoring `nameGenerator`; they, `TextareaWidget` and `CheckboxWidget` fall back to the field's id rather than the bare property name. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine-widgets-reference-rjsfs-ids-for-labels-and-descriptions-breaking-change) ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Fix `CheckboxWidget`, `PasswordWidget` and the `CheckboxesWidget` and `RadioWidget` options never being marked invalid, the radios and `AltDateWidget`'s parts never marked required, and checkbox and radio options not described by a `success` message ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Fix a `oneOf`/`anyOf` field's errors showing twice, on its option's widget and under its selector ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Fix `SelectWidget`, `RadioWidget` and `CheckboxesWidget` with object options and the `realValue` option value format ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Fix `DateTimeInput` leaving a field blank for an epoch number or a `Date` when `ui:options` sets a custom `valueFormat` ([#5397](https://github.com/rjsf-team/react-jsonschema-form/pull/5397), [#5393](https://github.com/rjsf-team/react-jsonschema-form/issues/5393))
- **BREAKING CHANGE:** Change `AltDateWidget`'s date parts to be named by the field's label and the translated part, such as `When, year`, with placeholders through `translateString`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `SelectWidget` to take the `aria-label` and `aria-describedby` it is passed ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Fix `CheckboxesWidget` and `RadioWidget` leaving every option enabled and focusable on a `disabled` or `readonly` field ([#5487](https://github.com/rjsf-team/react-jsonschema-form/pull/5487))
- Change `cleanupOptions()` to strip the new `itemLabel` array option, so it no longer reaches the Mantine component of an array rendered as a widget, such as checkboxes or a file input ([#5474](https://github.com/rjsf-team/react-jsonschema-form/pull/5474))
- Fix widgets passing rjsf options such as `ui:initialValue`, `ui:definitions`, per-field template overrides, `yearsRange`, `format` and `required` onto their Mantine component, so `ui:globalOptions.required` no longer marks boolean and array fields required ([#5521](https://github.com/rjsf-team/react-jsonschema-form/pull/5521), [#5485](https://github.com/rjsf-team/react-jsonschema-form/issues/5485))
- Change the theme to declare its presentation: its widgets draw their own label and description, an `anyOf`/`oneOf` field is named and described by its option selector, and an object's template draws its errors ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget` being described by ids that don't render; `aria-describedby` lists the selected option's description before the field's description and help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Change `WrapIfAdditionalTemplate` to label the key and align it with a description the value's widget draws ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's own `ui:help` repeating its field's id in `FieldHelpTemplate`; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix the `FallbackField` UI's value having no label: its own widget now labels it ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget`'s thumb being described by ids that don't render, such as under an `anyOf`/`oneOf` selector; it has no `aria-describedby` where nothing describes it ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget` to take its plan's `aria-labelledby`, so an object's option selector is named by the object's heading ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `RangeWidget` to put the field's id on the slider's thumb rather than its root, so `focusOnFirstError` focuses the thumb; a `#root_x` selector now matches the thumb (use `.mantine-Slider-root` for the root). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine-widgets-reference-rjsfs-ids-for-labels-and-descriptions-breaking-change) ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a widget declared `labelledBy: 'aria-labelledby'` having no name: every single-input widget and `CheckboxWidget` take the plan's `aria-labelledby`, and `RangeWidget` is declared so, so its template label no longer has a `for` aimed at the thumb `<div>` ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Fix field errors that were announced but never shown: the widgets draw their own in Mantine's error slot and `FieldErrorTemplate` the rest, including an item-by-item array's, which `ArrayFieldTemplate` no longer draws. A custom widget under a theme key should draw `presentation.errors.messages`, and a custom `ui:field` handing a theme widget `rawErrors` without its plan shows them twice. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the widgets' controls, `RangeWidget`'s thumb and `AltDateWidget`'s date parts included, being described by parts that don't render, and mark and style each invalid as its plan says ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `CheckboxesWidget`, `RadioWidget` and `RangeWidget` to be named by a label drawn elsewhere through `aria-labelledby` rather than a hidden title ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget` describing a `propertyNames` key select by `__error`, `__description` and `__help` ids no element has ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` drawing no label or description for a field whose plan leaves them to the template, such as a custom widget declared `label: 'template'` ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` and `ArrayFieldTitleTemplate` to put the title id on a `<span>` around the title's text, with a required heading's `*` outside it, so an option selector named by it reads "Pet" rather than "Pet *"; aim `h3#…__title` or `h4#…__title` selectors at the `<span>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing an `anyOf`/`oneOf` option's repeated `ui:title` a second time ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` and `ObjectFieldTemplate` dropping an optional array's or object's data control along with the heading ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTitleTemplate` dropping its heading and data control where `ui:globalOptions` turns labels off and the field's `ui:label` turns them on ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `FieldHelpTemplate` to render the help in a `<div>` rather than a `<p>`, which can't hold the markdown blocks `RichHelp` renders ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a `RatingWidget` field having no label or description: `FieldTemplate` draws them and names its stars' `radiogroup`. A widget of your own registered as `RatingWidget` that draws its own label or description should be declared `label: 'self'` or `description: 'self'` ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ui:autofocus` on `RadioWidget` and `CheckboxesWidget` focusing nothing when `ui:enumDisabled` disables the first option: `RadioWidget` focuses its checked radio or the first enabled one, `CheckboxesWidget` the first enabled checkbox ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `WrapIfAdditionalTemplate`'s key input having no name under `ui:label: false`, now named by the key's label, and a required `multiple` `SelectWidget`'s search input not being `aria-required` ([#5548](https://github.com/rjsf-team/react-jsonschema-form/pull/5548), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Remove `definitions` and `globalOptions` from the options `cleanupOptions()` lists, since `getUiOptions()` no longer returns them ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527))
- Change the theme to declare where its widgets draw their own label, so a custom `ArrayFieldItemTemplate` is handed `displayLabel: true` for an item whose widget draws its label above it ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538))
- Add `MantineGlobalUISchemaOptions`, typing the theme's `globalUiOptionsKeys` `gridCols`, `gridSpacing` and `gridVerticalSpacing`, which the new `UiSchema` type takes inline, so global ones reach `ObjectFieldTemplate` outside a `LayoutGridField` too ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- **BREAKING CHANGE:** Change the widgets to keep `ui:globalOptions` keys off their Mantine component unless the field sets them itself, so a Mantine prop such as `radius` or `variant` goes in each field's `ui:options`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uiglobaloptions-hold-only-the-options-rjsf-reads-there-breaking-change) ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- **BREAKING CHANGE:** Change `cleanupOptions()` to take the widget's `registry` and `uiSchema` as its second parameter. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uiglobaloptions-hold-only-the-options-rjsf-reads-there-breaking-change) ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- **BREAKING CHANGE:** Change `MantineGlobalUISchemaOptions` to reject extensions named after options the widgets read, such as `wrapperProps`, `thumbProps`, `valueFormat` or `size`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uiglobaloptions-hold-only-the-options-rjsf-reads-there-breaking-change) ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- **BREAKING CHANGE:** Change a single `SelectWidget` whose schema has a `default` to no longer clear its value when its selected option is clicked again; set `allowDeselect` in the field's `ui:options` to keep that. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantines-selectwidget-keeps-its-value-under-a-schema-default-breaking-change) ([#5615](https://github.com/rjsf-team/react-jsonschema-form/pull/5615), [#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527))
- Fix `ObjectFieldTemplate` showing no add button for an object naming no `additionalProperties` in a form whose `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `WrapIfAdditionalTemplate` to mark an additional property's key input, free-text or `propertyNames` select, `aria-invalid` and described by its row's errors while the object forbids that key; its description spacer is a `div` and no longer describes the key ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change the ids of an additional property's key input to `root_foo__key` (was `root_foo-key`), a success message to `root_when__success`, and an input's label and description to `root_when__wrapperLabel` and `root_when__wrapperDescription` (was `root_when-label` and `root_when-description`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- **BREAKING CHANGE:** Fix `ObjectFieldTemplate` giving a grid cell to a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget: it now leaves the property out, as it does one with its own `ui:widget: 'hidden'`. See [`@rjsf/antd` and `@rjsf/mantine` leave out a property hidden by `deprecatedHandling` or `ui:definitions`](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfantd-and-rjsfmantine-leave-out-a-property-hidden-by-deprecatedhandling-or-uidefinitions-breaking-change) ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- Fix a layout grid `ui:row` with `fluid: false` nested in another `ui:row` shrinking to its content rather than taking a line of its own: `GridTemplate` grows its `Grid` to fill its line, with a `flex` of `1 1 100%`, unless the row has a `w` or `flex` prop, a `flex`, `flexBasis`, `flexGrow` or `width` style of its own, or a `style` function, which can't be read for one ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `SelectWidget` leaving a select no label names, such as an untitled root or array item select, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ...") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:options` `aria-label`, else its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix a `ui:options` `aria-label` on `RadioWidget` and `CheckboxesWidget` landing on Mantine's wrapper, where it names nothing; it now names a group no label on screen names ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713))
- Fix `CheckboxesWidget` and `RadioWidget` passing a text input's Mantine props, such as `leftSection` or `rightSectionWidth`, from their `ui:options` on to the group's root element as unknown attributes ([#5716](https://github.com/rjsf-team/react-jsonschema-form/pull/5716), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix `RangeWidget`'s slider not taking a `size` from `ui:options.wrapperProps` or the theme's `Input` or `InputWrapper` `defaultProps`, and `AltDateWidget`'s date parts not taking the field's `ui:options.size` or `ui:options.wrapperProps.size` ([#5716](https://github.com/rjsf-team/react-jsonschema-form/pull/5716), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix a text, number, textarea, password, select, color, file, time, date or date-time input, or an additional property's key input, whose `inputWrapperOrder` leaves out the label having no accessible name; it is named by its label through `aria-label` ([#5716](https://github.com/rjsf-team/react-jsonschema-form/pull/5716), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- **BREAKING CHANGE:** Change `ColorWidget` to read `ui:options.colorFormat` instead of `format`, which now only means the alt-date widgets' order of date parts. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantines-colorwidget-reads-colorformat-instead-of-format-breaking-change) ([#5726](https://github.com/rjsf-team/react-jsonschema-form/pull/5726), [#5610](https://github.com/rjsf-team/react-jsonschema-form/issues/5610))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- **BREAKING CHANGE:** Change `id`, `name`, `value`, `defaultValue`, `readOnly`, `autoFocus`, `data`, `multiple`, `error`, `onChange`, `onBlur` and `onFocus` in `ui:options` to be dropped as invalid options, since they're the form's to set. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantine-ignores-id-name-value-defaultvalue-readonly-autofocus-data-multiple-error-onchange-onblur-and-onfocus-in-uioptions-breaking-change) ([#5737](https://github.com/rjsf-team/react-jsonschema-form/pull/5737))
- Fix `FileWidget` never calling the `Form`'s `onBlur` and `onFocus` ([#5737](https://github.com/rjsf-team/react-jsonschema-form/pull/5737))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a textarea holding `0` or `false` to show that value, where it was empty, and a text input holding `false`, which it shows, to offer the clear button for it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change `FileWidget` to hand a `ui:options.valueComponent` an empty `File` for each stored file, where it handed the stored data URLs, so a custom one no longer gets the files' names or contents. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget`, and the number input of a string field with `ui:inputType: 'number'`, writing a number into a string field, which then failed validation and, for the number input, lost the digits past a number's precision when focus left it: they now write a numeric string, as core's range input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change `PasswordWidget` and `ColorWidget` to show a value of `0` or `false`, where they were empty ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix the number input writing an empty string when cleared, which ignored `ui:emptyValue` and let a required string field with `ui:inputType: 'number'` pass empty: it now writes `ui:emptyValue`, as the text input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change `DateWidget` and `DateTimeWidget` to use their default `valueFormat` and `displayFormat` for an option that isn't a string ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` dropping a `pattern`, `inputMode` or `accept` a widget passes it as a prop, a `number` field a widget passes an `inputMode` getting a native number input that blocked a decimal, and `NumberInput` options such as `hideControls` landing on the text input a numeric field gets instead, such as with an `inputType` of `tel` ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Change `FileWidget` to leave out of `accept` whatever in the `accept` option isn't a string or is blank, where it stringified anything truthy, so `true` gave `accept="true"` and `' '` gave `accept=" "` ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Fix `ColorWidget` rewriting its value as hex when its `colorFormat` option changes to a format `ColorInput` doesn't take, such as `'RGB'` ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `AltDateWidget` to show the default years for a `yearsRange` reaching before 100, such as `[50, 2030]`, where it offered that range and wrote a year before 100 as 19xx. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-uses-the-default-years-for-a-yearsrange-reaching-before-100-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Fix a `ui:options` value of the wrong shape reaching Mantine, which now leaves it out: a `thumbProps` that isn't an object and a `thumbLabel` that isn't a string, at the top level or in `thumbProps`, on `RangeWidget`, and, on every widget, an `inputContainer` that isn't a function and an `inputWrapperOrder` that isn't an array, at the top level or in `wrapperProps`, which threw ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Fix a required `anyOf`/`oneOf` field showing no `*` with a `null` or untitled object option selected, or one on the option rather than the field: the selector's label is marked now, and the option's isn't, though its control stays `required`. A custom widget drawing its own label marks it from `templateMarksRequired()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Change `AltDateWidget` to render each date part through the registry's `SelectWidget`, as the other themes do, so a custom `SelectWidget` renders them too, a month, day, hour, minute or second shows two digits, such as `01`, a part is no longer required and its hidden input submits the picked option's index. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantines-altdatewidget-renders-its-date-parts-through-selectwidget-breaking-change) ([#5767](https://github.com/rjsf-team/react-jsonschema-form/pull/5767), [#5503](https://github.com/rjsf-team/react-jsonschema-form/issues/5503))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to give the element around an object's title, description and properties `role="group"`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Fix `ArrayFieldTemplate` leaving an array's group undescribed by the field's errors, description and help ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- **BREAKING CHANGE:** Fix a `date-time` field offering no way to pick a time: `DateTimeWidget` renders Mantine's `DateTimePicker`, a calendar and time picker behind a button, instead of a typed `DateInput`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantines-datetimewidget-renders-mantines-datetimepicker-breaking-change) ([#5862](https://github.com/rjsf-team/react-jsonschema-form/pull/5862), [#5402](https://github.com/rjsf-team/react-jsonschema-form/issues/5402), [#5887](https://github.com/rjsf-team/react-jsonschema-form/pull/5887), [#5884](https://github.com/rjsf-team/react-jsonschema-form/issues/5884))
- **BREAKING CHANGE:** Fix `DateWidget` and `DateTimeWidget` storing `''`, which fails a `date` or `date-time` format, when cleared: they store `ui:emptyValue` and show a Clear button by default. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmantines-datewidget-and-datetimewidget-can-be-cleared-breaking-change) ([#5862](https://github.com/rjsf-team/react-jsonschema-form/pull/5862), [#5402](https://github.com/rjsf-team/react-jsonschema-form/issues/5402))
- Fix an empty error message adding a blank line to a field's errors ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/mui

- **BREAKING CHANGE:** Remove support for `@mui/material` and `@mui/icons-material` 7; the peer dependency range is now `^9.0.0`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmui) ([#5264](https://github.com/rjsf-team/react-jsonschema-form/pull/5264))
- Change `BaseInputTemplate` to render a `number`/`integer` field as a numeric text input, as `@rjsf/core` does; a `slotProps.htmlInput` value always wins, and its type accepts `<input>`-only attributes such as `pattern`, `step`, `min` and `max` ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` support to `SelectWidget`, grouping options under `ListSubheader`s ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Change `WrapIfAdditionalTemplate` to render an additional property's key as a `SelectWidget` of the names `propertyNames.enum` allows, reading the key from the new `keyName` prop, and fix a `deprecated` additional property offering its decoration as a key name or renaming itself to it ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix `WrapIfAdditionalTemplate`'s key dropdown not filling its column as the free-text key input does ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Fix `BaseInputTemplate` and `SelectWidget` keeping their `Mui-error` styling under `ui:hideError`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` generic over the form data, so `<Form formData={data} />` infers `T`; the `Theme`, `Templates` and `Widgets` exports keep each component's own generic type, and `generateForm()` returns a `ThemedForm<T, S, F>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix object options in `RadioWidget` and `CheckboxesWidget`, and make `SelectWidget` report its form data value on focus and blur ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309), [#5317](https://github.com/rjsf-team/react-jsonschema-form/issues/5317))
- Fix a theme callback given as `sx` in a `ui:options.mui.rjsfSlotProps` target, such as `titleBox` or `errorBox`, being dropped; it applies after the theme's default styles, and `computeSxProps()` composes an array or callback default `sx` the same way ([#5386](https://github.com/rjsf-team/react-jsonschema-form/pull/5386))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value, and make `CheckboxesWidget` report the focused option on focus and blur ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each select is named by the field's label and the translated part, such as `When, year`, and described by the field's description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- **BREAKING CHANGE:** Change `SelectWidget` to put the `aria-label` and `aria-describedby` on its combobox rather than the field's root, under any `htmlInput` from `rjsfSlotProps`, now typed and accepting MUI's callback form; `aria-describedby` lists the selected option's description before the field's description and help, the order they are drawn in. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Change the theme to declare its presentation: its widgets draw their own label, its checkbox its description too, an `anyOf`/`oneOf` field is named by its option selector, and `FieldTemplate` draws a description without a plan only where `displayLabel` lets it draw the label ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget` being described by ids that don't render ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `WrapIfAdditionalTemplate` to label the key per the field's plan ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's own `ui:help` repeating its field's id in `FieldHelpTemplate`; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix the `FallbackField` UI's value having no label: its own widget now labels it ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget` to hand its plan's `aria-labelledby` to MUI's select as `labelId`, so an object's option selector is named by the object's heading ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's control in `BaseInputTemplate` and `SelectWidget` not being styled invalid while the field above draws its errors ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `BaseInputTemplate`, `TextareaWidget`, `CheckboxWidget`, `RadioWidget` and `CheckboxesWidget` putting `aria-invalid` and `aria-describedby` on MUI's wrapper rather than the element a user focuses, and describing it by parts that don't render ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` ignoring `ui:autofocus`; it and `CheckboxesWidget` focus the checked or first enabled option ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `RangeWidget` to put the field's id on its slider's `<input>` rather than the root `<span>`, so its label names it and `focusOnFirstError` reaches it; a multi-value slider keeps the id on its root and names each thumb by its label and number, such as "Span (1)" and "Span (2)". Aim `span#root_x` selectors at `input#root_x`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5730](https://github.com/rjsf-team/react-jsonschema-form/pull/5730), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5596](https://github.com/rjsf-team/react-jsonschema-form/issues/5596))
- Change `RangeWidget`'s `<input>` to be `required` for a required field, take `htmlName` as its `name` and honor `ui:autofocus` ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Fix `RadioWidget` and `CheckboxesWidget` groups having no name: each is named by its label, which has no `for`, and each radio of a required `RadioWidget` is `required`. Aim `label[for="root_color"]` selectors at `#root_color__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the helper text from `ui:options.mui.helperText` going unannounced: `BaseInputTemplate` and `SelectWidget` add it to their control's `aria-describedby` ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `BaseInputTemplate` dropping a `slotProps.htmlInput` given as MUI's `(ownerState) => props`, which its type now accepts ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` drawing no label for a field whose plan leaves it to the template, such as `@rjsf/core`'s `RatingWidget`, `AltDateWidget` and `AltDateTimeWidget`; declare your own widget under those keys `label: 'self'` if it draws its label ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `SelectWidget` to be named by the template's label through `aria-labelledby` ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` to put its title id on a `<span>` around the title's text rather than the `Box` around the heading, with a required heading's `*` outside it, so an option selector named by it reads "Pet"; aim `#…__title` selectors at the `<span>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing an `anyOf`/`oneOf` option's repeated `ui:title` a second time, and dropping an optional array's data control along with the heading, as under `ui:label: false` ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` dropping the optional data control along with the heading, as under `ui:label: false` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` rendering an empty `FormControl` when it is given no selector, as while an optional `anyOf`/`oneOf` field has no data ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldErrorTemplate` to put `errorId()` on its list alone and no longer give each message an id (`root_x__error-0`, …); aim a selector for one message at the list's items. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` and `CheckboxesWidget` overriding the group props an author gives through `ui:options.mui` or `rjsfSlotProps` with their own `role` and `aria-*` props; a `required` or `autoFocus` in `rjsfSlotProps.radio` or `checkbox` goes on each option's `<input>` as given ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` and `CheckboxesWidget` drawing a label holding only `*` for a required field with no label text, and `@rjsf/core`'s `AltDateWidget` date parts never being drawn in the error state while the field's errors show ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Fix `SelectWidget`'s combobox having no name where no label names it, as for an untitled root `anyOf`/`oneOf` selector, now named by the field's label, placeholder or translated prompt ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxWidget` hiding the schema `description` for an empty `ui:description` ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `WrapIfAdditionalTemplate`'s key input having no name under `ui:label: false` ([#5549](https://github.com/rjsf-team/react-jsonschema-form/pull/5549), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the theme to declare its radio and checkbox groups' and slider's labels `labelPlacement: 'above'`, so a custom `ArrayFieldItemTemplate` is handed `displayLabel: true` for an item holding one, and `false` for a text input or select, whose label sits inside its outline ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538))
- Add `MuiGlobalUISchemaOptions`, typing the theme's `mui` global UI option, which the new `UiSchema` type takes inline, so a global `mui` reaches every widget, custom ones included, and every template but `ErrorList` and `SubmitButton`, outside a `LayoutGridField` too ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- Fix `ObjectFieldTemplate` showing no add button for an object naming no `additionalProperties` in a form whose `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix `FieldTemplate`'s `error` state following the field above's `ui:hideError` for an `anyOf`/`oneOf` option rather than its own ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Change `WrapIfAdditionalTemplate` to mark an additional property's key input, free-text or `propertyNames` select, `aria-invalid`, described by its row's errors and drawn invalid while the object forbids that key ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add the `keyNotAllowed` prop `FieldTemplate` hands `WrapIfAdditionalTemplate`; a custom one that spreads its leftover props onto an element should leave it out ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change an additional property's key input id to `root_foo__key` (was `root_foo-key`) and its label's to `root_foo__key__inputLabel` (was MUI's `root_foo-key-label`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- **BREAKING CHANGE:** Change the id of the `ui:options.mui.helperText` that `BaseInputTemplate` and `SelectWidget` render to `root_foo__helperText` (was `root_foo-helper-text`) and of their label to `root_foo__inputLabel` (was `root_foo-label`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- Fix `ObjectFieldTemplate` leaving an empty grid cell for a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- Change `GridTemplate` to read a column's `span` as its `size`, unless it has a `size` of its own, logging a warning that its `span` is ignored ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix a layout grid `ui:row` nested in another `ui:row` shrinking to its content rather than taking a line of its own: `GridTemplate` grows a row without a `size`, a `flex`, `flexBasis`, `flexGrow` or `width` in its `style` or `sx`, or an `sx` function, which can't be read for one, to fill its line, with a `flex` of `1 1 100%` ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Change a text input or textarea holding `false` to show that value and offer the clear button for it, where they were empty ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget` writing a number into a string field, or into each item of a range of several values whose items are strings, which then failed validation: it now writes a numeric string, as core's range input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix the multiple `SelectWidget` throwing on a `null` value ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `MuiBaseInputTemplateProps`, the props mui's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes mui's own props to ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` putting a `pattern`, `inputMode`, `accept` or `multiple` a widget passes it on the `TextField` root, where they did nothing, instead of on the `<input>`, so the file input of an array took one file at a time; a caller's `pattern` drops the numeric title ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- **BREAKING CHANGE:** Change the values of the `mui` option in the exported `UiSchema` and `MuiGlobalUiOptionsKeys` from `any` to `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- Fix a `mui` option that isn't an object landing on the control as attributes named `0`, `1`, `2` ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- Fix `FieldTemplate` dropping the `sx` and `className` of `rjsfSlotProps.fieldFormControl`: when the root option sets them too, the two `sx` are now merged, the root's winning a clash, and the two class names joined, where the root's replaced the slot's ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- Fix `BaseInputTemplate` passing a `rjsfSlotProps` option to the `TextField`, whose DOM logged a React warning for it ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Fix a required `anyOf`/`oneOf` field showing no `*` with a `null` or untitled object option selected, or one on the option rather than the field: the selector's label is marked now, and the option's isn't, though its control stays `required`. A custom widget drawing its own label marks it from `templateMarksRequired()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Change `BaseInputTemplate`, `CheckboxWidget`, `CheckboxesWidget`, `RadioWidget`, `RangeWidget` and `SelectWidget` to ignore a `disabled` in `ui:options.mui` and its slots, and an `onChange`, `onBlur` or `onFocus` wherever MUI calls it in place of the form's: editing the field never changed the form data, and `disabled: false` let a user edit a read-only field. They also ignore a `value`, or a checkbox's or radio's `checked`, that would replace the form's data, which left the field showing a value the form didn't hold. `SelectWidget` also ignores an `open` or `defaultOpen`, a `MenuProps.open`, and a `tabIndex` that reaches its combobox, while it is disabled or read-only, which let a user pick an option. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmuis-widgets-keep-the-forms-value-disabled-state-and-handlers-over-uioptionsmui-breaking-change) ([#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))
- **BREAKING CHANGE:** Fix `DescriptionField` rendering every field description, and a selected option's, as an `<h6>` heading; it renders a `div` with the same look. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmuis-descriptions-render-a-div-rather-than-an-h6-breaking-change) ([#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))
- Fix `RangeWidget` reporting its `<input>`'s string, or a range of several values' focused part, to the form's `onFocus` and `onBlur`; it reports the field's value, as the other themes do ([#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to render an object's title, description and contents inside a `div` with `role="group"` carrying the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Change `ArrayFieldTemplate` to give the element around an array's title, description and items `role="group"` and the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix `FieldErrorTemplate` drawing an empty item for an empty error message ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `RangeWidget` drawing a label holding only a required field's `*` where the field's label has no text ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `CheckboxWidget` drawing a label holding only a required field's `*` where the field's label has no text ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/react-bootstrap

- Fix the package failing to load in Node, as it imported `react-bootstrap` and `@react-icons/all-files` subpaths only bundlers resolve ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244))
- Fix the `getTestRegistry()` test helper silently dropping its templates and widgets; it now comes from `@rjsf/core/testing` ([#5272](https://github.com/rjsf-team/react-jsonschema-form/pull/5272))
- Change `BaseInputTemplate` to render a `number`/`integer` field as `<input type="text">` with a numeric `inputMode`, `pattern` and `title` rather than `<input type="number">`, which changes snapshots of numeric fields; a `pattern` or `inputMode` in `extraProps` still wins ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` support to `SelectWidget`, rendering `<optgroup>`s; a multiple select still reports its values in enum order ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Change `WrapIfAdditionalTemplate` to render an additional property's key as a `SelectWidget` of the names `propertyNames.enum` allows, reading the key from the new `keyName` prop, and fix a `deprecated` additional property offering its decoration as a key name or renaming itself to it ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Fix `BaseInputTemplate` and `SelectWidget` keeping the `is-invalid` outline under `ui:hideError`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` generic over the form data, so `<Form formData={data} />` infers `T`; the `Theme`, `Templates` and `Widgets` exports keep each component's own generic type, and `generateForm()` returns a `ThemedForm<T, S, F>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix object options in `RadioWidget` and `CheckboxesWidget` ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5317](https://github.com/rjsf-team/react-jsonschema-form/issues/5317))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value; `CheckboxesWidget` reports the focused option on focus and blur, and `SelectWidget` options no longer render an `id`, as in the other themes ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Fix `TextareaWidget` replacing a `ui:options.rows` of `0` with 5 rows; it gets the browser's default height, as `@rjsf/core`'s does ([#5387](https://github.com/rjsf-team/react-jsonschema-form/pull/5387))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each select is named by the field's label and the translated part, such as `When, year`, and described by the field's description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `SelectWidget` to put the `aria-label` and `aria-describedby` it is passed on its `<select>` ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `FieldTemplate` to render the description it is handed under a plan whatever `displayLabel` says, and without one only where `displayLabel` lets it draw the label ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `CheckboxWidget` to draw its plan's description and be described only by ids that render ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `WrapIfAdditionalTemplate` to label the key per the field's plan ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's own `ui:help` repeating its field's id in `FieldHelpTemplate`; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Change `SelectWidget` to render the selected option's description under the id the select is described by, listed in `aria-describedby` before the field's description and help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix an `anyOf`/`oneOf` option's control in `BaseInputTemplate` and `SelectWidget` not being styled invalid while the field above draws its errors ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `BaseInputTemplate`, `TextareaWidget`, `RangeWidget` and `CheckboxWidget`'s `<input>` not being `aria-invalid` while errors show, and being described by parts that don't render ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `RangeWidget` to render through `BaseInputTemplate` as a `Form.Range`, taking `htmlName` as its `name`, `ui:autofocus`, `examples` and `required`, and to be disabled when read-only ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` ignoring `ui:autofocus`; it and `CheckboxesWidget` focus the checked or first enabled option ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Fix `RadioWidget` and `CheckboxesWidget` groups having no name: the group carries the field's id and the `radiogroup` or `group` role and is named by the template's label, drawn with no `for`. Aim `label[for="root_color"]` selectors at `label:has(#root_color__label)`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget`'s group and each `CheckboxesWidget` checkbox not being `aria-invalid`, and each option being described by parts that don't render ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxesWidget` marking each of a required field's checkboxes `required`, which made the browser block submit until every option was checked ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550))
- Fix `TextareaWidget`, `RangeWidget`, `CheckboxWidget`, `RadioWidget` and `CheckboxesWidget` not looking invalid while their errors show: each takes Bootstrap's `is-invalid`. Bootstrap has no invalid `.form-range` style, so style `.form-range.is-invalid` yourself ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` marking the label of an `uncheckedIsFalse` widget required where the schema doesn't demand `true` ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` to draw the `title` it is handed rather than `ui:title`, and put its title id on a `<span>` around the title's text, with a required heading's `*` outside it, so an option selector named by it reads "Pet". Aim `div#root__title` selectors at `span#root__title`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing an `anyOf`/`oneOf` option's repeated `ui:title` a second time, and it and `ObjectFieldTemplate` dropping an optional array's or object's data control along with the heading, as under `ui:label: false` ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` rendering an empty `Card.Body` when it is given no selector, as while an optional `anyOf`/`oneOf` field has no data ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldHelpTemplate` and `FieldTemplate`'s description to render their `Form.Text` as a `<div>` rather than a `<small>`, so it can hold markdown blocks; aim `small#root__help` selectors at `div#root__help`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `@rjsf/core`'s `AltDateWidget` date parts never being drawn in the error state while the field's errors show ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- **BREAKING CHANGE:** Change `FieldTemplate`'s label to put its label id on a `<span>` around the label's text, so a group or option selector named by it is named without the `*`; aim `label#root_color__label` selectors at `label #root_color__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `WrapIfAdditionalTemplate`'s key input having no name under `ui:label: false`; the key's label names it ([#5550](https://github.com/rjsf-team/react-jsonschema-form/pull/5550), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` showing no add button for an object naming no `additionalProperties` in a form whose `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix `FieldTemplate`'s label and description danger color following the field above's `ui:hideError` for an `anyOf`/`oneOf` option rather than its own ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Change `WrapIfAdditionalTemplate` to mark an additional property's key input, free-text or `propertyNames` select, `aria-invalid`, described by its row's errors and drawn invalid (`isInvalid`) while the object forbids that key ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add the `keyNotAllowed` prop `FieldTemplate` hands `WrapIfAdditionalTemplate`; a custom one that spreads its leftover props onto an element should leave it out ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change an additional property's key input id to `root_foo__key` (was `root_foo-key`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- Change `TextareaWidget`'s `options` to be type-checked as `WidgetProps['options']`, where `rows` is a `number`, rather than `any` ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Fix `ObjectFieldTemplate` leaving a gap for a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- Change `GridTemplate` to read a column's `span` as its `xs`, unless it has an `xs` of its own, logging a warning that its `span` is ignored, and warn about a column `span` that isn't a whole number ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `SelectWidget` leaving a select no label names, such as an untitled root or array item select, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.SelectPlaceholder` ("Select ...") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix renaming an `additionalProperties` key remounting its field, which lost what its widget held, such as an `alt-date`'s partly picked date ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a text input holding `false` to show that value and offer the clear button for it, where it was empty ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `TextareaWidget` keeping its text when its value is cleared, such as by resetting the form to empty data ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change `RangeWidget`'s readout beside the slider to show a boolean value as `true` or `false`, where it showed nothing, and to separate an array's items with commas ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `BootstrapBaseInputTemplateProps`, the props the theme's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes `extraProps` to, which take `Form.Control`'s props and `data-*` attributes ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` dropping a `pattern`, `inputMode`, `accept` or `multiple` a widget passes it as a prop, so the file input of an array took one file at a time ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Change `BaseInputTemplate` to put an `accept` a widget passes in `extraProps` on the input over `ui:options.accept`, which replaced it ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `BaseInputTemplate` to put a `multiple` it is passed, in `extraProps` too, on a file input only, as `ArrayField` passes one to the widget of every multi-select, so an `email` input no longer takes several addresses. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#baseinputtemplate-puts-multiple-only-on-a-file-input-breaking-change) ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` putting `Form.Control`'s own props in `extraProps`, such as `isValid` or `htmlSize`, on the `<input>` of a range ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Fix a required `anyOf`/`oneOf` field showing two `*`s with a titled object or array option selected: only the field's label is marked now ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to render an object's title, description and contents inside a `div` with `role="group"` carrying the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Change `ArrayFieldTemplate` to give the element around an array's title, description and items `role="group"` and the field's `id`, named by the title and described by the field's errors, description and help. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-or-an-arrays-group-has-rolegroup-and-the-fields-id-breaking-change) ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Change `BaseInputTemplate` to no longer set `placeholder` or `readonly` on a range input, where neither has an effect, and to disable a read-only one instead, as `RangeWidget` does, so a read-only `inputType: 'range'` field can't be dragged either ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Fix `FieldErrorTemplate` drawing an empty item for an empty error message ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `ObjectFieldTemplate` to title an expandable object's Add button after the object's title or name, such as `Add Address`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/shadcn

- Fix the `getTestRegistry()` test helper silently dropping its templates and widgets; import it from `@rjsf/core/testing` ([#5272](https://github.com/rjsf-team/react-jsonschema-form/pull/5272))
- **BREAKING CHANGE:** Remove the compiled stylesheets, whose Tailwind preflight restyled the rest of the page, and the `tailwindcss` dependency: your own Tailwind build scans the package with `@source` and supplies the design tokens. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfshadcn-no-longer-ships-prebuilt-stylesheets-breaking-change) ([#5287](https://github.com/rjsf-team/react-jsonschema-form/pull/5287))
- Change `BaseInputTemplate` to render a `number`/`integer` field as a text input with a numeric `inputMode`, `pattern` and `title` instead of `<input type="number">`; a `pattern` or `inputMode` from `extraProps` still wins ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add `ui:options.optgroups` support to `SelectWidget`, drawing one labeled group per option group; grouping doesn't change the order a multi-select reports its values in ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301))
- Change `WrapIfAdditionalTemplate` to render an additional property's key as a `SelectWidget` of the names `propertyNames.enum` allows, and to read the key from the new `keyName` prop, so a `deprecated` property no longer offers or renames itself to its decorated label ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix `SelectWidget`'s dropdown button not taking the `id` it is passed, so a label pointing at it didn't reach the control ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Fix `BaseInputTemplate` and `SelectWidget` outlining a field as invalid under `ui:hideError`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- **BREAKING CHANGE:** Change the default `Form` export to a `ThemedForm` generic over the form data, keeping each component's own generic type, so `withTheme<MyData>(Theme)` typechecks; `generateForm()` returns a `ThemedForm<T, S, F>`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#withtheme-returns-a-themedform-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Fix the multiple `SelectWidget` with object options or the `realValue` option format, and the value the single one reports on focus and blur ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309))
- Fix `realValue` options whose `String()` matches, such as `1` and `'1'`, sharing a DOM value, and `CheckboxesWidget` not reporting the focused option on focus and blur ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Fix `WrapIfAdditionalTemplate` adding a literal `undefined` class to an additional property rendered by a custom field that passes no `classNames` ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- Fix `TextareaWidget` replacing a `ui:options.rows` of `0` with 5 rows; the textarea gets the browser's default height, as in `@rjsf/core` ([#5387](https://github.com/rjsf-team/react-jsonschema-form/pull/5387))
- Fix the multiple `SelectWidget`'s search combobox having no accessible name: it is named by the field's label, `ui:placeholder` or the translated select prompt, and gets the field's description and `aria-required` ([#5475](https://github.com/rjsf-team/react-jsonschema-form/pull/5475), [#5458](https://github.com/rjsf-team/react-jsonschema-form/issues/5458))
- Add `TranslatableString.SelectPlaceholder`, which also fills the multiple select's placeholder and an empty single select's trigger ([#5475](https://github.com/rjsf-team/react-jsonschema-form/pull/5475), [#5458](https://github.com/rjsf-team/react-jsonschema-form/issues/5458))
- **BREAKING CHANGE:** Fix `AltDateWidget`'s date parts having no accessible name: each is named by the field's label and the part, such as `When, year`, even with the label hidden, and described by the field's description, help and errors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `SelectWidget` to pass the `aria-label` and `aria-describedby` it gets to its trigger or search input ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Change `FieldTemplate` to draw the description it is handed where its plan says ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `CheckboxWidget` to draw its widget description and be described by the ids its plan renders ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `WrapIfAdditionalTemplate` to label the key per the field's plan ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the multiple `SelectWidget` to be named by the label its plan says the template draws ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix an `anyOf`/`oneOf` option's own `ui:help` repeating the field's id: `FieldHelpTemplate` renders under the help id of its field's plan; `aria-describedby` lists an option's own description and help among the field's in the order they are drawn ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- Fix an `anyOf`/`oneOf` option selector being named by the option it displays rather than its field's label: `FieldTemplate`'s label carries its plan's id, and `SelectWidget`'s button its plan's `aria-labelledby` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a required `boolean` left unchecked not submitting as `false`: `CheckboxWidget` is natively `required` only where its schema demands `true` ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget`'s selected-option description not rendering under the id the select is described by, which `aria-describedby` lists after the field's description and before its help, the order they are drawn in ([#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367))
- Fix an `anyOf`/`oneOf` option's control in `BaseInputTemplate` and `SelectWidget` not being styled invalid while the field above draws its errors ([#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the widgets' error and description attributes missing the element a user focuses: `BaseInputTemplate`, `TextareaWidget` and `CheckboxWidget`'s checkbox, rather than the `<div>` around it, are `aria-invalid` while errors show and described only by elements that render ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `RangeWidget` to put the field's id on its slider's thumb, named by the template's label through `aria-labelledby`. Aim `#root_volume` selectors at the thumb and `label[for="root_volume"]` ones at `#root_volume__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `RangeWidget` to submit under `htmlName` and focus its thumb under `ui:autofocus` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `Slider`'s `thumbProps`, passed to each thumb ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Fix `RadioWidget` and `CheckboxesWidget` groups having no name: the group's wrapper carries the field's id and the `radiogroup` or `group` role and is named by the template's label, drawn with no `for`. Aim `label[for="root_color"]` selectors at `#root_color__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` and `CheckboxesWidget` not marking the `radiogroup`, or each checkbox, `aria-invalid`, and describing each option by parts that don't render ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `RadioWidget` and `CheckboxesWidget` to focus the checked radio or first choosable option under `ui:autofocus` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `CheckboxesWidget` marking each of a required field's checkboxes `required`, which blocked submit until every option was checked ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551))
- Fix `TextareaWidget`, `RangeWidget`, `CheckboxWidget`, `RadioWidget` and `CheckboxesWidget` not looking invalid while their errors show: each takes `border-destructive`, a range's thumb included, and none does under `ui:hideError` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` not calling `onFocus` and `onBlur` as its thumb takes and loses focus ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget`'s radios having no `name`, so a native submit left the field out; they submit under `htmlName` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RangeWidget` hiding an empty range's thumb, which left a required range nothing to focus: the thumb is drawn at the minimum, but the range commits no value until a press or key leaves it there, not on a reset or a cancelled press, and submits none until it has one ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `RangeWidget` to call `ui:options.props.onValueChange` alongside the form's change handling rather than in its place ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `RadioWidget` reporting a focus and a blur of no value before reaching a radio: it calls `onFocus` and `onBlur` as each radio takes and loses focus ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `SelectWidget`'s single-select trigger to a `combobox`, `aria-invalid` while its errors show and `aria-required` where required, named by the field's label, its placeholder or the translated select prompt. Query the trigger by the `combobox` role, not `button`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfshadcns-selectwidget-names-its-combobox-and-fills-empty-placeholders-breaking-change) ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the multiple `SelectWidget`'s search input not being `aria-invalid` while its errors show ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `SelectWidget` ignoring `ui:autofocus`: it focuses the single select's trigger or the multiple select's search input ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` marking a label required for a widget declared `uncheckedIsFalse` where the schema doesn't demand `true`; it reads the marker through `templateMarksRequired()` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `TitleField` to draw the `title` it is handed rather than `ui:title`, and put its title id on a `<span>` around the title's text, with a required heading's `*` outside it, so an option selector named by it reads "Pet". Aim `div#root__title` selectors at `span#root__title`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ArrayFieldTemplate` drawing an `anyOf`/`oneOf` option's repeated `ui:title` a second time, and `ArrayFieldTemplate` and `ObjectFieldTemplate` dropping an optional array's or object's data control where they draw no heading ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `MultiSchemaFieldTemplate` laying out an empty row for a selector it isn't given, as while an optional `anyOf`/`oneOf` field has no data ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5401](https://github.com/rjsf-team/react-jsonschema-form/issues/5401), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldHelpTemplate` and `FieldTemplate`'s description to render in a `<div>` rather than a `<span>`, so they can hold markdown paragraphs; aim `span#root__help` selectors at `div#root__help`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `FieldTemplate` without a plan drawing a label holding only a required field's `*`, which named its control "star"; a `SelectWidget` no label names, its multiple search input included, is named by the field's label, its placeholder or the select prompt ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `@rjsf/core`'s `AltDateWidget` date parts, rendered through this theme's `SelectWidget`, never showing the error state while the field's errors show ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542))
- Fix the single `SelectWidget` not announcing the option the arrow keys highlight, and Enter closing it without choosing, so no option could be chosen by keyboard: its combobox points `aria-activedescendant` at the highlighted option and `aria-controls` at the open listbox ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Change `FieldTemplate`'s label to put its label id on a `<span>` around the label's text, so a group, slider or option selector named by it is named without the `*`; aim `label#root_color__label` selectors at `label #root_color__label`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `WrapIfAdditionalTemplate` to name a key input through `aria-label` where `ui:label: false` draws no label ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the single `SelectWidget` to behave as a select-only combobox: it opens on the option it holds, or the first choosable one, Down Arrow, Alt+Down Arrow and Up Arrow open it, Escape closes it and Space chooses ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change the multiple `SelectWidget` to stay closed when `ui:autofocus` focuses it, opening on a click or typing ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `TextareaWidget` losing its focus ring while its errors show; its invalid look is `border-destructive` alone ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `BaseInputTemplate` hiding the focus ring of an invalid input ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the single `SelectWidget`'s keys: Enter on a held disabled option closes without choosing, Up/Down Arrow, Ctrl+N/J/P/K and Alt+Arrow move from it to its neighbour, and an option value with surrounding whitespace can be chosen ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the multiple `SelectWidget` not opening on Down Arrow after `ui:autofocus` ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix the single `SelectWidget` calling `onChange` when the option it already holds is chosen again, and the multiple one opening its list as focus leaves it from a remove button ([#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `ObjectFieldTemplate` showing no add button for an object naming no `additionalProperties` when `additionalPropertiesWhenAbsent` is `'allow'` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix `FieldTemplate`'s label and description taking an `anyOf`/`oneOf` option's error color from the field above; they follow the field's own errors and `ui:hideError` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Change `WrapIfAdditionalTemplate` to mark an additional property's key input `aria-invalid`, described by its row's errors, while the object forbids that key ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add the `keyNotAllowed` prop `FieldTemplate` hands `WrapIfAdditionalTemplate`; a custom `WrapIfAdditionalTemplate` that spreads its leftover props onto an element should leave it out ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- **BREAKING CHANGE:** Change an additional property's key input id to `root_foo__key`, from `root_foo-key`, through the new `additionalKeyId()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626), [#5741](https://github.com/rjsf-team/react-jsonschema-form/pull/5741))
- Change `TextareaWidget`'s `options` to be type-checked as `WidgetProps['options']`, where `rows` is a `number`, rather than `any` ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Remove the `form-control` class, which the theme doesn't style, from the alt-date selects ([#5634](https://github.com/rjsf-team/react-jsonschema-form/pull/5634), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- **BREAKING CHANGE:** Change the theme to render `@rjsf/core`'s plain-HTML templates through a Tailwind `classMap`, and remove its own `FieldTemplate`, `DescriptionField`, `FieldErrorTemplate`, `FieldHelpTemplate`, `MultiSchemaFieldTemplate`, `ArrayFieldTemplate`, `ArrayFieldItemTemplate` and `ObjectFieldTemplate`; a `Form` built from `generateTemplates()` passes the new `generateClassMap()` too. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfshadcn-renders-cores-plain-html-templates-through-its-class-map-breaking-change) ([#5641](https://github.com/rjsf-team/react-jsonschema-form/pull/5641), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `data-invalid` to the label and description `CheckboxWidget` draws while the field shows its own errors, as `@rjsf/core`'s does ([#5641](https://github.com/rjsf-team/react-jsonschema-form/pull/5641), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Fix `TitleField` and `WrapIfAdditionalTemplate` giving their separators an invalid `dir='horizontal'` attribute ([#5641](https://github.com/rjsf-team/react-jsonschema-form/pull/5641), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Change `WrapIfAdditionalTemplate` to mark its field's wrapper `data-invalid` while the field shows its own errors, and a key's label `data-invalid` where the object forbids the key, as `@rjsf/core`'s does ([#5641](https://github.com/rjsf-team/react-jsonschema-form/pull/5641), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Change `WrapIfAdditionalTemplate` to mark a key's label `*` where the object's `required` names the key, as `@rjsf/core`'s does ([#5641](https://github.com/rjsf-team/react-jsonschema-form/pull/5641), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `altDateList`, `altDateListItem`, `altDateNowButton` and `altDateClearButton` to the theme's `classMap`, so core's `AltDateWidget` renders its parts in one wrapping row with outline Now and Clear buttons ([#5641](https://github.com/rjsf-team/react-jsonschema-form/pull/5641), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Fix `ObjectFieldTemplate` leaving a gap for a property hidden by `deprecatedHandling: 'hide'` or a `ui:definitions` hidden widget ([#5617](https://github.com/rjsf-team/react-jsonschema-form/pull/5617), fixes [#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507))
- Fix an array item's buttons and an additional property's key input and remove button sitting off the field's input when its label or description is taller than one line, and an additional property's key or value label with a long unbroken word, such as a `snake_case` key, pushing the key's input over the value's ([#5673](https://github.com/rjsf-team/react-jsonschema-form/pull/5673), [#5667](https://github.com/rjsf-team/react-jsonschema-form/issues/5667))
- **BREAKING CHANGE:** Change `GridTemplate` to read a column's `span` as its `grid-column` unless it has a `col-span-*` class of its own, logging a warning that its `span` is ignored, and to lay a `ui:row` without a `grid-cols-*` class or a `gridTemplateColumns`, `gridTemplateAreas`, `gridTemplate` or `grid` style out on 12 tracks, each child full width unless it spans fewer, and warn about a column `span` that isn't a whole number. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-layout-grid-row-without-a-column-template-lays-out-on-12-tracks-in-chakra-ui-fluentui-rc-and-shadcn-breaking-change) ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Fix `RadioWidget` leaving a `radiogroup` no label names, such as an untitled field's, without an accessible name; it is named by its `ui:placeholder`, else `TranslatableString.RadioGroupName` ("Choose an option") ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Fix renaming an `additionalProperties` key remounting the buttons of its value's `RadioWidget` or `CheckboxesWidget` ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- **BREAKING CHANGE:** Change `RangeWidget` to ignore `name`, `disabled`, `value` and `defaultValue` in `ui:options.props`, so the form always sets the slider's value, name and disabled state, and the widget draws one thumb. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfshadcns-rangewidget-ignores-name-disabled-value-and-defaultvalue-from-uioptionsprops-breaking-change) ([#5737](https://github.com/rjsf-team/react-jsonschema-form/pull/5737))
- Fix the multiple `SelectWidget` highlighting options that read the same, such as `1` and `'1'`, together, which left Down Arrow stuck on them and options past them out of reach; each option's `data-value`, cmdk's own attribute, which RJSF doesn't document, is now its index ([#5741](https://github.com/rjsf-team/react-jsonschema-form/pull/5741), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Fix the multiple `SelectWidget` never highlighting an option whose value is an empty string, which stopped the arrow keys moving past it, and leaving that option out of its search ([#5741](https://github.com/rjsf-team/react-jsonschema-form/pull/5741))
- Fix the single `SelectWidget` with `optionValueFormat: 'realValue'` highlighting options whose values differ only in leading or trailing whitespace together, which left Down Arrow stuck on them and options past them out of reach; each option's `data-value`, cmdk's own attribute, which RJSF doesn't document, is now its index ([#5741](https://github.com/rjsf-team/react-jsonschema-form/pull/5741), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Fix the multiple `SelectWidget`'s options pointing `aria-labelledby` and `aria-controls` at ids no element has, since cmdk replaces the id each is given ([#5741](https://github.com/rjsf-team/react-jsonschema-form/pull/5741))
- Fix the text input rendering a stray `0` beside it when its value is `0` and `allowClearTextInputs` is set ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change a text input holding `false` to show that value and offer the clear button for it, where it was empty ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `RangeWidget` writing a number into a string field, which then failed validation: it now writes a numeric string, as core's range input does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix the multiple `SelectWidget` throwing on a value that isn't an array: it now reads a lone value as one selected item, as core does ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change the alt-date and alt-datetime widgets to show a number or `Date` value as empty, where they showed that date, since they can only write a string back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Change `RangeWidget`'s readout beside the slider to show a boolean value as `true` or `false`, where it showed nothing, and to separate an array's items with commas ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `ShadcnBaseInputTemplateProps`, the props the theme's `BaseInputTemplate` takes, to type the registry's `BaseInputTemplate` a widget passes `extraProps` to, which take input and `data-*` attributes ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` dropping a `pattern`, `inputMode`, `accept` or `multiple` a widget passes it as a prop, so the file input of an array took one file at a time ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `WrapIfAdditionalTemplate` leaving the key input and the remove button enabled for a property it is handed no rename or remove callback for, such as the root ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Change `BaseInputTemplate` to put an `accept` a widget passes in `extraProps` on the input over `ui:options.accept`, which replaced it ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `BaseInputTemplate` to put a `multiple` it is passed, in `extraProps` too, on a file input only, as `ArrayField` passes one to the widget of every multi-select, so an `email` input no longer takes several addresses. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#baseinputtemplate-puts-multiple-only-on-a-file-input-breaking-change) ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `BaseInputTemplate` replacing its `className` and error border with a `className` in `extraProps`: it now keeps all three ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Fix `RangeWidget` for an Ajv `$data` reference in `minimum`, `maximum` or `multipleOf`, which set the range's bound or step to the object and now leaves it at its default, and read a numeric-string bound such as `minimum: '5'` as its number ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `WrapIfAdditionalTemplate` to read `ADDITIONAL_PROPERTY_FLAG` by its truth rather than its presence, so a schema with it set to `undefined` or `false` renders as a plain field, with no key input or remove button. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#additional_property_flag-counts-only-when-set-to-a-truthy-value-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Fix a required `anyOf`/`oneOf` field showing two `*`s with a titled object or array option selected: only the field's label is marked now ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Fix `CheckboxesWidget` giving a screen reader no cue that a checked box is required: a required group whose `minItems` is at least 1, or with `ui:required: true`, is now named with "required", and a required group with neither, which submits `[]`, no longer shows a `*`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- **BREAKING CHANGE:** Change the multiple `SelectWidget`'s search input to take its field's id, so its label and `focusOnFirstError` focus it, and to open its list on a click, typing, an arrow key or Enter rather than on focus. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfshadcns-multiple-selectwidget-takes-its-fields-id-and-opens-only-on-user-action-breaking-change) ([#5764](https://github.com/rjsf-team/react-jsonschema-form/pull/5764), [#5478](https://github.com/rjsf-team/react-jsonschema-form/issues/5478), [#5492](https://github.com/rjsf-team/react-jsonschema-form/issues/5492))
- Fix the multiple `SelectWidget` saying it is expanded while closed, its keys, Escape and clicks beside its input misbehaving, and Escape closing a Radix `Dialog` or `Sheet` it is in ([#5764](https://github.com/rjsf-team/react-jsonschema-form/pull/5764), [#5478](https://github.com/rjsf-team/react-jsonschema-form/issues/5478), [#5492](https://github.com/rjsf-team/react-jsonschema-form/issues/5492))
- Fix the single `SelectWidget` opening an empty popup when it has no options, and staying expanded, pointing at options that are gone, when its options empty or it turns disabled or readonly while it is open, and Escape on its open list also closing a Radix `Dialog` or `Sheet` the form is in ([#5764](https://github.com/rjsf-team/react-jsonschema-form/pull/5764), [#5478](https://github.com/rjsf-team/react-jsonschema-form/issues/5478))
- Fix the multiple `SelectWidget`'s button removing a selected item having no accessible name, which it now takes from `TranslatableString.RemoveItemButton` with the item's label ([#5793](https://github.com/rjsf-team/react-jsonschema-form/pull/5793), [#5592](https://github.com/rjsf-team/react-jsonschema-form/issues/5592))
- Fix `ArrayFieldTemplate` and `ObjectFieldTemplate` leaving an object's or an array's group undescribed by the field's errors, description and help ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Fix `SelectWidget` rendering a hidden label whose `for` named an input that isn't on the page ([#5807](https://github.com/rjsf-team/react-jsonschema-form/pull/5807), [#5802](https://github.com/rjsf-team/react-jsonschema-form/issues/5802))
- **BREAKING CHANGE:** Fix `SelectWidget`'s list of options being named "Suggestions": it is now named by the field's label, else its `ui:placeholder`, else "Select ...". See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfshadcns-selectwidget-names-its-list-of-options-by-the-fields-label-breaking-change) ([#5807](https://github.com/rjsf-team/react-jsonschema-form/pull/5807), [#5792](https://github.com/rjsf-team/react-jsonschema-form/issues/5792))
- **BREAKING CHANGE:** Fix a required multiple `SelectWidget` blocking a submit of the `[]` its schema accepts: an array rendered as one widget holding `[]` is now required, and shows a `*`, only where its `minItems` is at least 1 or `ui:required: true` asks for it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add support for importing and rendering `Form` from a React Server Component, such as a Next.js App Router page, without wrapping it in a `'use client'` module of your own ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix `BaseInputTemplate` letting a read-only `inputType: 'range'` field be dragged, as a browser ignores `readonly` on a range input: it is disabled instead, as `@rjsf/core`'s is, and no longer gets a `placeholder`, which a range ignores too ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `AddButton` to an icon button titled `Add Item`, without its visible `Add Item` text, so that an expandable object's Add button, titled after the object's title or name, such as `Add Address`, matches. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#add-buttons-are-titled-add-item-or-after-their-object-breaking-change) ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))

## @rjsf/snapshot-tests

- Add `formTests` cases for typeless `oneOf`/`anyOf` constants (string, mixed-type, nested and boolean), which give a theme running `formTests` new snapshots ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- Add `themeTests()`, checking that `generateTemplates()`, `generateWidgets()` and `generateTheme()` build new maps on every call while their `memo()`/`forwardRef()` components stay the same instance, and that `generateTheme()` holds every template and widget they return, and accepts a theme whose `generateWidgets` is `null` ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311), [#5635](https://github.com/rjsf-team/react-jsonschema-form/pull/5635), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `hideErrorTests()`, failing any theme widget that still signals invalid under `ui:hideError`, with an optional `fixtures` argument for widgets it has no schema for ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- Change the suites to no longer mock `getTestIds`: a theme using them adds `@rjsf/snapshot-tests/setup` to its vitest `setupFiles`, and `server: { deps: { inline: [/@rjsf\//] } }` ([#5370](https://github.com/rjsf-team/react-jsonschema-form/pull/5370), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5599](https://github.com/rjsf-team/react-jsonschema-form/issues/5599))
- Add `realValue` select and radio cases with options sharing a `String()`, and make `@rjsf/validator-ajv8` a peer dependency ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Add `altDateTests()`, checking each `AltDateWidget` and `AltDateTimeWidget` part's accessible name, including through `translateString`, its description, the Now and Clear buttons' states, and that an unset part reaches `onFocus` and `onBlur` as `undefined` ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5604](https://github.com/rjsf-team/react-jsonschema-form/pull/5604), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357), [#5378](https://github.com/rjsf-team/react-jsonschema-form/issues/5378))
- Add an `arrayTests` case for an array whose items are named by the `itemLabel` option ([#5474](https://github.com/rjsf-team/react-jsonschema-form/pull/5474))
- Add `deprecatedLabelTests()`, checking that a deprecated field's label carries the Deprecated marker once wherever it is drawn ([#5579](https://github.com/rjsf-team/react-jsonschema-form/pull/5579), [#5329](https://github.com/rjsf-team/react-jsonschema-form/issues/5329))
- Add `selectedOptionDescriptionTests()`, checking that a `SelectWidget` shows its selected option's description exactly where it describes the select, with and without a plan, and that one without a plan keeps its caller's `aria-label` and description ids ([#5585](https://github.com/rjsf-team/react-jsonschema-form/pull/5585), [#5505](https://github.com/rjsf-team/react-jsonschema-form/issues/5505))
- Add `checkboxLabelTests()`, checking that a boolean's label and description are drawn once, its checkbox named by its label, however `ui:widget` names it, and where its plan draws them ([#5588](https://github.com/rjsf-team/react-jsonschema-form/pull/5588), [#5389](https://github.com/rjsf-team/react-jsonschema-form/issues/5389))
- Add `fallbackDescriptionTests()`, checking that the fallback UI's description is drawn once, by the field, when `ui:field` names `FallbackField` or nothing, that a boolean's label and description stay put however `ui:widget` names its checkbox, and that a boolean radio's are where a text input's are ([#5588](https://github.com/rjsf-team/react-jsonschema-form/pull/5588), [#5389](https://github.com/rjsf-team/react-jsonschema-form/issues/5389), [#5734](https://github.com/rjsf-team/react-jsonschema-form/pull/5734), [#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739), [#5581](https://github.com/rjsf-team/react-jsonschema-form/issues/5581))
- Add `optionErrorStateTests(Form, isMarked)`, checking that an `anyOf` option's error state follows its own errors and `ui:hideError` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Add `wrapIfAdditionalErrorStateTests()`, checking that a theme's `FieldTemplate` hands its `WrapIfAdditionalTemplate` the field's `hasErrors` ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Add an `objectTests` case for a key matching none of the `patternProperties` beside `additionalProperties: false`, whose row says the key is not allowed ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add `submitPendingTests()`, checking that the theme's `SubmitButton` is `aria-disabled` but enabled while a promise `onSubmit` returned is pending, idle once it settles, and that a click on it while pending is canceled ([#5649](https://github.com/rjsf-team/react-jsonschema-form/pull/5649))
- Add `renderGridColumn()`, which renders a one-column layout grid with the given `ui:col` and `ui:row` props, for a theme's tests of how its `GridTemplate` reads them ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Add `controlNameTests()`, checking that a `SelectWidget` or a `RadioWidget`'s `radiogroup` no label names is named by its `ui:placeholder`, else the translated prompt, and that one its label names takes no `aria-label` ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Add `renamedKeyTests()`, checking that renaming an `additionalProperties` key keeps its field and sends focus on to it ([#5733](https://github.com/rjsf-team/react-jsonschema-form/pull/5733), [#5595](https://github.com/rjsf-team/react-jsonschema-form/issues/5595))
- Add `clearButtonTests()`, which checks that a theme's `allowClearTextInputs` clear button shows for a value, `false` in a text input among them, renders nothing beside the input for `0`, and isn't offered for `false` in a number input or a string that isn't a date in a date input, which show nothing ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `callerInputPropsTests()`, checking that a theme's `BaseInputTemplate` puts the `pattern`, `accept` and `inputMode` a widget passes on the input over the derived ones, drops the numeric title with a replaced `pattern`, accepts a decimal on the input of a `number` field a widget passes an `inputMode` or `onChangeOverride`, and puts `multiple` on the file input of an array and on no other input, and `wrapIfAdditionalCallbackTests()`, checking that a theme's `WrapIfAdditionalTemplate` disables the key input and the remove button of a property it is handed no rename or remove callback for, or of a disabled or read-only form ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Add `wrapIfAdditionalFlagTests()`, which checks that a theme's `WrapIfAdditionalTemplate` draws the key input and the remove button for a field whose `ADDITIONAL_PROPERTY_FLAG` is set, and the field alone for one whose flag is `undefined` or `false` ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Add `requiredCueTests()`, which pins that a required `anyOf`/`oneOf` field, group of checkboxes or multiple select gives one required cue in a theme, and that a `CheckboxWidget` rendered without a plan is natively `required` only where the schema demands `true` and draws no label holding only the `*` where it has no label text ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Add a `checkboxLabelTests()` case for a `checkbox` on a string with a string `const`, checking that its label and description are drawn once, where a boolean checkbox's are, and that checking it writes the `const` and unchecking it clears the field ([#5753](https://github.com/rjsf-team/react-jsonschema-form/pull/5753), [#3882](https://github.com/rjsf-team/react-jsonschema-form/issues/3882))
- Add `presentationContractTests()`, checking that every widget, a `oneOf`, an `anyOf` rendering no option, an array, a multiple select, an object, the fallback UI and a type list holding an object in either order, clean and errored, give each control one accessible name, draw one description, help and error, tie each error to an element that it describes, mark `aria-invalid` only the control an error describes, or its radio group, and only while errored, never a container's group, keep a container's own error from moving focus into its fields, and leave no ARIA or `label[for]` id dangling or repeated, and break none of the WCAG A and AA rules axe-core can decide in jsdom, with an `exempt` selector for known breaks ([#5793](https://github.com/rjsf-team/react-jsonschema-form/pull/5793), [#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5881](https://github.com/rjsf-team/react-jsonschema-form/pull/5881), [#5592](https://github.com/rjsf-team/react-jsonschema-form/issues/5592), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))

## @rjsf/utils

- **BREAKING CHANGE:** Remove the merging of a widget component's `defaultProps.options` into the options it renders with, the `MergedWidget` property of the `Widget` type and the `react-is` dependency; set option defaults inside the widget. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-defaultprops-support-on-widgets-breaking-change) ([#5258](https://github.com/rjsf-team/react-jsonschema-form/pull/5258), [#4907](https://github.com/rjsf-team/react-jsonschema-form/issues/4907))
- **BREAKING CHANGE:** Change `TranslatableString` from an `enum` to an `as const` object with a same-named union type: values and member access are unchanged, but a member used as a type needs `typeof`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#gridtype-operators-and-translatablestring-are-as-const-objects-breaking-change) ([#5244](https://github.com/rjsf-team/react-jsonschema-form/pull/5244), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674))
- **BREAKING CHANGE:** Change `ObjectFieldTemplatePropertyType` to be generic (`<T, S, F>`), with `content` typed so `content.props.schema` typechecks under React 19's types. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#objectfieldtemplatepropertytype-breaking-change) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260))
- **BREAKING CHANGE:** Remove the deprecated `getUsedFormData()`, `getFieldNames()`, `removeOptionalEmptyObjects()` (use `omitExtraData`), `toPathSchema()`, the `PathSchema` type and `SchemaUtils`' `toPathSchema()`, and `UiSchema`'s `'ui:rootFieldId'` (use `Form`'s `idPrefix`). See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-deprecated-apis-breaking-change) ([#5262](https://github.com/rjsf-team/react-jsonschema-form/pull/5262))
- **BREAKING CHANGE:** Remove the `Experimental_`/`experimental_` prefix: the types are `DefaultFormStateBehavior`, `ArrayMinItems` and `CustomMergeAllOf`, and the schema utilities take `defaultFormStateBehavior` and `customMergeAllOf`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#removal-of-the-experimental_experimental_-prefix-breaking-change) ([#5267](https://github.com/rjsf-team/react-jsonschema-form/pull/5267))
- Add `offsetTimeToLocalTime()`, `padTimeSeconds()` and the `useTimeWidgetProps()` hook built on them, which the `TimeWidget`s of `@rjsf/core`, `@rjsf/daisyui` and `@rjsf/mantine` share for an offset-free display value and a `computeTimeValue()` for `onChange` ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `getDateTimeLocalValue()`, used by the `DateTimeWidget`s of `@rjsf/core`, `@rjsf/antd` and `@rjsf/mantine`, which reads a string, an epoch number or a `Date`, hides a stored value's offset and reads a bare day as the start of that day for `format: "iso-date-time"`, and returns `requiresOffset`, true for `date-time`/`datetime` ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#5397](https://github.com/rjsf-team/react-jsonschema-form/pull/5397), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930), [#5393](https://github.com/rjsf-team/react-jsonschema-form/issues/5393), [#5772](https://github.com/rjsf-team/react-jsonschema-form/pull/5772), [#5759](https://github.com/rjsf-team/react-jsonschema-form/issues/5759))
- Change a `format: "iso-time"` field to render `TimeWidget` and a `format: "iso-date-time"` field `DateTimeWidget` ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- **BREAKING CHANGE:** Add the required `MarkdownTemplate` to `TemplatesType`, with its `MarkdownTemplateProps` type; `enableMarkdownInDescription` and `enableMarkdownInHelp` control the registered renderer. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#markdown-is-an-opt-in-template) ([#5263](https://github.com/rjsf-team/react-jsonschema-form/pull/5263))
- **BREAKING CHANGE:** Change the `UnsupportedFieldWithId`, `UnsupportedFieldWithReason`, `UnsupportedFieldWithIdAndReason` and `FilesInfo` translatable strings to contain no markdown, so they read the same with or without a `MarkdownTemplate`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#markdown-is-an-opt-in-template) ([#5263](https://github.com/rjsf-team/react-jsonschema-form/pull/5263), [#5891](https://github.com/rjsf-team/react-jsonschema-form/pull/5891))
- **BREAKING CHANGE:** Fix `mergeObjects()` and `mergeSchemas()` throwing on a truthy primitive left-hand value, or mixing an array's indices into the result, where the right-hand value is an object, which now replaces it; both require an object first argument and throw on an `undefined` or `null` one when the second has keys. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#mergeobjects-and-mergeschemas-require-an-object-first-argument-breaking-change) ([#5281](https://github.com/rjsf-team/react-jsonschema-form/pull/5281))
- **BREAKING CHANGE:** Fix `ErrorSchema<T>` and `FormValidation<T>` describing the wrong shape for every non-object value; both now describe what `toErrorSchema()` and `createErrorHandler()` build, for leaves, arrays, tuples and a non-object root. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#errorschemat-and-formvalidationt-node-shapes-breaking-change) ([#5278](https://github.com/rjsf-team/react-jsonschema-form/pull/5278))
- **BREAKING CHANGE:** Change `UiSchema<T>` to check field names against `T`, so a misspelled or removed field is a compile error wherever `T` is known; bare `UiSchema` and `UiSchema<any>` accept any key, and `ui:` keys stay open. A function under `additionalProperties`, such as `items: (item) => item.label`, gets `unknown` data where `T` has no index signature. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uischemat-checks-field-names-breaking-change) ([#5279](https://github.com/rjsf-team/react-jsonschema-form/pull/5279), [#5680](https://github.com/rjsf-team/react-jsonschema-form/pull/5680))
- Change `useFileWidgetProps`' `handleChange` to accept `FileList | File[]` ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- Fix `useFileWidgetProps`' `handleChange` keeping a multi-file widget's files when its input is cleared: an empty selection reports `[]` when `multiple` and `undefined` otherwise ([#5285](https://github.com/rjsf-team/react-jsonschema-form/pull/5285))
- **BREAKING CHANGE:** Remove `toFieldPathId()` and the `FieldPathId` type for the branded `FieldPath` string, built with `toFieldPath()` and read with `fieldPathToList()`, `fieldPathToId()`, `fieldPathToName()` and `fieldPathEndsWithIndex()`; `titleId()`, `descriptionId()`, `helpId()`, `errorId()`, `examplesId()`, `buttonId()` and `optionalControlsId()` take only a `string` id. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#field-identity-is-a-fieldpath-string-instead-of-a-fieldpathid-object-breaking-change) ([#5280](https://github.com/rjsf-team/react-jsonschema-form/pull/5280), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- **BREAKING CHANGE:** Remove `useDeepCompareMemo()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#field-identity-is-a-fieldpath-string-instead-of-a-fieldpathid-object-breaking-change) ([#5280](https://github.com/rjsf-team/react-jsonschema-form/pull/5280), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- Add `fieldPathFromList()` and `expandButtonId()` ([#5280](https://github.com/rjsf-team/react-jsonschema-form/pull/5280), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- **BREAKING CHANGE:** Change `ui:emptyValue` to apply whenever a field is blank, on first render and after a reset too, array items and added properties included; `getDefaultFormState()` takes a trailing `uiSchema`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uiemptyvalue-extended-scope-breaking-change) ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885))
- Add `ui:initialValue`, which pre-fills a field over `schema.default` ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983))
- Add `ui:required`, which sets a field's required status from the uiSchema (`false` only hides the marker), enforced through `getUiRequiredErrorSchema()`, which also reports `[]` on an array rendered as one widget, such as a group of checkboxes or a multiple select, and reads the `anyOf`/`oneOf` option shown and any option inside it, whose `ui:required` defaults to the field's, a truthy value such as `1` or `'false'` counting as `true` ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744), [#5918](https://github.com/rjsf-team/react-jsonschema-form/pull/5918), [#5894](https://github.com/rjsf-team/react-jsonschema-form/issues/5894))
- Add `StrictUiSchema<Checks, T, S, F>`, an opt-in `UiSchema` that narrows `ui:widget`, `ui:field` and `ui:options` to the values valid for each field's type, with a theme's `Checks`, such as `@rjsf/core`'s `CoreUiOptionsChecks`, built from `UiOptionsCheck` ([#5275](https://github.com/rjsf-team/react-jsonschema-form/pull/5275), [#5372](https://github.com/rjsf-team/react-jsonschema-form/pull/5372), [#4916](https://github.com/rjsf-team/react-jsonschema-form/issues/4916))
- **BREAKING CHANGE:** Remove `shouldRender()`, `shallowEquals()`, the `ComponentUpdateStrategy` type and `GlobalFormOptions`' `experimental_componentUpdateStrategy`; extend `PureComponent`, or use `shallowEqual` from `fast-equals`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#shallow-comparison-replaces-experimental_componentupdatestrategy-breaking-change) ([#5297](https://github.com/rjsf-team/react-jsonschema-form/pull/5297), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- Add `replaceEqualDeep(prev, next, derivedFrom?)`, which returns `next` with every subtree deep-equal to `prev` replaced by `prev`'s, comparing React elements by type, key and props, and keeps the subtrees `next` still holds from `derivedFrom` without comparing them ([#5297](https://github.com/rjsf-team/react-jsonschema-form/pull/5297), [#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#5653](https://github.com/rjsf-team/react-jsonschema-form/pull/5653), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- Change `SchemaUtils.retrieveSchema()` to cache its last call per schema and share unchanged subtrees, so treat retrieved schemas as immutable ([#5297](https://github.com/rjsf-team/react-jsonschema-form/pull/5297), [#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#5217](https://github.com/rjsf-team/react-jsonschema-form/issues/5217))
- **BREAKING CHANGE:** Fix `getSchemaType()` returning `undefined` for a typeless schema whose `const` is falsy, which rendered it as an unsupported field; a typeless `{ const: null }` now renders through `NullField`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-typeless-oneofanyof-of-constants-now-renders-as-a-select-breaking-change) ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- Fix `enumOptionSelectedValue()` in the `realValue` format never matching a selected `null` or object value to its option; a `null` option still isn't selectable in that format ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- Fix `enumOptionSelectedValue()` reporting no selection when the selected value equals the widget's `emptyValue`, so an option carrying `null` or `''` never showed as selected ([#5305](https://github.com/rjsf-team/react-jsonschema-form/pull/5305), [#4666](https://github.com/rjsf-team/react-jsonschema-form/issues/4666))
- **BREAKING CHANGE:** Change the input props a `number`/`integer` field gets, from `getBaseInputProps()`, to a text input with a numeric `inputMode` and `pattern` instead of `<input type="number">`; `ui:options.inputType` or the `updown` widget still give a native one. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#numberinteger-fields-no-longer-render-a-native-input-typenumber-by-default-breaking-change) ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038))
- Add the `NumberInputTitle`/`IntegerInputTitle` strings, which plain-input themes set as `title` ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303), [#4038](https://github.com/rjsf-team/react-jsonschema-form/issues/4038), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Fix `mergeObjects()` reading an inherited member for a JSON-sourced `__proto__` or `constructor` key, and replacing the result's prototype when merging a `__proto__` key ([#5303](https://github.com/rjsf-team/react-jsonschema-form/pull/5303))
- Add `groupEnumOptions()`, `isEnumOptionsGroup()`, `flattenGroupedOptions()` and the `optgroups` `ui:options` key, which every theme's `SelectWidget` shares for grouping options ([#5301](https://github.com/rjsf-team/react-jsonschema-form/pull/5301), [#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Add the `AdditionalPropertyKeySelect` component, which renders an additional property's key as the theme's `SelectWidget` over the names `propertyNames.enum` allows, named by an `aria-label` from the key's label unless its template passes `labelledByTemplate`, and the `propertyNamesEnum` prop on `FieldTemplateProps`/`WrapIfAdditionalTemplateProps` ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change an object's add button to hide once every name `propertyNames.enum` allows is taken, as at the `maxProperties` limit ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Add `getFreePropertyNames()`, returning the `propertyNames.enum` names no property or form data key holds (none for an `enum` allowing no name), which the add button and handler share, and export `getMatchingPatternProperties()` ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- **BREAKING CHANGE:** Add the required `keyName` prop to `FieldTemplateProps`/`WrapIfAdditionalTemplateProps`, the property's own undecorated name. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#fieldtemplateprops-gains-a-required-keyname-breaking-change) ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Fix a `deprecated` `additionalProperties` key showing, and being renamed to, its decorated label ([#5321](https://github.com/rjsf-team/react-jsonschema-form/pull/5321), [#4682](https://github.com/rjsf-team/react-jsonschema-form/issues/4682))
- Add `hasVisibleErrors()`, whether a widget has errors to show, none under `ui:hideError`, and `VisibleErrorsProps`, both deprecated on arrival in favor of `getErrorsToDraw()`, `hasWidgetErrors()` or a template's `hasErrors` prop ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#5590](https://github.com/rjsf-team/react-jsonschema-form/pull/5590), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684), [#5325](https://github.com/rjsf-team/react-jsonschema-form/issues/5325), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `errorSchema` to `FieldTemplateProps`, so a `FieldTemplate` that renders errors itself can reach those `ui:hideError` keeps out of `rawErrors` ([#5324](https://github.com/rjsf-team/react-jsonschema-form/pull/5324), [#3684](https://github.com/rjsf-team/react-jsonschema-form/issues/3684))
- Add `getUnionTypes()`, reporting the types a schema allows when it allows more than one, and the `JSON_SCHEMA_TYPES` constant ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Change `retrieveSchema()` to keep what `additionalProperties` says about an unconstrained additional property's value, so `additionalProperties: { enum: ['a', 'b'] }` renders as a select in every form, and mark its stub with the new `GUESSED_TYPE_FLAG` ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- Change `sanitizeDataForNewSchema()` to keep an additional property's value when its guessed type changes, clearing it only when a newly declared type rejects it ([#5323](https://github.com/rjsf-team/react-jsonschema-form/pull/5323), [#5238](https://github.com/rjsf-team/react-jsonschema-form/issues/5238))
- **BREAKING CHANGE:** Change the generic defaults from `any`: `T` defaults to `unknown` and `F` to `FormContextType`, and slots take components through the new `SlotComponent<P>`, so a `Widget`, `Field` or template no longer fits a `ComponentType` annotation. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#generic-defaults-are-unknown-instead-of-any-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- **BREAKING CHANGE:** Remove `ValidatorType`'s `T` parameter, so it is `ValidatorType<S, F>` and one validator fits every typed `Form`; `validateFormData<T>()` takes the data type per call, and `createSchemaUtils<MyData>()` takes `T` from you. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validatortype-and-customizevalidator-take-the-schema-as-their-first-type-argument-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix the `help` option of `ui:options`, and `ui:help`, being typed `string`; it accepts `string | ReactElement` ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- **BREAKING CHANGE:** Change `@rjsf/utils` to log each schema and uiSchema warning or error only once, through the new `logOnce()`, so a test asserting on a warning needs the new `resetLogOnce()` before each test. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#each-rjsf-warning-is-logged-once-breaking-change) ([#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Change the `retrieveSchema()` `dependencies` `oneOf` warning to name its dependency ([#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Fix `getClosestMatchingOption()` overflowing the stack on an option holding a recursive `$ref`, which crashed `MultiSchemaField`, `getDefaultFormState()` and `omitExtraData()` over a self-referencing definition ([#5353](https://github.com/rjsf-team/react-jsonschema-form/pull/5353), [#5337](https://github.com/rjsf-team/react-jsonschema-form/issues/5337))
- Fix `getClosestMatchingOption()` scoring a missing or `null` `$ref` value, and a property named like an `Object.prototype` member against the inherited value ([#5353](https://github.com/rjsf-team/react-jsonschema-form/pull/5353), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5337](https://github.com/rjsf-team/react-jsonschema-form/issues/5337))
- **BREAKING CHANGE:** Change `FieldTemplateProps.rawHelp` to `string | ReactElement`, carrying a React element `ui:help` where it was `undefined`, so code using it as a string must narrow it first. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#fieldtemplatepropsrawhelp-carries-an-element-uihelp-breaking-change) ([#5351](https://github.com/rjsf-team/react-jsonschema-form/pull/5351), [#5326](https://github.com/rjsf-team/react-jsonschema-form/issues/5326))
- Remove the `jsonpointer` dependency; a `#/__proto__` `$ref` no longer resolves to `Object.prototype` unless the schema has its own `__proto__` key ([#5314](https://github.com/rjsf-team/react-jsonschema-form/pull/5314), [#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Remove the `fast-uri` dependency; `$ref`/`$id` URIs resolve with the platform `URL` parser, so relative refs such as `../other.json` against a relative base now resolve, percent-encoded unreserved characters compare as decoded, and `urn:` identifiers compare case-sensitively ([#5313](https://github.com/rjsf-team/react-jsonschema-form/pull/5313))
- Change `rawErrors` to be declared on `ContainerFieldTemplateProps` instead of `ArrayFieldTemplateProps`, so `ObjectFieldTemplateProps` has it too ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- Add an optional `id` to `MultiSchemaFieldTemplateProps`, the id of the field whose option is selected ([#5354](https://github.com/rjsf-team/react-jsonschema-form/pull/5354), [#5332](https://github.com/rjsf-team/react-jsonschema-form/issues/5332))
- **BREAKING CHANGE:** Change every reader of a schema's options to read `anyOf` before `oneOf`, and to treat a select over object or array constants as one value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-typeless-oneofanyof-of-constants-now-renders-as-a-select-breaking-change) ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5827](https://github.com/rjsf-team/react-jsonschema-form/pull/5827), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309), [#5817](https://github.com/rjsf-team/react-jsonschema-form/issues/5817))
- Add `enumOptionValueLabel()`, `getXxxOfKey()`, `isConstantOptionList()`, `isConstantSelect()`, `isWholeValueSelect()` and `useSelectFocusHandlers()` ([#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350), [#5309](https://github.com/rjsf-team/react-jsonschema-form/issues/5309))
- Add `getOptionalDataControlsType()` ([#5361](https://github.com/rjsf-team/react-jsonschema-form/pull/5361), [#5316](https://github.com/rjsf-team/react-jsonschema-form/issues/5316))
- Fix an empty `anyOf: []`/`oneOf: []` counting as an option list, so `isSelect()` no longer counts one as a select, a typed object or array beside one gets the Optional Data Controls and its own defaults, and `getDefaultFormState()` keeps data beside one or an `enum: []` ([#5361](https://github.com/rjsf-team/react-jsonschema-form/pull/5361), [#5675](https://github.com/rjsf-team/react-jsonschema-form/pull/5675), [#5316](https://github.com/rjsf-team/react-jsonschema-form/issues/5316), [#5365](https://github.com/rjsf-team/react-jsonschema-form/issues/5365))
- Change `getUiRequiredErrorSchema()` to skip an object option's `ui:required` fields while its value is `{}` ([#5361](https://github.com/rjsf-team/react-jsonschema-form/pull/5361), [#5316](https://github.com/rjsf-team/react-jsonschema-form/issues/5316))
- Add `fieldLabelId(id)`, the id of the label a `FieldTemplate` renders above a field, for a group of controls to point `aria-labelledby` at ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5551](https://github.com/rjsf-team/react-jsonschema-form/pull/5551), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- **BREAKING CHANGE:** Change `getDisplayLabel()` to read a `boolean` field's widget from the reduced ui options, so `ui:options: { widget: 'radio' }` gets a label, and naming `CheckboxWidget` returns `displayLabel: false` instead of a second label. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getdisplaylabel-reads-a-booleans-widget-from-the-reduced-ui-options-breaking-change) ([#5356](https://github.com/rjsf-team/react-jsonschema-form/pull/5356), [#5318](https://github.com/rjsf-team/react-jsonschema-form/issues/5318))
- Add `getSchemaOwnTypes()`, which returns the JSON Schema types a schema says its value has, or `undefined` when it says nothing; `@rjsf/core`'s fallback UI reads it ([#5362](https://github.com/rjsf-team/react-jsonschema-form/pull/5362), [#5333](https://github.com/rjsf-team/react-jsonschema-form/issues/5333))
- Fix `retrieveSchema()` choosing the wrong `if`/`then`/`else` branch when the form data is `0`, `false` or `''` ([#5369](https://github.com/rjsf-team/react-jsonschema-form/pull/5369))
- Fix `getClosestMatchingOption()` ignoring a `0`, `false` or `''` value when scoring options, whether against a `const` or under a nested `oneOf`/`anyOf` ([#5369](https://github.com/rjsf-team/react-jsonschema-form/pull/5369))
- Fix `useAltDateWidgetProps()`'s Clear button leaving a partially filled date in place; completing a date, Clear and Now drop the partial selection, so a parent that rejects or delays the value shows its own value ([#5381](https://github.com/rjsf-team/react-jsonschema-form/pull/5381))
- Fix `getDefaultFormState()` for a non-object schema with an object `default`: string form data or a `const` is returned as is instead of spread into index keys, a number or boolean is kept instead of replaced by `{}`, and a string the schema rejects gives the `default` ([#5386](https://github.com/rjsf-team/react-jsonschema-form/pull/5386))
- **BREAKING CHANGE:** Remove `enumOptionValueEncoder()` in favor of the new `enumOptionsDomValues()`, which gives `realValue` options whose `String()` matches, such as `1` and `'1'`, distinct DOM values. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#enumoptionvalueencoder-is-removed-in-favor-of-enumoptionsdomvalues-breaking-change) ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Add `getExampleSuggestions()`, which every theme's `BaseInputTemplate` uses and which returns the same frozen `readonly string[]` for the same schema object, so copy it to sort or add to it; `examples` or a `default` edited in place afterwards is not seen ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5508](https://github.com/rjsf-team/react-jsonschema-form/pull/5508), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Add `useOptionFocusHandlers()`, which every theme's `CheckboxesWidget` uses ([#5400](https://github.com/rjsf-team/react-jsonschema-form/pull/5400), [#5315](https://github.com/rjsf-team/react-jsonschema-form/issues/5315))
- Change `optionsList()` to take an optional `fallbackLabel` for an option nothing else names, and fix it offering only `undefined` values for a select of constants under a `discriminator` or `ui:optionsSchemaSelector` ([#5364](https://github.com/rjsf-team/react-jsonschema-form/pull/5364), [#5319](https://github.com/rjsf-team/react-jsonschema-form/issues/5319))
- **BREAKING CHANGE:** Change every validator-based schema function, `createSchemaUtils()` and `computeSkipPopulate()` included, to take a `SchemaContext` (`validator`, `customMergeAllOf`, `defaultFormStateBehavior`) in place of the `validator` and separate settings. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfutils-schema-functions-take-a-schemacontext-in-place-of-the-validator-breaking-change) ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Fix `omitExtraData()` and a `dependencies` `oneOf`'s `$ref` options dropping a `customMergeAllOf` ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Add an optional trailing `getCustomValidateFormData` to `ValidatorType.validateFormData()`, returning the data `customValidate` gets with the form's defaults applied; `ValidatorType` otherwise keeps its v6 signatures, so a custom validator needs no change ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Fix `omitExtraData()` deleting on submit the data of an `allOf` entry that is a `$ref`, or fields dropped by a `customMergeAllOf` that rejects a `$ref`; a failing `allOf` merge now warns once instead of throwing out of `Form`'s change and submit handlers ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Change `createSchemaUtils()` to warn once when handed a validator where the `SchemaContext` belongs, instead of failing later with an unexplained `TypeError` ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Add `getFieldClassNames()` and `omitConsumedStyling()` for a custom field rendering its own `FieldTemplate`, so a child doesn't apply the class names and style that template consumed again ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5606](https://github.com/rjsf-team/react-jsonschema-form/pull/5606), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- Add `getDeprecatedHandling()`, which resolves how a field renders a `deprecated` schema (`hide`, `disable` or `label`), for a custom field rendering its own `FieldTemplate` ([#5406](https://github.com/rjsf-team/react-jsonschema-form/pull/5406), [#5327](https://github.com/rjsf-team/react-jsonschema-form/issues/5327))
- Add `getTemplates(registry, uiOptions)`, the registry's templates with `uiOptions` overrides resolved, and `resolveWidget(schema, widget, widgets)`, which returns `{ Widget }`, so a component can destructure them as React's `static-components` lint rule accepts ([#5384](https://github.com/rjsf-team/react-jsonschema-form/pull/5384))
- Fix `getDefaultFormState()` concatenating a string `default` into an array with `minItems`, or throwing on another non-array `default`; a non-array `default` is now ignored when filling the array ([#5387](https://github.com/rjsf-team/react-jsonschema-form/pull/5387))
- Fix `logOnce()` taking two different plain-object or array errors logged with the same message for one, and `logUnsupportedDefaultForEnum()` printing an object default as `[object Object]`; `enumOptionValueLabel()` spells values the same way and no longer throws on a circular object ([#5382](https://github.com/rjsf-team/react-jsonschema-form/pull/5382))
- **BREAKING CHANGE:** Change `UiSchemaDefinitions<S, F>` to drop its `T` parameter and type every entry, as `ui:definitions` does, as `UiSchema<unknown, S, F>`, so a definition no longer rejects the nested keys of the field it describes. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uischemadefinitions-drops-its-t-parameter-breaking-change) ([#5372](https://github.com/rjsf-team/react-jsonschema-form/pull/5372))
- Change `sanitizeDataForNewSchema()` to treat an array's object and scalar items alike: an `enum: []` no longer drops every value, and a `maxItems` of `0` clears the array, as an items `enum` already did since [#5350](https://github.com/rjsf-team/react-jsonschema-form/pull/5350) ([#5430](https://github.com/rjsf-team/react-jsonschema-form/pull/5430), [#5346](https://github.com/rjsf-team/react-jsonschema-form/issues/5346))
- Add `uiBooleanOption()`, which reads a boolean `ui:` option such as `ui:required` or `ui:label` as `Boolean()` does, returning `undefined` only for `undefined` ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379))
- Change `useAltDateWidgetProps()`'s `handleChange()` to store a picked part as a number, so `elements[].value` is the `number` `DateElementProp` declares ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379))
- Fix `useAltDateWidgetProps()` treating a date part cleared with an empty string as zero and emitting a date in the previous month or year ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379))
- **BREAKING CHANGE:** Change `EnumOptionsType.value` and `UIOptionsType`'s `emptyValue`, `initialValue` and index signature to `unknown`, so `enumOptionsSelectValue()`, `enumOptionsDeselectValue()` and `enumOptionsValueForIndex()` return `unknown`, and `enumOptionSelectedValue()` returns `string`, `string[]` or its `emptyValue`'s type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#enumoptionstypevalue-is-unknown-breaking-change) ([#5383](https://github.com/rjsf-team/react-jsonschema-form/pull/5383))
- Add `schemaKey()`, the key a validator caches a compiled function under (the schema's `$id`, or its content hash), which all three validators now share so they agree on an empty `$id` ([#5371](https://github.com/rjsf-team/react-jsonschema-form/pull/5371), [#5338](https://github.com/rjsf-team/react-jsonschema-form/issues/5338), [#5373](https://github.com/rjsf-team/react-jsonschema-form/issues/5373))
- Fix a key merged with a matching `patternProperties` rendering the pattern's fields instead of the referenced schema's own `properties`, and a recursive one nesting fields until the heap runs out instead of rendering the cycle indicator ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5338](https://github.com/rjsf-team/react-jsonschema-form/issues/5338))
- Add `isComponentType()`, which accepts `memo()`, `forwardRef()` and `lazy()` components ([#5433](https://github.com/rjsf-team/react-jsonschema-form/pull/5433), [#5363](https://github.com/rjsf-team/react-jsonschema-form/issues/5363))
- Fix `getUiOptions()` dropping a `ui:widget` given as a `memo()`, `forwardRef()` or `lazy()` component ([#5433](https://github.com/rjsf-team/react-jsonschema-form/pull/5433), [#5363](https://github.com/rjsf-team/react-jsonschema-form/issues/5363))
- Fix a `ui:widget` name such as `'toString'` resolving to an inherited function; it throws `Unsupported widget definition` for a non-component ([#5433](https://github.com/rjsf-team/react-jsonschema-form/pull/5433), [#5363](https://github.com/rjsf-team/react-jsonschema-form/issues/5363))
- Change `getSchemaType()` to resolve a `type` list to its first non-null type, returning `string | undefined`, so `getDefaultFormState()` and `omitExtraData()` give a null-first list that type's defaults and pruning ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Change `omitExtraData()` to leave a value of another type a `type` list names as it is, and keep a `null` that a `['null', 'object']` or `['null', 'array']` allows ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `getWidgetType()`, so a `type` list takes a widget of a `string`, `number`, `integer` or `boolean` it names when the type it resolves to has none, and `resolveDefaultWidget()` takes a `format`'s widget only from the resolved type ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446))
- Change a select over a `type` list to take only its field's widgets, so a `checkbox` on an `enum` of `['a', true]` throws `No widget` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Add `getFieldTypeForWidget()` and `getSelectFieldType()`, the type of field a schema's `ui:widget` renders through, which `SchemaField`, `getDisplayLabel()`, `getDefaultFormState()`, `ObjectField` and daisyui's required marker follow ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Fix a `['null', 'boolean', 'string']` field shown as a `textarea` or select being filled with `false` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Change an `updown` on a `['string', 'number']` field to get `step="any"` ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Add the `isSchemaObject()` export, which narrows a boolean or missing subschema to a schema object ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Change `isCustomWidget()` to read a `widget` set to `undefined` as naming no widget ([#5428](https://github.com/rjsf-team/react-jsonschema-form/pull/5428), [#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5331](https://github.com/rjsf-team/react-jsonschema-form/issues/5331))
- Add `callWithDeferredThrow()`, which calls a consumer's callback and rethrows its throw from a timer, so a widget calling one from an Effect can't unmount the form; the throw escapes error boundaries as an uncaught error ([#5437](https://github.com/rjsf-team/react-jsonschema-form/pull/5437))
- Fix `retrieveSchema()` stranding a property renamed to a key matching no `patternProperties` pattern behind an empty `{ type: 'null' }` field; it's now stubbed from its data ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` rendering a key whose matching `patternProperties` subschema names no type as an unsupported field; it's now stubbed from its data, keeping the subschema's other keywords ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Add `getAdditionalPropertySchema()`, which returns the schema an object applies to a key its `properties` don't name (matching `patternProperties`, `additionalProperties` or `unevaluatedProperties`), shared by `retrieveSchema()` and `ObjectField` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Add `getAdditionalPropertyType()`, the type an additional property's subschema says it holds, read through its `anyOf`/`oneOf` options and `allOf` entries, so a typeless `enum` of numbers is stubbed and seeded as a number rather than a string ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- **BREAKING CHANGE:** Change `retrieveSchema()` to resolve an additional property's subschema before stubbing it, so keywords beside a `$ref` layer over the referenced ones and an `allOf` naming a type names the stub's type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#keywords-beside-a-ref-breaking-change) ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- **BREAKING CHANGE:** Change `retrieveSchema()` to stub an additional property whose options disagree about the type with no type, where it named `object` and rendered an empty fieldset beside the option selector. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Change `retrieveSchema()` to stub extra keys, and the add button to show, for an object whose only keyword describing them is `unevaluatedProperties` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `getFirstMatchingOption()` scoring an option that describes a map only through `unevaluatedProperties` as matching nothing ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` stubbing a key an `anyOf`/`oneOf` option renders as an additional property beside the option's field, giving one value two fields under one pair of ids ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` copying identifiers (`$id`, `$anchor`, …) and containers (`$defs`, `definitions`) onto the stub of an additional property whose type the subschema only implies, which routed every sibling property to the one field registered under the `$id` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Add `getXxxOfOptions()`, which returns the `anyOf`/`oneOf` options a schema renders, so an empty `anyOf: []` is no longer read over a `oneOf` with options ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `omitExtraData()` dropping a key an `unevaluatedProperties` describes when the object has no `additionalProperties`, a key the form renders and the next change deleted ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Change `getSchemaType()` to read `unevaluatedProperties` as implying `object`, as it reads `properties`, `additionalProperties` and `patternProperties` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` passing over a key named `constructor` or `toString` as one the `properties` name, and assigning a `__proto__` key through the prototype setter; it also skips the option walk for an object whose data holds no extra key ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` reading a definition that two merged subschemas both name only on the first, which stubbed names over the field that renders them or left a shadowed `type` unread ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` throwing on an `anyOf`/`oneOf` option whose `$ref` names no definition, or a circular one, while deciding which keys of an `unevaluatedProperties` object to stub ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` stubbing a name only a `dependencies` `oneOf` branch declares beside the field that branch renders, giving one value two fields, including where the dependency or branch is spelled as a `$ref` ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` describing an extra key differently when it re-retrieves a schema, bringing back the pattern's `$id`, a `default` of another type and a `not`; a key described by a pattern, `additionalProperties` or `unevaluatedProperties` now renders alike ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `getMatchingPatternProperties()` matching a unicode property escape such as `\p{Lu}` as literal text: patterns compile with the `u` flag as Ajv does, falling back to no flag for a pattern the flag rejects, and `omitExtraData()` reads its patterns through it ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `omitExtraData()` filtering a key through only its first matching `patternProperties` pattern, dropping a value another matching pattern describes; a `false` pattern among them drops the key ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `retrieveSchema()` leaving a value no field when a `dependencies` entry spelled as a `$ref` has `oneOf` branches that all declare its key but none of which applies ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `omitExtraData()` dropping a required key described by a `patternProperties` pattern, `additionalProperties` or `unevaluatedProperties`, and pruning a pattern-matched object whose only child was required and empty ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `omitExtraData()` keeping a value whose `allOf` merges to `false`, which no value satisfies; it's now dropped ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix `createSchemaUtils()`, for a draft 2020-12 root, crashing on a property named `$ref`, as in `properties: { $ref: { type: 'string' } }`, rewriting a `$ref` or `$id` in instance data such as `default`, and letting an `$id` re-base its siblings ([#5459](https://github.com/rjsf-team/react-jsonschema-form/pull/5459), [#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5457](https://github.com/rjsf-team/react-jsonschema-form/issues/5457))
- **BREAKING CHANGE:** Change an `$id` under a keyword that holds no subschemas, such as OpenAPI `components` or an `x-*` key, to name no schema, so a relative `$ref` relying on it no longer resolves; move such schemas under `$defs` or `definitions`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-id-under-an-unknown-keyword-such-as-components-or-x--names-no-schema-breaking-change) ([#5459](https://github.com/rjsf-team/react-jsonschema-form/pull/5459), [#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5529](https://github.com/rjsf-team/react-jsonschema-form/issues/5529))
- Add the `DEFAULT_BOOLEAN_WIDGET` export, the registry key the `checkbox` alias of a `boolean` resolves to ([#5456](https://github.com/rjsf-team/react-jsonschema-form/pull/5456))
- Fix `validationDataMerge()` dropping the existing `errors` when their `errorSchema` is empty, as after a `transformErrors` clears every `message`, so `extraErrors` or a field's own errors stopped being listed; a `validationData` without `errors` now throws ([#5469](https://github.com/rjsf-team/react-jsonschema-form/pull/5469), [#5034](https://github.com/rjsf-team/react-jsonschema-form/issues/5034))
- Fix `getChangedFields()` reporting a key missing on one side and `undefined` on the other (or an empty array slot) as changed, so a parent dropping an `undefined` key no longer clears that field's errors; add `deepEqualsUndefinedAsMissing()` ([#5469](https://github.com/rjsf-team/react-jsonschema-form/pull/5469), [#5034](https://github.com/rjsf-team/react-jsonschema-form/issues/5034))
- Fix `validationDataMerge()` with `preventDuplicates` listing an additional error a second time when the existing `errorSchema` already holds its message under the same keys ([#5443](https://github.com/rjsf-team/react-jsonschema-form/pull/5443), [#5442](https://github.com/rjsf-team/react-jsonschema-form/issues/5442))
- Add `propertyToPath()`, which splits an `RJSFValidationError`'s `property` into path segments as `toErrorSchema()` does ([#5443](https://github.com/rjsf-team/react-jsonschema-form/pull/5443), [#5442](https://github.com/rjsf-team/react-jsonschema-form/issues/5442))
- Add `TranslatableString.SelectPlaceholder`, which names an untitled shadcn multiple `SelectWidget` and fills both shadcn select widgets' placeholder when there's no `ui:placeholder`, so a single `SelectWidget`'s trigger is no longer blank ([#5475](https://github.com/rjsf-team/react-jsonschema-form/pull/5475), [#5458](https://github.com/rjsf-team/react-jsonschema-form/issues/5458))
- Fix `utcToLocal()` returning an empty string for an epoch of `0`, `NaN` text for an invalid date, and crashing the render on values `Date` throws on; it returns an empty string for `null`, booleans, invalid dates and years before 1, and its `jsonDate` is typed `unknown` ([#5473](https://github.com/rjsf-team/react-jsonschema-form/pull/5473), [#5431](https://github.com/rjsf-team/react-jsonschema-form/issues/5431))
- Change `getDateTimeLocalValue()` to give `undefined` for the year 0 ([#5473](https://github.com/rjsf-team/react-jsonschema-form/pull/5473), [#5431](https://github.com/rjsf-team/react-jsonschema-form/issues/5431))
- **BREAKING CHANGE:** Change `DateElement` to give each date part its id as `name`, a translated placeholder, an `aria-label` and the field's `aria-describedby`; it takes a translated `elementLabel`, makes `label` optional and deprecates `name`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-date-parts-are-named-in-every-theme-breaking-change) ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357))
- Add `TranslatableString.YearLabel`, `MonthLabel`, `DayLabel`, `HourLabel`, `MinuteLabel`, `SecondLabel` and `DateElementAriaLabel`, and `widgetAriaProps()` ([#5418](https://github.com/rjsf-team/react-jsonschema-form/pull/5418), [#5355](https://github.com/rjsf-team/react-jsonschema-form/issues/5355), [#5357](https://github.com/rjsf-team/react-jsonschema-form/issues/5357), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `TranslatableString.DoneLabel` and `TranslatableString.TimeLabel` for the daisyUI date pickers ([#5482](https://github.com/rjsf-team/react-jsonschema-form/pull/5482))
- Add `enumOptionsIsDisabled()`, the `ui:enumDisabled` check `groupEnumOptions()` and every `CheckboxesWidget` and `RadioWidget` share ([#5487](https://github.com/rjsf-team/react-jsonschema-form/pull/5487), [#5408](https://github.com/rjsf-team/react-jsonschema-form/issues/5408), [#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Add the `itemLabel` ui option, the `itemButtonProps` prop of `ArrayFieldItemButtonsTemplateProps` (typed `ArrayFieldItemButtonProps`), and the `CopyItemButton`, `MoveDownItemButton`, `MoveUpItemButton`, `RemoveItemButton` and `ItemNameWithNumber` translatable strings ([#5474](https://github.com/rjsf-team/react-jsonschema-form/pull/5474))
- Fix `localToUTC()` returning a `null` that wiped a `datetime-local` value with a five- or six-digit year; it now gives an ISO string with a `+YYYYYY` year, which fails `date-time` validation, and `utcToLocal()` reads a `Boolean` object from another realm as no value, following up [#5473](https://github.com/rjsf-team/react-jsonschema-form/pull/5473) ([#5510](https://github.com/rjsf-team/react-jsonschema-form/pull/5510))
- **BREAKING CHANGE:** Change `localToUTC()` to take `unknown` and return `string | null | undefined`, so a caller assigning its result to `string | undefined` must handle the `null` it returns for a value `Date` can't read. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#localtoutc-can-return-null-breaking-change) ([#5510](https://github.com/rjsf-team/react-jsonschema-form/pull/5510))
- Add `getRenderedOptionSchema()`, which decides what an `anyOf`/`oneOf` option inherits from its parent, and `rendersOwnFieldBesideOption()` ([#5484](https://github.com/rjsf-team/react-jsonschema-form/pull/5484), [#5821](https://github.com/rjsf-team/react-jsonschema-form/pull/5821), [#5900](https://github.com/rjsf-team/react-jsonschema-form/pull/5900), [#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359), [#5725](https://github.com/rjsf-team/react-jsonschema-form/issues/5725))
- Fix a `ui:required` field within a non-object parent's `items` option going unchecked ([#5484](https://github.com/rjsf-team/react-jsonschema-form/pull/5484), [#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359))
- Fix `sanitizeDataForNewSchema()` clearing a value across a schema switch when its type list allows `null`, when both schemas declare the same type list, and for a tuple or an array with no, `true` or the same boolean `items`; it gives an array holding the old `const` the new one, clears an array the new `const` or `enum` otherwise rejects, and clears an object where the new schema declares `properties` but its types leave out `object`, such as a nullable object's `null` option ([#5484](https://github.com/rjsf-team/react-jsonschema-form/pull/5484), [#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773), [#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5821](https://github.com/rjsf-team/react-jsonschema-form/pull/5821), [#5359](https://github.com/rjsf-team/react-jsonschema-form/issues/5359), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777), [#5725](https://github.com/rjsf-team/react-jsonschema-form/issues/5725))
- Change `guessType()` to take `unknown` ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Add the `Bivariant<Args, R>` type export, a callback whose parameters are checked bivariantly, which `SlotComponent` and the `onChange` props are built from ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- **BREAKING CHANGE:** Change `shouldRenderOptionalField()` to take the field's `fieldPath` as a required fifth argument, with `uiSchema` no longer optional; it returns `false` for the root field. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5426](https://github.com/rjsf-team/react-jsonschema-form/issues/5426))
- Change `retrieveSchema()` to run up to twice as fast on a schema with no `$ref` ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481))
- **BREAKING CHANGE:** Remove `isRootSchema()`, which mistook a nested field a recursive `$ref: '#'` describes for the root; compare the field's `fieldPath` with `ROOT_FIELD_PATH` instead. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5426](https://github.com/rjsf-team/react-jsonschema-form/issues/5426))
- Fix a recursive `$ref` reached through a nested property, or a dependent property pointing back at its definition, expanding again on every render and hanging the form; `retrieveSchema()` now flags it so a cycle indicator renders ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5501](https://github.com/rjsf-team/react-jsonschema-form/issues/5501))
- Add `createRootSchemaGuard()`, which a precompiled validator can use to check it is validating with its root schema, or that schema's resolution, without a deep comparison on every validation ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481))
- Fix `retrieveSchema()` expanding a property that refers back to its own definition through an `allOf`, `then`/`else` or `dependencies` entry on every call, so expanding a cycle indicator nested fields until the heap ran out ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `getDefaultFormState()` with `allOf: 'populateDefaults'` not giving the `items` an `allOf` beside a `$ref` declares the defaults they get with the definition written in place ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `getDefaultFormState()` turning a string or array `default` merged with object `formData` into index keys, such as `{ '0': 'x', b: 2 }` ([#5463](https://github.com/rjsf-team/react-jsonschema-form/pull/5463), [#5405](https://github.com/rjsf-team/react-jsonschema-form/issues/5405))
- Fix `createSchemaUtils()` reading a relative nested `$id` as written rather than against its parent resource, so a `$ref` into or inside it threw `Could not find a definition`; a `$ref` naming an embedded resource by its URI now resolves too ([#5530](https://github.com/rjsf-team/react-jsonschema-form/pull/5530), [#5467](https://github.com/rjsf-team/react-jsonschema-form/issues/5467))
- **BREAKING CHANGE:** Change `toErrorList()`, `validationDataMerge()` and `unwrapErrorHandler()` to read an array of item errors in an `ErrorSchema` as keyed by index, so its errors are listed and merged, and to skip `null`/`undefined` entries; the `ErrorSchema` and `FormValidation` types reject such an array. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-array-of-item-errors-is-keyed-by-index-breaking-change) ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- Add `errorSchemaChild()` ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- Fix keys named like `Object.prototype` members, such as `toString`, `constructor` and `__proto__`, being read as inherited values or written through the prototype setter by `mergeSchemas()`, `retrieveSchema()`, `getDefaultFormState()` and `omitExtraData()` ([#5524](https://github.com/rjsf-team/react-jsonschema-form/pull/5524), [#5515](https://github.com/rjsf-team/react-jsonschema-form/issues/5515))
- Fix `getDefaultFormState()` counting a property declared `false` as an additional one, so an object `default` seeds its other keys ([#5524](https://github.com/rjsf-team/react-jsonschema-form/pull/5524), [#5515](https://github.com/rjsf-team/react-jsonschema-form/issues/5515))
- Add theme presentation metadata, read by `@rjsf/core` and every theme to plan who draws a field's label, description, help and errors: the `ThemePresentation` and related types, among them a field's declared `widget` and the plan's `drawnByField`, which keeps a widget from drawing the label, description and errors its field draws, `WIDGET_FIELD_PRESENTATION`, `mergeThemePresentation()`, `getPresentationDeclaration()`, `resolveFieldPresentation()` and `getSelectorPresentation()`, whose selector label carries a required field's marker ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5531](https://github.com/rjsf-team/react-jsonschema-form/pull/5531), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5765](https://github.com/rjsf-team/react-jsonschema-form/pull/5765), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5591](https://github.com/rjsf-team/react-jsonschema-form/issues/5591))
- Add `uncheckedIsFalse`, which marks a checkbox holding `false` unchecked ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- Add the plan helpers `getControlAttributes()`, `getControlDescribedBy()`, `getDescribedControlAttributes()`, `getWidgetDescription()`, `isLabelledByTemplate()` and `hasAdditionalKeyLabel()`, and the id generators `optionDescriptionId()`, `optionHelpId()` and `selectedOptionDescriptionId()` ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `getFieldLabel()`, one computation of a field's label for its template and its widget, which puts the schema's `title` ahead of the `title` prop ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5394](https://github.com/rjsf-team/react-jsonschema-form/issues/5394))
- **BREAKING CHANGE:** Change `Registry` to require a `presentation`; code that builds a `Registry` by hand adds `presentation: mergeThemePresentation()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#registry-has-a-required-presentation-breaking-change) ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add an optional `presentation` prop, the field's plan, to fields, widgets and their templates, which `widgetAriaProps()` and `SelectedOptionDescription` read when given ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `getGroupAttributes()`, which splits the attributes of a widget rendering a group of controls, such as radios or checkboxes, into the wrapper's `role` and `aria-labelledby` and each control's `aria-describedby`, with `aria-invalid` where ARIA supports it for that `role`, and the `aria-label` naming a `radiogroup` no label names, given the widget's `registry`, and the `requiredCue` a required group of checkboxes is named by ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Add `templateDrawsLabel()`, `templateDrawsDescription()` and `widgetDrawsLabel()`, which read a field's plan and fall back to the deprecated `displayLabel` and `hideLabel` only without one ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `AdditionalPropertyKeySelect` and `SelectedOptionDescription` to declare a `hideLabel` of their own rather than taking the widget's ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `getArrayDescription()`, the description an `ArrayFieldTemplate` draws: the one its plan gives the array, or without a plan its `ui:description` or schema `description` ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `titleDrawsOptionalDataControl()`, whether an `ArrayFieldTemplate` or `ObjectFieldTemplate` lays out its optional data control in its title heading rather than with its items or properties ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `templateLabelFor()`, the `for` of a `FieldTemplate`'s label: the field's `id`, except where the plan names the control through `aria-labelledby`, as for a group of radios or checkboxes ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `templateMarksRequired()`, whether a `FieldTemplate`, a widget's own label included, marks its label required: as the field's plan says, which leaves the marker off an `uncheckedIsFalse` control whose schema doesn't demand `true` and off a level beneath a marked label, or by `required` without a plan ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5388](https://github.com/rjsf-team/react-jsonschema-form/issues/5388), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Add `hasWidgetErrors()`, whether a widget's control shows an error state, from the `aria-invalid` its plan gives it (the deprecated `rawErrors` and `hideError` without a plan), so an `anyOf`/`oneOf` option's control is styled invalid while the field above draws its errors ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `getGroupLabelling()`, which tells a group widget that draws its own group label whether to draw it, under which id, the attributes for the group and each control, and its `requiredCue`; `@rjsf/chakra-ui`'s, `@rjsf/fluentui-rc`'s and `@rjsf/mui`'s radio and checkboxes widgets use it ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Add `templateDrawsPlannedLabel()`, whether a `FieldTemplate` in a theme whose widgets draw their own label draws the field's label: only where the plan gives it the label and there is text, never without a plan; `@rjsf/chakra-ui`, `@rjsf/fluentui-rc`, `@rjsf/mantine` and `@rjsf/mui` use it ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix a control whose label `ui:label: false` hides having no accessible name: `resolveFieldPresentation()` gives it an `aria-label` with the label's text, also on a group's wrapper, an `anyOf`/`oneOf` selector and an option's control, and a caller's `aria-label` to `widgetAriaProps()` wins ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `isNamedByTemplateLabel()`, `getControlFallbackName()` and `widgetDrawsLabelText()`, which decide how a control such as a combobox trigger is named, so `@rjsf/daisyui`'s and `@rjsf/shadcn`'s comboboxes and each theme's select follow one rule ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `getFieldTypeForUiSchema()` to the package's exports ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Fix `AltDateWidget`'s date parts being described by ids no element has: `DateElement` takes its field's `presentation`, so each part is described by the field's rendered parts and is `aria-invalid` while errors show ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Change `widgetAriaProps()` to add a caller's `aria-describedby` ids to the plan's rather than replace them, while an empty one replaces the fallback, and to give a select no label names its field's label, `placeholder` or `TranslatableString.SelectPlaceholder` as its name, unless the widget draws its label itself, as `widgetDrawsLabelText()` says, and to list the selected option's description where its select draws it: inside the template's `children`, as the theme's `fieldTemplateOrder` places them, and after a description the select draws itself unless the theme's `selectedOptionDescription` says before ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5542](https://github.com/rjsf-team/react-jsonschema-form/issues/5542), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490), [#5711](https://github.com/rjsf-team/react-jsonschema-form/issues/5711), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add `enumOptionsAutofocusIndex()`, the option a `RadioWidget` or `CheckboxesWidget` focuses under `ui:autofocus`: a radio group's checked option, else the first enabled one; `@rjsf/core` and every theme use it ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Add `getLabelId()`, the id of a field's label from its plan, or `fieldLabelId()` without one, so a widget drawing its own label uses the id its plan points `aria-labelledby` at; `getGroupLabelling()`'s `labelId` is that id even where the template draws the label ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- **BREAKING CHANGE:** Deprecate `FieldTemplateProps.displayLabel` and `rawErrors`, `WidgetProps.hideLabel` and `rawErrors`, and `getDisplayLabel()` (also on `SchemaUtilsType`), kept through v7 for a component rendered without a plan; `@rjsf/core` and every theme ignore them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-fields-label-description-help-and-errors-are-drawn-where-its-plan-says-breaking-change) ([#5491](https://github.com/rjsf-team/react-jsonschema-form/pull/5491), [#5543](https://github.com/rjsf-team/react-jsonschema-form/pull/5543), [#5490](https://github.com/rjsf-team/react-jsonschema-form/issues/5490))
- Deprecate `FieldProps.rawErrors` and `ContainerFieldTemplateProps.rawErrors` in favor of a field's `presentation.errors`, a widget's `getErrorsToDraw()` and `hasWidgetErrors()`, or a template's `getErrorsToDraw()` and `hasErrors` prop; they are still passed in full ([#5590](https://github.com/rjsf-team/react-jsonschema-form/pull/5590), [#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646), [#5625](https://github.com/rjsf-team/react-jsonschema-form/pull/5625), [#5765](https://github.com/rjsf-team/react-jsonschema-form/pull/5765), [#5325](https://github.com/rjsf-team/react-jsonschema-form/issues/5325))
- Add `getErrorsToDraw()`, the error messages a widget, `ArrayFieldTemplate` or `ObjectFieldTemplate` draws itself as its plan says, with `ui:hideError` applied, or from the deprecated `rawErrors` without a plan; `@rjsf/mantine`'s widgets and `ObjectFieldTemplate` use it ([#5590](https://github.com/rjsf-team/react-jsonschema-form/pull/5590), [#5325](https://github.com/rjsf-team/react-jsonschema-form/issues/5325))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to fill a missing `type: 'null'` value in as `null`, with the objects that hold it, whatever `emptyObjectFields` says, and to include `null` in its return type and `SchemaUtilsType.getDefaultFormState()`'s. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#defaults-are-filled-in-without-onchange) ([#5556](https://github.com/rjsf-team/react-jsonschema-form/pull/5556))
- **BREAKING CHANGE:** Change `retrieveSchema()` to resolve one level at a time, handing out a `$ref` under `properties`, `items` or an option as written; subschemas carry the new `RJSF_PROVENANCE_KEY`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#retrieveschema-resolves-one-level-at-a-time-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- **BREAKING CHANGE:** Change `retrieveSchema()` to parse the root once per schema object, so a change made to the root in place is no longer seen; pass a new schema object instead. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-root-schema-is-treated-as-immutable-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `retrieveSchema()` overflowing the stack on recursive schemas and leaving a literal `$ref` where a schema merges itself back in ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5452](https://github.com/rjsf-team/react-jsonschema-form/issues/5452))
- Fix a `$ref` to an `$anchor` throwing under draft 2019-09/2020-12 rather than resolving ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5452](https://github.com/rjsf-team/react-jsonschema-form/issues/5452))
- Fix `resolveUiSchema()` not applying `ui:definitions` to a definition an `$anchor` names, or to an extra key whose `$ref` names a definition with an `allOf` ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5452](https://github.com/rjsf-team/react-jsonschema-form/issues/5452))
- **BREAKING CHANGE:** Change `getClosestMatchingOption()` and `omitExtraData()` to resolve only an option's own `$ref`, leaving the ones below it to the validator. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#option-matching-and-precompiled-validators-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674))
- Change `getDefaultFormState()` with `allOf: 'populateDefaults'` to fill an array of a recursive definition whose `minItems` sits in an `allOf` as deep as one whose `minItems` sits beside its `items`, one level less than before ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `getDefaultFormState()` overflowing the stack on recursive schemas and slowing down on definitions that all refer to one another ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481), [#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5500](https://github.com/rjsf-team/react-jsonschema-form/issues/5500), [#5452](https://github.com/rjsf-team/react-jsonschema-form/issues/5452), [#5493](https://github.com/rjsf-team/react-jsonschema-form/issues/5493))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to compute the defaults in one pass over the schema graph the form renders, which changes some defaults for extra keys, `then`, `dependencies` chains, keywords beside a `$ref`, `$ref` options and `allOf`s behind an extra key's `$ref`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getdefaultformstate-folds-over-the-schema-graph-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5500](https://github.com/rjsf-team/react-jsonschema-form/issues/5500), [#5452](https://github.com/rjsf-team/react-jsonschema-form/issues/5452))
- **BREAKING CHANGE:** Change `getDefaultFormState()` so a `default` beside a `$ref` overrides the referenced one wherever it stands. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getdefaultformstate-folds-over-the-schema-graph-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674))
- Fix `getDefaultFormState()` giving `undefined` rather than `{}` for a definition that merges a schema which merges it back in, and score a field's options as declared, so a parent's `customMergeAllOf` no longer reaches the option its children pick. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#breaking-changes-schema-resolution) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- **BREAKING CHANGE:** Change `getClosestMatchingOption()` to score a property written as a `$ref` as the definition it names with the keywords beside it, without merging its `allOf`, where a recursive one overflowed the stack. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#option-matching-and-precompiled-validators-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674))
- **BREAKING CHANGE:** Change a `$ref` with keywords beside it to read as the `allOf` of those keywords and the schema it names, under every draft, so `{ $ref: Pet, properties: { meow } }` renders `meow` beside `Pet`'s fields; `refDefinition()` reads the merged definition and a `customMergeAllOf` merges the two. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#keywords-beside-a-ref-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `getDefaultFormState()` called without a `rootSchema` throwing `Could not find a definition` for the schema's own `$ref`s once the form data held anything ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- **BREAKING CHANGE:** Change `createSchemaUtils()` to stop rewriting a draft 2020-12 root's `$ref`s against its `$id`: `getRootSchema()` returns the root as given, each `$ref` resolves against the `$id`s around it, and `ui:definitions` entries are keyed by the `$ref` as written. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#createschemautils-no-longer-rewrites-the-roots-refs-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5529](https://github.com/rjsf-team/react-jsonschema-form/issues/5529))
- Fix `getDefaultFormState()` missing the defaults of a `$ref` whose only other keywords are identifiers and annotations where another `$ref` reaches it: it reads as the schema it names with those annotations on top, as `retrieveSchema()` does ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5529](https://github.com/rjsf-team/react-jsonschema-form/issues/5529))
- Fix a `$ref` beside an `$id` under a keyword that holds no subschemas, such as `components`, throwing `Could not find a definition` ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5529](https://github.com/rjsf-team/react-jsonschema-form/issues/5529))
- Add `rootSchemaIdOf()` and `withRootIdRefPrefix()`, which give the id a validator registers the root under and prefix a schema's local `$ref`s with it ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Change a `oneOf`/`anyOf` of constants written as `$ref`s to render as a select or multi-select with their titles, label and defaults as when written in place, clearing an array it doesn't offer when the schema changes ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Fix `getDefaultFormState()` under `allOf: 'populateDefaults'` giving a nested object's property an earlier `allOf` entry's default over the default of the `anyOf`/`oneOf` option a later entry chooses, as it already did at the root ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix a `oneOf` of `$ref`s to objects missing the Optional Data Controls its inline spelling gets: `getOptionalDataControlsType()` takes a `rootSchema` to read such options ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5657](https://github.com/rjsf-team/react-jsonschema-form/pull/5657), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to compute each property's defaults from the property as declared, so under `allOf: 'skipDefaults'` a deep `customMergeAllOf` no longer fills `allOf` defaults, and a root `dependencies` entry counts a default as its property's value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getdefaultformstate-folds-over-the-schema-graph-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- **BREAKING CHANGE:** Change `getDefaultFormState()` under `allOf: 'skipDefaults'` to skip the `allOf` defaults of a property merged with the `patternProperties` its name matches, and of a definition a `$ref` with keywords beside it names, which it used to fill. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getdefaultformstate-folds-over-the-schema-graph-breaking-change) ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Add `getOptionSelectorSchema()`, the schema of an `anyOf`/`oneOf` option's selector property, retrieved where written as a `$ref`, so `findSelectedOptionInXxxOf()` and `LayoutMultiSchemaField` agree on the selected option ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- **BREAKING CHANGE:** Change `ValidatorType.isValid()` to receive `{ $ref: '#/<pointer>' }` into the `rootSchema` for each `if`, discriminator, option and dependency `oneOf` condition rather than a copy of the subschema, which a custom validator has to resolve. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validators-are-handed-pointers-into-the-root-schema-breaking-change) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Change `getFirstMatchingOption()` and `getClosestMatchingOption()` to match an option as JSON Schema reads it, so one written as a `$ref` or with `allOf` matches like one written in place, a `discriminatorField` decides alone only where it can reject the value, and a precompiled form no longer throws. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validators-are-handed-pointers-into-the-root-schema-breaking-change) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5454](https://github.com/rjsf-team/react-jsonschema-form/issues/5454), [#5455](https://github.com/rjsf-team/react-jsonschema-form/issues/5455))
- Add `getValidationSchemas()`, which lists every schema a form hands its validator for a root schema, keyed by `schemaKey()`, terminating on a `oneOf` of a root `$ref` beside `dependencies` and covering an `if` without an `else` ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5452](https://github.com/rjsf-team/react-jsonschema-form/issues/5452), [#5453](https://github.com/rjsf-team/react-jsonschema-form/issues/5453))
- **BREAKING CHANGE:** Change the schemas precompiled: `getValidationSchemas()` replaces `schemaParser()` with other keys and contents, so precompiled validator code has to be regenerated or it throws `No precompiled validator function was found`, as does an option a `customMergeAllOf` rewrites. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#option-matching-and-precompiled-validators-breaking-change) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674))
- Add `getValidationTarget()`, the `{ $ref }` naming where a schema sits in the root, or, for a schema with no place there, the schema itself with its `$id` made unique ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Change a `dependencies` `oneOf` option to apply when the dependency's property fits what the option declares anywhere in its scope (its `$ref` target, `allOf`, `then`/`else` and `dependencies`), not only its own `properties`, so a second option can apply, and then neither does. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validators-are-handed-pointers-into-the-root-schema-breaking-change) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Remove `getOptionMatchingSimpleDiscriminator()`, which read only an option's own `properties`; use `getFirstMatchingOption()` or `getClosestMatchingOption()` with the `discriminatorField`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Remove `JUNK_OPTION_ID`, which nothing read any more. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validators-are-handed-pointers-into-the-root-schema-breaking-change) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Remove `relaxOptionsForScoring()`; to score options with their `additionalProperties: false` relaxed, hand `getClosestMatchingOption()` or `getFirstMatchingOption()` copies with `additionalProperties: true`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix an `if` below a subschema with an `$id` of its own being checked detached from that resource, so a `$ref` inside it missed the resource's definitions and the wrong branch applied ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Add `resolveUri()`, `normalizeUri()` and `keywordShape()`, so a validator package can resolve a `$ref` or `$id` and walk subschema keywords as the schema graph does ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Change `getClosestMatchingOption()` to return an option the data matches whenever one does, and never `-1` or an index past the options; a tie goes to `selectedOption` only if it is a candidate, a nested `anyOf`/`oneOf` adds its pick's score rather than its index, a first `{ type: 'null' }` option no longer wins over matching ones, and validations grow linearly with depth. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getclosestmatchingoption-picks-among-the-candidates-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#4990](https://github.com/rjsf-team/react-jsonschema-form/issues/4990))
- **BREAKING CHANGE:** Add a `selectedOption` last argument to `retrieveSchema()` and `SchemaUtilsType.retrieveSchema()`, stubbing the data's extra keys once for the schema and that option together, and change `getRenderedOptionSchema()` to render an object's option without its extra-key keywords. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-objects-extra-keys-are-stubbed-once-with-the-selected-option-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5461](https://github.com/rjsf-team/react-jsonschema-form/issues/5461), [#5462](https://github.com/rjsf-team/react-jsonschema-form/issues/5462))
- **BREAKING CHANGE:** Add `expandRefCycle()`, the one-level expansion of a field flagged with `RJSF_REF_CYCLE_KEY`; `retrieveSchema()` no longer reads a copy carrying `RJSF_REF_CYCLE_KEY: false` as an expansion. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#cycle-expansion-is-form-state-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- Add an optional `fieldState`, a `FormFieldState`, to `getUiRequiredErrorSchema()`, `omitExtraData()` and their `SchemaUtilsType` methods, so the `ui:required` walk and omitting follow the option each field shows and descend into an expanded `$ref` cycle, and the walk asks its optional `rendersArrayWidget()` whether `ArrayField` renders an array as one widget, whose `[]` `ui:required` turns down; without it they work as before ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537), [#5822](https://github.com/rjsf-team/react-jsonschema-form/pull/5822), [#5744](https://github.com/rjsf-team/react-jsonschema-form/issues/5744))
- **BREAKING CHANGE:** Remove the `oldData`, `resolvedOldSchema` and `oldDataForPairing` parameters of `sanitizeDataForNewSchema()` and `SchemaUtilsType.sanitizeDataForNewSchema()`, which always run the `enum` filter. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#sanitize-is-a-diff-of-the-field-trees-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- **BREAKING CHANGE:** Change `sanitizeDataForNewSchema()` to sanitize an object property whose data holds no object to `{}`, or leave it out where it declares no `properties`, which no longer loops behind a recursive `$ref`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#sanitize-is-a-diff-of-the-field-trees-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- **BREAKING CHANGE:** Remove `schemaHasNestedConditional()`: `Form` sanitizes by a diff of the field trees, which reaches a `dependencies` or `if` at any depth. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#sanitize-is-a-diff-of-the-field-trees-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- Add `constrainsValue()`, whether a schema keyword constrains the value, which `Form` reads to tell whether an edit to one property can choose between an object's `anyOf`/`oneOf` options ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- **BREAKING CHANGE:** Change `ValidatorType.isValid()` to require leaving the data it is handed unchanged at any depth, since `getClosestMatchingOption()` reuses its picks; a custom validator whose engine fills in defaults, coerces or removes properties validates a copy, as `@rjsf/validator-ajv8` now does. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-validators-isvalid-must-leave-the-data-as-it-is-breaking-change) ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- **BREAKING CHANGE:** Change `getUiOptions()` to leave out a `required` in its `globalOptions` and stop returning the root's `ui:definitions` and `ui:globalOptions` as the `definitions` and `globalOptions` options, so no widget's `options` carry them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getuioptions-returns-a-fields-options-alone-breaking-change) ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538), [#5527](https://github.com/rjsf-team/react-jsonschema-form/issues/5527))
- Add `labelPlacement`, `'above'` or `'beside'` the control, to a `PresentationDeclaration`, which `mergeThemePresentation()` layers and `getPresentationDeclaration()` returns for the declaration that gives the component its own label ([#5538](https://github.com/rjsf-team/react-jsonschema-form/pull/5538))
- **BREAKING CHANGE:** Add a required `buttonsDisabled` to `useAltDateWidgetProps()`'s `UseAltDateWidgetResult`, true when the widget is disabled or read-only, which disables every `AltDateWidget`'s Now and Clear buttons; a hand-built result has to include it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-hands-an-unset-date-part-on-as-undefined-and-usealtdatewidgetprops-returns-buttonsdisabled-breaking-change) ([#5604](https://github.com/rjsf-team/react-jsonschema-form/pull/5604), [#5378](https://github.com/rjsf-team/react-jsonschema-form/issues/5378))
- **BREAKING CHANGE:** Change `useAltDateWidgetProps()`'s `elements` and `DateElement` to give an unset date part `undefined` rather than `-1`, which `@rjsf/antd`, `@rjsf/daisyui`, `@rjsf/mui`, `@rjsf/fluentui-rc` and `@rjsf/shadcn` report to `onFocus` and `onBlur` and a custom `SelectWidget` or `AltDateWidget` gets. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-hands-an-unset-date-part-on-as-undefined-and-usealtdatewidgetprops-returns-buttonsdisabled-breaking-change) ([#5604](https://github.com/rjsf-team/react-jsonschema-form/pull/5604), [#5378](https://github.com/rjsf-team/react-jsonschema-form/issues/5378))
- Add the `setOwn()` export, which writes a key as an own property, `__proto__` included, without reaching the prototype setter ([#5564](https://github.com/rjsf-team/react-jsonschema-form/pull/5564), [#5561](https://github.com/rjsf-team/react-jsonschema-form/issues/5561))
- **BREAKING CHANGE:** Fix keys named like `Object.prototype` members being read as inherited or written through the prototype setter by `setByPath()`, `getPropertySchema()`, `sanitizeDataForNewSchema()`, `optionsList()`, `getOptionSelectorSchema()` and `orderProperties()`, so a `__proto__` error is filed and a kept `__proto__` value can fail `additionalProperties: false`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5564](https://github.com/rjsf-team/react-jsonschema-form/pull/5564), [#5561](https://github.com/rjsf-team/react-jsonschema-form/issues/5561))
- **BREAKING CHANGE:** Change `GlobalUISchemaOptions` to hold only the options RJSF reads, so a `ui:globalOptions` literal with another key no longer compiles; add your own, which may not reuse an option name RJSF reads for a field, `definitions` or `globalOptions`, through its `UserExtensions` parameter, or a theme's through `ThemeGlobalUISchemaOptions`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uiglobaloptions-hold-only-the-options-rjsf-reads-there-breaking-change) ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- Add `pickGlobalUiOptions()`, which keeps only the known and declared extension keys of `ui:globalOptions` and warns about reserved and per-field names, `definitions` and `globalOptions` among them ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Change a global `readonly` in `ui:globalOptions` to no longer apply, with a warning ([#5611](https://github.com/rjsf-team/react-jsonschema-form/pull/5611), [#5607](https://github.com/rjsf-team/react-jsonschema-form/issues/5607))
- Add an optional `fieldState` to `getDefaultFormState()`'s props and `SchemaUtilsType.getDefaultFormState()`, so a field with `anyOf`/`oneOf` options that holds data takes its defaults from the option shown ([#5618](https://github.com/rjsf-team/react-jsonschema-form/pull/5618))
- Add `additionalPropertiesWhenAbsent` to `SchemaContext`, `'forbid'` by default: under `'allow'` an object naming neither `additionalProperties` nor `unevaluatedProperties` takes extra keys ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Add `allowsAdditionalProperties()` and `canExpand()` to `SchemaUtilsType`, which read whether an object takes extra keys with the form's `additionalPropertiesWhenAbsent`, an empty `patternProperties` naming no pattern ([#5429](https://github.com/rjsf-team/react-jsonschema-form/pull/5429), [#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137), [#5330](https://github.com/rjsf-team/react-jsonschema-form/issues/5330))
- Fix an object parent's `anyOf`/`oneOf` option offering extra keys beside the parent's, and keep a key one level of a join forbids forbidden in `getAdditionalPropertySchema()` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Add `getRenderedOptionUiSchema()`, the uiSchema an `anyOf`/`oneOf` option renders with, giving an option that takes its parent's extra keys the parent's `expandable` option and `additionalProperties` entry ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Change `getRenderedOptionSchema()` to give such an option the stricter `maxProperties` and both `propertyNames` ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix `omitExtraData()` keeping an extra key a closed shown option renders no field for, and dropping a property the shown option, or its `if`/`then`, declares: it judges extra keys by the object and its shown option joined, as the form renders them ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- Fix `omitExtraData()` pruning the keys of an object or array a `const` pins, so the submit failed the `const`; under `additionalPropertiesWhenAbsent: 'allow'` such an object takes no extra keys either ([#5620](https://github.com/rjsf-team/react-jsonschema-form/pull/5620), [#2137](https://github.com/rjsf-team/react-jsonschema-form/issues/2137))
- **BREAKING CHANGE:** Change `optionsList()` to order a constant `anyOf`/`oneOf`'s options by `ui:enumOrder`, dropping unlisted ones unless it has `'*'`, except where options are read through a discriminator or `ui:optionsSchemaSelector`; `ui:enumOrder` accepts `null`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uienumorder-orders-constant-anyofoneof-options-breaking-change) ([#5636](https://github.com/rjsf-team/react-jsonschema-form/pull/5636), [#4298](https://github.com/rjsf-team/react-jsonschema-form/issues/4298))
- **BREAKING CHANGE:** Add a required `hasErrors` to `FieldTemplateProps` and `WrapIfAdditionalTemplateProps`, the field's own errors after `ui:hideError`; a custom field rendering a `FieldTemplate` itself has to pass it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uihideerror-now-suppresses-the-themes-error-styling-breaking-change) ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Fix an `anyOf`/`oneOf` option that shows its own errors under its own `ui:hideError` not being described by the messages it is marked invalid for ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- Add an optional `hasErrors` to `ArrayFieldTemplateProps` and `ObjectFieldTemplateProps`, the container's own errors after `ui:hideError`, for its error state ([#5646](https://github.com/rjsf-team/react-jsonschema-form/pull/5646))
- **BREAKING CHANGE:** Add `TranslatableString.AdditionalPropertyKeyNotAllowed`, `'The key "%1" is not allowed here'`, shown on the row of an additional property whose key the object forbids; a `translateString` that maps every key needs it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-forbidden-extra-key-says-so-on-its-row-breaking-change) ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Add `getAdditionalKeyAttributes()`, the `aria-describedby` and `aria-invalid` of a forbidden additional key's input, the `keyNotAllowed` prop of `FieldProps`, `FieldTemplateProps` and `WrapIfAdditionalTemplateProps`, and `AdditionalPropertyKeySelect`'s `errorAttributes` prop ([#5640](https://github.com/rjsf-team/react-jsonschema-form/pull/5640), [#4630](https://github.com/rjsf-team/react-jsonschema-form/issues/4630))
- Fix `getTemplates()` returning an invalid override of a declared template, such as an unregistered name or a React element: it falls back to the registry's template with a warning naming the uiSchema entry, or silently for an explicit `null` ([#5383](https://github.com/rjsf-team/react-jsonschema-form/pull/5383), [#5526](https://github.com/rjsf-team/react-jsonschema-form/pull/5526), [#5432](https://github.com/rjsf-team/react-jsonschema-form/issues/5432))
- Add an `entryLabel` parameter to `getTemplates()`, handed the template's name and read once while the override stays the same, and export `describeUnresolvedComponent()` ([#5526](https://github.com/rjsf-team/react-jsonschema-form/pull/5526), [#5871](https://github.com/rjsf-team/react-jsonschema-form/pull/5871), [#5829](https://github.com/rjsf-team/react-jsonschema-form/issues/5829))
- **BREAKING CHANGE:** Change `fieldPathToId()` to escape whitespace, `__` and characters a CSS identifier can't hold, as in `root_first-_20name`, and join a part's id with `__`, as in `root_when__year` or `root_x__internalTypeSelector`, numbering nested selectors. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#ids-cant-collide-or-split-an-id-list-breaking-change) ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626), [#5558](https://github.com/rjsf-team/react-jsonschema-form/issues/5558), [#5504](https://github.com/rjsf-team/react-jsonschema-form/issues/5504))
- Add `partId()`, `idSegment()`, `additionalKeyId()`, `besideOptionsId()`, `fallbackTypeSelectorId()` and `optionSelectorId()` ([#5626](https://github.com/rjsf-team/react-jsonschema-form/pull/5626))
- **BREAKING CHANGE:** Fix `getDefaultFormState()` under `nestedDefaultsPrecedence: 'ancestorWins'` ignoring an ancestor's falsy default such as `0`, `false`, `''` or `null`; an ancestor's default of a type the property can't hold gives way to its own, and an `anyOf`/`oneOf` property takes it through an option that holds it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627), [#5624](https://github.com/rjsf-team/react-jsonschema-form/issues/5624))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to apply `overrideFormDataWithDefaults` and `defaultSupercedesUndefined` at every depth, so it replaces a nested `enum` value no longer offered with its default and a select over object constants keeps an offered value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627), [#5523](https://github.com/rjsf-team/react-jsonschema-form/issues/5523))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to keep an untyped field's object data as it stands once defaults are generated, without its object `default` filling missing keys. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627), [#5523](https://github.com/rjsf-team/react-jsonschema-form/issues/5523))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to drop object data at any depth held by a schema whose types, its `allOf`'s included, leave out `object`, except a `Date` or epoch-valued object for a date field, so the field takes its defaults; an object a select over object constants doesn't offer takes its default or is left out. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5522](https://github.com/rjsf-team/react-jsonschema-form/issues/5522))
- Fix `getDefaultFormState()` dropping the object data of a select over discriminated object constants that one of its options holds; it matches the data by the discriminator property ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627), [#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674))
- Fix `getDefaultFormState()` under `constAsDefaults: 'always'` keeping the data keys an object `const` doesn't name inside an object, and in an object taking extra keys through `additionalProperties` ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627))
- Fix `getDefaultFormState()` under `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'` leaving a key undefined in an `anyOf`/`oneOf` field's object data where the field's `default` has a value for it, when the option it opens on takes none of that data ([#5627](https://github.com/rjsf-team/react-jsonschema-form/pull/5627))
- **BREAKING CHANGE:** Change a `oneOf` in `dependencies` whose options don't declare the dependency's key, and any `anyOf` there, to merge in the option the data matches, as the same list beside `dependencies` does, rather than being dropped with a warning, so its `const` can become the default. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-dependency-anyof-or-a-dependency-oneof-whose-options-dont-declare-the-dependencys-key-now-applies-breaking-change) ([#5652](https://github.com/rjsf-team/react-jsonschema-form/pull/5652))
- Add the optional `pending` prop to `SubmitButtonProps`, set while a promise `onSubmit` returned is settling or the form is pending in React's form status ([#5649](https://github.com/rjsf-team/react-jsonschema-form/pull/5649))
- **BREAKING CHANGE:** Change `getOptionalDataControlsType()` to give an `anyOf`/`oneOf` option naming no type its schema's type, so `enableOptionalDataFieldForType` can turn on the Optional Data Controls for such objects and arrays, whose `ui:required` properties aren't reported and `type: 'null'` properties aren't defaulted while it is unset, in an array item `minItems` adds too. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-anyofoneof-option-naming-no-type-takes-its-fields-type-for-the-optional-data-controls-breaking-change) ([#5657](https://github.com/rjsf-team/react-jsonschema-form/pull/5657), [#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5809](https://github.com/rjsf-team/react-jsonschema-form/pull/5809), [#5360](https://github.com/rjsf-team/react-jsonschema-form/issues/5360))
- **BREAKING CHANGE:** Add a required `classMap` to `Registry`, which `buildRegistry()` fills in; a `Registry` built by hand, as in a test, needs one. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#registry-has-a-required-classmap-breaking-change) ([#5634](https://github.com/rjsf-team/react-jsonschema-form/pull/5634), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add the `ClassMap`, `FormClassMap` and `MergedClassMap` types, `joinClassNames()`, which joins one element's class names, and `mergeClassMaps()`, which layers class maps as `@rjsf/core` does ([#5634](https://github.com/rjsf-team/react-jsonschema-form/pull/5634), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- **BREAKING CHANGE:** Remove `DateElement`'s default `className` of `form-control`, so a `SelectWidget` that renders the `className` it is handed no longer puts it on an `AltDateWidget`'s selects; pass `className='form-control'` to keep it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfcore-renders-unstyled-markup-bootstrap-3-moved-to-rjsfbootstrap3-breaking-change) ([#5634](https://github.com/rjsf-team/react-jsonschema-form/pull/5634), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add a `span` to `GridTemplateProps`, how many twelfths of a row a column spans, which every theme's `GridTemplate` reads, and a `fieldId`, the id of a column's first field or else of the field whose layout grid holds the row or column ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651))
- Add `fieldShowsOwnErrors()`, whether the field a widget renders shows errors of its own, so a widget can mark the label it draws ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `hasErrors` to `DescriptionFieldProps`, so `DescriptionField` can mark the description `data-invalid` ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- Add `outsideFieldset` to `TitleFieldProps`, set where the title heads no `<fieldset>`, so a template can render something other than a `<legend>` there ([#5637](https://github.com/rjsf-team/react-jsonschema-form/pull/5637), [#5616](https://github.com/rjsf-team/react-jsonschema-form/issues/5616))
- **BREAKING CHANGE:** Change `isFormDataAvailable()` to return `true` for an empty object, so `getUiRequiredErrorSchema()` and `getDefaultFormState()` treat an optional object holding `{}` as added. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-empty-object-counts-as-added-data-for-the-optional-data-controls-breaking-change) ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427))
- Add `hasOwnContentBesideOptions()`, whether an object with `anyOf`/`oneOf` options has properties of its own or room for more keys beside them, where it draws its Optional Data Controls ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427))
- Fix `getDefaultFormState()` leaving out the `null`s of the `type: 'null'` properties of an object `ui:required` makes required while `enableOptionalDataFieldForType` names `object` ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672))
- Add the optional `drawsControlsBesideOptions()` to `FormFieldState`, so `getUiRequiredErrorSchema()` asks the form whether an object's `anyOf`/`oneOf` option is hidden behind the object's Add button ([#5672](https://github.com/rjsf-team/react-jsonschema-form/pull/5672), [#5427](https://github.com/rjsf-team/react-jsonschema-form/issues/5427))
- Add `getOptionUiSchema()`, the uiSchema of the `anyOf`/`oneOf` option at an index, as `AnyOfField` resolves it: the keyword's array entry for that option, or the field's own uiSchema ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983))
- Add `selectOptionUiSchema()`, which picks an option's uiSchema from per-option uiSchemas already resolved, falling back to the field's own uiSchema ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983))
- Add `getItemUiSchemaForItem()`, the uiSchema of the array item at an index, given the item's data, resolving the function form of `uiSchema.items` as `ArrayField` does, and naming the item by path (`people[0]`) in the error logged when that function throws ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Add `getStaticItemsUiSchema()`, the object form of `uiSchema.items` that applies at a tuple position, or `undefined` for its function form, which needs the item's data ([#5277](https://github.com/rjsf-team/react-jsonschema-form/pull/5277), [#4983](https://github.com/rjsf-team/react-jsonschema-form/issues/4983))
- Add `logGridSpanWarning()`, which logs once that a layout grid column's `span` is ignored beside a width of its own, or isn't a whole number in a grid that needs one, for the themes' `GridTemplate`s to share, with an `ownWidthId` option giving the ignored-span warning a warning ID ([#5707](https://github.com/rjsf-team/react-jsonschema-form/pull/5707), [#5651](https://github.com/rjsf-team/react-jsonschema-form/issues/5651), [#5868](https://github.com/rjsf-team/react-jsonschema-form/pull/5868), [#5775](https://github.com/rjsf-team/react-jsonschema-form/issues/5775))
- Add `TranslatableString.RadioGroupName` ("Choose an option"), the name `getGroupAttributes()` gives a `radiogroup` no label names ([#5713](https://github.com/rjsf-team/react-jsonschema-form/pull/5713), [#5586](https://github.com/rjsf-team/react-jsonschema-form/issues/5586))
- Add `selectedOptionDescription` to `ThemePresentation`, typed by the new `SelectedOptionDescriptionPlacement`: where a theme's `SelectWidget` draws the selected option's description beside a description it draws itself, `'beforeDescription'` or `'afterDescription'` (the default), and `fieldTemplateOrder`, typed by the new `FieldTemplateOrder`, one of the six orders of `'description'`, `'help'` and `'children'`: the order its `FieldTemplate` draws a field's description and help in around its children, so `resolveFieldPresentation()` lists an `anyOf`/`oneOf` option's own among the field's, and `widgetAriaProps()` the selected option's description, in drawn order ([#5718](https://github.com/rjsf-team/react-jsonschema-form/pull/5718), [#5367](https://github.com/rjsf-team/react-jsonschema-form/issues/5367), [#5794](https://github.com/rjsf-team/react-jsonschema-form/pull/5794), [#5720](https://github.com/rjsf-team/react-jsonschema-form/issues/5720))
- **BREAKING CHANGE:** Change `UiSchema` and `UIOptionsType` to type `accept`, `expandable`, `format`, `hideClearButton`, `hideNowButton`, `shape`, `stars` and `yearsRange`, which were `any`, so another type for one of them no longer compiles, and `DateElementProp['range']` to `readonly [number, number]`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uioptions-types-the-options-rjsfs-widgets-read-breaking-change) ([#5726](https://github.com/rjsf-team/react-jsonschema-form/pull/5726), [#5610](https://github.com/rjsf-team/react-jsonschema-form/issues/5610))
- **BREAKING CHANGE:** Change a `type` list resolving to `object` or `array` to find a scalar's widget, such as `TextareaWidget` on a `['array', 'string']`, rather than throwing. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-type-list-follows-its-uiwidget-to-the-field-and-class-it-renders-breaking-change) ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446))
- Add optional `registeredWidgets` and `formData` parameters to `getFieldTypeForWidget()` and `getFieldTypeForUiSchema()`, and a `fieldType` parameter to `getFieldClassNames()` ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446))
- Add the optional `widgets` to `SchemaContext`, so `getDisplayLabel()`, `getDefaultFormState()` and `getUiRequiredErrorSchema()` read a widget registered under a built-in alias as the form's own, and the optional `fallbackType()` to `FormFieldState` ([#5728](https://github.com/rjsf-team/react-jsonschema-form/pull/5728), [#5785](https://github.com/rjsf-team/react-jsonschema-form/pull/5785), [#5446](https://github.com/rjsf-team/react-jsonschema-form/issues/5446), [#5729](https://github.com/rjsf-team/react-jsonschema-form/issues/5729))
- **BREAKING CHANGE:** Change the array button handlers (`onAddItem`, `onCopyItem`, `onMoveUpItem`, `onMoveDownItem`, `onRemoveItem`, `onAddClick`) to take an optional `SyntheticEvent<HTMLElement>` instead of `any`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- **BREAKING CHANGE:** Change `style` in `FieldTemplateProps` and `ui:style` from `StyleHTMLAttributes<any>` to `CSSProperties`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- **BREAKING CHANGE:** Change `RJSFValidationError.params` from `any` to `Record<string, unknown>`, so a value read from it needs narrowing. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5677](https://github.com/rjsf-team/react-jsonschema-form/pull/5677))
- **BREAKING CHANGE:** Remove the `Result` type argument from `ValidatorType.rawValidation()`, which now returns the new `RawValidationResult`, whose errors are `unknown[]`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- Add the `RawValidationResult` type, what `ValidatorType.rawValidation()` returns ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- **BREAKING CHANGE:** Change a custom template's entry in `TemplatesType`, alone or in a group, from `ComponentType<any>` to `SlotComponent<never>`, so one read back from `registry.templates` or `getTemplates()` under a custom name can't be rendered without its props type, and one written inline needs a type on its props. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5679](https://github.com/rjsf-team/react-jsonschema-form/pull/5679))
- Add the `DeclaredTemplatesType` and `CustomTemplateEntries` types, the two parts of `TemplatesType`, and `PartialTemplatesType`, the type of the `templates` prop of `Form` ([#5679](https://github.com/rjsf-team/react-jsonschema-form/pull/5679))
- **BREAKING CHANGE:** Change an entry of an untyped `UiSchema`, of a `UiSchema` for data whose index signature holds `unknown`, or of a field typed `any`, from `any` to `unknown`, so reading or spreading it needs a type and it no longer fits a typed entry; spreading the rest of a generic `UiSchema<T>` needs a cast. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5680](https://github.com/rjsf-team/react-jsonschema-form/pull/5680), [#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- **BREAKING CHANGE:** Change `WidgetProps.value`, the value a widget's `onChange` takes, and the value of the `onBlur`/`onFocus` props from `any` to `unknown`, and the value `FieldProps.onChange` takes from `T | undefined` to `unknown`, since it is the value at the path it reports, so a widget narrows its value before use. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change `useFileWidgetProps()` to take an `unknown` value and an `onChange` that takes one, and `DateElementProps.value` to `number | undefined`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `toInputValue()`, which turns a widget's `value` into what an input's `value` prop takes ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `useFileWidgetProps()`'s `handleRemove` removing the wrong file when an earlier item of a multiple value isn't a readable data URL, such as the `null` stored for a file that couldn't be read: it now takes the index of the file in `filesInfo`, as every theme passes it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `useAltDateWidgetProps()` reading a date part cleared to `null`, as a select with an `emptyValue` of `null` reports it, as a picked `0`, which built a date with a day, month or year of `0`, and a part set to a value that is no number, such as `'abc'`, `false` or `[]`, as `NaN` or `0`, which threw for a date-only widget or built such a date ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `toNumericValue()`, which reads a widget's `value`, a number or a plain decimal string, as a number, and `numericWidgetStoresString()`, which reports whether a widget that draws a number, such as a rating or a slider, writes a string ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Fix `useFileWidgetProps()` appending the next selection after a lone value of a multiple field that isn't a data URL, which the field doesn't show: the selection now replaces it ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change `useAltDateWidgetProps()` to read only a string value, so a number or `Date` value, which the widget can't write back, renders every alt-date widget's selects blank, where it showed that date. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- Add `offersClearButton()`, which reports whether an input with `allowClearTextInputs` offers its clear button for the value it's given, as a number, date, date-time, month, time or week input blanks a value outside its type's syntax, and offers none for a range or color input, which can't show an empty value ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682), [#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))
- Fix `useAltDateWidgetProps()` throwing during render for a string it can't parse as a date, such as `'not-a-date'`, which unmounted the form; the widget now shows every part unset ([#5682](https://github.com/rjsf-team/react-jsonschema-form/pull/5682))
- **BREAKING CHANGE:** Change `GridTemplateProps` and `ui:submitButtonOptions.props`, whose undeclared props were `any`, to take any object, of which only the declared props read back: `GridTemplateProps` now also declares `className` and `style`, and `props` declares `disabled`, `className`, `onClick` and `onClickCapture`. `GridTemplateProps` is no longer an interface, so a props type built on it intersects it rather than extending or augmenting it, and one built with `Omit` adds `OpenProps` back. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5683](https://github.com/rjsf-team/react-jsonschema-form/pull/5683))
- Change `getSubmitButtonOptions()` to always return `props`, the default ones when the uiSchema's are missing or a JSON uiSchema sets them to something other than an object ([#5683](https://github.com/rjsf-team/react-jsonschema-form/pull/5683))
- Add the `OpenProps` type, the open part of `GridTemplateProps` and `ui:submitButtonOptions.props`, `SubmitButtonOptions`, what `getSubmitButtonOptions()` returns, and `AnyUiOptionsCheck`, the constraint of `StrictUiSchema`'s `Checks` ([#5683](https://github.com/rjsf-team/react-jsonschema-form/pull/5683))
- **BREAKING CHANGE:** Remove the open index signature from `FieldProps`, `WidgetProps` and `BaseInputTemplateProps`, which now declare the props RJSF passes, so a field or widget declares any prop of its own. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change `onKeyRename`, `onKeyRenameBlur` and `onRemoveProperty` to optional in `FieldTemplateProps` and `WrapIfAdditionalTemplateProps`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Add `callerInputProps()`, the `pattern`, `inputMode` and `accept` a widget passes `BaseInputTemplate` ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Change `AdditionalPropertyKeySelect` to take an optional `onKeyRename` and render disabled without one ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Add `isAdditionalKeyDisabled()`, whether a `WrapIfAdditionalTemplate` disables its free-text key input: for a disabled or read-only field, and one handed no `onKeyRenameBlur` ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Add `getBaseInputProps()`, the props a `BaseInputTemplate` puts on its input: those derived from the schema and options, the ones `callerInputProps()` picks over them, the numeric `title` unless the widget replaces the derived `pattern`, and the widget's `multiple` on a file input only ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- Add `isAdditionalRemoveDisabled()`, whether a `WrapIfAdditionalTemplate` disables its remove button: for a disabled or read-only field, and one handed no `onRemoveProperty` ([#5684](https://github.com/rjsf-team/react-jsonschema-form/pull/5684))
- **BREAKING CHANGE:** Change an option `UIOptionsType` doesn't declare from `any` to `unknown`, so a component reading its own `ui:options` checks the option's type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Add `ratingStarValues()`, the values of the stars a rating widget draws ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Fix `useAltDateWidgetProps()` throwing or hanging for a `yearsRange` it can't offer, such as `[-10, 2030]` or `[1, 1e9]`, or a `format` it can't read, which now get the defaults; a numeric-string year counts as its number ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Add `acceptAttribute()`, the value of a file input's `accept` attribute ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- Change an input's props to leave out an `accept` option that isn't a string or an array of them, where it stringified anything truthy, so `true` gave `accept="true"`, and to leave out an empty or blank file type ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `useAltDateWidgetProps()` to use the default years for a `yearsRange` reaching before 100, such as `[50, 2030]`, where it offered that range and wrote a year before 100 as 19xx. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#altdatewidget-uses-the-default-years-for-a-yearsrange-reaching-before-100-breaking-change) ([#5685](https://github.com/rjsf-team/react-jsonschema-form/pull/5685))
- **BREAKING CHANGE:** Change `FormContextType` from `Record<string, any>` to `object`, so a component reading an untyped `formContext` names the keys it reads. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5686](https://github.com/rjsf-team/react-jsonschema-form/pull/5686))
- **BREAKING CHANGE:** Change `RJSFSchema` from `JSONSchema7 & Record<string, any>` to `JSONSchema7`, which `@rjsf/utils` now augments, globally, with the later-draft, OpenAPI and Ajv keywords RJSF or its validators read, so a schema with keywords of its own declares them by augmenting `JSONSchema7` too. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- Fix an input's props and `rangeSpec()` setting `min`, `max` or `step` to `[object Object]` when `formatMinimum`, `formatMaximum`, `minimum`, `maximum` or `multipleOf` is an Ajv `$data` reference ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- Change an input's props and `rangeSpec()` to read a numeric-string bound such as `minimum: '5'` as its number, which they passed on as a string, and to leave out a string bound that is no number, which a date or time input still gets as its `min` or `max` ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- Fix `RJSFSchema` checking nothing where a package manager doesn't hoist `@types/json-schema`, which is now a dependency of `@rjsf/utils` ([#5688](https://github.com/rjsf-team/react-jsonschema-form/pull/5688))
- **BREAKING CHANGE:** Change `RJSFMarkedSchema` to a schema with the symbol markers `retrieveSchema()` adds, without the `any` index for other keys, and its symbol values from `boolean | string` to `unknown`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfmarkedschema-has-no-index-signature-and-its-markers-are-unknown-breaking-change) ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- Add `hasSchemaMarker()`, which reads a flag marker such as `ADDITIONAL_PROPERTY_FLAG` off a schema, a boolean subschema included, and the `SchemaFlagMarker` type of the markers it takes ([#5689](https://github.com/rjsf-team/react-jsonschema-form/pull/5689))
- **BREAKING CHANGE:** Change `GenericObjectType` from `Record<string, any>` to `Record<string, unknown>`, so a value read from one, such as one `isObject()` narrows, needs narrowing. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Change `mergeObjects()` and `mergeSchemas()` to take any objects and return `GenericObjectType`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Remove `GenericSymbolObjectType`, which nothing uses. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5696](https://github.com/rjsf-team/react-jsonschema-form/pull/5696))
- **BREAKING CHANGE:** Change `getUiOptions()` to ignore `field`, `fieldReplacesAnyOrOneOf`, `definitions` and `globalOptions` in `ui:options`, which the docs exclude, with a console warning, and the `ui:options` types to reject them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#uioptions-ignores-field-and-the-other-keys-it-doesnt-take-breaking-change) ([#5739](https://github.com/rjsf-team/react-jsonschema-form/pull/5739))
- Add `TranslatableString.RequiredGroupCue` ("required"), which ends the name of a required group of checkboxes ([#5743](https://github.com/rjsf-team/react-jsonschema-form/pull/5743), [#5573](https://github.com/rjsf-team/react-jsonschema-form/issues/5573))
- Fix `ui:enumDisabled` matching object and array values only by identity, which left a JSON-authored uiSchema unable to name them: they now match by deep equality, as `ui:enumOrder` does ([#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Fix `ui:enumOrder` listing an option twice where two entries name it: each entry now takes the next option it finds, as `optgroups` does, so `['1', '1']` over `[1, '1']` lists `'1'` and `1` ([#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- **BREAKING CHANGE:** Change `EnumValue` to include `null`, objects and arrays, so `ui:enumOrder`, `optgroups` and `ui:enumDisabled` can list them without a cast. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#enumvalue-includes-null-objects-and-arrays-breaking-change) ([#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Fix `ui:enumOrder` listing the remaining values again at each `'*'` after the first ([#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742))
- Fix a `ui:enumOrder` that isn't a list throwing during render; it is now ignored ([#5742](https://github.com/rjsf-team/react-jsonschema-form/pull/5742))
- Fix `findFieldInSchema()` missing a property beside a `oneOf`/`anyOf`, in options with no discriminator, or under `patternProperties` or `additionalProperties`, reading the wrong data below the first level, and ignoring the `required` beside the options ([#5746](https://github.com/rjsf-team/react-jsonschema-form/pull/5746), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- **BREAKING CHANGE:** Change `findSelectedOptionInXxxOf()` to return the option `getClosestMatchingOption()` picks for options with no discriminator, as `MultiSchemaField` does, rather than matching a value in `fallbackField`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#findselectedoptioninxxxof-returns-the-closest-option-for-options-with-no-discriminator-breaking-change) ([#5746](https://github.com/rjsf-team/react-jsonschema-form/pull/5746), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- **BREAKING CHANGE:** Change `findFieldInSchema()` to read a property declared both beside `anyOf`/`oneOf` and in an option from beside them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-property-declared-beside-anyofoneof-and-in-an-option-is-read-from-beside-them-breaking-change) ([#5746](https://github.com/rjsf-team/react-jsonschema-form/pull/5746), [#5392](https://github.com/rjsf-team/react-jsonschema-form/issues/5392))
- Add the `checkbox` alias for a string with a string `const`, including on a `type` list naming the string after a number, returning `CheckboxWidget` where it threw, and make `getDisplayLabel()` leave the label to `CheckboxWidget` named by its key on such a string, as it does on a boolean ([#5753](https://github.com/rjsf-team/react-jsonschema-form/pull/5753), [#3882](https://github.com/rjsf-team/react-jsonschema-form/issues/3882))
- Add `attributes` and `elementOptions` to `DateElement`, so a theme can describe each date part by a message of its own and give its `SelectWidget` further options ([#5767](https://github.com/rjsf-team/react-jsonschema-form/pull/5767), [#5503](https://github.com/rjsf-team/react-jsonschema-form/issues/5503))
- Fix `sanitizeDataForNewSchema()` dropping every array item whose object schema declares no `properties`, such as `{ type: 'object' }` or one picked from a multi-value `enum` option, so switching options cleared such lists ([#5754](https://github.com/rjsf-team/react-jsonschema-form/pull/5754), [#5736](https://github.com/rjsf-team/react-jsonschema-form/issues/5736), [#5440](https://github.com/rjsf-team/react-jsonschema-form/issues/5440))
- Fix `sanitizeDataForNewSchema()` not sanitizing the items of an array of arrays, so data the new schema no longer describes survived an option switch ([#5754](https://github.com/rjsf-team/react-jsonschema-form/pull/5754), [#5440](https://github.com/rjsf-team/react-jsonschema-form/issues/5440))
- Fix `sanitizeDataForNewSchema()` keeping an array's object items that their `enum` or constant options don't list when the items declare `properties`, as it drops such items of any other type, and writing an empty object into the absent object properties of one they list ([#5754](https://github.com/rjsf-team/react-jsonschema-form/pull/5754), [#5440](https://github.com/rjsf-team/react-jsonschema-form/issues/5440))
- Fix `sanitizeDataForNewSchema()` changing an object or array that equals its schema's `const`, such as writing a default the new schema adds or `{}` into its items' absent object properties, so it no longer matched the `const` and failed validation ([#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773), [#5770](https://github.com/rjsf-team/react-jsonschema-form/issues/5770))
- Fix `sanitizeDataForNewSchema()` clearing an array whose old schema declares no type, or no `items`, as a property or sanitized directly, so switching `anyOf`/`oneOf` options dropped a list the new option accepts; it's now sanitized against the new schema, as an inner array is, without the keys of its object items that only the old schema's items declare ([#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773), [#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5757](https://github.com/rjsf-team/react-jsonschema-form/issues/5757), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777))
- **BREAKING CHANGE:** Change `sanitizeDataForNewSchema()` to remove a key the new schema doesn't declare, declares with another type, or whose value it rejects, rather than set it to `undefined`, to remove a key the data holds as `undefined` where the two schemas constrain it differently and keep it where they constrain it alike, rather than fill it from an `enum`, and to leave out an object property the data doesn't hold, or holds as `null`, rather than write `{}` or keep the `null`, at every level. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#sanitizedatafornewschema-removes-the-keys-it-discards-and-leaves-out-objects-the-data-doesnt-hold-breaking-change) ([#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773), [#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5820](https://github.com/rjsf-team/react-jsonschema-form/pull/5820), [#5768](https://github.com/rjsf-team/react-jsonschema-form/issues/5768), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777), [#5815](https://github.com/rjsf-team/react-jsonschema-form/issues/5815))
- Fix `sanitizeDataForNewSchema()` keeping an object that the new schema's object `const` rejects, or replacing a value of another type with an empty object it rejects, so switching `anyOf`/`oneOf` options kept a value that failed validation; one holding the old `const` now takes the new one, as a scalar does, and any other is cleared ([#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773))
- Fix `sanitizeDataForNewSchema()` replacing an array item that isn't an object, such as a string or `null`, with an empty object where the new items declare `type: 'object'`, so switching `anyOf`/`oneOf` options turned a list of strings into rows the user never filled; such an item is now dropped, whatever the old items declare, unless it is a `null` that `nullable: true` allows ([#5773](https://github.com/rjsf-team/react-jsonschema-form/pull/5773))
- Fix `getFirstMatchingOption()` and `getClosestMatchingOption()` taking exponentially longer with depth, stalling a form, on data nested in definitions that offer each other as `anyOf`/`oneOf` options ([#5756](https://github.com/rjsf-team/react-jsonschema-form/pull/5756), [#4990](https://github.com/rjsf-team/react-jsonschema-form/issues/4990))
- Change `getFirstMatchingOption()`, `getClosestMatchingOption()` and the `dependencies` option `retrieveSchema()` merges to pick the first of options that differ only within such definitions ([#5756](https://github.com/rjsf-team/react-jsonschema-form/pull/5756))
- Change `getFirstMatchingOption()` and `getClosestMatchingOption()` to ignore an option's `dependentRequired` and the `required` of its `dependentSchemas` entries, so an option whose dependent property is still empty matches ([#5756](https://github.com/rjsf-team/react-jsonschema-form/pull/5756))
- Change `getClosestMatchingOption()` to loosen an `additionalProperties: false` inside an option's `dependentSchemas` entries, as it does inside its `dependencies` schemas ([#5756](https://github.com/rjsf-team/react-jsonschema-form/pull/5756))
- Fix `sanitizeDataForNewSchema()` reading every item of an array that declares `prefixItems` against `items` alone, which dropped a valid prefix item and moved the next into its place; each item, a tuple's included, is now sanitized against the schema its position declares, and the array is cleared where a prefix item is rejected, rather than wherever the old schema declared `items: false` ([#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777))
- Fix `sanitizeDataForNewSchema()` keeping an array item the new items' `const` rejects where the item is a scalar, declares no type, or is an object whose items declare no `properties` ([#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777))
- Add `constrainsAlike()`, which says whether two schemas constrain a field alike under the form's `defaultFormStateBehavior`, so a clear of it stays one across a schema change, and `constrainsAlikeAsideDefault()`, which says so without their defaults, as for whether a value is valid ([#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5820](https://github.com/rjsf-team/react-jsonschema-form/pull/5820), [#5827](https://github.com/rjsf-team/react-jsonschema-form/pull/5827), [#5917](https://github.com/rjsf-team/react-jsonschema-form/pull/5917), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777), [#5815](https://github.com/rjsf-team/react-jsonschema-form/issues/5815), [#5817](https://github.com/rjsf-team/react-jsonschema-form/issues/5817), [#5818](https://github.com/rjsf-team/react-jsonschema-form/issues/5818), [#5825](https://github.com/rjsf-team/react-jsonschema-form/issues/5825))
- Add `getItemSchema()` and `getPrefixLength()`, which read the schema an array declares for each position, through `prefixItems` or a tuple `items` ([#5790](https://github.com/rjsf-team/react-jsonschema-form/pull/5790), [#5777](https://github.com/rjsf-team/react-jsonschema-form/issues/5777))
- Add the optional `renderedAs` to `ObjectFieldTemplatePropertyType` and the `ObjectFieldPropertyRendering` type it returns ([#5791](https://github.com/rjsf-team/react-jsonschema-form/pull/5791), [#5516](https://github.com/rjsf-team/react-jsonschema-form/issues/5516))
- Add `getContainerAttributes()`, the `aria-labelledby` and `aria-describedby` a container's template gives the group around its title, description and contents ([#5795](https://github.com/rjsf-team/react-jsonschema-form/pull/5795), [#5723](https://github.com/rjsf-team/react-jsonschema-form/issues/5723))
- Add `listboxAriaProps()`, which names the list of options a `SelectWidget` shows, used by those of `@rjsf/daisyui` and `@rjsf/shadcn` ([#5807](https://github.com/rjsf-team/react-jsonschema-form/pull/5807), [#5792](https://github.com/rjsf-team/react-jsonschema-form/issues/5792))
- Fix `findFieldInSchema()` finding nothing at an index of an array, or below a nested `allOf` or `if`/`then`: it now finds the item the array renders there and reads each step as the form renders it ([#5785](https://github.com/rjsf-team/react-jsonschema-form/pull/5785), [#5729](https://github.com/rjsf-team/react-jsonschema-form/issues/5729))
- Fix `sanitizeDataForNewSchema()` clearing a whole array where its items past any `prefixItems` or tuple change type, or where the new items declare no type, also allow another or widen `integer` to `number`, rather than dropping only the items they reject, and cutting an array to a `maxItems` the old schema declared too; a `null` item the new items' `default` can fill becomes an empty row ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `sanitizeDataForNewSchema()` keeping the keys only the old items declare on an object item whose new items' type list names `object` beside another type, such as `['string', 'object']` ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Add `namesEveryType()`, which says whether a schema's new `type` allows every type its old one did, a `number` counting as naming `integer` ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `sanitizeDataForNewSchema()` dropping an `undefined` array item whose items declare `type: 'array'` or a type list naming `object` or `array`, such as `['object', 'null']`, which moved the items after it into the row the defaults fill ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `sanitizeDataForNewSchema()` replacing an array item with `{}` where its items' type list names `object` and `array` and declares `properties`, such as `['array', 'object']` ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `sanitizeDataForNewSchema()` dropping an `undefined` array item whose items declare an `enum` or constant options, which moved the items after it into its place ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `sanitizeDataForNewSchema()` keeping an array item or property as it is where its type list names `array` after another type, such as `['object', 'array']` or `['string', 'array']`, and an object property as it is where its list names `object` after another type, such as `['array', 'object']` or `['string', 'object']`, rather than sanitizing it as `Form` does; an array property under `['array', 'object']` no longer becomes `{}`, an array property holding the old `default` takes the new one, and a `readOnly` new `default` no longer clears an array or object property under a type list ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Fix `sanitizeDataForNewSchema()` keeping an array item that holds its items' old `default`, rather than swapping in the new one as it does for a property; an object item rendered as `object` keeps its value, for the defaults to fill key by key ([#5801](https://github.com/rjsf-team/react-jsonschema-form/pull/5801), [#5786](https://github.com/rjsf-team/react-jsonschema-form/issues/5786))
- Add the `SHARED_COPY_ID` constant, `?rjsf-copy=`, the start of the `$id` an option's scoring target gives a part it holds once, and `sharedCopyParts()`, which lists those parts ([#5811](https://github.com/rjsf-team/react-jsonschema-form/pull/5811), [#5771](https://github.com/rjsf-team/react-jsonschema-form/issues/5771))
- Fix `getValidationSchemas()`, `getFirstMatchingOption()` and `getClosestMatchingOption()` running out of memory where definitions each name the next twice over before a recursive `anyOf`/`oneOf` ([#5811](https://github.com/rjsf-team/react-jsonschema-form/pull/5811), [#5771](https://github.com/rjsf-team/react-jsonschema-form/issues/5771))
- **BREAKING CHANGE:** Remove the exports no other RJSF package uses: `ariaDescribedByIds()`, `canExpand()`, `dataURItoBlob()`, `dateRangeOptions()`, `findSchemaDefinition()`, `getDateElementProps()`, `getInputProps()`, `getTemplate()`, `getWidget()`, `hashForSchema()`, `hashString()`, `isValueEmpty()`, `mergeDefaultsWithFormData()`, `pad()`, `parseDateString()`, `replaceStringParameters()`, `schemaParser()`, `sortedJSONStringify()`, `toDateString()`, `withIdRefPrefix()` and the `DEFINITIONS_KEY`, `DEPENDENCIES_KEY`, `ENUM_KEY`, `IF_KEY`, `DISCRIMINATOR_PATH`, `FORM_CONTEXT_NAME`, `NAME_KEY` and `RJSF_PREFIX_KEY` constants. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#utilities-no-other-rjsf-package-uses-are-no-longer-exported-from-rjsfutils-breaking-change) for what to use instead ([#5808](https://github.com/rjsf-team/react-jsonschema-form/pull/5808))
- Add the `PINNED_TYPE_FLAG` Symbol, with which `FallbackField` marks the schema whose `type` its type selector pins, so `rendersOwnFieldBesideOption()` hands an `anyOf`/`oneOf` option of another type the whole field there too ([#5821](https://github.com/rjsf-team/react-jsonschema-form/pull/5821), [#5725](https://github.com/rjsf-team/react-jsonschema-form/issues/5725))
- Fix `retrieveSchema()` dropping a schema-valued `items` merged in an `allOf` with a tuple `items`, so `Form` showed no Add button for extra items, and resolving some `allOf`s that mix `patternProperties` with `additionalProperties` to an empty schema (updates `@x0k/json-schema-merge` to `^1.1.1`) ([#5851](https://github.com/rjsf-team/react-jsonschema-form/pull/5851))
- **BREAKING CHANGE:** Add `getFilledDefault()`, which returns the value the defaults fill a field with given the `FieldFill` they hand it, `childFillOf()`, which returns the fill of a field's child, and `getFieldDefault()`, which returns a field's default before the defaults fill it out, and add them and `constrainsAlike()` to `SchemaUtilsType`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#rjsfutils-schema-functions-take-a-schemacontext-in-place-of-the-validator-breaking-change) ([#5827](https://github.com/rjsf-team/react-jsonschema-form/pull/5827), [#5837](https://github.com/rjsf-team/react-jsonschema-form/pull/5837), [#5917](https://github.com/rjsf-team/react-jsonschema-form/pull/5917), [#5817](https://github.com/rjsf-team/react-jsonschema-form/issues/5817), [#5818](https://github.com/rjsf-team/react-jsonschema-form/issues/5818), [#5825](https://github.com/rjsf-team/react-jsonschema-form/issues/5825))
- Fix `sanitizeDataForNewSchema()` keeping a value an ancestor's old `default` filled in, under either `nestedDefaultsPrecedence`, swapping in a `default` that `emptyObjectFields` leaves unfilled, replacing a value its `enum` rejects by its own `default` rather than the one it's filled with, keeping an object holding its old `default` where the new one is no object, keeping a clear whose `anyOf`/`oneOf` option's `default` changes, reading the option the field's own `default` picks, reading an array item's `default` without its option's, keeping a clear of an object whose `default` names a key whose own `default` changes, which the fill writes over the object's, keeping an array item holding its array's old `default` at its index, or dropping it where the new items reject it, keeping an array of objects holding its old `default` as it was, which is judged item by item and, while it still holds the old filled `default` whole, follows the new one's rows, and reading a field's `default` without the ones its own properties declare, the `const` an ancestor gives it or the `default` of the pattern describing an extra key ([#5827](https://github.com/rjsf-team/react-jsonschema-form/pull/5827), [#5917](https://github.com/rjsf-team/react-jsonschema-form/pull/5917), [#5817](https://github.com/rjsf-team/react-jsonschema-form/issues/5817), [#5818](https://github.com/rjsf-team/react-jsonschema-form/issues/5818), [#5825](https://github.com/rjsf-team/react-jsonschema-form/issues/5825), [#5826](https://github.com/rjsf-team/react-jsonschema-form/issues/5826), [#5839](https://github.com/rjsf-team/react-jsonschema-form/issues/5839), [#5819](https://github.com/rjsf-team/react-jsonschema-form/issues/5819))
- Change `sanitizeDataForNewSchema()` to keep a `readOnly` property's value where the old schema declared no `default` for it, clearing it only where a new `default` replaces an old one ([#5837](https://github.com/rjsf-team/react-jsonschema-form/pull/5837))
- Fix `getDefaultFormState()` and `getFilledDefault()` leaving out the keys of an object `const` that no property declares, so `{ type: 'object', const: { a: 1 } }` defaulted to `{}` and a form submitted data its own `const` rejects ([#5809](https://github.com/rjsf-team/react-jsonschema-form/pull/5809), [#5644](https://github.com/rjsf-team/react-jsonschema-form/issues/5644))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to leave out an optional object that only an object `const` fills where the Optional Data Controls show it, rather than defaulting it to the `const`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-optional-object-only-an-object-const-fills-starts-behind-its-add-button-breaking-change) ([#5809](https://github.com/rjsf-team/react-jsonschema-form/pull/5809))
- Fix `getDefaultFormState()` dropping a valid value, object or `null` included, of a select whose options sit in an `allOf`, such as `allOf: [{ $ref: … }]`, so a `Form` select jumped back to its default ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` keeping a value an `allOf` leaves out of a field's `enum`, at any depth, instead of replacing it with the field's default, as a plain `enum` select does ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to keep the value of a field whose `allOf` narrows it to one constant, as for a field declaring one, rather than replace it with the default, where the field's own options take it. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` ignoring a `const` in an `allOf`, or in an `if`/`then` under `emptyObjectFields: 'skipEmptyDefaults'`, where it takes the field's own `const`: on an empty field, and over the data under `constAsDefaults: 'always'` ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` under `constAsDefaults: 'always'` keeping the data over a `const` of `0`, `false`, `''` or `null` ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` under `constAsDefaults: 'always'` replacing the data with a `const` that is an AJV `$data` reference, which names another value rather than being one ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` turning a `null` that a select's `allOf` options leave out into `undefined`, under either `allOf` setting, rather than keeping it as a plain `enum` does ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- **BREAKING CHANGE:** Change `getDefaultFormState()` under `constAsDefaults: 'always'` to drop the data keys an object `const` in an object field's `allOf` or unmerged `if`/`then` doesn't name, as the field's own `const` drops them. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to replace a value a field's own `enum` or options leave out with its default where its `allOf` narrows them to one value, under either `allOf` setting and at the root. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- **BREAKING CHANGE:** Change `getDefaultFormState()` under `constAsDefaults: 'always'` to give a key only an object's `allOf` declares its first option's `const` when its `anyOf`/`oneOf` constants don't offer its value, as for the object's own properties. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#changes-to-existing-utility-functions) ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` under `allOf: 'skipDefaults'`, the default, leaving out the keys a typed object's `default` names that only its `allOf` declares, as an untyped object fills them ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` blending an object select's `default` with an ancestor's into a value no option allows where its options sit in an `allOf`, such as `allOf: [{ $ref: … }]` ([#5803](https://github.com/rjsf-team/react-jsonschema-form/pull/5803), [#5769](https://github.com/rjsf-team/react-jsonschema-form/issues/5769))
- Fix `getDefaultFormState()` leaving the items of an array's `default` without the `default`s and `const`s of its `items` schema until the array was in the form data ([#5870](https://github.com/rjsf-team/react-jsonschema-form/pull/5870), [#5831](https://github.com/rjsf-team/react-jsonschema-form/issues/5831))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to fill the items of an array's `default` from its `items` schema alone, not from an `additionalItems` beside it, which describes only the items past a tuple. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-items-of-an-arrays-default-ignore-an-additionalitems-beside-items-breaking-change) ([#5870](https://github.com/rjsf-team/react-jsonschema-form/pull/5870), [#5831](https://github.com/rjsf-team/react-jsonschema-form/issues/5831))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to check an `if`, and match the option of a `dependencies` `oneOf`, against the form data with the computed defaults filled in, nested ones included, rather than the form data alone, so it fills the `then` or `else` defaults, and those of the option, a `default` selects. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-default-decides-an-if-as-the-same-value-in-the-form-data-does-breaking-change) ([#5869](https://github.com/rjsf-team/react-jsonschema-form/pull/5869), [#5830](https://github.com/rjsf-team/react-jsonschema-form/issues/5830))
- Add `dateElementLabel()` and `dateElementAriaLabel()`, which name a date or time part as `AltDateWidget`'s parts are named, such as `When, hour`, for a widget of your own that renders such parts ([#5862](https://github.com/rjsf-team/react-jsonschema-form/pull/5862))
- Add [`setWarningOptions()`](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions#setwarningoptions), which has `logOnce()` throw an `RJSFWarningError` for the migration or config warnings, or the warning IDs, it names, and `id` and `dedupe` options to `logOnce()`, as in `logOnce(message, { id: 'form-data-ignored' })` ([#5868](https://github.com/rjsf-team/react-jsonschema-form/pull/5868), [#5775](https://github.com/rjsf-team/react-jsonschema-form/issues/5775))
- Fix `resolveUiSchema()` writing the `anyOf`/`oneOf` entries it merges a `ui:definitions` entry under back into the uiSchema it is given ([#5871](https://github.com/rjsf-team/react-jsonschema-form/pull/5871), [#5829](https://github.com/rjsf-team/react-jsonschema-form/issues/5829))
- Add the `EXTRA_KEY_OPTION_KEY` and `UI_DEFINITION_ORIGIN_KEY` markers `retrieveSchema()` and `resolveUiSchema()` record for the form's warnings ([#5871](https://github.com/rjsf-team/react-jsonschema-form/pull/5871), [#5829](https://github.com/rjsf-team/react-jsonschema-form/issues/5829))
- Add [`mergeOptionDefinitions()`](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions#mergeoptiondefinitionst--unknown-s-extends-strictrjsfschema--rjsfschema-f-extends-formcontexttype--formcontexttype), which merges the `ui:definitions` entries of the `anyOf`/`oneOf` options `resolveUiSchema()` doesn't reach, such as those a `then` branch offers ([#5871](https://github.com/rjsf-team/react-jsonschema-form/pull/5871), [#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#5829](https://github.com/rjsf-team/react-jsonschema-form/issues/5829), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885))
- **BREAKING CHANGE:** Change `getClosestMatchingOption()` to score the data's keys an option's `additionalProperties: true` or schema, or its `patternProperties`, takes, so `getDefaultFormState()` fills a field from the option the field shows, except under `additionalPropertiesWhenAbsent: 'allow'` for an option naming neither keyword. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#getclosestmatchingoption-scores-the-extra-keys-an-options-additionalproperties-takes-breaking-change) ([#5873](https://github.com/rjsf-team/react-jsonschema-form/pull/5873), [#5832](https://github.com/rjsf-team/react-jsonschema-form/issues/5832))
- Add `getCheckboxRequired()`, which gives whether a `CheckboxWidget` is natively `required` and whether its label is marked required ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- Add `nonEmptyErrorMessages()`, which gives the error messages a `FieldErrorTemplate` draws, dropping an empty one ([#5882](https://github.com/rjsf-team/react-jsonschema-form/pull/5882), [#5603](https://github.com/rjsf-team/react-jsonschema-form/issues/5603))
- **BREAKING CHANGE:** Change `orderProperties()` to place the properties a `ui:order` doesn't list at its first `*`, or at the end, instead of throwing, a property it lists twice at its first entry rather than twice, and a property named `*` among the unlisted ones rather than dropping it, and remove `TranslatableString.InvalidObjectField`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-incomplete-uiorder-renders-the-object-instead-of-an-error-breaking-change) ([#5891](https://github.com/rjsf-team/react-jsonschema-form/pull/5891), [#4316](https://github.com/rjsf-team/react-jsonschema-form/issues/4316))
- Fix `resolveUiSchema()` not merging the `ui:definitions` entries of the `anyOf`/`oneOf` options an `allOf` member offers under `uiSchema.anyOf`/`oneOf`, as it merges those of the options the schema lists itself ([#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885))
- Fix `resolveUiSchema()` merging the `ui:definitions` entries of a field's `anyOf`/`oneOf` options by their written positions where a `then`/`else` or `dependencies` entry offers options of its own (other than a `dependencies` entry's `oneOf` that only picks the branch the data applies), which change the list the field shows, so an option could take another's title ([#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#5906](https://github.com/rjsf-team/react-jsonschema-form/pull/5906), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885), [#5896](https://github.com/rjsf-team/react-jsonschema-form/issues/5896))
- Add [`withoutFieldOptions()`](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions#withoutfieldoptionst--unknown-s-extends-strictrjsfschema--rjsfschema-f-extends-formcontexttype--formcontexttype), the uiSchema an `anyOf`/`oneOf` option's fields read: the field's own, less its option list, for an option with no entry of its own ([#5890](https://github.com/rjsf-team/react-jsonschema-form/pull/5890), [#5885](https://github.com/rjsf-team/react-jsonschema-form/issues/5885))
- Add `TranslatableString.AddNamedButton`, `Add %1`, and the `addButtonProps` prop of `ObjectFieldTemplateProps`, which titles an expandable object's Add button after the object ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))
- Deprecate `TranslatableString.AddButton`, which no template uses now that every `AddButton` falls back to `AddItemButton` ([#5899](https://github.com/rjsf-team/react-jsonschema-form/pull/5899), [#3596](https://github.com/rjsf-team/react-jsonschema-form/issues/3596))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to give each key of an object `const` the `const`'s value over the key's own `default` at any depth, whatever `nestedDefaultsPrecedence` says, a tuple's item defaults included, to select the `anyOf`/`oneOf` option of a nested object from the value the `const` gives it, and to set such a key whatever `emptyObjectFields` says, as a key of a parent's `const` already is. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-object-const-wins-over-the-defaults-beneath-it-breaking-change) ([#5897](https://github.com/rjsf-team/react-jsonschema-form/pull/5897), [#5819](https://github.com/rjsf-team/react-jsonschema-form/issues/5819))
- Fix `getDefaultFormState()` leaving out the keys of an object's `const` or `default` where only `patternProperties` or `unevaluatedProperties` takes them, or the defaults of an extra key the data holds that only they describe, and filling a key a pattern matches from the `additionalProperties` beside the pattern rather than from the pattern ([#5897](https://github.com/rjsf-team/react-jsonschema-form/pull/5897), [#5819](https://github.com/rjsf-team/react-jsonschema-form/issues/5819))
- Fix `getDefaultFormState()` leaving out, under the default `allOf: 'skipDefaults'`, the `const` of the `oneOf`/`anyOf` option that a nested field's `allOf`, or the `allOf` of the option a field shows, offers, and the `const` or `null` of each key that option declares ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to replace a value that a `oneOf`/`anyOf` of constants doesn't offer with the field's `default`, as it does for an `enum`, where it kept the value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-value-outside-a-constant-oneof-or-anyof-takes-the-fields-default-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to start a `oneOf`/`anyOf` of constants with no value and no `default` of its own from the constant its object's `default` names, as it does for an `enum`, where it took the first constant. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-constant-oneof-or-anyof-starts-from-the-constant-its-objects-default-names-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to start a `oneOf`/`anyOf` of constants with no value, or one the defaults replace such as a `NaN`, from a `default` naming none of the constants, its own or its object's, as it does for an `enum`, where it took the first constant. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-constant-oneof-or-anyof-starts-from-a-default-outside-its-constants-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `getDefaultFormState()` to keep a value that an `enum` at the root with no `default` doesn't offer, and a `NaN` at the root with no `default`, as it does for a property, where it dropped the value. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-root-keeps-a-value-outside-its-enum-and-a-nan-breaking-change) ([#5898](https://github.com/rjsf-team/react-jsonschema-form/pull/5898), [#5895](https://github.com/rjsf-team/react-jsonschema-form/issues/5895))
- **BREAKING CHANGE:** Change `getDefaultFormState()`, `getRenderedOptionSchema()`, `retrieveSchema()`'s `allOf` merge, `omitExtraData()`, `isMultiSelect()` and `isFilesArray()` to read a `prefixItems` array as a tuple, with its `items` describing only the items past it, and add `prefixItems` to `UiSchema`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-prefixitems-array-renders-as-a-tuple-breaking-change) ([#5900](https://github.com/rjsf-team/react-jsonschema-form/pull/5900), [#5797](https://github.com/rjsf-team/react-jsonschema-form/issues/5797))
- Add `isTupleSchema()`, `getOpenPrefixLength()` and `getItemsUiSchemaKey()`, and an optional `schema` argument to `getStaticItemsUiSchema()` and `getItemUiSchemaForItem()`, which read the uiSchema an item's position declares, `uiSchema.prefixItems` included ([#5900](https://github.com/rjsf-team/react-jsonschema-form/pull/5900), [#5797](https://github.com/rjsf-team/react-jsonschema-form/issues/5797))
- Fix `getDefaultFormState()` padding a tuple to `minItems` with the defaults of the items past it at its own positions, rather than each position's ([#5900](https://github.com/rjsf-team/react-jsonschema-form/pull/5900), [#5797](https://github.com/rjsf-team/react-jsonschema-form/issues/5797))
- Add [`getInheritedOptionUiSchema()`](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/utility-functions#getinheritedoptionuischemat--unknown-s-extends-strictrjsfschema--rjsfschema-f-extends-formcontexttype--formcontexttype), the uiSchema an `anyOf`/`oneOf` option's field renders with, which takes the field's `ui:required` where the option leaves its own unset ([#5918](https://github.com/rjsf-team/react-jsonschema-form/pull/5918), [#5894](https://github.com/rjsf-team/react-jsonschema-form/issues/5894))
- Add `applyValidatorErrorTitles()` and its `ValidatorErrorTitleSource` type, which the validator packages use to name the properties an error's message names by their `ui:title` or `title` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))

## @rjsf/validator-ajv8

- **BREAKING CHANGE:** Change the `ajv-formats` dependency from 2.x to 3.x, so the `time` format requires a timezone offset (`Z` or `±HH:MM`) and offset-less `formData` fails validation. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#timedate-time-formats-now-require-a-timezone-offset-breaking-change) ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- Add the `iso-time` and `iso-date-time` formats, which accept offset-less values and render with `TimeWidget`/`DateTimeWidget` ([#5270](https://github.com/rjsf-team/react-jsonschema-form/pull/5270), [#3930](https://github.com/rjsf-team/react-jsonschema-form/issues/3930))
- **BREAKING CHANGE:** Remove the `T` parameter of `customizeValidator()` and `createPrecompiledValidator()`, now `<S, F>`, so the default export fits every `Form`; drop a leftover data type argument, since the first one is now the schema type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validatortype-and-customizevalidator-take-the-schema-as-their-first-type-argument-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Change `isValid()` to log a schema compilation error once rather than on every re-render, naming the schema by its `$id` or hash and saying whether the schema or the form data failed ([#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Add an optional trailing `getCustomValidateFormData` parameter to `validateFormData()`, so the defaults `customValidate` sees honor the form's `customMergeAllOf` and `defaultFormStateBehavior` ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Add a `customMergeAllOf` parameter to `createPrecompiledValidator()`, which resolves the root schema with it ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- **BREAKING CHANGE:** Change `createPrecompiledValidator()` to take its `localizer`, `suppressDuplicateFiltering` and `customMergeAllOf` in one options object after the `rootSchema`, instead of as trailing positional parameters. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#createprecompiledvalidator-takes-its-localizer-and-suppressduplicatefiltering-in-an-options-object-breaking-change) ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385), [#5866](https://github.com/rjsf-team/react-jsonschema-form/pull/5866))
- Fix `validateFormData()` and `rawValidation()` throwing for a schema whose `$id` is not a string, such as `null` or `5`; they now report it as a validation error ([#5387](https://github.com/rjsf-team/react-jsonschema-form/pull/5387))
- Fix a schema whose `$id` is the empty string sharing one compiled function with every other such schema, and every `$ref` into a root carrying one failing to compile ([#5371](https://github.com/rjsf-team/react-jsonschema-form/pull/5371), [#5338](https://github.com/rjsf-team/react-jsonschema-form/issues/5338), [#5373](https://github.com/rjsf-team/react-jsonschema-form/issues/5373))
- Fix the `errors` a validation returns dropping an error whose `message` a `transformErrors` cleared when a `customValidate` is passed, so such a form submitted instead of reporting them through `onError` ([#5469](https://github.com/rjsf-team/react-jsonschema-form/pull/5469), [#5034](https://github.com/rjsf-team/react-jsonschema-form/issues/5034))
- Change `CompiledValidateFunction` to take `unknown` data instead of `any` and drop its `this: Ajv | any` parameter; a hand-written validator declaring a narrower `data` parameter still satisfies `ValidatorFunctions` ([#5379](https://github.com/rjsf-team/react-jsonschema-form/pull/5379), [#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Change a precompiled validator to check a schema against the one it was compiled from once per schema object, not on every validation, accepting it again even if changed since, so a caller of `validateFormData()` that resolves the root schema itself must pass the resolution for the data being validated ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481))
- Fix `validateFormData()` leaving out of `errors` the errors a `customValidate` returns as an array for an array field's items, and letting that array replace the validator's own errors; they are now listed and keyed by index in the `errorSchema` ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- Fix `compileSchemaValidatorsCode()` resolving a root-local `$ref` in another compiled schema against that schema rather than the root; it now names the root in those `$ref`s, as the runtime validator does ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid()` failing a `$ref` into a root its Ajv dialect rejects on a fresh validator, such as an `if` under a 2020-12 root picking `else` on the first call; pass `AjvClass: Ajv2019` or `Ajv2020` to `customizeValidator()` for such roots ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix a root the Ajv dialect can't compile turning every later `isValid()` check under any other root to `false` ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `isValid()` not resolving a `$ref` below a nested `$id` in an option or `if`: it checks it against the resource holding it ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid()` resolving a root-local `$ref`, such as a form's `if: { $ref: … }` condition, against the wrong schema when the root has an `$id`, which gave the `else` defaults for data matching the condition ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid()` answering a `$ref` with the function compiled for an earlier root, such as accepting `'s'` against a root whose `X` is a `number` after one whose `X` is a `string` ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `compileSchemaValidatorsCode()` throwing `can't resolve reference` for a recursive definition used as an option ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Change a precompiled validator to stop answering the junk option `getClosestMatchingOption()` no longer uses, and to name the subschema a `$ref` points at in its missing-function error ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid()` answering every schema `false` and logging `schema with key or id … already exists` once a root whose `$id` ends in an empty fragment, such as `http://example.com/root.json#`, was edited under the same `$id` ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Change `isValid()` to validate a copy of the data under Ajv's `useDefaults`, `coerceTypes`, `removeAdditional` or a `modifying: true` keyword so it leaves the data as handed, as does a precompiled validator for functions marked with the new `CompiledValidateFunction.changesData`; data that can't be copied makes `isValid()` return `false` with a warning, or throw when precompiled ([#5537](https://github.com/rjsf-team/react-jsonschema-form/pull/5537))
- Change a precompiled validator's error for a schema it has no function for to name that schema: by where in the root a `$ref` it was handed points, or by the `$id` in its first `allOf` entry ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5455](https://github.com/rjsf-team/react-jsonschema-form/issues/5455))
- **BREAKING CHANGE:** Remove the `Result` type argument from `rawValidation()`, which now returns Ajv's `ErrorObject`s, including on the validator `createPrecompiledValidator()` returns. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- **BREAKING CHANGE:** Change `createPrecompiledValidator()` to return `AJV8PrecompiledValidator` instead of `ValidatorType`, so a variable it initializes needs a `ValidatorType` annotation to be assigned another validator. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#createprecompiledvalidator-returns-its-validator-class-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- Add the `AJV8Validator` and `AJV8PrecompiledValidator` classes to the root exports, the second being what `createPrecompiledValidator()` returns, and Ajv's `ErrorObject` type ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- **BREAKING CHANGE:** Change the validator `createPrecompiledValidator()` returns to hand its `localizer` property names in error params quoted, such as `'foo'`, as `customizeValidator()`'s does, so a localized message names a property by its `title` or `ui:title`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-localizer-gets-quoted-property-names-from-a-precompiled-or-ata-validator-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- **BREAKING CHANGE:** Change the default `validator` export to a client module, so a React Server Component can pass it to `Form`; server code can no longer call it, so validate there with a validator from `customizeValidator()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-default-validator-is-a-client-module-breaking-change) ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix the error for a missing `dependentRequired` or `dependencies` property naming the properties by their keys rather than their `title` or `ui:title` when no localizer is passed, and its `title` naming the property that is present ([#5901](https://github.com/rjsf-team/react-jsonschema-form/pull/5901), [#4402](https://github.com/rjsf-team/react-jsonschema-form/issues/4402))
- Fix a localized error for a missing `dependentRequired` or `dependencies` property naming a property by the wrong `title` when another property's `title` is its key ([#5901](https://github.com/rjsf-team/react-jsonschema-form/pull/5901), [#4402](https://github.com/rjsf-team/react-jsonschema-form/issues/4402))
- Change `isValid()` to keep what it compiled for the last two root schemas instead of one, so changing the schema of a form with conditional or option fields no longer compiles their schemas again for each field it checks ([#5904](https://github.com/rjsf-team/react-jsonschema-form/pull/5904), [#5903](https://github.com/rjsf-team/react-jsonschema-form/issues/5903))
- Fix `isValid()` checking a schema whose `$id` is that of a root schema it was called with before against that root rather than the schema itself ([#5904](https://github.com/rjsf-team/react-jsonschema-form/pull/5904), [#5903](https://github.com/rjsf-team/react-jsonschema-form/issues/5903))
- Fix `isValid()` on an `ajv-draft-04` validator failing to compile a schema with an `id` of its own once called with another root schema, as a schema with an `$id` does on any other, and resolving a `$ref` by a root schema's `id` into a root it was called with before that held the same `id` ([#5904](https://github.com/rjsf-team/react-jsonschema-form/pull/5904), [#5903](https://github.com/rjsf-team/react-jsonschema-form/issues/5903))
- Fix a localized error for a missing `dependentRequired` or `dependencies` property splitting a property whose key contains `, ` into two names and leaving it untitled ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property ignoring a `ui:title` that only its schema path leads to when a key on that path holds `/`, `~`, `%`, a space or another character a URI escapes ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property whose key holds `.`, `[` or `]` taking another field's `ui:title`, such as the `ui:title` of `b` inside `a` for a key `a.b` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property with a sub-field named `title` naming it `'[object Object]'` and taking that sub-field's uiSchema as its `title` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix `validateFormData()` filing an error on a property whose name holds a `/` or `~` under an escaped name, such as `a~1b`, so it didn't show on its field and its message missed the property's `title` or `ui:title` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix an error naming two properties, where one's key is the other's followed by a quote, such as `it` and `it's`, titling the longer one as the shorter one's title followed by the rest of its key ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))

## @rjsf/validator-ata

- **BREAKING CHANGE:** Remove the `T` parameter of `customizeValidator()`, `createPrecompiledValidator()` and the `ATAValidator` class, now `<S, F>`, so the default export fits every `Form`; drop a leftover data type argument, since the first one is now the schema type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validatortype-and-customizevalidator-take-the-schema-as-their-first-type-argument-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Change `isValid()` to log an error it catches once rather than on every re-render, naming the schema by its `$id` or hash ([#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Add an optional trailing `getCustomValidateFormData` parameter to `validateFormData()`, so the defaults `customValidate` sees honor the form's `customMergeAllOf` and `defaultFormStateBehavior` ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Add a `customMergeAllOf` parameter to `createPrecompiledValidator()`, which resolves the root schema with it ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- **BREAKING CHANGE:** Change `createPrecompiledValidator()` to take its `localizer`, `suppressDuplicateFiltering` and `customMergeAllOf` in one options object after the `rootSchema`, instead of as trailing positional parameters. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#createprecompiledvalidator-takes-its-localizer-and-suppressduplicatefiltering-in-an-options-object-breaking-change) ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385), [#5866](https://github.com/rjsf-team/react-jsonschema-form/pull/5866))
- Fix `isValid()` and `rawValidation()` letting two schemas whose `$id` is the empty string evict each other from their shared cache, and a root carrying one not resolving its local `$ref`s ([#5371](https://github.com/rjsf-team/react-jsonschema-form/pull/5371), [#5338](https://github.com/rjsf-team/react-jsonschema-form/issues/5338))
- Fix the `errors` a validation returns dropping an error whose `message` a `transformErrors` cleared when a `customValidate` is passed, so such a form submitted instead of reporting them through `onError` ([#5469](https://github.com/rjsf-team/react-jsonschema-form/pull/5469), [#5034](https://github.com/rjsf-team/react-jsonschema-form/issues/5034))
- Change `CompiledValidateFunction`'s call signature to `@rjsf/utils`' `Bivariant` type, so a hand-written validator declaring a narrower `data` parameter satisfies `ValidatorFunctions` ([#5488](https://github.com/rjsf-team/react-jsonschema-form/pull/5488))
- Change a precompiled validator to check a schema against the one it was compiled from once per schema object, not on every validation, accepting it again even if changed since, so a caller of `validateFormData()` that resolves the root schema itself must pass the resolution for the data being validated ([#5481](https://github.com/rjsf-team/react-jsonschema-form/pull/5481))
- Fix `validateFormData()` leaving out of `errors` the errors a `customValidate` returns as an array for an array field's items, and letting that array replace the validator's own errors; they are now listed and keyed by index in the `errorSchema` ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- Fix `isValid()` not resolving a `$ref` below a nested `$id` in an option or `if`: it checks it against the resource holding it ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Change `isValid()` to treat a root whose `$id` isn't a string as having no `$id` ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `isValid()` answering a schema such as `{ $ref: '#/definitions/X' }` with a validator built for an earlier root; it resolves a root-local `$ref` against the root's own `$id` and rebuilds its validators when the root changes ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `compileSchemaValidatorsCode()` failing on a root with both `definitions` and `$defs`, a percent-encoded definition name, a `$ref` beside other keywords, a self-referencing property (a stack overflow), or a `$ref` by an equivalent URI or into a nested resource ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Change a precompiled validator to throw `was not compiled to a standalone validator` on validation for a `$ref` to nothing in the root or to another document ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix a precompiled validator throwing `was not compiled to a standalone validator` from `isValid()` for a schema holding only annotations, such as the root `{ title: 'Anything' }`; it now returns `true` ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix a precompiled validator throwing `was not compiled to a standalone validator` when a form scored an option carrying its own `$id`; `compileSchemaValidatorsCode()` now compiles it and reads a `$ref` below it against the option ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5455](https://github.com/rjsf-team/react-jsonschema-form/issues/5455))
- Change a precompiled validator's error for a schema it has no function for to name that schema: by where in the root a `$ref` it was handed points, or by the `$id` in its first `allOf` entry ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536), [#5455](https://github.com/rjsf-team/react-jsonschema-form/issues/5455))
- **BREAKING CHANGE:** Remove the `Result` type argument from `rawValidation()`, which now returns `ata-validator`'s `ValidationError`s, including on the validator `createPrecompiledValidator()` returns. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- **BREAKING CHANGE:** Change `createPrecompiledValidator()` to return `ATAPrecompiledValidator` instead of `ValidatorType`, so a variable it initializes needs a `ValidatorType` annotation to be assigned another validator. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#createprecompiledvalidator-returns-its-validator-class-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- Add the `ATAPrecompiledValidator` class to the root exports, which `createPrecompiledValidator()` returns, and `ata-validator`'s `ValidationError` type ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- **BREAKING CHANGE:** Change both validators to hand their `localizer` property names in error params quoted, such as `'foo'`, so a localized message names a property by its `title` or `ui:title`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-localizer-gets-quoted-property-names-from-a-precompiled-or-ata-validator-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- Fix a precompiled validator accepting any data for an `ataOptionsOverrides.schemas` or `additionalMetaSchemas` entry whose `$ref` points into the form's schema ([#5750](https://github.com/rjsf-team/react-jsonschema-form/pull/5750), [#5748](https://github.com/rjsf-team/react-jsonschema-form/issues/5748))
- Fix a precompiled validator using an `ataOptionsOverrides.schemas` or `additionalMetaSchemas` entry under the form's `$id` without its `#`, or under `__rjsf_rootSchema` for a form with no `$id`, in place of the form's schema ([#5750](https://github.com/rjsf-team/react-jsonschema-form/pull/5750), [#5748](https://github.com/rjsf-team/react-jsonschema-form/issues/5748))
- Fix a precompiled validator throwing `was not compiled to a standalone validator` for a form whose own `$ref` names the root by `__rjsf_rootSchema`, or by the form's `$id` where the root's `$id` sits beside a draft-07 `$ref` ([#5750](https://github.com/rjsf-team/react-jsonschema-form/pull/5750), [#5748](https://github.com/rjsf-team/react-jsonschema-form/issues/5748))
- Fix a precompiled validator throwing `was not compiled to a standalone validator` for a relative `$ref` into an `ataOptionsOverrides.schemas` or `additionalMetaSchemas` entry from below a nested `$id` of the form's schema, or from a form whose `$id` sits beside a draft-07 `$ref` ([#5750](https://github.com/rjsf-team/react-jsonschema-form/pull/5750))
- **BREAKING CHANGE:** Change the default `validator` export to a client module, so a React Server Component can pass it to `Form`; server code can no longer call it, so validate there with a validator from `customizeValidator()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-default-validator-is-a-client-module-breaking-change) ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- **BREAKING CHANGE:** Change an `additionalMetaSchemas` or `ataOptionsOverrides.schemas` list entry whose only `$id` is a fragment, such as `#frag`, to fail every validation, where it was ignored. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#an-extra-schema-whose-only-id-is-a-fragment-fails-validation-breaking-change) ([#5880](https://github.com/rjsf-team/react-jsonschema-form/pull/5880))
- Fix `isValid()` rejecting valid data for a form whose root `$id` is only a fragment, such as `#root`, and which names the root by it in a `$ref`, where `validateFormData()` and a precompiled validator accept it ([#5880](https://github.com/rjsf-team/react-jsonschema-form/pull/5880))
- Change `isValid()` to keep what it compiled for the last two root schemas instead of one, so changing the schema of a form with conditional or option fields no longer compiles their schemas again for each field it checks ([#5904](https://github.com/rjsf-team/react-jsonschema-form/pull/5904), [#5903](https://github.com/rjsf-team/react-jsonschema-form/issues/5903))
- Fix the error for a missing required property garbling a `title` or `ui:title` that contains `$$`, `$&`, `$'` or `` $` `` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property whose key holds `.`, `[` or `]` taking another field's `ui:title`, such as the `ui:title` of `b` inside `a` for a key `a.b` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property with a sub-field named `title` naming it `'[object Object]'` and taking that sub-field's uiSchema as its `title` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property ignoring a `ui:title` that only its schema path leads to when a key on that path holds `/` or `~` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix `validateFormData()` filing an error on a property whose name holds a `/` or `~` under an escaped name, such as `a~1b`, so it didn't show on its field and its message missed the property's `title` or `ui:title` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))

## @rjsf/validator-cfworker

- **BREAKING CHANGE:** Remove the `T` parameter of `customizeValidator()` and the `CFWorkerValidator` class, now `<S, F>`, so the default export fits every `Form`; drop a leftover data type argument, since the first one is now the schema type. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#validatortype-and-customizevalidator-take-the-schema-as-their-first-type-argument-breaking-change) ([#5311](https://github.com/rjsf-team/react-jsonschema-form/pull/5311))
- Change `isValid()` to log an error it catches once rather than on every re-render, naming the schema by its `$id` or hash ([#5344](https://github.com/rjsf-team/react-jsonschema-form/pull/5344), [#3051](https://github.com/rjsf-team/react-jsonschema-form/issues/3051))
- Add an optional trailing `getCustomValidateFormData` parameter to `validateFormData()`, so the defaults `customValidate` sees honor the form's `customMergeAllOf` and `defaultFormStateBehavior` ([#5340](https://github.com/rjsf-team/react-jsonschema-form/pull/5340), [#4385](https://github.com/rjsf-team/react-jsonschema-form/issues/4385))
- Fix `isValid()` and `rawValidation()` letting two schemas whose `$id` is the empty string evict each other from the cache of built validators ([#5371](https://github.com/rjsf-team/react-jsonschema-form/pull/5371), [#5338](https://github.com/rjsf-team/react-jsonschema-form/issues/5338))
- Fix the `errors` a validation returns dropping an error whose `message` a `transformErrors` cleared when a `customValidate` is passed, so such a form submitted instead of reporting them through `onError` ([#5469](https://github.com/rjsf-team/react-jsonschema-form/pull/5469), [#5034](https://github.com/rjsf-team/react-jsonschema-form/issues/5034))
- Fix `validateFormData()` leaving out of `errors` the errors a `customValidate` returns as an array for an array field's items, and letting that array replace the validator's own errors; they are now listed and keyed by index in the `errorSchema` ([#5553](https://github.com/rjsf-team/react-jsonschema-form/pull/5553), [#3827](https://github.com/rjsf-team/react-jsonschema-form/issues/3827))
- Fix `isValid()` not resolving a `$ref` below a nested `$id` in an option or `if`: it checks it against the resource holding it ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535), [#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Change `isValid()` to treat a root whose `$id` isn't a string as having no `$id` ([#5535](https://github.com/rjsf-team/react-jsonschema-form/pull/5535))
- Fix `isValid()` logging `Unresolved $ref` for a `$ref` into a `dependencies` entry named like a keyword, such as `type` or `properties`, including under a property whose name holds a `#` or in a resource with its own `$id` ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid()` not finding a root with an `$id` from a `$ref` in a 2020-12 root, so an `if: { $ref: … }` condition always took `else` and `getFirstMatchingOption()` picked the wrong `$ref` option ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid(rootSchema, data, rootSchema)` returning `false` for a root whose `$id` ends in an empty fragment ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- Fix `isValid()` and `validateFormData()` reporting an unresolved `$ref` for one that escapes a `#` in a name as `%23`, such as `{ $ref: '#/definitions/a%23b' }` ([#5536](https://github.com/rjsf-team/react-jsonschema-form/pull/5536))
- **BREAKING CHANGE:** Remove the `Result` type argument from `rawValidation()`, which now returns `CFWorkerValidationError`s. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#any-members-of-the-public-types-are-specific-types-breaking-change) ([#5678](https://github.com/rjsf-team/react-jsonschema-form/pull/5678))
- Fix `validateFormData()` filing the error on a property whose name holds a `/`, `~`, `#`, space or non-ASCII character under an escaped name, so it didn't show on its field ([#5749](https://github.com/rjsf-team/react-jsonschema-form/pull/5749))
- Fix `validateFormData()` leaving out the `ui:title` of a missing required property in an array item under a key holding such a character ([#5749](https://github.com/rjsf-team/react-jsonschema-form/pull/5749))
- Change `@cfworker/json-schema` to `^4.1.6`, whose [stricter checks](https://github.com/cfworker/cfworker/blob/main/packages/json-schema/CHANGELOG.md) can reject data 4.1.1 accepted, such as a `time` without an offset or `required: ['toString']` on `{}` ([#5749](https://github.com/rjsf-team/react-jsonschema-form/pull/5749))
- **BREAKING CHANGE:** Change the default `validator` export to a client module, so a React Server Component can pass it to `Form`; server code can no longer call it, so validate there with a validator from `customizeValidator()`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#the-default-validator-is-a-client-module-breaking-change) ([#5863](https://github.com/rjsf-team/react-jsonschema-form/pull/5863), [#5761](https://github.com/rjsf-team/react-jsonschema-form/issues/5761))
- Fix the error for a missing `dependentRequired` or `dependencies` property showing on the object rather than the missing field, and naming the properties by their keys rather than their `title` or `ui:title` ([#5901](https://github.com/rjsf-team/react-jsonschema-form/pull/5901), [#4402](https://github.com/rjsf-team/react-jsonschema-form/issues/4402))
- Change `isValid()` to keep what it compiled for the last two root schemas instead of one, so changing the schema of a form with conditional or option fields no longer compiles their schemas again for each field it checks ([#5904](https://github.com/rjsf-team/react-jsonschema-form/pull/5904), [#5903](https://github.com/rjsf-team/react-jsonschema-form/issues/5903))
- Fix the error for a missing `required`, `dependentRequired` or `dependencies` property garbling a `title` or `ui:title` that contains `$$`, `$&`, `$'` or `` $` `` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Change the error for a missing `required`, `dependentRequired` or `dependencies` property to find a property's title as `@rjsf/validator-ajv8` does, also reading a `title` the uiSchema holds for it and reading the schema's `title` past an empty `ui:title` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing property whose key holds `.`, `[` or `]` taking another field's `ui:title`, such as the `ui:title` of `b` inside `a` for a key `a.b` ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))
- Fix the error for a missing `required` property whose key holds a quote, such as `it's`, filing it on a property named by the key up to the quote and leaving it untitled ([#5920](https://github.com/rjsf-team/react-jsonschema-form/pull/5920), [#5902](https://github.com/rjsf-team/react-jsonschema-form/issues/5902))

## All packages

- **BREAKING CHANGE:** Remove support for Node 20, 23, 25, 22 before 22.18.0 and 24 before 24.11.0: `engines.node` is now `^22.18.0 || ^24.11.0 || >=26.0.0` in every package, and CI runs Node 22, 24 and 26. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#node-support) ([#5253](https://github.com/rjsf-team/react-jsonschema-form/pull/5253))
- **BREAKING CHANGE:** Remove the CommonJS, bundled ESM and UMD builds in `dist/` and the `./dist` and `./dist/*.cjs` export paths: every package is ESM-only, publishing `lib/`, and `require()` still works through Node's native `require(esm)`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#esm-only-packages) ([#5255](https://github.com/rjsf-team/react-jsonschema-form/pull/5255), [#3812](https://github.com/rjsf-team/react-jsonschema-form/issues/3812))
- **BREAKING CHANGE:** Change every theme package's `react` peer dependency floor from `>=18` to `>=19`, and the repo to `react`/`react-dom` 19.2+, as the `@rjsf/mantine` upgrade to Mantine 9 requires. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#react-version) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260))
- **BREAKING CHANGE:** Change the `@types/react` requirement to 19.2.18 or later, the first release with the `SubmitEvent` type that the `onSubmit` of `@rjsf/core`'s and every theme's `Form` uses; an earlier release fails to compile with `TS2305: Module 'react' has no exported member 'SubmitEvent'`. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#formpropsonsubmit-event-type-breaking-change) ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260))
- **BREAKING CHANGE:** Remove deep imports through `@rjsf/<package>/lib/...`, and `@rjsf/snapshot-tests/package.json`; import from the package root instead. See [the upgrade guide](https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#deep-imports-are-removed-breaking-change) ([#5674](https://github.com/rjsf-team/react-jsonschema-form/pull/5674), [#5599](https://github.com/rjsf-team/react-jsonschema-form/issues/5599))
- Fix a range input reached through `ui:inputType: 'range'`, and a color input, drawing a clear button under `allowClearTextInputs`, in `@rjsf/core` and every theme; clearing it emptied the field while the slider showed its midpoint, or the color input black ([#5752](https://github.com/rjsf-team/react-jsonschema-form/pull/5752), [#5600](https://github.com/rjsf-team/react-jsonschema-form/issues/5600))

# 6.11.1

## @rjsf/core

- Updated `markdown-to-jsx` from `^9.8.2` to `^9.10.3` ([#5420](https://github.com/rjsf-team/react-jsonschema-form/pull/5420))
- Fixed `Form` failing validation with `must be boolean` (or the matching type error) when the root `formData` is a falsy value such as `false`, `0` or `''`. Only `undefined` is now treated as missing before validating, fixing [#5404](https://github.com/rjsf-team/react-jsonschema-form/issues/5404)
- Fix `Form` crashing with `Maximum update depth exceeded` when a widget or `setFieldValue()` calls `onChange` more than about 50 times in one event ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631), [#5532](https://github.com/rjsf-team/react-jsonschema-form/issues/5532))
- Fix `Form` ignoring later changes after a change whose `customValidate` or `transformErrors` throws. The form keeps its state and the error is rethrown from a timeout ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- **Potentially breaking change:** Change `setFieldValue()` so a throw from `customValidate` or `transformErrors` is rethrown from a timeout, so a `try`/`catch` around `setFieldValue()` no longer catches it ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- **Potentially breaking change:** Change `Form` to no longer call its deprecated `omitExtraData()` method, so a subclass overriding it no longer affects `liveOmit`, a submit or `validateForm()`. A submit no longer calls `validateFormWithFormData()` either ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- **Potentially breaking change:** Change `customValidate`, `transformErrors` and the validator to run while `Form` renders a change, so they must be pure: they can run more than once per change, and must not set another component's state ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- **Potentially breaking change:** Remove the undocumented `Form` members `pendingChanges` and `processPendingChange()` ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Change `noValidate` to hide custom errors a widget raised, including ones raised before it was turned on; they show again once it is turned off ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Fix `ErrorList` and the `onChange` event still listing a widget's custom error after an edit cleared it, with live validation off ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Change live validation on change to run once per burst of changes in one event, for the last one; the events of the changes before it report the errors from before the burst ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Fix `Form` reverting changes made in the same event as a submit, or as a blur with `liveValidate` or `liveOmit` set to `'onBlur'`. A throw from a blur's live validation is now rethrown from a timeout ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631), [#5660](https://github.com/rjsf-team/react-jsonschema-form/issues/5660))
- **Potentially breaking change:** Change a submit to validate and submit the data and schema of the changes made in the same event, rather than those from before them, so `onSubmit` gets the data the form shows. Its `customValidate` and `transformErrors` now run while `Form` renders, `focusOnFirstError` is called after the errors render, and a throw is rethrown from a timeout. With `createRoot`, a change made outside a React event, such as after an `await`, or in a transition is still not included ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Fix a blur with `liveOmit` set to `'onBlur'` omitting extra data against the schema from before a schema change the parent made in the same event as a field change ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Fix the errors of an old schema coming back after a schema change with live validation off, once another prop such as `uiSchema` changes, where they also hid a widget's custom error. With live validation on, an error hidden by `noValidate` now stays hidden after it is turned off until the next edit, even when `extraErrors` change ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))
- Change a widget's replacement of a validation error to be dropped when a parent storing `formData` hands the data back, with `liveValidate` set to `'onBlur'`. The field shows the validation error again until the next blur ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))

## @rjsf/shadcn

- Fixed `RadioWidget` not showing the selected value with `@radix-ui/react-radio-group` 1.4.x, which ignores the per-item `checked` prop. The `RadioGroup` is now controlled by the encoded option value, so it also follows a form reset or an outside `formData` change ([#5420](https://github.com/rjsf-team/react-jsonschema-form/pull/5420))
- Updated `lucide-react` to `^1.49.0`, which makes `Trash2` an alias of `Trash`: the remove button's icon class changes from `lucide-trash2` to `lucide-trash`, and the `PlusCircle`/`AlertCircle` icons gain `lucide-plus-circle`/`lucide-alert-circle` classes. Update any CSS or test selectors that target `.lucide-trash2` ([#5420](https://github.com/rjsf-team/react-jsonschema-form/pull/5420))

## @rjsf/utils

- Upgraded `@x0k/json-schema-merge` to `^1.1.0`, which merges `if`/`then`/`else`, `properties`/`patternProperties`/`additionalProperties` and `items`/`additionalItems` as groups. `omitExtraData()` merges an object's `allOf` before evaluating its conditions, and the older merge could pair one entry's `else` with another entry's `if`, so data from an inactive branch was kept. The same merge in `retrieveSchema()` no longer lets an `additionalProperties` or `additionalItems` from one `allOf` entry act on another entry's `properties`/`patternProperties`/`items`
- Fixed `retrieveSchema()` treating a `$ref` shared by several `dependencies` `oneOf` branches, `allOf` entries, `then`/`else` branches, `anyOf`/`oneOf` options or root properties as a recursion cycle, leaving it unresolved, fixing [#5434](https://github.com/rjsf-team/react-jsonschema-form/issues/5434). Reference resolution now tracks a path-scoped recursion stack, so a `$ref` is a cycle only when it is already being expanded on the current path, and previously expanded schemas keep their source ref on the path through `RJSF_REF_KEY`. Shared references resolve in every branch while recursive schemas still terminate
- Documented on `Experimental_DefaultFormStateBehavior.allOf` which `allOf` and `if-then-else` defaults `skipDefaults` still provides, related to [#3869](https://github.com/rjsf-team/react-jsonschema-form/issues/3869) ([#5444](https://github.com/rjsf-team/react-jsonschema-form/pull/5444))

## @rjsf/validator-ajv8

- Fixed apps that import only `createPrecompiledValidator` bundling all of AJV anyway: the default export's `customizeValidator()` call is now marked pure, so bundlers drop it ([#5559](https://github.com/rjsf-team/react-jsonschema-form/pull/5559))

## @rjsf/validator-ata

- Updated `ata-validator` from `^1.23.0` to `^1.40.1` ([#5420](https://github.com/rjsf-team/react-jsonschema-form/pull/5420))
- Updated `ata-validator` from `^1.40.1` to `^1.56.0`. 1.55.0 fixes a crash in precompiled validators: a one-character value under `minLength: 1`, or an emoji under a `maxLength`, threw `_cpLen is not defined`. 1.56.0 loads its code generator on demand in the browser, so with a bundler that splits chunks (Vite, webpack, Rollup) the runtime validator adds about 58 KB gzipped to the first load instead of 135 KB ([#5559](https://github.com/rjsf-team/react-jsonschema-form/pull/5559))
- Fixed apps that import only `createPrecompiledValidator` bundling all of ata-validator anyway: the default export's `customizeValidator()` call is now marked pure, so bundlers drop it ([#5559](https://github.com/rjsf-team/react-jsonschema-form/pull/5559))
- `compileSchemaValidators()` and `compileSchemaValidatorsCode()` now pass `ataOptionsOverrides` to ata, so options like `assertFormat: false` apply to the precompiled validator; only `verbose` was used before. `additionalMetaSchemas` and `schemas` overrides with an `$id` are now compiled into the module, so a custom meta-schema applies there too; they go in under the `$id` a `$ref` reaches each by (a draft-04 `id` in `schemas` where the entry is read as draft-04) and as the runtime validator ends up with them, a later entry replacing an earlier one with the same `$id` and the form's own schemas winning. A json-schema.org meta-schema passed in is compiled in too, with a warning giving its size, since ata already ships the official draft-04 to 2020-12 ones. `extenderFn` and the `coerceTypes`, `removeAdditional` and `keywords` overrides cannot be carried into the generated module: they were dropped silently and now log a warning, once per process, saying the precompiled and runtime validators may disagree. Extra schemas without an `$id`, which ata requires, log their own warning. Passing `suppressDuplicateFiltering` to the compile step also warns, pointing to `createPrecompiledValidator()` ([#5559](https://github.com/rjsf-team/react-jsonschema-form/pull/5559))
- Fixed `ataOptionsOverrides.schemas` being dropped by the runtime validator for every schema other than the root once a root schema was registered, a custom meta-schema among them: the root is now added after the caller's `schemas` instead of in their place, so it still wins over an entry with its `$id`, an `additionalMetaSchemas` entry with the root's `$id` no longer replaces it there, and the root's own validator reads `schemas` through the same list, so the root and its sub-schemas apply the same rules; a boolean record entry keeps its meaning ([#5571](https://github.com/rjsf-team/react-jsonschema-form/pull/5571))

## Dev / docs / playground

- Upgraded dependencies with minor or patch version bumps across all packages, including `nx`/`@nx/js`, `vite`, `@vitejs/plugin-react`, `@tailwindcss/cli`, `knip` and `lint-staged`, plus the playground's `monaco-editor` from `^0.55.1` to `^0.57.0`. Added `pnpm` overrides that pin `@types/react` and `@types/react-dom` to React 18 so libraries with an optional `@types/react` peer don't typecheck against React 19's types, plus one that holds `jsdom` at `~30.0.1` because 30.1 needs the global `Iterator` that Node 20 lacks. Renamed the vitest configs to `.mts` so Vite's `native` config loader can load them as ESM ([#5420](https://github.com/rjsf-team/react-jsonschema-form/pull/5420))
- Documented in the `allOf` section of `form-props.md`, and on `Experimental_DefaultFormStateBehavior.allOf`, which `allOf` and `if-then-else` defaults `skipDefaults` still provides, and added tests for those cases, related to [#3869](https://github.com/rjsf-team/react-jsonschema-form/issues/3869) ([#5444](https://github.com/rjsf-team/react-jsonschema-form/pull/5444))
- Documented precompiled validators for `@rjsf/validator-ata` in `usage/validation.md`, and added size-limit canaries that fail if `createPrecompiledValidator` stops tree-shaking in either validator package ([#5559](https://github.com/rjsf-team/react-jsonschema-form/pull/5559))
- Documented in `usage/validation.md` that `customValidate()` and `transformErrors()` must be pure, since they can run more than once for a change ([#5631](https://github.com/rjsf-team/react-jsonschema-form/pull/5631))

# 6.11.0

## @rjsf/core

- Fixed a `schema` prop change being silently dropped when it adds a property with a `default`, either as the parent's reply to `onChange` or at any point after a change to an uncontrolled form. The guard that keeps a oneOf/anyOf option switch from reverting now only applies when the form re-derives its own `formData` (an uncontrolled form, or a parent holding what `onChange` emitted, including when it reshaped the emitted value by spreading it, storing `undefined` as `null` or round-tripping it through JSON) with the same `schema` and `experimental_defaultFormStateBehavior`, and it keeps only that `formData` rather than dropping the rest of the prop update, fixing [#5294](https://github.com/rjsf-team/react-jsonschema-form/issues/5294)
- Fixed switching between `oneOf`/`anyOf` options keeping a value the previous option's `default` put there, so a property whose value still matches that default, or a whole option that does, now picks up the new option's `default` the way a scalar property already did, and switching back to an option restores its own defaults. A property the new option cannot hold as it stands now picks the new `default` up as well instead of arriving empty — one whose type differs between the options, or a `readOnly` one edited away from its default. Values are compared whole, so a nested object the user has partly edited keeps the rest of the old option's defaults, and a value equal to the old default is replaced no matter who supplied it, including one passed in `formData`, since the two cannot be told apart, fixing [#4476](https://github.com/rjsf-team/react-jsonschema-form/issues/4476)

## @rjsf/utils

- Updated `Experimental_DefaultFormStateBehavior` to add a new `requiredBooleanDefault` option, and updated `getDefaultFormState()` to honor it: `skip` turns off the `false` populated for a required boolean with no `default` (introduced in 6.9.0 by [#5170](https://github.com/rjsf-team/react-jsonschema-form/pull/5170)), so a form that models an unanswered boolean as its own state can keep it `undefined` and let `required` report it. The default, `populateFalse`, keeps the 6.9.0+ behavior

## @rjsf/validator-ata

- Updated `ata-validator` from `^1.7.1` to `^1.23.0`, picking up the corrected error shape for `unevaluatedProperties` (the error now carries `params.unevaluatedProperty`), the removal of a quadratic in `additionalProperties: false` schemas with many properties, a fix for a hang on truncated JSON input, and enforced strict-mode schema checks ([#5293](https://github.com/rjsf-team/react-jsonschema-form/pull/5293))

## Dev / docs / playground

- Documented the `requiredBooleanDefault` option in `form-props.md` and `internals.md`, and added a selector for it to the playground

# 6.10.1

## @rjsf/core

- Fixed a `dependencies`/`if` branch switch nested inside an object property never sanitizing a sibling field's now-invalid value. The check gating sanitization only compared the root retrieved schema, which never reflects a conditional resolved deeper in the tree, so it always skipped sanitizing in that case, fixing ([#5250](https://github.com/rjsf-team/react-jsonschema-form/issues/5250))
- Fixed `NumberField` losing or misinterpreting decimal input in comma-decimal locales, and passing a locale-formatted string instead of a `number` to custom and format-registered widgets, fixing [#5199](https://github.com/rjsf-team/react-jsonschema-form/issues/5199) and [#5241](https://github.com/rjsf-team/react-jsonschema-form/issues/5241)
- Fixed `NumberField` still comma-formatting the displayed value for a `text` widget with an explicit `ui:options.inputType` override in a comma-decimal locale; `getInputProps()` gives that override priority over the locale-based `text` fallback, so it rendered a native, locale-unaware `<input type="number">` that rejected the comma-formatted string

## @rjsf/mantine

- Fixed `BaseInputTemplate` passing an `undefined` value straight through to `NumberInput`/`TextInput`, which let the DOM input fall out of sync with React's controlled value and retain a stray digit after clearing a multi-digit number field ([#5269](https://github.com/rjsf-team/react-jsonschema-form/issues/5269))
- Backported the `fluid` `Container` layout fix from the v7 Mantine 9 upgrade ([#5260](https://github.com/rjsf-team/react-jsonschema-form/pull/5260)): `GridTemplate`'s and `ObjectFieldTemplate`'s root `Container` now use Mantine's `fluid` prop so forms fill their available width instead of centering at Mantine's default 960px max-width

## @rjsf/shadcn

- Fixed the documented `import '@rjsf/shadcn/dist/[theme].css'` failing to resolve. The prebuilt stylesheets were in the published tarball but no `exports` entry matched them, so Node and every bundler that honours the exports map rejected the path

## @rjsf/utils

- Fixed `sanitizeDataForNewSchema()` to resolve `dependencies`, `if`/`then`/`else` and `allOf` (not just `$ref`) on each property's old/new schema before comparing them, so a conditional nested inside an object property is taken into account when sanitizing its data, fixing ([#5250](https://github.com/rjsf-team/react-jsonschema-form/issues/5250))
- Added `schemaHasNestedConditional()`, which `Form` uses to detect a `dependencies`/`if` nested below a schema's top level (behind a `$ref`, `patternProperties`, tuple `items`, `additionalProperties` or `allOf`/`anyOf`/`oneOf`) so sanitization isn't skipped just because the root retrieved schema looks unchanged ([#5250](https://github.com/rjsf-team/react-jsonschema-form/issues/5250))
- Fixed `getInputProps()` defaulting `type: number` schemas to a native `number` input in locales whose decimal separator isn't `.`, where the browser rejects the localized value; it now defaults to a `text` input in those locales unless an explicit `inputType` is set
- Added `resolveDefaultWidget()`, extracting the widget-name/`enumOptions` fallback logic shared by `@rjsf/core`'s `StringField` and `NumberField` so the two can no longer drift out of sync
- Upgraded `@x0k/json-schema-merge` to `^1.0.6`, which now preserves Symbol-keyed properties (e.g. `Symbol(__rjsf_ref)`) when merging `allOf` schemas and no longer collapses distinct `allOf.contains` branches into one over-constrained schema; removed the corresponding Symbol-preservation and `contains`-extraction workarounds from `retrieveSchemaInternal()`, fixing ([#5146](https://github.com/rjsf-team/react-jsonschema-form/issues/5146))
- Fixed defaults from a dependency subschema being omitted when `getDefaultFormState()` is called without form data or with an empty object, fixing [#5198](https://github.com/rjsf-team/react-jsonschema-form/issues/5198)
- Fixed `computeDefaults()` to merge a non-object schema's `allOf` when `experimental_defaultFormStateBehavior.allOf` is set to `populateDefaults`, so a `$ref` wrapped in a single-element `allOf` now populates the same defaults as the bare `$ref` does, fixing [#5177](https://github.com/rjsf-team/react-jsonschema-form/issues/5177)

## Dev / docs / playground

- Fixed the size-limit report never being posted on a pull request from a fork. The comment workflow resolved the PR from its head sha, which the base repository cannot associate with a fork's commit, so it warned and skipped — leaving a green check and no comment. The measuring job now records the PR number in its artifact, and the comment workflow looks that PR up directly, accepts it only if its head sha matches the run's trusted `workflow_run` head sha, and fails loudly rather than skipping when the PR cannot be found
- Extended the size-limit checks to cover every released package rather than just `@rjsf/core`, `@rjsf/utils` and `@rjsf/validator-ajv8`. The checks are derived from each package's own `package.json`, so a new package or a dependency change needs no config edit; only the packages that already had budgets enforce one, the rest are measured and reported
- Moved `size-limit` and its preset out of the root `devDependencies` into their own pnpm project under `.github/size-limit`, so they are installed only by the size-limit workflow

# 6.10.0

## @rjsf/chakra-ui

- Removed an `environment` prop the test wrapper passed to `EnvironmentProvider`, which has no such prop and silently ignored it

## @rjsf/core

- Fixed defaults not being restored when returning to an `anyOf` or `oneOf` option with disjoint properties ([#3736](https://github.com/rjsf-team/react-jsonschema-form/issues/3736))
- Added `ui:autocapitalize` support for inputs rendered by `BaseInputTemplate`, allowing mobile keyboards to apply the requested capitalization behavior ([#2187](https://github.com/rjsf-team/react-jsonschema-form/issues/2187))

## @rjsf/mantine

- Added `ui:autocapitalize` support for text inputs ([#2187](https://github.com/rjsf-team/react-jsonschema-form/issues/2187))

## @rjsf/mui

- Added `ui:autocapitalize` support for text inputs ([#2187](https://github.com/rjsf-team/react-jsonschema-form/issues/2187))

## @rjsf/utils

- Fixed `sanitizeDataForNewSchema()` clearing existing arrays or preserving stale `undefined` values instead of retaining data or applying defaults for properties newly defined by the incoming schema ([#3736](https://github.com/rjsf-team/react-jsonschema-form/issues/3736))
- Added `autocapitalize` UI option handling to `getInputProps()` and its public input prop types ([#2187](https://github.com/rjsf-team/react-jsonschema-form/issues/2187))

## Dev / docs / playground

- Documented `ui:autocapitalize`, added it to the simple playground sample, and added cross-theme regression coverage ([#2187](https://github.com/rjsf-team/react-jsonschema-form/issues/2187))

## @rjsf/validator-ajv8

- Changed the `standaloneCode` import to name the file, `ajv/dist/standalone/index.js`, instead of the directory subpath `ajv/dist/standalone`. A `tsc-alias` replacer used to patch this into the emitted output; the source now says what it means. No public API changed

## Dev / docs / playground

- Relative TypeScript imports now name their real `.ts`/`.tsx` source file (and an explicit `index.ts` for directory imports), and TypeScript's `rewriteRelativeImportExtensions` emits the `.js` specifiers directly. This removes `tsc-alias` and its post-emit string rewriting entirely, along with the `tsc-alias-replacer/` directory, both `tsconfig.replacer.json` files, the `compileReplacer` scripts and `move-file-cli`. Naming the source file rather than the output is deliberate: Node's native type stripping requires exact `.ts` extensions and does no extension or directory-index searching, so this avoids a second repository-wide import migration later
- Fixed `packages/daisyui/test/tsconfig.json`, which was configured to emit into `../dist` — the esbuild/rollup bundle output directory — instead of type-checking without emit like every other test project
- Collapsed each package's `tsconfig.json` + `tsconfig.build.json` + `src/tsconfig.json` chain into one source config plus one test config extending a new shared root `tsconfig.test.json`. Building a package no longer pulls its dependencies' test projects into the graph
- Fixed the root `tsconfig.json`, which referenced `snapshot-tests` twice and omitted `mantine`, `primereact`, `validator-ata` and `validator-cfworker`. It now lists every source and test project once, and a new root `typecheck` script runs in CI, so tests are typechecked for the first time. That surfaced stale tests in `@rjsf/chakra-ui` and `@rjsf/validator-ata` and two drifted playground samples, fixed here. `@rjsf/chakra-ui`'s `type-check` script previously ran against a solution config with `files: []` and checked nothing
- Every package now emits `lib/` with the same settings: `esnext` target plus `.js.map` and `.d.ts.map`. Previously only `@rjsf/core` did; the rest emitted ES2018 with JS source maps only, depending on which root config their `src/tsconfig.json` extended
- `tsconfig.tsbuildinfo` is no longer written into `lib/` and published with it. In 6.8.0 it was 446 kB of `@rjsf/antd`'s 959 kB unpacked tarball
- Set `"types": []` in `tsconfig.base.json` so packages no longer see every hoisted `@types/*`, with Node-using packages opting in, and `"lib": ["ESNext"]` in the three validator packages so they cannot compile against browser globals
- `build:ts` is now plain `tsc -b`. The old `rimraf ./lib` also deleted the build-info, forcing a full rebuild every time; the build-info is now an Nx `build` output alongside `lib/` so cache restores stay coherent
- Added `"type": "module"` to `@rjsf/snapshot-tests`, which publishes ESM `.js` files
- Enabled `verbatimModuleSyntax`, so type-only imports must be written as `import type`. The one import it affected, `React` in `@rjsf/utils`'s `shouldRender.ts`, is now type-only, so emitted output is unchanged

# 6.9.0

> **Potentially breaking change:** `lodash` and `lodash-es` are no longer dependencies of any `@rjsf/*` package. No RJSF public API changed, but an application that imports `lodash` itself without declaring it — relying on it being hoisted into `node_modules` because RJSF depended on it — must now add `lodash` to its own `package.json`.

## @rjsf/antd

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `BaseInputTemplate` to clear `number`/`integer` fields back to `undefined` instead of `null` when the `InputNumber` widget is emptied, fixing [#5213](https://github.com/rjsf-team/react-jsonschema-form/issues/5213)
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/chakra-ui

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/core

- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused modules; a consumer importing only `Form` no longer bundles the AJV validator chain pulled in by `getTestRegistry`, shrinking a minimal bundle by ~34kB gzipped
- Fixed `TimeWidget` to respect schema `multipleOf` time precision, preserving second-precision values while keeping minute-precision native inputs synchronized with their displayed value ([#5174](https://github.com/rjsf-team/react-jsonschema-form/pull/5174))
- Replaced all path-based `lodash` usage (`get`, `set`, `unset`, `toPath`, `pick`) with the new `@rjsf/utils` path utilities
- Replaced the remaining non-path `lodash` usage (`isEmpty`, `isObject`, `isPlainObject`, `each`, `flatten`, `includes`, `intersection`, `last`, `uniqueId`, `noop`) with native equivalents, and dropped the `lodash`/`lodash-es` dependencies entirely
- Fixed the clearing of errors on change so that only the field that actually changed loses its error, along with the errors the containers holding it own, rather than every field under the top-level key holding it, fixing [#5197](https://github.com/rjsf-team/react-jsonschema-form/issues/5197) ([#5205](https://github.com/rjsf-team/react-jsonschema-form/pull/5205))
- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Renamed the test file `Form.test.tsx` to `Form.behaviors.test.tsx` so all the `Form` test files follow the `Form.<topic>.test.tsx` naming pattern introduced by [#5219](https://github.com/rjsf-team/react-jsonschema-form/pull/5219)
- Fixed `ObjectField` to coerce a cleared `additionalProperties`/`patternProperties` value to the empty string only when the change targets the additional property's own path, so clearing a field nested inside an entry now omits that field's key instead of storing `""` in it, fixing [#5222](https://github.com/rjsf-team/react-jsonschema-form/issues/5222)
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/daisyui

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Removed the module-level Font Awesome `library.add()` call from `AddButton`; every icon is passed to `FontAwesomeIcon` as an imported icon object, so the global registry was never consulted
- Registered `ArrayFieldDescriptionTemplate` and `ArrayFieldTitleTemplate` in `generateTemplates()`; `ArrayFieldTemplate` already looked these up from the registry, but since they were never registered, array titles/descriptions silently fell back to `core`'s unstyled defaults instead of the DaisyUI-styled versions the theme ships
- Added `generateForm`, `generateTemplates`, `generateTheme` and `generateWidgets` exports so `lib/index.d.ts` matches the other themes, and consolidated the duplicate `daisyForm` entry point into `DaisyUIForm`
- Wired the previously-unused `getDaisy()`/`DaisyProps` helpers into `FieldTemplate`, so `ui:options: { daisy: { theme, className, style } }` now applies a per-field DaisyUI theme, class name and/or style
- Fixed `build:esm`/`build:umd` in `package.json`, which built and named the bundle as `@rjsf/chakra-ui` (`dist/chakra-ui.esm.js`/`.umd.js`) instead of `@rjsf/daisyui`
- Gave `ArrayFieldTitleTemplate` and `ArrayFieldDescriptionTemplate` the `id` (`titleId`/`descriptionId` derived from `fieldPathId`) and empty-value guard every other template implementing these has, and that registering them in `generateTemplates()` had otherwise dropped from array titles/descriptions
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/fluentui-rc

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/mantine

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Moved the `dayjs` `customParseFormat` plugin registration from the widgets barrel file into `DateTimeInput`, so it loads with the date widgets that actually need it
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/mui

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/primereact

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `ArrayFieldTemplate` leaking the `errorSchema` object into the DOM as an `errorschema="[object Object]"` attribute
- Fixed `SelectWidget` clobbering a consumer-supplied `options.prime.autoComplete` with `undefined` when `ui:autocomplete` is not set
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/react-bootstrap

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/semantic-ui

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `RadioWidget` forwarding the unsupported `fluid`/`inverted` props to Semantic UI's `Radio`, which triggered React unknown-attribute warnings
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/shadcn

- Updated `CheckboxWidget` to append a `*` onto the end of the label when the field is required AND the schema value is hardcoded to `true`, fixing [#4136](https://github.com/rjsf-team/react-jsonschema-form/issues/4136)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Fixed `FancySelect` showing a red error border on required empty enum fields before validation runs, fixing [#5187](https://github.com/rjsf-team/react-jsonschema-form/issues/5187) ([#5209](https://github.com/rjsf-team/react-jsonschema-form/pull/5209))
- Fixed `BaseInputTemplate`'s `ui:allowClearTextInputs` clear button to store `ui:emptyValue` (`undefined` by default) instead of always storing `""`, so clicking it now behaves exactly like clearing the input by typing. **Potentially breaking change:** an app that never sets `ui:emptyValue` and clicks the clear button on a field (rather than backspacing it) previously got `""` back; it now gets `undefined`, matching every other way of emptying the field.

## @rjsf/utils

- Fixed `mergeDefaultsWithFormData()` to take the recursive path when the default under an object key holds an array, so a default that lives inside a `dependencies` subschema is no longer dropped when the owning array sits more than one object below the root, fixing part of [#5198](https://github.com/rjsf-team/react-jsonschema-form/issues/5198) ([#5202](https://github.com/rjsf-team/react-jsonschema-form/pull/5202))
- Added new path utilities `getByPath`, `setByPath`, `hasByPath`, `unsetByPath` and `toPath`, and switched all path-based `lodash` usage (`get`, `set`, `setWith`, `has`, `unset`, `toPath`, `pick`) over to them. Unlike their lodash counterparts, these treat a bare string as a single literal key, lodash-style dotted path strings are parsed explicitly via `toPath()`, and `getByPath()`/`hasByPath()` resolve **own** properties only (inherited members and prototype internals such as `__proto__` never resolve)
- Replaced the remaining non-path `lodash` usage (`isEmpty`, `isObject`, `isPlainObject`, `difference`, `times`, `uniqueId`, `noop`) with native equivalents, and dropped the `lodash`/`lodash-es` dependencies entirely
- Added `isPlainObject`, the stricter counterpart to `isObject()` that excludes class instances, replacing `lodash/isPlainObject` for consumers
- Added `getPropertySchema()`, which reads a property sub-schema out of a schema's `properties`, defaulting to an empty schema; it replaces the repeated `(schema[PROPERTIES_KEY]?.[key] ?? {}) as S` lookups in `@rjsf/utils` and `@rjsf/core`
- Added `noop()`, a do-nothing function replacing `lodash/noop` for consumers
- Added an optional `deep` flag to `getChangedFields()` that descends into nested objects and same-length arrays and returns the dotted path of the field that changed ([#5205](https://github.com/rjsf-team/react-jsonschema-form/pull/5205))
- Made the default value of a required boolean field be false if a `default` is not present in the schema
- Fixed `omitExtraData()` by removing the over-reaching `additionalProperties: false` post-processing block introduced in [#5147](https://github.com/rjsf-team/react-jsonschema-form/pull/5147) that incorrectly stripped keys written by winning `oneOf`/`anyOf` and `if/then/else` branches, fixing [#5194](https://github.com/rjsf-team/react-jsonschema-form/issues/5194)
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports
- Sped up the test suite (~6.2s → ~2.7s) by defaulting to vitest's `node` environment; the few DOM-dependent test files opt back into jsdom with a `@vitest-environment` pragma, and the shared test setup skips its ResizeObserver mock when there is no `window`

## @rjsf/validator-ajv8

- Replaced all `lodash/get` usage with the new `@rjsf/utils` path utilities
- Replaced `lodash/isObject` with `isObject` from `@rjsf/utils` and dropped the `lodash`/`lodash-es` dependencies entirely
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports

## @rjsf/validator-ata

- Replaced all `lodash/get` usage with the new `@rjsf/utils` path utilities
- Replaced `lodash/isObject` with `isObject` from `@rjsf/utils` and dropped the `lodash`/`lodash-es` dependencies entirely
- Updated `ata-validator` dependency to `^1.7.1`, picking up lazily materialized errors and the closure-tree interpreted engine ([#5211](https://github.com/rjsf-team/react-jsonschema-form/pull/5211))
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports

## @rjsf/validator-cfworker

- Replaced all `lodash/get` usage with the new `@rjsf/utils` path utilities and dropped the `lodash`/`lodash-es` dependencies entirely
- Declared `"sideEffects": false` in `package.json`, allowing bundlers to tree-shake unused exports

## Dev / docs / playground

- Removed the last `lodash` usage from the playground and the test suites, so no package declares `lodash`/`lodash-es` as a direct dependency any more (both remain in the lockfile as transitive dependencies of third-party tooling). The `lodashReplacer` `tsc-alias` machinery that rewrote `lodash` imports to `lodash-es` for the ESM builds has been deleted along with it
- Cleaned up `@rjsf/validator-ajv8`'s tests: the deliberately-triggered AJV `console.warn` output is now asserted with a shared `expectWarn()` helper instead of leaking into the test output
- Added `size-limit` CI checks that enforce bundle size budgets for `@rjsf/core`, `@rjsf/utils` and `@rjsf/validator-ajv8` — each measured both with and without its runtime dependencies, plus single-export tree-shaking canaries — and comment the size diff versus the base branch on every PR
- Restructured `@rjsf/core`'s test suite for speed: the "Form common" suite was split by topic into six test files so vitest can parallelize them, and the `StringField` suite is no longer re-executed via cross-imports from the `ArrayField`/`ObjectField` suites (302 duplicate test executions removed)
- Added `knip` and removed the unused code, exports and dependencies it reported ([#5194](https://github.com/rjsf-team/react-jsonschema-form/pull/5194))
- Removed test-setup shims that empirically no longer do anything (each verified by deleting it and running the package's suite): core's `setImmediate` global, antd's `MessageChannel` global, chakra-ui's `structuredClone` JSON polyfill (native since Node 17), mantine's `cleanSnapshotSerializer` (a no-op on all current snapshots), and primereact's `<style>`-injection blocker
- Upgraded the test tooling: `@testing-library/jest-dom` 6→7, `jsdom` 29→30, `@testing-library/user-event` to 14.6.6, `vitest` to 4.1.11, and declared the `@testing-library/dom` peer explicitly at the root. Self-anchored test selectors were rewritten to `:scope` to match jsdom 30's corrected element-scoped `querySelectorAll` behavior
- Tests now resolve `@rjsf/*` workspace imports to TypeScript source via a custom `@rjsf/source` export condition (declared in a new shared `testing/vitest.base.ts` that every package's vitest config extends), so `git clone && pnpm install && pnpm vitest run` works with no build step and tests always exercise current source; a root vitest `projects` config also lets vitest run across every package from the repo root, while the nx-driven test scripts remain unchanged
- Simplified `@rjsf/validator-ajv8`'s precompiled-validator test harness: the tests now compile `superSchema` in memory via a small `compileSuperSchema()` helper, replacing the generated gitignored `superSchema*.cjs` fixtures and with them the `compileSchemas` npm script and the vitest `globalSetup` that regenerated them
- Updated the `emptyValue` and `allowClearTextInputs` uiSchema docs to indicate relationship each other.

# 6.8.0

## @rjsf/core

- Fixed `TimeWidget` to respect schema `multipleOf` time precision, preserving second-precision values while keeping minute-precision native inputs synchronized with their displayed value ([#5174](https://github.com/rjsf-team/react-jsonschema-form/pull/5174))

## @rjsf/utils

- Fixed an issue in `sortedJSONStringify` with regards to handling arrays containing `null` and `undefined` values.

## @rjsf/validator-ata

- Raised the `ata-validator` requirement to `^1.3.0`, which fixes a `$ref` that could not be resolved being treated as vacuous rather than reported as an error ([#5181](https://github.com/rjsf-team/react-jsonschema-form/pull/5181))
- Raised the `ata-validator` requirement to `^1.6.0`, so that validation runs correctly where `new Function` is refused, such as a page under a strict Content-Security-Policy ([#5184](https://github.com/rjsf-team/react-jsonschema-form/pull/5184))
- Raised the `ata-validator` requirement to `^1.6.1`, which stops a `$ref` into another document from silently dropping the constraints behind it ([#5186](https://github.com/rjsf-team/react-jsonschema-form/pull/5186))

## @rjsf/validator-cfworker

- Added an eval-free, draft-2020-12 validator package backed by `@cfworker/json-schema`, including undefined form-data normalization and per-schema-id caching, fixing [#3269](https://github.com/rjsf-team/react-jsonschema-form/issues/3269) and contributing to [#4923](https://github.com/rjsf-team/react-jsonschema-form/issues/4923)

## Dev / docs / playground

- Added `@rjsf/validator-cfworker` to the playground validator selector and API documentation

# 6.7.1

## @rjsf/core

- Support locale-specific decimal separators in `NumberField` (e.g. Polish/German comma decimal separators) without breaking non-text widgets like radio buttons and select dropdowns, fixing [#5148](https://github.com/rjsf-team/react-jsonschema-form/pull/5148)
- Fixed `ObjectField` to preserve the insertion order of additional and pattern properties when keys are renamed to integers, fixing [#4631](https://github.com/rjsf-team/react-jsonschema-form/issues/4631)

## @rjsf/utils

- Added `getDecimalSeparator()` utility to detect locale-specific decimal separators and updated `asNumber()` to parse locale-specific decimal strings, partially fixing [#5148](https://github.com/rjsf-team/react-jsonschema-form/pull/5148)
- Fixed a regression where `getDefaultFormState()` with `experimental_defaultFormStateBehavior.arrayMinItems.populate = 'never'` padded arrays with `null` entries up to `minItems`, fixing [#5163](https://github.com/rjsf-team/react-jsonschema-form/issues/5163)
  - Optional arrays with no data are now omitted (unchanged) while required arrays with no data default to `[]`, letting the validator report the `minItems` violation instead of surfacing invalid `null` items

## @rjsf/validator-ajv8

- Updated `AJV8Validator` to remove broken schemas from AJV cache after compilation error, fixing [#3933](https://github.com/rjsf-team/react-jsonschema-form/issues/3933)

## @rjsf/validator-ata

- Updated the `ata-validator` dependency to `^1.1.0`, which fixes a stack overflow in browser environments for schemas its JS engine cannot compile and shrinks the install footprint via per-platform optional packages ([#5162](https://github.com/rjsf-team/react-jsonschema-form/pull/5162))

## Dev / docs / playground

- Updated `utility-functions.md` to document `getDecimalSeparator()`
- Removed bump-peer-deps script, pnpm workspaces now handles this for us.

# 6.7.0

## @rjsf/antd

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/chakra-ui

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/core

- Fixed [#3907](https://github.com/rjsf-team/react-jsonschema-form/issues/3907) and [#4262](https://github.com/rjsf-team/react-jsonschema-form/issues/4262) as follows:
  - Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
  - Added `CyclicSchemaField` to the list of fields, that renders the `CyclicSchemaExpandTemplate` initially and, if expanded, will render the `SchemaField` with the `RJSF_REF_CYCLE_KEY` tag turned off
  - Updated `SchemaForm` to render the `CyclicSchemaField` when the schema contains the `RJSF_REF_CYCLE_KEY` set to `true`
- Fixed array fields with empty tuple `items` and schema-valued `additionalItems` so clicking add renders the additional item field, fixing [#3791](https://github.com/rjsf-team/react-jsonschema-form/issues/3791)
- Added a warning when a `select` widget schema default is not present in the enum options, fixing [#4494](https://github.com/rjsf-team/react-jsonschema-form/issues/4494)
- Fixed `SchemaField` so that a schema with a primitive or array `type` alongside a non-select `oneOf`/`anyOf` no longer renders a spurious duplicate input above the option selector, fixing [#5119](https://github.com/rjsf-team/react-jsonschema-form/issues/5119)
- Fixed `MultiSchemaField` to propagate the parent schema's `type` to option sub-schemas that don't define their own, so the correct widget (e.g. `StringField`) renders for the selected option instead of `FallbackField`, fixing [#5119](https://github.com/rjsf-team/react-jsonschema-form/issues/5119)
- Fixed nested `constAsDefaults` values being skipped in matching conditional `allOf` schemas, fixing [#4963](https://github.com/rjsf-team/react-jsonschema-form/issues/4963)
- Fixed `processPendingChange` so that clearing a string field that has a schema `default` value no longer re-applies the default, fixing [#5125](https://github.com/rjsf-team/react-jsonschema-form/issues/5125)
- Fixed a regression introduced in [#5136](https://github.com/rjsf-team/react-jsonschema-form/pull/5136) where clearing a second field caused a previously-cleared field to be re-populated with its schema default; uses `JSON.parse(JSON.stringify(...))` to strip `undefined`-valued keys from formData before AJV validation so that the [#4518](https://github.com/rjsf-team/react-jsonschema-form/issues/4518) fix is preserved
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))
- Fixed `ObjectField`'s "Add" button for `additionalProperties` schemas containing a `$ref` so the new item's default value is computed via `getDefaultFormState()` against the fully-resolved referenced schema (recursively populating nested defaults) instead of only reading the resolved schema's own top-level `default`, which discarded the sibling `default` and any nested property defaults, fixing [#4266](https://github.com/rjsf-team/react-jsonschema-form/issues/4266)

## @rjsf/daisyui

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/fluentui-rc

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/mantine

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/mui

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/primereact

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/react-bootstrap

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/semantic-ui

- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/shadcn

- Updated the single select trigger to use native button semantics with expanded and disabled state coverage, fixing [#4764](https://github.com/rjsf-team/react-jsonschema-form/issues/4764) ([#5117](https://github.com/rjsf-team/react-jsonschema-form/pull/5117))
- Added `CyclicSchemaExpandTemplate` to the list of templates for the theme, updating snapshots accordingly
- Fixed a small visual bug that caused hovering over items of `FancySelect` and `FancyMultiSelect` that have the same label to incorrectly highlight more than one element, fixing [#5126](https://github.com/rjsf-team/react-jsonschema-form/issues/5126)
- Fixed `CommandItem` value handling in `FancySelect` and `FancyMultiSelect` components to ensure values are passed as strings ([#5155](https://github.com/rjsf-team/react-jsonschema-form/pull/5155))
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))

## @rjsf/utils

- Updated `types.ts` to add `CyclicSchemaExpandProps` type and `CyclicSchemaExpandTemplate` in the `TemplatesType`
- Updated `resolveAllReferences()` to add a new `markCycleOnDetection` prop which adds `RJSF_REF_CYCLE_KEY` marker (from `constants.ts`) to a schema that has been detected to have a cycle, partially fixing [#3907](https://github.com/rjsf-team/react-jsonschema-form/issues/3907)
- Updated `hashForSchema()` to filter keys to remove `RJSF_REF_KEY` prefixed keys before hashing the schema
- Updated `enums.ts` to add `ExpandButton` and `CycleDetected` keys
- Updated `isFixedItems()` to treat empty tuple `items` arrays as fixed items so `additionalItems` schemas are handled consistently, fixing [#3791](https://github.com/rjsf-team/react-jsonschema-form/issues/3791)
- Added `logUnsupportedDefaultForEnum()` helper for theme select widgets to warn when a schema default is not present in the enum options, fixing [#4494](https://github.com/rjsf-team/react-jsonschema-form/issues/4494)
- Fixed `retrieveSchema()` to preserve boolean conditional branches while resolving schemas, fixing [#4476](https://github.com/rjsf-team/react-jsonschema-form/issues/4476) ([#5101](https://github.com/rjsf-team/react-jsonschema-form/pull/5101))
- Updated `Experimental_DefaultFormStateBehavior` to add a new `nestedDefaultsPrecedence` option
- Updated `getDefaultFormState()` to use the new `nestedDefaultsPrecedence` option to control how defaults defined on multiple levels are merged together, fixing [#5089](https://github.com/rjsf-team/react-jsonschema-form/issues/5089)
- Updated `omitExtraData()` to better handle `allOf`s containing multiple `if/then/else` blocks, matching fix in `SJSF`, fixing [#5142](https://github.com/rjsf-team/react-jsonschema-form/issues/5142)
- Fixed `optionsList()` to preserve an explicitly empty string `title` on `oneOf`/`anyOf` options instead of falling back to the option's value, fixing [#4448](https://github.com/rjsf-team/react-jsonschema-form/issues/4448)
- Show selected option descriptions, fixing ([#4214](https://github.com/rjsf-team/react-jsonschema-form/issues/4214))
- Fixed `getDefaultFormState()` so that optional array defaults are not initialized when `experimental_defaultFormStateBehavior.arrayMinItems.populate = never`, fixing [#5149](https://github.com/rjsf-team/react-jsonschema-form/issues/5149)

## @rjsf/validator-ajv8

- Updated `transformRJSFValidationErrors()` to detect field name for `allOf` and `if-then-else` by falling back to the root schema to find the title, fixing [#5134](https://github.com/rjsf-team/react-jsonschema-form/issues/5134)

## @rjsf/validator-ata

- Updated `transformRJSFValidationErrors()` to detect field name for `allOf` and `if-then-else` by falling back to the root schema to find the title, fixing [#5134](https://github.com/rjsf-team/react-jsonschema-form/issues/5134)
- Updated the `ata-validator` dependency to `^1.0.0`, its first stable release; no API changes for `@rjsf/validator-ata` consumers ([#5157](https://github.com/rjsf-team/react-jsonschema-form/pull/5157))

## Dev / docs / playground

- Updated `@rjsf/snapshots` to add a test case to `formTests` that verifies the new Cycle detection UI
- Updated the `custom-templates.md` and `custom-widgets-fields.md` for the new feature
- Updated `utility-functions.md` to document `logUnsupportedDefaultForEnum()`
- Updated the playground to add a selector for the `nestedDefaultsPrecedence` option
- Replaced npm with pnpm v10 for development

# 6.6.2

## @rjsf/core

- Fixed schema-change handling so dependent enum updates sanitize invalid scalar field data without over-sanitizing root, object, array, readonly, or disabled field changes, fixing [#3838](https://github.com/rjsf-team/react-jsonschema-form/issues/3838)
- Updated `Form` tests to verify fix for [#1357](https://github.com/rjsf-team/react-jsonschema-form/issues/1357) and [#2492](https://github.com/rjsf-team/react-jsonschema-form/issues/2492)
  - Also added `console` message suppression support to the tests to reduce noise
- Updated `MultiSchemaField` by skipping next option recalculation when a user selects an option, fixing [#3833](https://github.com/rjsf-team/react-jsonschema-form/issues/3833)
- Updated `Form`'s `validate()` function to pass the original schema to AJV when no pre-resolved schema is provided, fixing [#3368](https://github.com/rjsf-team/react-jsonschema-form/issues/3368)
- Improved performance of `IconButtons` in all themes, `ArrayField` components and `ObjectField` components using memoization, partially fixing [#3183](https://github.com/rjsf-team/react-jsonschema-form/issues/3183)
- Fixed `ObjectField` so renaming an `additionalProperties` key to an empty string is no longer silently dropped, using `Object.hasOwn` instead of a falsy check ([#5098](https://github.com/rjsf-team/react-jsonschema-form/pull/5098))

## @rjsf/utils

- Updated `sanitizeDataForNewSchema()` to preserve valid enum values while replacing or clearing stale values across enum, `oneOf`, and `anyOf` schema changes, fixing [#3838](https://github.com/rjsf-team/react-jsonschema-form/issues/3838)
- Updated `sanitizeDataForNewSchema()` to filter out invalid enum values in arrays, fixing [#1357](https://github.com/rjsf-team/react-jsonschema-form/issues/1357) and [#2492](https://github.com/rjsf-team/react-jsonschema-form/issues/2492)

## Dev / docs / playground

- Upgraded `vitest` and `jsdom` to the latest to remove deprecated package warnings
- Fix a documentation error related to precedence when setting default values ([#5089](https://github.com/rjsf-team/react-jsonschema-form/issues/5089))

# 6.6.1

## Dev / docs / playground

- Updated peer dependencies to 6.6.x

# 6.6.0

## @rjsf/core

- Updated `Form` to stop using `removeOptionalEmptyObjects()` and deprecating `removeEmptyOptionalObjects` prop

## @rjsf/utils

- Adopted the `svelte-jsonschema-form` algorithm for `omitExtraData()`, adding in support for the code from `removeOptionalEmptyObjects()`, exporting the `isValueEmpty()` function from the library
- Deprecated the `removeOptionalEmptyObject()` and `toPathSchema()` functions, `toPathSchema()` on `SchemaUtilsType` and the `PathSchema` type
- Added `relaxOptionsForScoring()` utility that normalizes a `oneOf`/`anyOf` option list for scoring with optional `$ref`s resolution
  Converts boolean schemas to object equivalents and widens `additionalProperties: false → true` so that `getClosestMatchingOption` does not produce false negatives when form data contains keys not declared in `properties`
- Fixed `resolveAnyOrOneOfSchemas` (called by `schemaParser` with `expandAllBranches=true`) to use `getFirstMatchingOption` on the options returned from `relaxOptionsForScoring()` so that they are captured for precompiled validators
- Extracted the `shallowAllOfMerge()` function from `retrieveSchema.ts` into its own file for additional use in `omitExtraData.ts`

## @rjsf/validator-ajv8

- Added integration tests verifying that `getFirstMatchingOption`, `getClosestMatchingOption`, and `omitExtraData` work correctly when given an `AJV8PrecompiledValidator` compiled from a `oneOf` schema whose branches carry `additionalProperties: false` (both direct options and options defined via `$ref`)

## @rjsf/validator-ata

- Added `@rjsf/validator-ata`, an `ata-validator` backed alternative to `@rjsf/validator-ajv8`. The public surface mirrors the AJV package (`customizeValidator()`, `ValidatorType<T, S, F>`, custom formats, `transformErrors`, `customValidate`, `suppressDuplicateFiltering`), so swapping the import is enough for existing forms to keep working. AJV-only options (`AjvClass`, `ajvFormatOptions`, `ajvOptionsOverrides`) are replaced by `ataOptionsOverrides`, and the `ata-validator` format set is always installed. Depends on `ata-validator` `^0.17.4`, which carries stable `ATA####` error codes and rich error metadata (`expected`, `received`, `schemaSource`, `dataFrame`, `suggestion`, `docUrl`) that `transformErrors` can consume. See the [validator-ata API reference](https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/docs/docs/api-reference/validator-ata.md) for the full list of differences ([#5063](https://github.com/rjsf-team/react-jsonschema-form/pull/5063))
- Wired through precompiled validators. `compileSchemaValidators` compiles a schema to a standalone module via `ata-validator`'s `bundleStandalone`, and `createPrecompiledValidator` loads it as a `ValidatorType`, mirroring `@rjsf/validator-ajv8`. Error output matches the non-precompiled validator, including per-field errors for schema-valued `additionalProperties` (`ata-validator` `>= 0.17.4`); an invalid `anyOf` reports a single error on the field, the same as the runtime path. Custom formats in a precompiled bundle must be a RegExp or string pattern, since a function checker cannot be serialized into the standalone bundle ([#5078](https://github.com/rjsf-team/react-jsonschema-form/pull/5078))

## Dev / docs / playground

- Added a `validator-ata` API reference page under `api-reference` describing the package and its differences from `validator-ajv8` ([#5063](https://github.com/rjsf-team/react-jsonschema-form/pull/5063))
- Documented the `compileSchemaValidators` and `createPrecompiledValidator` APIs on the `validator-ata` API reference page ([#5078](https://github.com/rjsf-team/react-jsonschema-form/pull/5078))
- Added `ATA` and `ATA (coerceTypes)` choices to the playground validator picker ([#5063](https://github.com/rjsf-team/react-jsonschema-form/pull/5063))
- Removed the `ataValidatorBrowserCompat` workaround from the playground Vite config. The bump to `ata-validator` `^0.18.2` makes the patch unnecessary, since the validator no longer touches the filesystem at module init. See [ata-core/ata-validator#25](https://github.com/ata-core/ata-validator/issues/25)
- Updated the `form-props.md` and `utility-functions.md` to document the deprecations and `uiSchema.md` to cleanup the `enumNames` docs slightly
- Switched out `eslint`/`prettier` for `OxLint`/`Oxfmt` and `jest`/`babel` for `vitest`

# 6.5.3

## @rjsf/core

- Fixed `processPendingChange` leaving optional object keys as `undefined` after clearing text inputs (invalid for AJV `type: "string"`), by unsetting keys for resolved non-oneOf/anyOf leaves while preserving explicit `undefined` for oneOf/anyOf branches, fixing [#4518](https://github.com/rjsf-team/react-jsonschema-form/issues/4518)
- Added support for the JSON Schema `deprecated` keyword in `SchemaField`, providing options to hide, disable, or label deprecated fields via a new `deprecatedHandling` global UI option, fixing [#5024](https://github.com/rjsf-team/react-jsonschema-form/issues/5024)
- Pass `FieldPathList` through to `findFieldInSchema` without per-segment string mapping now that `SchemaFieldPath` is supported in `@rjsf/utils` (follow-up to [#4518](https://github.com/rjsf-team/react-jsonschema-form/issues/4518) fix)

## @rjsf/utils

- Added `deprecatedHandling` to `GlobalUISchemaOptions` and updated `StrictRJSFSchema` to be recursive, ensuring the `deprecated` keyword (and future extensions) are supported in all nested schema structures without requiring type casts, fixing [#5024](https://github.com/rjsf-team/react-jsonschema-form/issues/5024)
  - Also added `DeprecatedLabel` to `TranslatableString` to support internationalization of the deprecated field suffix
- Added `SchemaFieldPath` (`string | FieldPathList`) for `getFromSchema` / `findFieldInSchema`; fixed schema descent when a segment is numeric `0` (previously skipped due to falsy check); use string keys for `required` / oneOf fallback matching
- Fixed `mergeDefaultsWithFormData` calling `Object.entries` on non-object defaults (e.g. long `data:` URL strings for single file fields), which iterated every character and caused severe UI freezes, fixing [#5055](https://github.com/rjsf-team/react-jsonschema-form/issues/5055)

# 6.5.2

## @rjsf/core

- Fixed `processPendingChange()` using `originalErrorSchema` (which already contains merged `extraErrors`) as the base for `mergeErrors()`, causing sibling-field `extraErrors` to accumulate duplicate entries on every array mutation, fixing [#5041](https://github.com/rjsf-team/react-jsonschema-form/issues/5041)
- Added `ObjectField` test for renaming a nested `additionalProperties` key using `userEvent` and `reset()` via a form ref, verifying fix for [#4948](https://github.com/rjsf-team/react-jsonschema-form/issues/4948)
- Updated `ArrayField`'s change handling to only `null` out data for paths that are directly an array indexed value and not object properties within them, fixing [#4952](https://github.com/rjsf-team/react-jsonschema-form/issues/4952)

## @rjsf/mui

- Added `computeSxProp()` helper to `utils.ts`, ran the MUI `v9.0.0/system-props` codemod on the directory and then updated the `sx` changes to use `computeSxProps()`
- Also transformed the use of `style` blocks for margins or explicit `marginTop` or `marginBottom` in MUI into `sx` values within `DescriptionField`, `FieldHelpTemplate`, `ObjectFieldTemplate` and `SubmitButton`,
  - Updated snapshots accordingly
- Upgraded the `peerDependencies` to add support for MUI v9

## @rjsf/utils

- Switched `deepEquals` from `lodash.isEqualWith` to `fast-equals.createCustomEqual` with cycle detection enabled, and replaced direct `lodash.isEqual` usage in `useDeepCompareMemo`, `isRootSchema`, and `findSelectedOptionInXxxOf` with `deepEquals`, fixing [#4291](https://github.com/rjsf-team/react-jsonschema-form/issues/4291)
- Fixed `getObjectDefaults` re-injecting stale schema-level `default` keys into an `additionalProperties` object when `formData` already contains its own keys (e.g. after a key rename), preventing ghost entries from reappearing, fixing [#4948](https://github.com/rjsf-team/react-jsonschema-form/issues/4948)

## @rjsf/validator-ajv8

- Cached the most recent `rootSchema` reference in `handleSchemaUpdate` so repeated `isValid` calls with the same root schema skip the deep-equality check and Ajv re-registration, fixing [#4291](https://github.com/rjsf-team/react-jsonschema-form/issues/4291)

## Dev / docs / playground

- Cleaned up testing to make registry mocks simpler using `getTestRegistry()` function
- Refactored `antd` specific test setup out of `testing/testSetup.ts`
- Updated the Playground to use MUI v9

# 6.5.1

## Dev / docs / playground

- Updated peer dependencies to 6.5.x

# 6.5.0

## @rjsf/antd

- Updated `BaseInputTemplate` to remove `type` and set `changeOnWheel` to false for the `InputNumber` component, fixing [#5002](https://github.com/rjsf-team/react-jsonschema-form/issues/5002)
- Updated `ErrorList` and `IconButton` to destructure icons imported from `@ant-design/icons`, fixing [#4953](https://github.com/rjsf-team/react-jsonschema-form/issues/4953)
- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Updated `BaseInputTemplate` to destructure and guard `min`/`max` before spreading onto `InputNumber`, fixing a build error caused by the widened `InputPropsType` (`number | string`)
- Added support for Antd v6, addressing [#4995](https://github.com/rjsf-team/react-jsonschema-form/issues/4995)

## @rjsf/chakra-ui

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/core

- Added a new `removeEmptyOptionalObjects` boolean prop to gracefully prune optional empty objects preventing form submission lockouts, fixing [#4954](https://github.com/rjsf-team/react-jsonschema-form/issues/4954)
- Included `button` elements in `focusOnError` querySelector so that radio and checkbox groups receive focus on validation error, fixing [#4870](https://github.com/rjsf-team/react-jsonschema-form/issues/4870)
- Fixed focus being lost when renaming additional property keys by preserving React key for renamed properties ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Removed `expandUiSchemaDefinitions` call at form init, now handled at runtime by `resolveUiSchema`, fixing [#4986](https://github.com/rjsf-team/react-jsonschema-form/issues/4986)
- Used `useRef` to track latest `formData` in `handleKeyRename`, preventing stale closure data when multiple additional property keys are renamed in quick succession, fixing [#5021](https://github.com/rjsf-team/react-jsonschema-form/issues/5021)
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` for rendering real enum values in DOM attributes instead of array indices ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/daisyui

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/fluentui-rc

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/mantine

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Updated `BaseInputTemplate` to destructure and guard `min`/`max` before spreading onto `NumberInput`, fixing a build error caused by the widened `InputPropsType` (`number | string`)
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/mui

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))
- Added support for passing MUI-specific props (e.g., `sx`, `rjsfSlotProps`, `variant`) directly through `uiSchema` for all templates and widgets, fixing [#4996](https://github.com/rjsf-team/react-jsonschema-form/issues/4996)

## @rjsf/primereact

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/react-bootstrap

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/semantic-ui

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/shadcn

- Added `key={label}` to key input in `WrapIfAdditionalTemplate` to reset input value after duplicate key rename ([#4999](https://github.com/rjsf-team/react-jsonschema-form/issues/4999))
- Added opt-in `optionValueFormat: 'realValue'` support to `SelectWidget`, `RadioWidget`, and `CheckboxesWidget` ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

## @rjsf/utils

- Added `removeOptionalEmptyObjects` utility function to recursively strip fully empty optional objects based on their parent's `required` properties, fixing [#4954](https://github.com/rjsf-team/react-jsonschema-form/issues/4954)
- Updated `InputPropsType` to widen `min` and `max` to `number | string` to support date values (e.g. `"2020-01-01"`)
- Updated `getInputProps()` to propagate `formatMinimum` and `formatMaximum` schema keywords to the HTML `min`/`max` attributes for `date`, `datetime-local`, `time`, `week`, and `month` input types, aligning browser-native date picker constraints with AJV validation
- Fixed `ui:title` from `ui:definitions` not applied to `oneOf`/`anyOf` dropdowns beyond first recursion level, fixing [#4986](https://github.com/rjsf-team/react-jsonschema-form/issues/4986)
- Added `enumOptionValueEncoder`, `enumOptionValueDecoder`, and `enumOptionSelectedValue` utilities for opt-in real enum value rendering in select/radio/checkbox widgets ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))
- Added `optionValueFormat: 'indexed' | 'realValue'` to `GlobalUISchemaOptions` and the `OptionValueFormat` type for opt-in real enum values in widget DOM attributes ([#4693](https://github.com/rjsf-team/react-jsonschema-form/issues/4693))

# @rjsf/validator-ajv8

- Updated `CustomValidatorOptionsType` to add the new `suppressDuplicateFiltering` flag prop, updating the validators to pass it through to the `transformRJSFValidationErrors()` which suppresses the appropriate duplicate errors if specified, fixing [#5028](https://github.com/rjsf-team/react-jsonschema-form/issues/5028)

## Dev / docs / playground

- Updated References playground sample to demonstrate `oneOf` with `ui:title` at recursive depth, related to [#4986](https://github.com/rjsf-team/react-jsonschema-form/issues/4986)
- Updated the building of the `mantine` theme to properly support ESM, fixing [#5025](https://github.com/rjsf-team/react-jsonschema-form/issues/5025)
- Updated the `validator-ajv8.md` and `validation.md` documetation for the new `suppressDuplicateFiltering` configuration prop
- Added comprehensive documentation for `@rjsf/mui` customization via `uiSchema` (including `rjsfSlotProps` usage).

# 6.4.2

## @rjsf/antd

- Forward `required` to `BaseInputTemplate` so that required string and number fields render the HTML `required` attribute, fixing [#3743](https://github.com/rjsf-team/react-jsonschema-form/issues/3743)

## @rjsf/core

- Fixed a breaking change introduced in v6.4.0 where array properties with enum items no longer used `ui:enumNames` from the array property's uiSchema ([#4985](https://github.com/rjsf-team/react-jsonschema-form/issues/4985))
- Passed `parentUiSchema` to `ArrayFieldItem` to maintain `uiSchema`, this prop was introduced recently but was not being passed
- Fixed `extraErrors` not displaying when `customErrors` are also present (e.g., with array fields and controlled `formData`), fixing [#4982](https://github.com/rjsf-team/react-jsonschema-form/issues/4982)

## Dev / docs / playground

- Fixed scrolling of Monaco editors in the playground, fixing [#4992](https://github.com/rjsf-team/react-jsonschema-form/issues/4992)

# 6.4.1

## Dev / docs / playground

- Updated peer dependencies to 6.4.x

# 6.4.0

## @rjsf/core

- Fixed `extraErrors` not displaying on first async set after submit, fixing [#4965](https://github.com/rjsf-team/react-jsonschema-form/issues/4965)
- Updated multi-select ArrayFields to properly use the `items` uiSchema for enumerated options, fixing [#4955](https://github.com/rjsf-team/react-jsonschema-form/issues/4955)
- Fixed `validateForm()` clearing `extraErrors` from state when schema validation passes, fixing [#4962](https://github.com/rjsf-team/react-jsonschema-form/issues/4962)

## @rjsf/utils

- Fixed `resolveAllReferences` to preserve `$ref` on resolved schemas, enabling `ui:definitions` beyond the first recursion level, fixing [#4966](https://github.com/rjsf-team/react-jsonschema-form/issues/4966)
- Fixed `omitExtraData` stripping `additionalProperties` inside oneOf/anyOf options, fixing [#4366](https://github.com/rjsf-team/react-jsonschema-form/issues/4366)
- Added support for map-based `ui:enumNames` and `ui:enumOrder` for controlling enum display labels and ordering, fixing [#4969](https://github.com/rjsf-team/react-jsonschema-form/issues/4969)

## Dev / docs / playground

- Added documentation and playground examples for map-based `ui:enumNames` and `ui:enumOrder`

# 6.3.1

## Dev / docs / playground

- Changed all `@rjsf/*` dev dependencies from `^6.3.0` to `6.3.0` so that the latest version of `nx` keeps automatically updating them
- Updated peer dependencies to `^6.3.x` due to type changes in `@rjsf/utils` that are required in the other libraries

# 6.3.0

## @rjsf/antd

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/chakra-ui

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)
- Updated `NativeSelectWidget` so that is properly renders a placeholder, fixing [#4942](https://github.com/rjsf-team/react-jsonschema-form/issues/4942)

## @rjsf/core

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)
- Integrated `ui:definitions` support for recursive and reusable uiSchema ([#4947](https://github.com/rjsf-team/react-jsonschema-form/pull/4947))

## @rjsf/daisyui

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/fluentui-rc

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/mantine

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/mui

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/react-bootstrap

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/semantic-ui

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/shadcn

- Fixed duplicate React keys in datalist when schema examples and default have different types, fixing [#4927](https://github.com/rjsf-team/react-jsonschema-form/issues/4927)

## @rjsf/utils

- Added `expandUiSchemaDefinitions()` and `resolveUiSchema()` functions, and `UiSchemaDefinitions` type to support defining reusable uiSchema for schema `$ref` references ([#4947](https://github.com/rjsf-team/react-jsonschema-form/pull/4947))

## Dev / docs / playground

- Updated References sample in playground to demonstrate `ui:definitions` feature ([#4947](https://github.com/rjsf-team/react-jsonschema-form/pull/4947))
- Added documentation for `ui:definitions` in `uiSchema.md` and `definitions.md` ([#4947](https://github.com/rjsf-team/react-jsonschema-form/pull/4947))
- Updated the libraries via the `npm run bump-all-libraries` command, fixing new lint errors and updating the snapshots due to fixes in the theme libraries

# 6.2.5

## @rjsf/mui

- Updated `BaseInputTemplate` to properly handle `slotProps` and `InputProps` (deprecated by MUI) with existing `endAdornment`s when the `allowClearTextInputs` flag is true, fixing [#4938](https://github.com/rjsf-team/react-jsonschema-form/issues/4938)

## Dev / docs / playground

- Updated `uiSchema.md` to add documentation for `allowClearTextInputs`
- Updated the `formTests.tsx` in `snapshot-tests` to render string fields with the `allowClearTextInputs` flag enabled, with data and readonly to test the new feature

# 6.2.4

## Dev / docs / playground

- Updated the `package.json` for `chakra-ui` to add the `repository` information so that publishing works for it
- Updated the `release.yml` to remove the push tag stuff as it isn't needed

# 6.2.3

## @rjsf/mantine

- Updated `cleanupOptions()` to add `enableMarkdownInHelp` and `globalOptions` to avoid DOM errors

## @rjsf/primereact

- Updated `ArrayFieldTemplate` to destructure additional fields to avoid DOM errors

## Dev / docs / playground

- Updated the `release.yml` to move the permissions within the job, switch to node 24 and add push checking

# 6.2.2

## Dev / docs / playground

- Updated the `release.yml` to switch to NPM Trusted Publishing so that we can actually publish the changes
- Updated the `SECURITY.md` to add v6

# 6.2.1

## Dev / docs / playground

- Updated peer dependencies to `^6.2.x` due to type changes in `@rjsf/utils` that are required in the other libraries

# 6.2.0

## @rjsf/antd

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields
- Removed deprecated `defaultProps` from `AltDateTimeWidget` and `AltDateWidget` components, preserving all existing behavior

## @rjsf/chakra-ui

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields
- Removed deprecated `defaultProps` from `AltDateTimeWidget` and `AltDateWidget` components, preserving all existing behavior

## @rjsf/core

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields
- Removed deprecated `defaultProps` from `AltDateTimeWidget` and `AltDateWidget` components, preserving all existing behavior
- Fixed `ObjectFieldTemplate` rendering an empty fieldset for pure oneOf/anyOf schemas (schemas with `type: "object"` and oneOf/anyOf but no properties at root level)
- Added `fieldPathId` to `FieldTemplate` props in `SchemaField` and `LayoutMultiSchemaField`, fixing [#4897](https://github.com/rjsf-team/react-jsonschema-form/issues/4897)
- Fixed oneOf/anyOf option switches reverting in controlled forms, fixing [#4918](https://github.com/rjsf-team/react-jsonschema-form/issues/4918)
- Fixed null option not being selectable and defaults not being restored when switching from null back to object option in oneOf/anyOf, fixing [#4896](https://github.com/rjsf-team/react-jsonschema-form/issues/4896) and [#4380](https://github.com/rjsf-team/react-jsonschema-form/issues/4380)
- Refactored the `omitExtraData()` function to `schemaUtils`, fixing [#4081](https://github.com/rjsf-team/react-jsonschema-form/issues/4081)

## @rjsf/daisyui

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields
- Updated `FieldTemplate` to destructure `fieldPathId` to prevent passing it to DOM elements, fixing [#4897](https://github.com/rjsf-team/react-jsonschema-form/issues/4897)

## @rjsf/fluent-ui

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields

## @rjsf/mantine

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields

## @rjsf/mui

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields

## @rjsf/primereact

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields

## @rjsf/react-bootstrap

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields
- Updated `WrapIfAdditionalTemplate` to add `maxHeight` for the Remove button column, fixing [#4684](https://github.com/rjsf-team/react-jsonschema-form/issues/4684)

## @rjsf/semantic-ui

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields

## @rjsf/shadcn

- Updated `BaseInputTemplate` to support the `allowClearTextInputs` feature for input fields
- Fixed issue `"ui:rows"` option for `textarea` elements, fixing [#4903](https://github.com/rjsf-team/react-jsonschema-form/issues/4903).

## @rjsf/utils

- Fixed issue by adding new `allowClearTextInputs` option to `GlobalUISchemaOptions` type, fixing [#4671](https://github.com/rjsf-team/react-jsonschema-form/issues/4671)
- Fixed issue with default value not being prefilled when object with if/then is nested inside another object, fixing [#4222](https://github.com/rjsf-team/react-jsonschema-form/issues/4222)
- Fixed issue with schema array with nested dependent fixed-length, fixing [#3754](https://github.com/rjsf-team/react-jsonschema-form/issues/3754)
- Updated `CustomValidator` type to accept `errorSchema`, so its implementation can be based on result of ajv validation ([#4898](https://github.com/rjsf-team/react-jsonschema-form/pull/4899))
- Added `fieldPathId` to `FieldTemplateProps` to enable proper use of `onChange` with the required `path` parameter, fixing [#4897](https://github.com/rjsf-team/react-jsonschema-form/issues/4897)
- Fixed user formData being overwritten with defaults in schemas combining `anyOf`/`oneOf` with `$ref` and `default` at multiple levels, fixing [#4918](https://github.com/rjsf-team/react-jsonschema-form/issues/4918)
- Fixed issue where nested `if/then/else` conditions lost values with `liveOmit` and `omitExtraData` enabled, fixing [#4450](https://github.com/rjsf-team/react-jsonschema-form/issues/4450)
- Refactored the `omitExtraData()` function and its helpers from `Form` into a new `schema/omitExtraData.ts`, fixing [#4081](https://github.com/rjsf-team/react-jsonschema-form/issues/4081)

## @rjsf/validator-ajv8

- Updated `processRawValidationErrors` to pass `errorSchema` to `customValidate` function ([#4898](https://github.com/rjsf-team/react-jsonschema-form/pull/4899))

## Dev / docs / playground

- Updated unit tests for `@rjsf/core` to convert them to typescript and jest
- Updated the `utility-functions.md` documentation for the `omitExtraData()` function

# 6.1.2

## @rjsf/antd

- Updated `SelectWidget` to add a static `getPopupContainerCallback` to the `SelectWidget` component, partially fixing [#3609](https://github.com/rjsf-team/react-jsonschema-form/issues/3609)
  - Also, added the explicit `open` state to the `Select` in conjunction with providing the `setOpen` as the `onOpenChange` prop
- In `BaseInputTemplate` added comments explaining why `step='1'` is returned, closing [#4022](https://github.com/rjsf-team/react-jsonschema-form/issues/4022)

## @rjsf/mantine

- Align Mantine’s behavior with other themes when clearing string fields: clearing an input now removes the key from formData instead of setting it to an empty string. ([#4875](https://github.com/rjsf-team/react-jsonschema-form/pull/4875))

## @rjsf/utils

- Replace json-schema-merge-allof with [@x0k/json-schema-merge](https://github.com/x0k/json-schema-merge/) ([#4774](https://github.com/rjsf-team/react-jsonschema-form/issues/4774))

## @rjsf/validator-ajv8

- Updated `CustomValidatorOptionsType` to add new `extenderFn?: (ajv: Ajv) => Ajv` prop
- Updated `createAjvInstance()` to add new `extenderFn?: (ajv: Ajv) => Ajv` parameter, using it to extend the `ajv` instance, fixing [#4746](https://github.com/rjsf-team/react-jsonschema-form/issues/4746)
  - Updated the `AJV8Validator` and `compileSchemaValidatorsCode()` to pass `extenderFn` from the `options` into `createAjvInstance()`
- Updated `transformRJSFValidationErrors()` to add filtering of duplicate `anyOf`/`oneOf` based errors from the returned errors, fixing [#4167](https://github.com/rjsf-team/react-jsonschema-form/issues/4167)

## Dev / docs / playground

- Updated `DemoFrame` as follows to fix [#3609](https://github.com/rjsf-team/react-jsonschema-form/issues/3609)
  - Override `antd`'s `SelectWidget.getPopupContainerCallback` callback function to return undefined
  - Added a `AntdSelectPatcher` component that observes the creation of `antd` select dropdowns and makes sure they open in the correct location
  - Update the `antd` theme wrapper to render the `AntdSelectPatcher`, `AntdStyleProvider` and `ConfigProvider` with it's own `getPopupContainer()` function inside of a `FrameContextConsumer`
- Updated the base TypeScript configuration to use `"moduleResolution": "bundler"`
- Updated the `validation.md` documentation to note that HTML 5 validation is not translatable via RJSF translation mechanisms and should be turned off, fixing [#4092](https://github.com/rjsf-team/react-jsonschema-form/issues/4092)
  - Also added documentation for the new `extenderFn` prop on `CustomValidatorOptionsType`

# 6.1.1

## @rjsf/core

- Updated `ObjectField` to get errors and formData by wrapping `name` in brackets to prevent names that have dots in them incorrectly getting data from a lower level, fixing [#3846](https://github.com/rjsf-team/react-jsonschema-form/issues/3846)

## @rjsf/shadcn

- Updated `package.json` to copy css files to new `resources` directory

## Dev / docs / playground

- Updated the `playground` to use the css files for `@rjsf/shadcn` from the CDN connected with github, pointing to the new resources directory
- Added new `antdIconsReplacer.ts` and used it in `@rjsf/antd` during build time to append `.js` onto imports of `@antd/icons` to fix es build issues on webpack and vite

# 6.1.0

## @rjsf/antd

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` and `ArrayFieldTemplate` to adjust sizes and buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel`

## @rjsf/chakra-ui

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `FieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/core

- Added new `RichHelp` component for use in all the themes for help rendering, fixing [#4601](https://github.com/rjsf-team/react-jsonschema-form/issues/4601)
- Updated `ArrayField` to compute and pass `displayLabel` and `hasDescription` to the rendered `ArrayFieldItemTemplate` to support fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `StringField` to extract the `title` from the props and pass it down to the widget if provided
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `AddButton` to improve it's responsiveness in relation to the `ArrayFieldItemTemplate` changes
- Updated `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/daisyui

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `WrapIfAdditionalTemplate` to add `flexGrow` and `BaseInputTemplate` to add `w-full` to allow the array item fields to grow properly
- Updated `FieldTemplate` to render the `description` which was missing in the theme
- Updated `FieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/fluentui-rc

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `WrapIfAdditionalTemplate` to add `flexGrow` to allow the array item fields to grow properly for non-container elements
- Updated `FieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/mantine

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `utils.ts` to add `label` to the cleanup fields to filter it from the `uiOptions`
- Updated `BaseInputTemplate` to display `description` which was missing in the theme
- Updated `ArrayFieldTitleTemplate` to support the `optionalData`
- Updated `FieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/mui

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel`

## @rjsf/primereact

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/react-bootstrap

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `ArrayFieldTemplate` to improve it's responsiveness in relation to the `ArrayFieldItemTemplate` changes
- Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/semantic-ui

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `FieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/shadcn

- Added support for rendering `ui:help` as markdown via new `ui:enableMarkdownInHelp` flag in `FieldHelpTemplate`
- Updated `ArrayFieldItemTemplate` to adjust buttons location using `displayLabel` and `hasDescription`, fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated `ArrayFieldTemplate` to add `justify-end` to the `AddButton` rendering
- Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to adjust the sizes and buttons location using `displayLabel` and `rawDescription`

## @rjsf/utils

- Added new `enableMarkdownInHelp` to the `GlobalUISchemaOptions` type, fixing [#4601](https://github.com/rjsf-team/react-jsonschema-form/issues/4601)
- Added new `displayLabel` and `hasDescription` flags in the `ArrayFieldItemTemplateProps` to support fixing [#3296](https://github.com/rjsf-team/react-jsonschema-form/issues/3296)
- Updated the three hooks to add `use client` directive to support NextJS builds
- Updated `WrapIfAdditionalTemplateProps` to also pick the `displayLabel` and `rawDescription` props from `FieldProps` for use in adjusting the Additional Properties buttons location
- Fixed bug in `getDisplayLabel()` to return false ALWAYS, when the `ui:options` is set to false AND to return true for `array` and `object` types when they were added via additionalProperties

## Dev / docs / playground

- Updated `uiSchema.md` in the docs to document the new `enableMarkdownInHelp` flag
- Updated `objectTests.tsx` to increase the variations of the additionalProperties tests to include labels off, descriptions and object and array types

# 6.0.2

## @rjsf/antd

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))
- Updated `ArrayFieldTemplate` and `ObjectFieldTemplate` to remove the rendering of a duplicate description (since the `FieldTemplate` already does it), fixing [#3624](https://github.com/rjsf-team/react-jsonschema-form/issues/3624)

## @rjsf/chakra-ui

- Modified `CheckboxesWidget` to render the Title, fixing ([#4840](https://github.com/rjsf-team/react-jsonschema-form/issues/4840))
- Updated `CheckboxWidget` to handle label and description rendering consistently, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))

## @rjsf/core

- Fixed duplicate label and description rendering in `CheckboxWidget` by conditionally rendering them based on widget type
  - Updated `CheckboxWidget` to handle label and description rendering consistently
  - Modified `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))
- Updated `ObjectField` to change the removal of an additional property to defer the work to the `processPendingChange()` handler in `Form`, fixing [#4850](https://github.com/rjsf-team/react-jsonschema-form/issues/4850)
- Updated `FallbackField` to support `object` and `array` types, and improved `ArrayField` so that it handles missing items properly with the fallback field

## @rjsf/fluentui-rc

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))

## @rjsf/mantine

- Updated `CheckboxWidget` to handle label and description rendering consistently, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))

## @rjsf/mui

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))
- Updated `ArrayFieldItemTemplate` to switch `size` from 'auto' to responsive values on the `Grid`, fixing [#4838](https://github.com/rjsf-team/react-jsonschema-form/issues/4838)

## @rjsf/primereact

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))

## @rjsf/react-bootstrap

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))

## @rjsf/semantic-ui

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))

## @rjsf/shadcn

- Updated `FieldTemplate` to skip label and description rendering for checkbox widgets, fixing ([#4742](https://github.com/rjsf-team/react-jsonschema-form/issues/4742))
- Updated the `Command` component to properly handle `forwardRef`

## @rjsf/utils

- Updated `getDefaultFormState()` to not save an undefined field value into an object when the type is `null` and `excludeObjectChildren` is provided, fixing [#4821](https://github.com/rjsf-team/react-jsonschema-form/issues/4821)

## Dev / docs / playground

- Updated the `OptionsDrawer` of the playground to add `idPrefix` and `idSeparator` fields
- Updated test files to switch to using the React Testing library instead of `react-test-renderer`, updating all snapshots accordingly
- Updated Fluent libraries to latest, with updated snapshots
- Added Node 24 to `ci.yml`, removing `v5` and old Node 14 non-docs builds

# 6.0.1

## Dev / docs / playground

- Updated peer dependencies for packages to `6.x`

# 6.0.0

## @rjsf/antd

- Updated the `README.md` to show the theme snapshot with the latest theme UI from the playground, making it a link to the theme

## @rjsf/chakra-ui

- Updated the `README.md` to show the theme snapshot with the latest theme UI from the playground, making it a link to the theme

## @rjsf/core

- Updated `SchemaField` to add a new optional property `childFieldPathId` to the `FieldComponent` render to prevent duplicate ids, fixing (#4819)[https://github.com/rjsf-team/react-jsonschema-form/issues/4819]
  - Also updated `ObjectField` and `ArrayField` to make children use the `childFieldPathId` if present, falling back to the `fieldPathId` if not

## Dev / docs / playground

- Updated the libraries to the latest ones that aren't problematic
  Updated the playground to modernize the UI using MUI components
- Updated the documentation to switch to using an animated gif based on the latest modernized playground UI
- Updated the `README.md` in all themes to show the theme snapshot with the latest theme UI from the playground, making it a link to the theme

# 6.0.0-beta.23

## @rjsf/antd

- Updated `AltDateWidget` to use the new `useAltDateWidgetProps()` hook, renaming `showTime` to `time`
- Potentially BREAKING CHANGE: Updated `AltDateTimeWidget` to rename `showTime` prop to `time`

## @rjsf/chakra-ui

- Updated `AltDateWidget` to use the new `useAltDateWidgetProps()` hook, renaming `showTime` to `time`
- Potentially BREAKING CHANGE: Updated `AltDateTimeWidget` to rename `showTime` prop to `time`

## @rjsf/core

- Updated `FormProps` to add new `onChange`/`onBlur` values for the `liveValidate` and `liveOmit` props, deprecating the `boolean` aspect of them
- Updated `Form` to support the new feature to do `onBlur` handling of `liveValidate` and `liveOmit`
- Updated `FormProps` to add the new `initialFormData` prop
- Updated `Form` so that is behaves as a "controlled" form when `formData` is passed and uncontrolled when `initialFormData` is passed, fixing [#391](https://github.com/rjsf-team/react-jsonschema-form/issues/391)
  - Also fixed an issue where live validation was called on the initial form render, causing errors to show immediately, partially fixing [#512](https://github.com/rjsf-team/react-jsonschema-form/issues/512)
- Updated `Form` to add a new programmatic function, `setFieldValue(fieldPath: string | FieldPathList, newValue?: T): void`, fixing [#2099](https://github.com/rjsf-team/react-jsonschema-form/issues/2099)
- Added new `FallbackField` to add opt-in functionality to control form data that is of an unsupported or unknown type ([#4736](https://github.com/rjsf-team/react-jsonschema-form/issues/4736)).
- Refactored much of the `FileWidget` implementation into a new `useFileWidgetProps()` hook, fixing [#3146](https://github.com/rjsf-team/react-jsonschema-form/issues/3146)
- Refactored much of the `AltDateWidget` implementation into a new `useAltDateWidgetProps()` hook, fixing [#3352](http://github.com/rjsf-team/react-jsonschema-form/issues/3352)

## @rjsf/daisyui

- Deleted the `FileWidget` component, moving the className and isMulti logic directly into the `BaseInputTemplate` so that the `@rjsf/core`'s `FileWidget` works properly for the theme, fixing [#4803](https://github.com/rjsf-team/react-jsonschema-form/issues/4803)
- Updated `AltDateWidget` to use the new `useAltDateWidgetProps()` hook

## @rjsf/mantine

- Updated `FieldHelpTemplate` to avoid issue when `help` `and `fieldPathId` are undefined
- Updated `AltDateWidget` to use the new `useAltDateWidgetProps()` hook, renaming `showTime` to `time`
- Potentially BREAKING CHANGE: Updated `AltDateTimeWidget` to rename `showTime` prop to `time`
- Updated `FileWidget` to use the `useFileWidgetProps()` hook

## @rjsf/utils

- Added the `useFileWidgetProps()` hook implementation, refactored from `@rjsf/core`
- Added the `useAltDateWidgetProps()` hook implementation, refactored from `@rjsf/core`

## Dev / docs / playground

- Updated the playground to switch `liveValidate` and `liveOmit` from checkboxes to radio buttons for the new options
- Updated `internals.md`, `form-props.md`, `utility-functions.md` and `v6x upgrade guide.md` to document the new features, potential breaking changes and deprecations

# 6.0.0-beta.22

## @rjsf/antd

- Updated most of the widgets to get `formContext` from the `registry` instead of the `props` since it will no longer be passed
- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/chakra-ui

- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/core

- Updated `MultiSchemaField` and `SchemaField` to properly display `anyOf`/`oneOf` optional data fields by hiding the label and selector control when it is an optional field AND there is no form data
- Updated `ArrayField`, `BooleanField`, `LayoutMultiSchemaField`, `MultiSchemaField`, `ObjectField`, `SchemaField`, `StringField` and `BaseInputTemplate` to remove `formContext` from the props
- Updated `ObjectField` to refactor the code from a class component to two stateless functional components, replacing the 3 generator-props with the 4 memoized props mentioned in the `@rjsf/utils` changes
- Updated `Form` to "memoize" the `fieldPathId` and `registry` into the `FormState`, adding a `toIChangeEvent()` helper to restrict the state returned on the `IChangeEvent` interface callbacks
- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Added `nameGenerator` prop to `Form` component to enable custom HTML `name` attribute generation for form fields
- Updated `ArrayField` to refactor code from a class component to seven stateless functional components, replacing the 4 generator-props with the 5 memoized props mentioned in the `@rjsf/utils` changes
  - BREAKING CHANGE: The refactor included rendering the `ArrayFieldItemTemplate` directly by the `ArrayField` rather than deferring it to the `ArrayFieldTemplate`
  - Updated the `ArrayField` tests to adjust for the rendering change AND to remove 2 tests due to them no longer being valid
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes
- BREAKING CHANGE: Updated `ArrayFieldItemButtonsTemplate` to replace the old callback-generator functions with the new memoizable callback functions
- Fixed a bug in `Form` to avoid getting errors being reported at the root level via `onChange` when there aren't
- Refactored `LayoutGridField` as function components instead of a single class component.

## @rjsf/daisyui

- Updated the test mocks to remove `formContext` for the widget mock
- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes
- BREAKING CHANGE: Updated `ArrayFieldItemButtonsTemplate` to replace the old callback-generator functions with the new memoizable callback functions

## @rjsf/fluentui-rc

- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/mantine

- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/mui

- Updated `BaseInputTemplate` and `SelectWidget` to remove `formContext` from the props
- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/primereact

- Updated `SelectWidget` to remove `formContext` from the props
- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/react-bootstrap

- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/semantic-ui

- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes
- Updated `ArrayFieldItemTemplate` to refactor the getting of the `semanticProps` from `ArrayFieldTemplate`, using the new `parentUiSchema` prop to maintain the feature

## @rjsf/shadcn

- Updated the test mocks to remove `formContext` for the widget mock and added `globalFormOptions` in the registry mock
- BREAKING CHANGE: Updated `FieldTemplate`, `ObjectFieldTemplate` and `WrapIfAdditionalTemplate` to rename the old `additionalProperties` interface props to the new ones
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `SelectWidget`, and `TextareaWidget` to use `htmlName` for the HTML `name` attribute (Note: `RadioWidget` does not support `htmlName` due to Radix UI RadioGroup limitations)
- BREAKING CHANGE: Updated `ArrayFieldTemplate` to remove the `ArrayFieldItemTemplate` render in favor of simply using `items` due to `ArrayField` changes

## @rjsf/utils

- BREAKING CHANGE: Updated `FieldTemplateProps` and `WrapIfAdditionalTemplateProps` to replace the `onKeyChange()` and `onDropPropertyClick()` callback-generator props with the `onKeyRename()`, `onKeyRenameBlur()` and `onRemoveProperty()` callback props
- BREAKING CHANGE: Updated `ObjectFieldTemplateProps` to replace the `onAddClick()` callback-generator prop with the `onAddProperty()` callback prop
- Added new hook `useDeepCompareMemo()` and its associated tests
- Added `NameGeneratorFunction` type and two built-in name generators: `bracketNameGenerator` and `dotNotationNameGenerator`
- Updated `GlobalFormOptions` type to include optional `nameGenerator` field
- Updated `toFieldPathId()` function to support name generation via the `nameGenerator` option in `GlobalFormOptions`
- Added `htmlName` field to `WidgetProps` interface to provide the generated HTML `name` attribute to widgets
- BREAKING CHANGE: Renamed `ArrayFieldItemTemplateType` to `ArrayFieldItemTemplateProps` and updated it to change `key: string` to `itemKey: string` to avoid a name collision with React
- BREAKING CHANGE: Updated `ArrayFieldTemplateProps` to change the type of the `items` prop from `ArrayFieldItemTemplateType<T, S, F>[]` to `ReactElement[]`
- BREAKING CHANGE: Updated `ArrayFieldItemButtonsTemplateType` to replace the `onAddIndexClick()`, `onCopyIndexClick()`, `onDropIndexClick()` and `onReorderClick()` callback-generator props with the `onAddItem()`, `onCopyItem()`, `onMoveUpItem()`, `onMoveDownItem()` and `onRemoveItem()` callback props
- BREAKING CHANGE: Updated `ArrayFieldItemTemplateType` to change `key: string` to `itemKey: string` to avoid a name collision with React
- BREAKING CHANGE: Renamed `ArrayFieldItemButtonsTemplateType` to `ArrayFieldItemButtonsTemplateProps` and updated it to replace the `onAddIndexClick()`, `onCopyIndexClick()`, `onDropIndexClick()` and `onReorderClick()` callback-generator props with the `onAddItem()`, `onCopyItem()`, `onMoveUpItem()`, `onMoveDownItem()` and `onRemoveItem()` callback props

## Dev / docs / playground

- Updated the `formTests.tsx` snapshots to add an `anyOf` of all arrays with different item types and removed the disabling of the optional data controls feature for the optional object with oneOfs
  - Updated the snapshots in all of the themes accordingly
- Updated the playground to make the same changes as `formTests.tsx` in the `optionalDataControls.ts` sample, moving the `experimental_defaultFormStateBehavior` inside of a `liveSettings` block
- Updated the `Sample` and `LiveSettings` types to support the `liveSettings` inside of a sample
- Updated the `Playground`'s `onSampleSelected` callback to merge any `liveSettings` in the sample on top of those already used in the playground
- Updated the `customFieldAnyOf` sample to switch `IdSchema` to `FieldPathId`
- Updated the `customArray` sample to refactor out a `ArrayFieldItemButtonsTemplate`
- Updated the `custom-templates.md` documentation to reflect the `additionalProperties`-based interface props replacement and `ArrayField` conversion changes
- Updated the `utility-functions.md` documentation to add the new `useDeepCompareMemo()` hook
- Updated the `v6.x upgrade guide.md` documentation to add the BREAKING CHANGES to the `ArrayFieldTemplateProps`, `ArrayFieldItemTemplateType`, `ArrayFieldItemButtonsTemplateType`, `FieldTemplateProps`, `ObjectFieldTemplateProps` and `WrapIfAdditionalTemplateProps` interface props changes and the `useDeepCompareMemo()` hook
- Added documentation for the `nameGenerator` prop in `form-props.md` and v6.x upgrade guide
- Updated `@rjsf/snapshot-tests` package to explicitly depend on `@rjsf/core` to build first, fixing an error with parallelized builds

# 6.0.0-beta.21

## @rjsf/antd

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to fix up the props in `AntdIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/chakra-ui

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to add `ChakraIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/core

- Added `initialDefaultsGenerated` flag to state, which indicates whether the initial generation of defaults has been completed
- Added `ObjectField` tests for additionalProperties with defaults
- Added a new `OptionalDataControlsField` to the `fields` that renders either undefined (when there is data for a readonly/disabled field) or gets the `OptionalDataControlsTemplate` and renders the `label` and potentially an `onAddClick` or `onRemoveClick` function
- Updated `ArrayField` and `ObjectField` to check whether it `shouldRenderOptionalData()` and if true, calls `ObjectDataControlsField` and passes the result to its associated render template as `optionalDataControl`
- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated `Form` as follows to fix [#4796](https://github.com/rjsf-team/react-jsonschema-form/issues/4796)
  - Refactored the `liveValidate()` and `mergeErrors()` functions out of `getStateFromProp()` and `processPendingChange()`
  - Added new, optional `customErrors?: ErrorSchemaBuilder<T>` to the `FormState`, updating the `IChangeEvent` interface to remove all of the private variables
  - Reworked the `newErrorSchema` handling in `processPendingChange()` to simplify the handling since `newErrorSchema` is now path-specific, adding `newErrorSchema` to `customErrors` when they don't match an existing validator-based validation
    - This rework resulted in any custom errors passed from custom widgets/fields will now be remembered during the validation stage
  - Removed the now unused `getPreviousCustomValidateErrors()` and `filterErrorsBasedOnSchema()` methods
- Updated `LayoutGridField` to simplify `onFieldChange()` to just return the given `errorSchema` now that it is path-specific, fixing [#4796](https://github.com/rjsf-team/react-jsonschema-form/issues/4796)
- Updated `NullField` to pass `fieldPathId.path` for the `onChange()` instead of `[name]`

## @rjsf/daisyui

- Updated `ArrayFieldTemplate`, `ArrayFieldTitleTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to better support the `OptionalDataControlTemplate`

## @rjsf/fluentui-rc

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to add `FluentIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/mantine

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list

## @rjsf/mui

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list

## @rjsf/primereact

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to add `PrimeIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/react-bootstrap

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to add `BootstrapIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/semantic-ui

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to add `SemanticIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/shadcn

- Updated `ArrayFieldTemplate`, `ObjectFieldTemplate`, `TitleField` to add support for the new `optionalDataControl` feature
  - Added the new `OptionalDataControlTemplate` to the theme, adding it to the `templates` list
- Updated the `ButtonTemplates` classes to add `ShadIconButtonProps` and the `IconButton`s associated with them to better support the `OptionalDataControlTemplate`

## @rjsf/utils

- Updated `getDefaultFormState` to add a new `initialDefaultsGenerated` prop flag, along with type definitions, fixing uneditable & permanent defaults with additional properties [3759](https://github.com/rjsf-team/react-jsonschema-form/issues/3759)
- Updated `createSchemaUtils` definition to reflect addition of `initialDefaultsGenerated`
- Updated existing tests where `getDefaultFormState` is used to reflect addition of `initialDefaultsGenerated`
- Updated `types.ts` to support the new `Optional Data Controls` feature as follows:
  - Added new `OptionalDataControlsTemplateProps` and refactored the common props from `ArrayFieldTemplateProps` and `ObjectFieldTemplateProps` into a new super type, `ContainerFieldTemplateProps`
  - Added new `optionalDataControl?: ReactNode` to the `ArrayFieldTitleProps`, `TitleFieldProps` and `ContainerFieldTemplateProps`
  - Updated `GlobalFormOptions` to add new `enableOptionalDataFieldForType?: ('object' | 'array')[]` prop
  - Updated `SchemaUtilsType`'s `retrieveSchema()` function to add an additional, property `resolveAnyOfOrOneOfRefs?: boolean`
- Updated the `Templates` interface to add a new required template `OptionalDataControlsTemplate: ComponentType<OptionalDataControlsTemplateProps<T, S, F>>`
- Updated `retrieveSchema()` to add an additional property `resolveAnyOfOrOneOfRefs?: boolean` which causes `resolveAllSchemas()` to resolve `$ref`s inside of the options of `anyOf`/`oneOf` schemas
- Updated `getDefaultFormState` to fix an issue where optional array props had their default set to an empty array when they shouldn't be
- Updated the `TranslatableString` enum to add three new strings in support of the new feature: `OptionalObjectAdd`, `OptionalObjectRemove` and `OptionalObjectEmptyMsg`
- Added four new utility functions: `isFormDataAvailable()`, `isRootSchema()`, `optionalControlsId()`, and `shouldRenderOptionalField()`
- Updated `validationDataMerge()` to add an additional, optional parameter `preventDuplicates = false`, that causes the `mergeObjects()` call to receive `preventDuplicates` instead of `true`

## Dev / docs / playground

- Updated docs for `getDefaultFormState` to reflect addition of the `initialDefaultsGenerated` prop
- Updated `utility-function.me` docs to add documentation for the new functions and to update the `validationDataMerge()` function's new parameter
  - Also updated docs for `retrieveSchema` and `SchemaUtilsType` for the new prop
- Updated `uiSchema.md` to add documentation for the new `enableOptionalDataFieldForType` prop
- Updated the playground to add a new `Optional Data Controls` example
- Updated the snapshot and jest tests for `Form` to test the new `Optional Data Controls` feature
- Updated `custom-widgets-fields.md` to change the documentation around passing errors via `onChange()` to reflect the new reality
- Updated the `v6x upgrade guide.md` to document the new feature, utility functions and changes to existing method parameters

# 6.0.0-beta-20

## @rjsf/antd

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/chakra-ui

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/core

- BREAKING CHANGES
  - Updated all of the fields, templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions
  - `ObjectField` and `ArrayField` to use `toFieldPathId` instead of `toIdSchema()` to generate the `fieldPathId`s of all its children
  - Updated the `onChange` handling of fields to make `path` required and either pass it straight through, or use the `fieldPathId.path` instead of using an empty array or appending path information
  - Updated `Form` to use `toFieldPathId()` to generate `fieldPathId` instead of `idSchema`, always providing the `idPrefix` and `idSeparator` in the `globalFormOptions` and make the `path: FieldPathList` required
  - Updated `LayoutGridField` to remove the `IdSchema` related code in favor of `FieldPathId` code
- Also exported the `getTestRegistry()` function from the main `index.ts` to assist developers in creating `registry` object for tests
- Updated all of the test to deal with the `idSchema` -> `fieldPathId` changes

## @rjsf/daisyui

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions
- Also fixed the `FieldTemplate` to extract the `description` element so that it was not spread onto the `div`, fixing the snapshots

## @rjsf/fluent-ui

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/mantine

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/mui

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/primereact

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/react-bootstrap

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/semantic-ui

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/shadcn

- BREAKING CHANGES - Updated all of the templates and widgets to change `idSchema` to `fieldPathId` or to remove the `<T>` off of the idGenerator functions

## @rjsf/utils

- Added new `FieldPathList` and `FieldPathId` types and `DEFAULT_ID_PREFIX` and `DEFAULT_ID_SEPARATOR` to `constants.ts`
- Added the new `toFieldPathId()` function to generate `FieldPathId`s, exporting it from the library
- Deprecated the `ui:rootFieldId` in the `UiSchema` since `idPrefix` does the same exact thing
- BREAKING CHANGES
  - Removed the `IdSchema` type, replacing `idSchema: IdSchema<T>` in all types with `fieldPathId: FieldPathId`
  - Updated the `idGenerators` to replace `id: IdSchema<T> | string` with `id: FieldPathId | string` removing the need for the `<T = any>` generic on the functions
  - Removed the `toIdSchema()` function in the `schema` directory
  - Updated the `FieldProps` type's `onChange()` callback to make the `path: FieldPathList` parameter be required instead of optional
  - Updated the `SchemaUtilsType` and `createSchemaUtils()` to remove the `toIdSchema()` function

## @rjsf/validator-ajv8

- Updated the test to no longer try to test the delete `toIdSchema` function

## Dev / docs / playground

- Updated `custom-templates.md`, `custom-widgets-fields.md` and `layout-grid.md` to change the `idSchema` documentation to `fieldPathId`
- Updated `uiSchema.md` to mark the `ui:rootFieldId` as deprecated in the documentation
- Updated `utility-functions.md` delete `toIdSchema()`, add `toFieldPathId()` and to remove the `<T>` from the id generator functions
- Updated `v6.x upgrade guide.md` to document all the breaking changes, new functions and deprecations made in `6.0.0-beta.20`

# 6.0.0-beta.19

## @rjsf/core

- Updated `Form` to fix live validation in `getStateFromProps()` broken by an optimization, fixing [#4782](https://github.com/rjsf-team/react-jsonschema-form/issues/4782)
- Updated `Form` to fix error messages being displayed abnormally when `customValidate` is provided, fixing [#4783](https://github.com/rjsf-team/react-jsonschema-form/issues/4783)
- Updated `Form` to fix `omitExtraData` when the leaf node happens to have an object value, fixing [#4784](https://github.com/rjsf-team/react-jsonschema-form/issues/4784)

## @rjsf/utils

- Updated `resolveSchema()` to pass the `experimental_customMergeAllOf` options properly to `resolveReference()` and `resolveDependencies()` called within it

# 6.0.0-beta.18

## @rjsf/chakra-ui

- Updated `ObjectFieldTemplate` to always generate the "Add" button when `canExpand()` is true, fixing [#4772](https://github.com/rjsf-team/react-jsonschema-form/issues/4772)

## @rjsf/core

- Updated `Form` to add the `globalFormOptions` to the `registry` when there are `GlobalFormOptions` provided, also stopped passing `idPrefix` and `idSeparator` to `SchemaField`
- Updated `ArrayField`, `LayoutGridField`, `ObjectField` and `SchemaField` to get `idPrefix`, `idSeparator` from the `registry.globalFormOptions`, no longer passing them on `FieldProps`
  - Updated `SchemaField` to get `experimental_componentUpdateStrategy` from the `registry.globalFormOptions` as well

## @rjsf/utils

- Update `getDefaultFormState()` to add support for `null` defaults for `["null", "object"]` and `["null", "array"]`, fixing [#1581](https://github.com/rjsf-team/react-jsonschema-form/issues/1581)
- Added a new `GlobalFormProps` interface which contains the following props and replaced the `experimental_componentUpdateStrategy` in `Registry` with `globalFormProps?: GlobalFormProps`
  - `experimental_componentUpdateStrategy` (refactored from `Registry`) and `idPrefix` & `idSeparator` (refactored from `FieldProps`)
- BREAKING CHANGE: Removed the optional `idPrefix` and `idSeparator` props from the `FieldProps` interface

## Dev / docs / playground

- Updated the `custom-widget-fields.md` and `v6.x upgrade guide.md` to document the refactor of the `idPrefix` and `idSeparator` refactor

# 6.0.0-beta.17

## @rjsf/core

- Updated `ObjectField` to remove the `name` from the path passed to `onChange()` callback in `handleAddClick()` and `onDropPropertyClick()`, fixing [#4763](https://github.com/rjsf-team/react-jsonschema-form/issues/4763)
- Updated `Form` to restore the passing of an empty string for `name` to avoid accidentally showing it as the title for the whole schema

## @rjsf/shadcn

- Update `ArrayFieldItemTemplate` to align buttons with the input field, fixing [#4753](https://github.com/rjsf-team/react-jsonschema-form/pull/4753)

# 6.0.0-beta.16

## @rjsf/antd

- Updated the `ArrayFieldTemplate`, `FieldTemplate` and `ObjectFieldTemplate` to get `formContext` from the `registry`

## @rjsf/core

- Updated `ArrayField`, `Form`, `LayoutMultiSchemaField` and `SchemaField` to stop passing `formContext`

## @rjsf/daisyui

- Updated `FieldTemplate` to remove `formContext` as it is never used

## @rjsf/semantic-ui

- Updated the `ArrayFieldTemplate`, `BaseInputTemplate`, `CheckboxWidget`, `FieldTemplate`, `RadioWidget`, `RangeSelect`, `SelectWidget`, `TextareaWidget` and `ObjectFieldTemplate` to get `formContext` from the `registry`

## @rjsf/utils

- BREAKING CHANGE: Removed `formContext` from the following interfaces because it is available on `registry`:
  - `ErrorListProps`, `FieldProps`, `FieldTemplateProps`, `ArrayFieldTemplateProps` and `WidgetProps`
- Update `mergeDefaultsWithFormData` to properly handle overriding `undefined` formData with a `null` default value, fixing [#4734](https://github.com/rjsf-team/react-jsonschema-form/issues/4734)
- Fixed object reference sharing in arrays with minItems when using oneOf schemas, fixing [#4756](https://github.com/rjsf-team/react-jsonschema-form/issues/4756)
- Updated `getWigets()` to output the `schema` when throwing errors, fixing [#4731](https://github.com/rjsf-team/react-jsonschema-form/issues/4731)

## Dev / docs / playground

- Updated the documentation to remove `formContext` from the interface documentation, adding a BREAKING CHANGE notification in the `v6.x upgrade guide`
- POTENTIAL BREAKING CHANGE: Updated the `cjs` build for all packages to generate `.cjs` files instead of `.js` files and updating the `exports` to make the `require` statements use `.cjs`, fixing [#4754]https://github.com/rjsf-team/react-jsonschema-form/issues/4754)
- Updated `v6.x upgrade guide.md` to note the change to the `cjs` builds

# 6.0.0-beta.15

## @rjsf/chakra-ui

- Updated `package.json` for to make `lucide-react` a dependency rather than a devDependency, fixing [#4739](https://github.com/rjsf-team/react-jsonschema-form/issues/4739)

## @rjsf/core

- Updated `ArrayField` `onSelectChange` to not pass `name` in the `path` since the `ObjectField` will automatically add it [#4733](https://github.com/rjsf-team/react-jsonschema-form/issues/4733)
- Updated `Form` to optimize the need for live validation in an attempt to improve performance, potentially fixing [#3616](https://github.com/rjsf-team/react-jsonschema-form/issues/3616)

## @rjsf/semantic-ui

- Updated `ArrayField` to stop using `nanoid` and instead use `lodash/uniqueId` to fix [#4762](https://github.com/rjsf-team/react-jsonschema-form/issues/4726)

## @rjsf/shadcn

- Update `README.md` with picture of the theme!
- Allow passing `className` props to `AddButton`, `BaseInputTemplate`, `CheckboxWidget`, `CheckboxesWidget`, `RadioWidget`, `SelectWidget`, `SubmitButton`, `TextareaWidget` for extra Tailwind CSS customization through `ui:className`

## @rjsf/utils

- Updated `getTestIds` to stop using `nanoid` and instead use `lodash/uniqueId` to fix [#4762](https://github.com/rjsf-team/react-jsonschema-form/issues/4726)

## Dev / docs / playground

- Removed `nanoid` from the build system and `jest.config.js` files

# 6.0.0-beta.14

## @rjsf/core

- Added support for dynamic UI schema in array fields - the `items` property in `uiSchema` can now accept a function that returns a UI schema based on the array item's data, index, and form context ([#4706](https://github.com/rjsf-team/react-jsonschema-form/pull/4706))
- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)
- Updated all of the `XxxxField` components and `Form` to handle the new `path` parameter in `FieldProps.onChange`, making `Form` queue up changes so that they are all processed and no data is lost, fixing [#3367](https://github.com/rjsf-team/react-jsonschema-form/issues/3367)
- Updated a bug in `AltDateWidget` related to the `clear` button not working after the fix for [#3367](https://github.com/rjsf-team/react-jsonschema-form/issues/3367)
- Fixed the missing hook dependencies for the `CheckboxesWidget` so that they work properly
- Added support for array indexes in the `LayoutGridField`, fixing [#4676](https://github.com/rjsf-team/react-jsonschema-form/issues/4676)

## @rjsf/chakra-ui

- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)

## @rjsf/daisyui

- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)
- Fixed additional properties rendering by properly connecting the `FieldTemplate` and `WrapIfAdditionalTemplate`, fixing [4707](https://github.com/rjsf-team/react-jsonschema-form/issues/4707)
- Fixed the missing hook dependencies in the `DateTimeWidget` and `DateWidget` so that they work properly

## @rjsf/fluentui-rc

- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)

## @rjsf/mantine

- Added new theme!

## @rjsf/mui

- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)

## @rjsf/primereact

- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)

## @rjsf/semantic-ui

- Fixed checkbox widget to use current value instead of event target in onFocus/onBlur handlers, fixing [#4704](https://github.com/rjsf-team/react-jsonschema-form/issues/4704)

## @rjsf/shadcn

- Bump `@shadcn/ui` components to use latest version from https://ui.shadcn.com/
- Bump `tailwindcss` to using v4 and css compiling process to use latest `@tailwindcss/cli`
- Remove `postcss` due to new Oxide compiler of tailwindcss
- Update playground themes with `default`, `Amethyst Haze`, `Caffeine`, `Claude`, `Neo Brutalism`, `Pastel Dreams`, `Soft Pop`, `Twitter`, `Vercel`
- Radio widget labels are now accessible and can be clicked on to select the associated option.

## @rjsf/utils

- Updated `UiSchema` type to support dynamic array item UI schemas - the `items` property can now be either a `UiSchema` object or a function that returns a `UiSchema` ([#4706](https://github.com/rjsf-team/react-jsonschema-form/pull/4706))
- Added `title` property to `RJSFValidationError` [PR](https://github.com/rjsf-team/react-jsonschema-form/pull/4700)
- BREAKING CHANGE: Updated the `FieldProps` interface's `onChange` handler to inject a new optional `path` before the `ErrorSchema` parameter as part of the fix for [#3367](https://github.com/rjsf-team/react-jsonschema-form/issues/3367)

## @rjsf/validator-ajv8

- Updated `transformRJSFValidationErrors()` to include the `title` property of a field with error fixing #4504 with [PR](https://github.com/rjsf-team/react-jsonschema-form/pull/4700)
- Updated `AJVValidator` to handle the attempted compile of a bad schema, fixing [#4357](https://github.com/rjsf-team/react-jsonschema-form/issues/4357)

## Dev / docs / playground

- Added comprehensive documentation for dynamic UI schema feature with TypeScript examples [#4706](https://github.com/rjsf-team/react-jsonschema-form/pull/4706)
- Updated array documentation to reference the new dynamic UI schema capabilities [#4706](https://github.com/rjsf-team/react-jsonschema-form/pull/4706)
- Updated nearly all of the libraries in the `package.json` files to the latest non-breaking versions
- Fixed the broken `Custom Array` sample
- Improved the `Any Of with Custom Field` sample so that it renders using the appropriate theme components
- Updated the `custom-widgets-fields.md` and `v6.x upgrade guide.md` to document the BREAKING CHANGE to the `FieldProps.onChange` behavior
- Updated the playground to properly output the `validationError` when running `Raw Validate`

# 6.0.0-beta.13

## @rjsf/shadcn

- Updated `lodash` import in `fancy-multi-select.tsx` to to be direct import, fixing [#4696](https://github.com/rjsf-team/react-jsonschema-form/issues/4696)

# 6.0.0-beta.13

## @rjsf/core

- Added `experimental_componentUpdateStrategy` prop to `Form` component to control re-render optimization behavior. Supports `'customDeep'` (default, uses deep equality checks that ignore functions), `'shallow'`, and `'always'`

## @rjsf/utils

- Extended `Registry` interface to include optional `experimental_componentUpdateStrategy` property
- Added `shallowEquals()` utility function for shallow equality comparisons
- Fixed boolean fields incorrectly set to `{}` when switching oneOf/anyOf options with `mergeDefaultsIntoFormData` set to `useDefaultIfFormDataUndefined`, fixing [#4709](https://github.com/rjsf-team/react-jsonschema-form/issues/4709) ([#4710](https://github.com/rjsf-team/react-jsonschema-form/pull/4710))
- Always make all references absolute in nested bundled schemas

# 6.0.0-beta.12

## @rjsf/core

- Updated `Form` to store the `schemaUtils.getRootSchema()` into the `state.schema` and use that everywhere as the `schema`

## @rjsf/shadcn

- Updated the building of `shadcn` to use the `lodashReplacer` with `tsc-alias` fixing [#4678](https://github.com/rjsf-team/react-jsonschema-form/issues/4678)

## @rjsf/utils

- Updated `SchemaUtils` and `createSchemaUtils()` to add a new `getRootSchema()` function

# 6.0.0-beta.11

## @rjsf/antd

- Set peerDependency for `@ant-design/icons` to `^6.0.0`, fixing [#4643](https://github.com/rjsf-team/react-jsonschema-form/issues/4643)
- Added `MultiSchemaFieldTemplate`

## @rjsf/chakra-ui

- Added `MultiSchemaFieldTemplate`
- Improve visual styling of error validation boxes
- Update `chakra-ui/react` package to `^3.19.1`

## @rjsf/core

- Refactored `MultiSchemaField` to use the `MultiSchemaFieldTemplate` provided by the registry.
- Added `MultiSchemaFieldTemplate` component to maintain the same functionality as the previous `MultiSchemaField` implementation.

## @rjsf/daisyui

- Added `MultiSchemaFieldTemplate`

## @rjsf/fluentui-rc

- Added `MultiSchemaFieldTemplate`

## @rjsf/mui

- Added `MultiSchemaFieldTemplate`

## @rjsf/primereact

- New theme!

## @rjsf/react-bootstrap

- Added `MultiSchemaFieldTemplate`

## @rjsf/semantic-ui

- Added `MultiSchemaFieldTemplate`

## @rjsf/shadcn

- Added `MultiSchemaFieldTemplate`

## @rjsf/utils

- Fixed issue where oneOf radio button could not be modified when defaults were set, fixing [#4634](https://github.com/rjsf-team/react-jsonschema-form/issues/4634)
- Fix default value for object properties such as enums that are rendered in select, radio inputs, etc.
- Add support for `MultiSchemaFieldTemplate`, with new `MultiSchemaFieldTemplateProps`, to the `TemplatesType` interface

## Dev / docs / playground

- Added documentation for the new `MultiSchemaFieldTemplate`

# 6.0.0-beta.10

## @rjsf/mui

- Fixed build process to remove the `tsc-alias` replacer that was adding `/index.js` onto the `@mui/Xxxx` imports since MUI 7 has proper ESM support

# 6.0.0-beta.9

## @rjsf/antd

- Updated the `README.md` file for dependencies and snapshots due to updating to latest `antd`

## @rjsf/chakra-ui

- Updated `SelectWidget` to only pick the first element in a list when single selection is active, fixing [#4623](https://github.com/rjsf-team/react-jsonschema-form/issues/4623)
- Updated the `README.md` file for dependencies

## @rjsf/daisyui

- Updated the `README.md` file for dependencies
- Updated `package.json` to move `@fluentui` packages to peer and dev dependencies

## @rjsf/fluentui-rc

- Updated the `README.md` file for dependencies
- Updated `package.json` to move `daisyui` to peer and dev dependencies

## @rjsf/mui

- Updated the `README.md` file for dependencies
- BREAKING CHANGE: Upgraded MUI to version 7, dropping support for earlier versions due to conversion of `Grid`s to v7 version (a MUI breaking change)

## @rjsf/react-bootstrap

- Updated the `README.md` file for dependencies

## @rjsf/semantic-ui

- Updated the `README.md` file for dependencies
- Deprecated the theme due to it appearing to be a dead project

## @rjsf/shadcn

- Updated the `README.md` file for dependencies

## @rjsf/utils

- Fixed form data propagation with `patternProperties` [#4617](https://github.com/rjsf-team/react-jsonschema-form/pull/4617)
- Updated the `GlobalUISchemaOptions` types to extend `GenericObjectType` to support user-defined values for their extensions

## Dev / docs / playground

- Updated `playground` to use MUI version 7
- Updated `v6 upgrade guide.md` to note the breaking change for MUI 7 and deprecation of `semantic-ui`

# 6.0.0-beta.8

## @rjsf/chakra-ui

- Added `getChakra` to package exports
- Restored the `ui:options` customization
- Updated `SelectWidget` to only pick the first element in a list when single selection is active, fixing [#4623](https://github.com/rjsf-team/react-jsonschema-form/issues/4623)

## @rjsf/core

- Updated `LayoutGridField` to use the pre-existing `UI_GLOBAL_OPTIONS_KEY` instead of its own incorrect one.

## @rjsf/utils

- Fixed form data propagation with `patternProperties` [#4617](https://github.com/rjsf-team/react-jsonschema-form/pull/4617)
- Fixed issue where oneOf schema references could not be modified when defaults were set, fixing [#4580](https://github.com/rjsf-team/react-jsonschema-form/issues/4580).
- Updated the `GlobalUISchemaOptions` types to extend `GenericObjectType` to support user-defined values for their extensions

## Dev / docs / playground

- Updated precompiled schemas documentation in `validation.md` based on v6 changes, addressing [#4618](https://github.com/rjsf-team/react-jsonschema-form/issues/4618)

# 6.0.0-beta.7

## @rjsf/core

- Fixed crash in `LayoutGridField` when the 'name' field is missing in the grid schema for a component

# 6.0.0-beta.6

## @rjsf/utils

- Updated the `Field` type to add the optional `TEST_IDS?: TestIdShape` prop to it to support exposing the `TEST_IDS` static prop on `LayoutGridField`, `LayoutHeaderField` and `LayoutMultiSchemaField` for external users

# 6.0.0-beta.5

## Dev / docs / playground

- Updated the peer dependencies for all packages from `6.0.0-beta` to `^6.0.0-beta` to avoid `npm install` dependency resolution issues

# 6.0.0-beta.4

## Dev / docs / playground

- Updated the peer dependencies for all packages from `6` to `6.0.0-beta` to avoid `npm install` dependency resolution issues

# 6.0.0-beta.3

## Dev / docs / playground

- Updated the peer dependencies for all packages from `^6.0.0-beta.x` to `6` to avoid `npm install` dependency resolution issues

# 6.0.0-beta.2

## @rjsf/antd

- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/chakra-ui

- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/core

- Added new `RichDescription` component, refactored from `SchemaField` to support Rich Text descriptions in Markdown format
- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/daisyui

- Updated `DescriptionField` to render the `description` using the `RichDescription` field
- Updated `FieldTemplate` to move the checkbox implementation into the `CheckboxWidget` adding the `description` for checkboxes
- Updated `package.json` to make the package publishable
- Updated `DaisyUIFrameProvider` to extract the bulk of the code into `DaisyUIFrameComponent` to add a `useEffect()` with a cleanup to remove the tailwind styles

## @rjsf/fluentui-rc

- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/mui

- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/react-bootstrap

- Updated `DescriptionField` to render the `description` using the `RichDescription` field
- Updated `CheckboxField` to remove the `checkbox` class that breaks the UI

## @rjsf/semantic-ui

- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/shadcn

- Updated `DescriptionField` to render the `description` using the `RichDescription` field

## @rjsf/utils

- Updated the `description` field in field props to be a `string | ReactElement` and added `enableMarkdownInDescription` to the `GlobalUISchemaOptions` interface
- Support for bundled JSON Schemas [#4505](https://github.com/rjsf-team/react-jsonschema-form/issues/4505)
- Fixed issue with schema references in combinators(allOf, anyOf, oneOf) could not be modified when defaults were set, fixing [#4555](https://github.com/rjsf-team/react-jsonschema-form/issues/4555)

## Dev / docs / playground

- Updated the `snapshot-tests` to disable `getTestId()` for snapshots and updated the `formTests.tsx` to add tests for rich text descriptions for generic fields and the `CheckboxWidget`
- Updated the `uiSchema.md` to document new `enableMarkdownInDescription` prop
- Updated the `playground` to move `daisyui` theme choice after `chakra-ui` and to stop freezing the samples to avoid an `AJV` validation issue
  - Also removed `validator` from the `examples.ts` to fix [#4605](https://github.com/rjsf-team/react-jsonschema-form/issues/4605)
- Added a playground example for bundled JSON Schemas

# 6.0.0-beta.1

## @rjsf/antd

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme
- BREAKING CHANGE: Removed support for version 4 of `antd`
- Updated `ArrayFieldItemTemplate` to replace `Button.Group` with `Space.Compact` since `Button.Group` is deprecated in `antd` version 5
- Upgraded to `@ant-design/icon@5`
- BREAKING CHANGE: Removed the addition of `Bootstrap 3` classes from the `SchemaField` and added `rjsf-` prefix to marker classes, thereby changing theme `FieldTemplate` className prop output and associated snapshots

## @rjsf/chakra-ui

- BREAKING CHANGE: upgrade from v2 to v3
- BREAKING CHANGE: remove deprecated `@chakra-ui/icon` in favor of `lucide-react`
- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme
- BREAKING CHANGE: Removed the addition of `Bootstrap 3` classes from the `SchemaField` and added `rjsf-` prefix to marker classes, thereby changing theme `FieldTemplate` className prop output and associated snapshots

## @rjsf/core

- BREAKING CHANGE: Updated `ArrayField` to provide the `buttonsProps` to the `ArrayFieldItemTemplateType`
- Added `ArrayFieldItemButtonsTemplate` component as a refactor of all the common buttons code from all the `ArrayFieldItemTemplate` implementations, adding a unique id using the `buttonId()` function
- Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme
- Implemented the new `LayoutGridField`, `LayoutMultiSchemaField` and `LayoutHeaderField` fields, adding them to the `fields` list
- BREAKING CHANGE: Removed support for the deprecated `schema.enumNames` and `uiSchema.classNames` as well as the deprecated `acceptcharset` prop on `Form`
- BREAKING CHANGE: Moved the addition of `Bootstrap 3` classes from the `SchemaField` to the `WrapIfAdditionalTemplate`, thereby affecting all the other themes, fixing [#2280](https://github.com/rjsf-team/react-jsonschema-form/issues/2280)
- BREAKING CHANGE: Added `rjsf-` prefix onto the following marker classes used in the fields and templates:
  - `field`, `field-<schema.type>`, `field-error`, `field-hidden`, `field-array`, `field-array-of-<schema.type>`, `field-array-fixed-items`, `array-item`, `config-error`, `array-item-add`, `array-item-copy`, `array-item-move-down`, `array-item-move-up`, `array-item-remove`, `object-property-expand`
- Added support for `patternProperties` [#1944](https://github.com/rjsf-team/react-jsonschema-form/issues/1944)

## @rjsf/daisyui

- Added new theme!

## @rjsf/fluent-ui

- BREAKING CHANGE: Deleted this theme in favor of `fluentui-rc`

## @rjsf/fluentui-rc

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme
- BREAKING CHANGE: Removed the addition of `Bootstrap 3` classes from the `SchemaField` and added `rjsf-` prefix to marker classes, thereby changing theme `FieldTemplate` className prop output and associated snapshots

## @rjsf/material-ui

- BREAKING CHANGE: Deleted this theme in favor of `mui`

## @rjsf/mui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Updated the theme to use `Grid2` instead of the deprecated `Grid`
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme
- BREAKING CHANGE: Removed the addition of `Bootstrap 3` classes from the `SchemaField` and added `rjsf-` prefix to marker classes, thereby changing theme `FieldTemplate` className prop output and associated snapshots

## @rjsf/semantic-ui

- BREAKING CHANGE: Refactored `ArrayFieldItemTemplate` to use the new `ArrayFieldItemButtonsTemplate`
- Updated the `ArrayFieldTemplate`, `ObjectFieldTemplate`, and `WrapIfAdditionalTemplate` to a unique id using the `buttonId()` function and adding consistent marker classes
- Implemented the `GridTemplate` component, adding it to the `templates` for the theme
- BREAKING CHANGE: Removed the addition of `Bootstrap 3` classes from the `SchemaField` and added `rjsf-` prefix to marker classes, thereby changing theme `FieldTemplate` className prop output and associated snapshots
- BREAKING CHANGE: Removed support for the v1 version of `semantic-ui-react`

## @rjsf/shadcn

- Added new theme!

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
- BREAKING CHANGE: Removed support for the deprecated `schema.enumNames` from `getOptionsList()` while switching the order of its generic types
- BREAKING CHANGE: Removed the deprecated `getMatchingOption()` and `mergeValidationData()` from the library export and the `SchemaUtilsType` interface
- BREAKING CHANGE: Removed the deprecated `toErrorList()` function from the `ValidatorType` interface
- BREAKING CHANGE: Removed the deprecated `RJSF_ADDITONAL_PROPERTIES_FLAG` constant
- Updated the `WrapIfAdditionalTemplateProps` to include `hideError` and `rawErrors` in support of moving `Bootstrap 3` marker classes out of `SchemaField`
- Added support for `patternProperties` [#1944](https://github.com/rjsf-team/react-jsonschema-form/issues/1944)
- Updated `getTemplate()` to allow per-field customization using string key from `Registry`, fixing [#3695](https://github.com/rjsf-team/react-jsonschema-form/issues/3695).
- Updated `TemplatesType` to allow for a string key to be used to reference a custom template in the `Registry`, fixing [#3695](https://github.com/rjsf-team/react-jsonschema-form/issues/3695)
- Updated tests to cover the new `getTemplate()` functionality

## @rjsf/validator-ajv6

- BREAKING CHANGE: This deprecated validator has been removed

## @rjsf/validator-ajv8

- BREAKING CHANGE: Removed the implementation of the deprecated `toErrorList()` function from the validator implementations

## Dev / docs / playground

- Updated the playground to Chakra UI v3
- Updated the playground to remove `fluent-ui` theme
- Updated the `custom-templates.md` documentation for the changes to the `ArrayFieldTemplateItem` and add the two new templates
- Updated the `utility-functions.md` documentation to add the `buttonId()` function
- Added the `v6.x upgrade guide.md` documentation
- Updated the `playground` to add a `Layout Grid` example and made the selected example now be part of the shared export
- Replaced Lerna with Nx, updated all lerna commands to use the Nx CLI
- BREAKING CHANGE: Updated all `peerDependencies` to change minimal `React` support to `>=18`
- Added documentation and playground example for `patternProperties`
- Updated `advanced-customization/custom-templates` with the new feature.

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

# 5.24.10

## Dev / docs / playground

- Updated all `package.json` files in the `packages` directories to remove the `exports` blocks, fixing [#4537](https://github.com/rjsf-team/react-jsonschema-form/issues/4537)

# 5.24.9

## @rjsf/antd

- Fixed ts errors in newer antd versions [#4525](https://github.com/rjsf-team/react-jsonschema-form/issues/4525)

## @rjsf/chakra-ui

- Restricted the chakra-react-select peerDependency to <6.0.0, fixing [#4539](https://github.com/rjsf-team/react-jsonschema-form/issues/4539)

## @rjsf/core

- Do not display input field in MultiSchemaField with null type

## @rjsf/mui

- Fixed issue in BaseInputTemplate where input props were passed to `slotProps.htmlInput`, which does not work in MUI v5.

## @rjsf/utils

- Fixed issue with schema combinators(allOf, anyOf, oneOf) could not be modified when defaults were set, fixing [#4555](https://github.com/rjsf-team/react-jsonschema-form/issues/4555)

## Dev / docs / playground

- Updated docs for ArrayFieldItemTemplate to include prop `onCopyIndexClick`, fixing [#4507](https://github.com/rjsf-team/react-jsonschema-form/issues/4507)
- Use antd 5 in playground
- Updated docs to clarify that errors raised within a widget are not caught during form validation
- Updated docs where objects typed as RJSFValidationError were not valid ([#4558](https://github.com/rjsf-team/react-jsonschema-form/issues/4558))

# 5.24.8

## @rjsf/antd

- Fixed the total disable of the `RadioWidget`, fixing [#4481](https://github.com/rjsf-team/react-jsonschema-form/issues/4481)

## @rjsf/validator-ajv8

- Fixed up the ESM build to properly handle ESM imports for `compileSchemaValidatorsCode()` by adding a new `ajvReplacer.ts` and using it

## Dev / docs / playground

- Updated `snapshot-tests` to add validation of disable `RadioWidget` via the `Form` prop as well as `uiSchema`

# 5.24.7

## Dev / docs / playground

- Fixed build issues with small change to `core/src/tsconfig.json` and improvements to the `exports` for ESM support
- Run NX serially in the pipelines to avoid odd out-of-sequence build issues

# 5.24.6

## @rjsf/core

- Fixed `src/tsconfig.json` to add the `tsc-alias` block to support proper fixing up of ESM import

# 5.24.5

## @rjsf/utils

- Fixed `package.json` to remove `node` from the `exports` block to fix ESM support

# 5.24.4

## @rjsf/utils

- Fixed issue with customValidate errors are not cleared when the form is valid [4365](https://github.com/rjsf-team/react-jsonschema-form/pull/4365) due to regression
- Add missing `experimental_customMergeAllOf` argument to `ensureFormDataMatchingSchema` introduced by [4388](https://github.com/rjsf-team/react-jsonschema-form/pull/4388)

## Dev / docs / playground

- Improved the ESM support for all public packages by adding explicit `exports` to each public `package.json`
- Updated the ESM builds to use `tsc-alias` to add `.js` onto all ESM imports

# 5.24.3

## @rjsf/utils

- Rollback [4446](https://github.com/rjsf-team/react-jsonschema-form/pull/4446) due to regression

## Dev / docs / playground

- Fixed issue with selector, where validator was getting refreshed on clicking on anything in selector. [#4472](https://github.com/rjsf-team/react-jsonschema-form/pull/4472)

# 5.24.2

## @rjsf/utils

- switch `lodash.isEqualWith` to `fast-equals.createCustomEqual` providing `areFunctionsEqual` assuming any functions are equal.
- Fixed issue with oneOf selector can be modified in readonly mode, fixing [#4460](https://github.com/rjsf-team/react-jsonschema-form/issues/4460)
- Fixed issue with fields inside an array can't be set to empty when a default is set, fixing [#4456](https://github.com/rjsf-team/react-jsonschema-form/issues/4456)
- Fixed issue with file accept attribute, fixing [#4404](https://github.com/rjsf-team/react-jsonschema-form/issues/4404).

## @rjsf/mui

- Fixed issue with file accept attribute, fixing [#4404](https://github.com/rjsf-team/react-jsonschema-form/issues/4404).

# 5.24.1

## @rjsf/utils

- Fixed documentation for `getChangedFields()`

## Dev / docs / playground

- Updated the peer dependencies for `@rjsf/*` to be `5.24.x`
- Added documentation for `getChangedFields()`

# 5.24.0

## @rjsf/core

- Fixed issue with schema if/then/else conditions where switching to then/else subschemas did not reflect the actual validation errors in the onChange event, fixing [#4249](https://github.com/rjsf-team/react-jsonschema-form/issues/4249) and improving performance.
- Fixed issue error message will not be cleared after the controlled Form formData is changed. Fixes [#4426](https://github.com/rjsf-team/react-jsonschema-form/issues/4426)

## @rjsf/utils

- Fixed issue with formData not updating when dependencies change, fixing [#4325](https://github.com/rjsf-team/react-jsonschema-form/issues/4325)
- Fixed issue with assigning default values to formData with deeply nested required properties, fixing [#4399](https://github.com/rjsf-team/react-jsonschema-form/issues/4399)
- Fixed issue error message will not be cleared after the controlled Form formData is changed. Fixes [#4426](https://github.com/rjsf-team/react-jsonschema-form/issues/4426)
- Fix for AJV [$data](https://ajv.js.org/guide/combining-schemas.html#data-reference) reference in const property in schema treated as default/const value. The issue is mentioned in [#4361](https://github.com/rjsf-team/react-jsonschema-form/issues/4361).
- Switched uses of `lodash.isEqual()` to `@rjsf/utils.deepEquals`.

## @rjsf/validator-ajv8

- Partially fixed issue where dependency errors do not show `title` or `ui:title`. This fix only applicable if we use an ajv-i18n localizer. Ref. [#4402](https://github.com/rjsf-team/react-jsonschema-form/issues/4402).
- Switched uses of `lodash.isEqual()` to `@rjsf/utils.deepEquals` at precompiledValidator.

# 5.23.2

## @rjsf/core

- Fix default value population when switching between options in `MultiSchemaField` [#4375](https://github.com/rjsf-team/react-jsonschema-form/pull/4375). Fixes [#4367](https://github.com/rjsf-team/react-jsonschema-form/issues/4367)

## @rjsf/utils

- Short-circuit `File` and `Date` constructor access in isObject to optimize performance in scenarios where `globalThis` is a `Proxy` that incurs overhead for each class constructor access ([#4413](https://github.com/rjsf-team/react-jsonschema-form/pull/4413)). Fixes [#4409](https://github.com/rjsf-team/react-jsonschema-form/issues/4409)

## @rjsf/validator-ajv8

- Fixed issue where `ui:title` in anyOf/oneOf is not shown in error messages. Fixes [#4368](https://github.com/rjsf-team/react-jsonschema-form/issues/4368)

# 5.23.1

## @rjsf/chakra-ui

- Updated `package.json` to restrict `@chakra-ui/react`'s peer dependency to be < 3.0.0, fixing [#4390](https://github.com/rjsf-team/react-jsonschema-form/issues/4390)

## @rjsf/core

- Updated `NumberField` to properly pass through the `errorSchema` and `id` in the onChange handler, fixing [#4382](https://github.com/rjsf-team/react-jsonschema-form/issues/4382)

## Dev / docs / playground

- Updated the peer dependencies for `@rjsf/*` to be `5.23.x`

# 5.23.0

## @rjsf/core

- Updated `SchemaField` to no longer make schema fields with const read-only by default, partially fixing [#4344](https://github.com/rjsf-team/react-jsonschema-form/issues/4344)

## @rjsf/utils

- Updated `Experimental_DefaultFormStateBehavior` to add a new `constAsDefaults` option
- Updated `getDefaultFormState()` to use the new `constAsDefaults` option to control how const is used for defaulting, fixing [#4344](https://github.com/rjsf-team/react-jsonschema-form/issues/4344), [#4361](https://github.com/rjsf-team/react-jsonschema-form/issues/4361) and [#4377](https://github.com/rjsf-team/react-jsonschema-form/issues/4377)
- Use `experimental_customMergeAllOf` option in functions that have previously missed it.
- Updated `ErrorSchemaBuilder` methods `addErrors` and `setErrors` to prevent duplicate error messages.

## @rjsf/validator-ajv8

- Fixed issue where error messages do not have `title` or `ui:title` if a `Localizer` function is used. Fixes [#4387](https://github.com/rjsf-team/react-jsonschema-form/issues/4387)

## Dev / docs / playground

- Updated the playground to add a selector for the `constAsDefaults` option

# 5.22.4

## @rjsf/utils

- Fixed issue with array schema defaults not applying properly when formData is an empty array, fixing [#4335](https://github.com/rjsf-team/react-jsonschema-form/issues/4335).

## Dev / docs / playground

- Fix issue 'Maximum call stack size exceeded' with playground share with large content.

# 5.22.3

## @rjsf/utils

- Fixed deep nested dependencies issue with assigning values to formData, fixing [#4334](https://github.com/rjsf-team/react-jsonschema-form/issues/4334)

# 5.22.2

## @rjsf/core

- Fix an issue where only the first file was uploaded when users selected multiple files for upload.
- Fixed validation regression Form not revalidating after formData change, fixing [#4343](https://github.com/rjsf-team/react-jsonschema-form/issues/4343)

## @rjsf/validator-ajv8

- Fixed `AJV8Validator#transformRJSFValidationErrors` to replace the error message field with either the `uiSchema`'s `ui:title` field if one exists or the `parentSchema` title if one exists. Fixes [#4348](https://github.com/rjsf-team/react-jsonschema-form/issues/4348)

# 5.22.1

## Dev / docs / playground

- Bumped peer dependencies to 5.22.x due to updated type definition and API changes in @rjsf/utils

# 5.22.0

## @rjsf/core

- Updated `MultiSchemaField` to call the `onChange` handler after setting the new option, fixing [#3997](https://github.com/rjsf-team/react-jsonschema-form/issues/3977) and [#4314](https://github.com/rjsf-team/react-jsonschema-form/issues/4314)

## @rjsf/utils

- Added `experimental_customMergeAllOf` option to `retrieveSchema()` and `getDefaultFormState()` to allow custom merging of `allOf` schemas
- Made fields with const property pre-filled and readonly, fixing [#2600](https://github.com/rjsf-team/react-jsonschema-form/issues/2600)
- Added `mergeDefaultsIntoFormData` option to `Experimental_DefaultFormStateBehavior` type to control how to handle merging of defaults
- Updated `mergeDefaultsWithFormData()` to add new optional `defaultSupercedesUndefined` that when true uses the defaults rather than `undefined` formData, fixing [#4322](https://github.com/rjsf-team/react-jsonschema-form/issues/4322)
- Updated `getDefaultFormState()` to pass true to `mergeDefaultsWithFormData` for `defaultSupercedesUndefined` when `mergeDefaultsIntoFormData` has the value `useDefaultIfFormDataUndefined`, fixing [#4322](https://github.com/rjsf-team/react-jsonschema-form/issues/4322)
- Updated `getClosestMatchingOption()` to improve the scoring of sub-property objects that are provided over ones that aren't, fixing [#3997](https://github.com/rjsf-team/react-jsonschema-form/issues/3977) and [#4314](https://github.com/rjsf-team/react-jsonschema-form/issues/4314)

## Dev / docs / playground

- Updated the `form-props.md` to add documentation for the new `experimental_customMergeAllOf` props and the `experimental_defaultFormStateBehavior.mergeDefaultsIntoFormData` option
- Updated the `utility-functions.md` to add documentation for the new optional `defaultSupercedesUndefined` parameter and the two missing optional fields on `getDefaultFormState()`
- Updated the `custom-templates.md` to add a section header for wrapping `BaseInputTemplate`
- Updated the playground to add controls for the new `mergeDefaultsIntoFormData` option
  - In the process, moved the `Show Error List` component over one column, making it inline radio buttons rather than a select

# 5.21.2

## @rjsf/core

- Updated `SchemaField` to pass `required` flag to `_AnyOfField`/`_OneOfField`
- Updated `Form` to deal with null objects in `filterErrorsBasedOnSchema()`, fixing [#4306](https://github.com/rjsf-team/react-jsonschema-form/issues/4306)

## @rjsf/utils

- Updated `ErrorSchemaBuilder` to support adding, updating, and removing paths that are numbers, fixing [#4297](https://github.com/rjsf-team/react-jsonschema-form/issues/4297)
- Updated `retrieveSchema` to not merge `contains` properties in `allOf` schema lists, fixing [#2923](https://github.com/rjsf-team/react-jsonschema-form/issues/2923#issuecomment-1946034240)

## Dev / docs / playground

- Updated the `custom-widgets-fields.md` to add examples of wrapping a widget/field

# 5.21.1

## @rjsf/utils

- Revert of updating `deepEquals()` from [#4292]

## @validator-ajv8

- Revert of using `deepEquals()` instead of `lodash.isEqual()` from [#4292]

# 5.21.0

## @rjsf/core

- Updated `Form` to fix `focusOnError()` to support the ids that include dots, fixing [#4279](https://github.com/rjsf-team/react-jsonschema-form/issues/4279)

## @rjsf/mui

- Updated the peer dependencies for `@mui/material` and `@mui/icon-material`, fixing [4283](https://github.com/rjsf-team/react-jsonschema-form/issues/4283)

## @rjsf/utils

- Fixes an issue with dependencies computeDefaults to ensure we can get the dependencies defaults [#4271](https://github.com/rjsf-team/react-jsonschema-form/issues/4271)
- Updated `deepEquals()` to use `fast-equals.createCustomEqual()` instead of `lodash.isEqualWith()`, fixing [#4291](https://github.com/rjsf-team/react-jsonschema-form/issues/4291)
  - Switched uses of `lodash.isEqual()` to `deepEquals()` in many of the utility functions as well

## @validator-ajv8

- Use `@rjsf/utils` `deepEquals()` instead of `lodash.isEqual()` to improve performance, fixing [#4291](https://github.com/rjsf-team/react-jsonschema-form/issues/4291)

## Dev / docs / playground

- Updated the playground to use `@mui/*` version 6, changing the name of the dropdown from `material-ui-5` to `mui`

# 5.20.1

## Dev / docs / playground

- Updated the peer dependencies to `5.20.x` due to types and API changes in `@rjsf/utils`

# 5.20.0

## @rjsf/core

- Support allowing raising errors from within a custom Widget [#2718](https://github.com/rjsf-team/react-jsonschema-form/issues/2718)
- Updated `ArrayField`, `BooleanField` and `StringField` to call `optionsList()` with the additional `UiSchema` parameter, fixing [#4215](https://github.com/rjsf-team/react-jsonschema-form/issues/4215) and [#4260](https://github.com/rjsf-team/react-jsonschema-form/issues/4260)

## @rjsf/utils

- Updated the `WidgetProps` type to add `es?: ErrorSchema<T>, id?: string` to the params of the `onChange` handler function
- Updated `UIOptionsBaseType` to add the new `enumNames` prop to support an alternate way to provide labels for `enum`s in a schema, fixing [#4215](https://github.com/rjsf-team/react-jsonschema-form/issues/4215)
- Updated `optionsList()` to take an optional `uiSchema` that is used to extract alternate labels for `enum`s or `oneOf`/`anyOf` in a schema, fixing [#4215](https://github.com/rjsf-team/react-jsonschema-form/issues/4215) and [#4260](https://github.com/rjsf-team/react-jsonschema-form/issues/4260)
  - NOTE: The generics for `optionsList()` were expanded from `<S extends StrictRJSFSchema = RJSFSchema>` to `<S extends StrictRJSFSchema = RJSFSchema, T = any, F extends FormContextType = any>` to support the `UiSchema`.

## Dev / docs / playground

- Update the `custom-widget-fields.md` to add documentation for how to raise errors from a custom widget or field

# 5.19.4

## @rjsf/core

- Fix XSS when rendering schema validation errors [#4254](https://github.com/rjsf-team/react-jsonschema-form/issues/2718)
  - NOTE: This will have potential consequences if you are using the [translateString](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props/#translatestring) feature and are trying to render HTML. Switching to [Markdown](https://www.markdownguide.org/) will solve your problems.

## @rjsf/utils

- Updated the `ValidatorType` interface to add an optional `reset?: () => void` prop that can be implemented to reset a validator back to initial constructed state
  - Updated the `ParserValidator` to provide a `reset()` function that clears the schema map
- Also updated the default translatable string to use `Markdown` rather than HTML tags since we now render them with `Markdown`

## @rjsf/validator-ajv8

- Updated the `AJV8Validator` to implement the `reset()` function to remove cached schemas in the `ajv` instance

## Dev / docs / playground

- Updated the `Validator` dropdown to add `AJV8 (discriminator)` which sets the AJV validator [discriminator](https://ajv.js.org/json-schema.html#discriminator) option to `true` to support testing schemas with that option in them

# 5.19.3

## @rjsf/antd

- SelectWidget now displays an empty option when appropriate, fixing [#4197](https://github.com/rjsf-team/react-jsonschema-form/issues/4197)

## @rjsf/chakra-ui

- SelectWidget now displays an empty option when appropriate, fixing [#4197](https://github.com/rjsf-team/react-jsonschema-form/issues/4197)

## @rjsf/fluentui-rc

- SelectWidget now displays an empty option when appropriate, fixing [#4197](https://github.com/rjsf-team/react-jsonschema-form/issues/4197)

## @rjsf/material-ui

- SelectWidget now displays an empty option when appropriate, fixing [#4197](https://github.com/rjsf-team/react-jsonschema-form/issues/4197)

## @rjsf/mui

- SelectWidget now displays an empty option when appropriate, fixing [#4197](https://github.com/rjsf-team/react-jsonschema-form/issues/4197)

## @rjsf/semantic-ui

- SelectWidget now displays an empty option when appropriate, fixing [#4197](https://github.com/rjsf-team/react-jsonschema-form/issues/4197)

# 5.19.2

## @rjsf/core

- Removed `.only` on tests that was accidentally added in `5.19.0`

# 5.19.1

## Dev / docs / playground

- Bumped the peer dependencies to `5.19.x` due to use of new API in `5.19.0`

# 5.19.0

## @rjsf/antd

- Updated `AltDateWidget` to use the new `dateRangeOptions()` function in `utils` to support relative Years and reversing the order of the Year choices

## @rjsf/chakra-ui

- Updated `AltDateWidget` to use the new `dateRangeOptions()` function in `utils` to support relative Years and reversing the order of the Year choices

## @rjsf/core

- Fixed case where `readOnly` from a JSON Schema was not applied in SchemaField ([#4236](https://github.com/rjsf-team/react-jsonschema-form/issues/4236))
- Updated `AltDateWidget` to use the new `dateRangeOptions()` function in `utils` to support relative Years and reversing the order of the Year choices

## @rjsf/utils

- Added a new `dateRangeOptions()` function to implement relative Years in (via negative ranges) and reversing the order of the Year choices

## Dev / docs / playground

- Added documentation for the new `dateRangeOptions()` function as well as showing examples of using relative Years and reversed Year ordering

# 5.18.6

## @rjsf/antd

- Fix disabled property of options in CheckboxesWidget and RadioWidget ([#4216](https://github.com/rjsf-team/react-jsonschema-form/pull/4216))

## @rjsf/core

- Fixed `omitExtraData` not working in `onSubmit` and `validateForm`; fixing [#4187](https://github.com/rjsf-team/react-jsonschema-form/issues/4187), [#4165](https://github.com/rjsf-team/react-jsonschema-form/issues/4165) and [#4109](https://github.com/rjsf-team/react-jsonschema-form/issues/4109)

## @rjsf/utils

- Fix IdSchema and PathSchema types ([#4196](https://github.com/rjsf-team/react-jsonschema-form/pull/4196))

## @rjsf/validator-ajv6

- Fix IdSchema and PathSchema types ([#4196](https://github.com/rjsf-team/react-jsonschema-form/pull/4196))

## @rjsf/validator-ajv8

- Fix IdSchema and PathSchema types ([#4196](https://github.com/rjsf-team/react-jsonschema-form/pull/4196))

# 5.18.5

## @rjsf/antd

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/bootstrap4

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/chakra-ui

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/core

- Fix case where NumberField would not properly reset the field when using programmatic form reset (#4202)[https://github.com/rjsf-team/react-jsonschema-form/issues/4202]
- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers
- Fix field disable or readonly property can't cover globalOptions corresponding property (#4212)[https://github.com/rjsf-team/react-jsonschema-form/pull/4212]
- Added support for `default` values in `additionalProperties` in [#4199](https://github.com/rjsf-team/react-jsonschema-form/issues/4199), fixing [#3195](https://github.com/rjsf-team/react-jsonschema-form/issues/3915)

## @rjsf/fluent-ui

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/fluentui-rc

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/material-ui

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/mui

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/semantic-ui

- Updated widgets to handle undefined `target` in `onFocus` and `onBlur` handlers

## @rjsf/validator-ajv6

- Improved performance issues with large schema dependencies and oneOf conditions [#4203](https://github.com/rjsf-team/react-jsonschema-form/issues/4203).

## @rjsf/validator-ajv8

- Improved performance issues with large schema dependencies and oneOf conditions [#4203](https://github.com/rjsf-team/react-jsonschema-form/issues/4203).

# 5.18.4

## Dev / docs / playground

- Fixed typo in `constants.ts`, `Form.tsx`

# 5.18.3

## @rjsf/semantic-ui

- Added support for version 2 in the `peerDependencies`

## Dev / docs / playground

- Bumped devDependencies on `react` to `18.x`
- Fixed typo in `custom-widgets-fields.md` in the documentation
- Updated the `LICENSE.md` to include the proper copyright dates and owner

# 5.18.2

## @rjsf/core

- Fixed Programmatic submit not working properly in Firefox [#3121](https://github.com/rjsf-team/react-jsonschema-form/issues/3121)

## @rjsf/utils

- [#4116](https://github.com/rjsf-team/react-jsonschema-form/issues/4116) Fix Maximum call stack size exceeded when encountering circular definitions ([Link to PR](https://github.com/rjsf-team/react-jsonschema-form/pull/4123))

# 5.18.0

## @rjsf/antd

- Fix issue where the theme provided by the ConfigProvider under antd v5 wasn't respected thereby rendering the form items unusable under dark themes [#4129](https://github.com/rjsf-team/react-jsonschema-form/issues/4129)

## @rjsf/core

- Fix Error state not resetting when schema changes [#4079](https://github.com/rjsf-team/react-jsonschema-form/issues/4079)

## @rjsf/mui

- Fixed the `SelectWidget` and `BaseInputTemplate` to filter out `errorSchema` and `autocomplete` from the `textFieldProps` being spread onto the `TextField`, fixing [#4134](https://github.com/rjsf-team/react-jsonschema-form/issues/4134)

## @rjsf/utils

- Added a new `skipEmptyDefault` option in `emptyObjectFields`, fixing [#3880](https://github.com/rjsf-team/react-jsonschema-form/issues/3880)
- Added a new `computeSkipPopulate` option in `arrayMinItems`, allowing custom logic to skip populating arrays with default values, implementing [#4121](https://github.com/rjsf-team/react-jsonschema-form/pull/4121).
- Fixed bug where the string `"\</strong>"` would get printed next to filenames when uploading files, and restored intended bolding of filenames fixing [#4120](https://github.com/rjsf-team/react-jsonschema-form/issues/4120).

## Dev / docs / playground

- Updated the documentation to describe how to use the `skipEmptyDefault` option.
- Fixed missing import of `Form` in usage documentation - fixing [#4127](https://github.com/rjsf-team/react-jsonschema-form/issues/4127)

# 5.17.1

## @rjsf/chakra-ui

- Added support for `UiSchema` `"ui:rows"` option for `textarea` elements, fixing [#4070](https://github.com/rjsf-team/react-jsonschema-form/issues/4070).

## @rjsf/core

- [#4091](https://github.com/rjsf-team/react-jsonschema-form/issues/4091) Added `errorSchema` to `ArrayFieldTemplate` props.

## @rjsf/utils

- [#4080](https://github.com/rjsf-team/react-jsonschema-form/issues/4080) - BREAKING CHANGE: Removed the `base64` object from the `@rjsf/utils` package. Note that this is a breaking change if you relied on the `base64` object exported by `@rjsf/utils`. Since this change caused [#4080](https://github.com/rjsf-team/react-jsonschema-form/issues/4080), and was only internally used by playground code, we are shipping this change in a patch release.
- [#4091](https://github.com/rjsf-team/react-jsonschema-form/issues/4091) Added `errorSchema` to the `ArrayFieldTemplateProps` type.

## Dev / docs / playground

- [#4080](https://github.com/rjsf-team/react-jsonschema-form/issues/4080) - Moved the `base64` encoder/decoder object to the Playground package.
- Added test configuration and script to the Playground.

# 5.17.0

## @rjsf/core

- Added support for `anyOf`/`oneOf` in `uiSchema`s in the `MultiSchemaField`, fixing [#4039](https://github.com/rjsf-team/react-jsonschema-form/issues/4039)
- Fix potential XSS vulnerability in the preview button of FileWidget, fixing [#4057](https://github.com/rjsf-team/react-jsonschema-form/issues/4057)

## @rjsf/utils

- [#4024](https://github.com/rjsf-team/react-jsonschema-form/issues/4024) Added `base64` to support `encoding` and `decoding` using the `UTF-8` charset to support the characters out of the `Latin1` range.
- Updated `enumOptionsValueForIndex()` to fix issue that filtered enum options with a value that was 0, fixing [#4067](https://github.com/rjsf-team/react-jsonschema-form/issues/4067)
- Changes the way of parsing the data URL, to fix [#4057](https://github.com/rjsf-team/react-jsonschema-form/issues/4057)

## Dev / docs / playground

- [#4024](https://github.com/rjsf-team/react-jsonschema-form/issues/4024) Updated the base64 references from (`atob` and `btoa`) to invoke the functions from the new `base64` object in `@rjsf/utils`.
- Updated the `uiSchema.md` documentation to describe how to use the new `anyOf`/`oneOf` support

# 5.16.1

## Dev / docs / playground

- Bumped peer dependencies due to new utils function

# 5.16.0

## @rjsf/core

- Pass indexed title from array into its items, adding enhancement asked in [#3983](https://github.com/rjsf-team/react-jsonschema-form/issues/3983)
- Removed `dateElementProps` function implementation, and replaced it with `getDateElementProps` from `@rjsf/utils`.
- Modify submit method to make it a public method, fixing [#4015](https://github.com/rjsf-team/react-jsonschema-form/issues/4015)
- Support file deletion for `format: "data-url"` in `FileWidget`, fixing [#3957](https://github.com/rjsf-team/react-jsonschema-form/issues/3957).

## @rjsf/antd

- Removed `dateElementProps` function implementation, and replaced it with `getDateElementProps` from `@rjsf/utils`.

## @rjsf/chakra-ui

- Removed `dateElementProps` function implementation, and replaced it with `getDateElementProps` from `@rjsf/utils`.

## @rjsf/mui

- Updated the `FieldErrorTemplate` and `FieldHelpTemplate` to support html-based errors that cause `<xxxx> cannot appear as a descendant of <p>` browser warnings, fixing [#4031](https://github.com/rjsf-team/react-jsonschema-form/issues/4031)

## @rjsf/utils

- Added `getDateElementProps()` to refactor duplicate function in `core`, `antd` & `chakra-ui` AltDateWidget's source code. The same function, implements the feature requested in [#297](https://github.com/rjsf-team/react-jsonschema-form/issues/297)

## Dev / docs / playground

- Updated docs and playground with the implementation guide of newly added date re-order feature.

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

# 5.14.3

## @rjsf/core

- add `retrieveSchema` at `Form` state to memoize the result of `schemUtils.retrieveSchema`

## @rjsf/fluentui-rc

- Updated README.md references
- Fixed width of `ArrayFieldItemTemplate` items

## Dev

- update tsconfigs:
  - `"importHelpers": false` to remove need for tslib dependency [#3958](https://github.com/rjsf-team/react-jsonschema-form/issues/3958)
  - increase compilation target level from es6 to es2018 (so there are no need for transpiling object spread/rest feature)
  - add missing typescript project reference for `snapshot-tests` in a root tsconfig, update it to also use es modules

# 5.14.2

## @rjsf/antd

- Fixed the `peerDependencies` for `@ant-design/icons` to also support v5, fixing [#3507](https://github.com/rjsf-team/react-jsonschema-form/issues/3507)

## @rjsf/core

- avoid call `retrieveSchema` twice during `getStateFromProps` and `mustValidate` is true [#3959](https://github.com/rjsf-team/react-jsonschema-form/pull/3959)

## @rjsf/mui

- Resolve the React error caused by the propagation of the `hideError` property to the DOM element, fixing [#3945](https://github.com/rjsf-team/react-jsonschema-form/issues/3945)

## @rjsf/material-ui

- Resolve the React error caused by the propagation of the `hideError` property to the DOM element, fixing [#3945](https://github.com/rjsf-team/react-jsonschema-form/issues/3945)

## @rjsf/utils

- Update `sanitizeDataForNewSchema()` to avoid spreading strings and Arrays into the returned value when the old schema is of type `string` or `array` and the new schema is of type `object`. Fixing [#3922](https://github.com/rjsf-team/react-jsonschema-form/issues/3922)

# 5.14.1

## @rjsf/utils

- Update `sanitizeDataForNewSchema()` to avoid spreading strings and Arrays into the returned value when the old schema is of type `string` or `array` and the new schema is of type `object`. Fixing [#3922](https://github.com/rjsf-team/react-jsonschema-form/issues/3922)
- update types for `labelValue` to have more granular return types, fixing [#3946](https://github.com/rjsf-team/react-jsonschema-form/issues/3946)

## Dev / playground

- Added Fluent UI v9 (React Components) theme to playground
- Update Fluent UI v9 and playground project references
- Update eslint ignores to exclude new typescript build output folders

# 5.14.0

## @rjsf/fluentui-rc

- Added theme for Fluent UI v9 (React Components), fixing [#3659](https://github.com/rjsf-team/react-jsonschema-form/issues/3659)

## @rjsf/snapshot-tests

Move theme snapshot tests into separate package

## Dev / playground

- update configuration to use typescript project references, start type checking the tests

# 5.13.6

## @rjsf/core

- Updated `StringField` to pass `hideError` prop to `Widget` so that all fields are consistent. Missed this file in previous patch

# 5.13.5

## @rjsf/core

- Updated `StringField` and `BooleanField` to pass `hideError` prop to `Widget` so that all fields are consistent

# 5.13.4

## @rjsf/core

- Updated `SchemaField` to show errors for `anyOf`/`oneOf` when being rendered as select control, fixing [3908](https://github.com/rjsf-team/react-jsonschema-form/issues/3908)

# 5.13.3

## @rjsf/antd

- Fixed the `SelectWidget` so that filtering works by reworking how `options` are passed to the underlying `Select`

## @rjsf/core

- Replaced the deprecated `UNSAFE_componentWillReceiveProps()` method in the Form.tsx component with an improved solution utilizing the React lifecycle methods: `getSnapshotBeforeUpdate()` and `componentDidUpdate()`. Fixing [#1794](https://github.com/rjsf-team/react-jsonschema-form/issues/1794)
- Fixed the `ArrayField` implementation to never pass an undefined schema for fixed arrays to other methods, fixing [#3924](https://github.com/rjsf-team/react-jsonschema-form/issues/3924)
- Fixed a refresh issue in `getSnapshotBeforeUpdate()` caused by the fix for #1794, fixing [#3927](https://github.com/rjsf-team/react-jsonschema-form/issues/3927)

## @rjsf/utils

- Updated `toPathSchemaInternal()` util to generate correct path schemas for fixed arrays by picking up individual schemas in the `items` array, fixing [#3909](https://github.com/rjsf-team/react-jsonschema-form/issues/3909)

# 5.13.2

## @rjsf/utils

- Updated `resolveAnyOrOneOfSchemas()` to not take a `recurseList` anymore, and instead always pass an empty array down to `resolveAllReferences()`, fixing [#3902](https://github.com/rjsf-team/react-jsonschema-form/issues/3902)
  - Also updated `parseSchema()` and `resolveDependencies()` to no longer pass `recurseList` to `resolveAnyOrOneOfSchemas()`

## @rjsf/validator-ajv8

- Updated `AJV8PrecompiledValidator` to add a new `ensureSameRootSchema()` function that is called in both `rawValidation()` and `isValid()`
  - This function adds an optimization to avoid resolving the root schema unless necessary

# 5.13.1

## @rjsf/core

- Updated `ArrayField` to move errors in the errorSchema when the position of array items changes for the insert and copy cases.

## @rjsf/material-ui

- Removed an unnecessary `Grid` container component in the `ArrayFieldTemplate` component that wrapped the `ArrayFieldItemTemplate`, fixing [#3863](https://github.com/rjsf-team/react-jsonschema-form/issues/3863)
- Fixed an issue where `SelectWidget` switches from controlled to uncontrolled when `enumOptions` does not include a value, fixing [#3844](https://github.com/rjsf-team/react-jsonschema-form/issues/3844)

## @rjsf/mui

- Removed an unnecessary `Grid` container component in the `ArrayFieldTemplate` component that wrapped the `ArrayFieldItemTemplate`, fixing [#3863](https://github.com/rjsf-team/react-jsonschema-form/issues/3863)
- Fixed an issue where `SelectWidget` switches from controlled to uncontrolled when `enumOptions` does not include a value, fixing [#3844](https://github.com/rjsf-team/react-jsonschema-form/issues/3844)

## @rjsf/utils

- Added `getOptionMatchingSimpleDiscriminator()` function
- `getMatchingOption` and `getClosestMatchingOption` now bypass `validator.isValid()` calls when simple discriminator is provided, fixing [#3692](https://github.com/rjsf-team/react-jsonschema-form/issues/3692)
- Fix data type in `FieldTemplateProps['onChange']`
- Updated `retrieveSchema()` to properly resolve references inside of `properties` and array `items` while also dealing with recursive `$ref`s, fixing [#3761](https://github.com/rjsf-team/react-jsonschema-form/issues/3761)
  - Updated `schemaParser()` and `getClosestMatchingOption()` to pass the new `recursiveRef` parameter added to internal `retrieveSchema()` APIs
- Added/updated all the necessary tests to restore the `100%` test coverage that was lost when updating to Jest 29
  - Updated `getDefaultFormState()` to remove an unnecessary check for `formData` being an object since it is always guaranteed to be one, thereby allowing full testing coverage
- Updated `getSchemaType()` to return the first schema `type` when it is an array not containing `'null'`, fixing [#3875](https://github.com/rjsf-team/react-jsonschema-form/issues/3875)

## @rjsf/validator-ajv8

- Updated the `validator` and `precompiledValidator` tests to the restore `100%` coverage that was lost when updating to Jest 29
  - Updated `isValid()` for the `validator` commenting out an if condition that was preventing `100%` coverage, with a TODO to fix it later

## Dev / docs / playground

- Added the `@types/jest` as a global `devDependency` so that developer tools properly recognize the jest function types

# 5.13.0

## @rjsf/antd

- Bump Antd version from v4 to v5.
- Intentionally kept peer dependencies to v4 so that this change doesn't make breaking change for @rfjs/antd users.
- However, if users of @rjsf/antd want to use v5 styling, they need to wrap your application with the `StyleProvider` from `@ant-design/cssinjs`. They need not have to install this package, its a transitive package coming from antd.

```tsx
import { StyleProvider } from '@ant-design/cssinjs';

const Component = () => {
  return (
    <StyleProvider>
      <YourFormComponents />
    </StyleProvider>
  );
};
```

## @rjsf/core

- Updated `MultiSchemaField` to only merge top level required field fixing duplicate field and description.
- Fixed programmatic validation (`validateForm()`) removes previous errors if all data is now valid.

## @rjsf/chakra-ui

- Fixed a faulty check of the `isMultiple` option in `MultiSchemaField`. It no longer offers multiple choice inside a select field in a `oneOf` case in Chakra UI, fixing [#3848](https://github.com/rjsf-team/react-jsonschema-form/issues/3848)

## Dev / docs / playground

- Fixed custom validation playground example ([#3856](https://github.com/rjsf-team/react-jsonschema-form/issues/3856))

# 5.12.1

## @rjsf/validator-ajv8

- Updated `AJV8PrecompiledValidator.rawValidation()` to resolve root schema with formData when comparing input schema, fixing [#3825](https://github.com/rjsf-team/react-jsonschema-form/issues/3825)

## @rjsf/core

- Updated `MultiSchemaField` to merge all top level fields except properties for anyOf/oneOf options, fixing [#3808](https://github.com/rjsf-team/react-jsonschema-form/issues/3808) and [#3787](https://github.com/rjsf-team/react-jsonschema-form/issues/3787)

## @rjsf/antd

- Updated CheckboxesWidget to not show duplicate title, fixing [#3815](https://github.com/rjsf-team/react-jsonschema-form/issues/3815)

## @rjsf/utils

- Updated `retrieveSchemaInternal` allOf logic for precompiled schemas to resolve top level properties fixing [#3817](https://github.com/rjsf-team/react-jsonschema-form/issues/3817)

# 5.12.0

## @rjsf/utils

- Experimental feature:
  - Added `experimental_defaultFormStateBehavior = { arrayMinItems: { populate: 'never' } }` (feature [#3796](https://github.com/rjsf-team/react-jsonschema-form/issues/3796))

## @rjsf/validator-ajv8

- Exposing new function `compileSchemaValidatorsCode` to allow creating precompiled validator without a file. This is useful in case when precompiled validator is to be created dynamically. [#3793](https://github.com/rjsf-team/react-jsonschema-form/pull/3793)

## Dev / docs / playground

- update playground vite config to use sources directly, allowing to reload changes in it without additional build step
- moving from `dts-cli` to use individual dev tools directly, updating package publish config
  - tsc for generating type definitions and esm modules
  - esbuild for CJS bundle
  - rollup for UMD bundle
- Updated the `form-props` documentation `arrayMinItems`, added description for `never`.
- Updated the `playground` to add the option for the new `arrayMinItems.populate = 'never'`.

# 5.11.2

## @rjsf/material-ui

- Removed unnecessary import of old `@types/material-ui` which can cause typescript issues in some situations

## @rjsf/utils

- Updated the `resolveAllReferences()` function to use object spreading to update properties and items in a schema rather than directly modifying the schema to avoid issues with frozen object, fixing [#3805](https://github.com/rjsf-team/react-jsonschema-form/issues/3805)

# 5.11.1

## @rjsf/core

- Updated `SchemaField` to ignore errors for `anyOf`/`oneOf` parent schema, fixing [1295](https://github.com/rjsf-team/react-jsonschema-form/issues/1295)

## @rjsf/utils

- Created new `resolveAllReferences()` function to resolve all references within a schema's properties and array items.
- Updated `getClosestMatchingOption()` to use `resolveAllReferences()` for all oneOf/anyOf schemas
- Updated `resolveAnyOrOneOfSchemas()` to use `resolveAllReferences()` for all oneOf/anyOf schemas
- Better handle the `null` case in `withIdRefPrefix`, fixing [#3792](https://github.com/rjsf-team/react-jsonschema-form/pull/3792)

# 5.11.0

## @rjsf/core

- Updated `MultiSchemaField` to use `mergeSchema()` for merging in the remaining schema for `anyOf`/`oneOf`
- Added new `extraErrorsBlockSubmit` prop to `Form` that allows the extra asynchronous errors to block a form submit, fixing [#3757](https://github.com/rjsf-team/react-jsonschema-form/issues/3757)

## @rjsf/utils

- Updated `retrieveSchemaInternal()` to always resolve allOf schema without merging when `expandAllBranches` is set, fixing compiled schema issue always throwing error with `mergeAllOf`
- Updated `getDefaultFormState()` to use `mergeSchema()` for merging in the remaining schema for `anyOf`/`oneOf`
- Updated `retrieveSchema()` to use `mergeSchema()` for merging in the remaining schema for `anyOf`/`oneOf`

## Dev / docs / playground

- Switched to using npm workspaces for the sub-package hierarchy
  - NOTE: Developers may need to run the `npm run refresh-node-modules` script first to get the build and tests to work correctly
- Backfilled Docusaurus site with documentation for v3, v4

# 5.10.0

## @rjsf/core

- Updated `getFieldComponent()` to support rendering a custom component by given schema id ($id). [#3740](https://github.com/rjsf-team/react-jsonschema-form/pull/3740)
- Updated `MultiSchemaField` to merge the selected `oneOf/anyOf` value into base `schema`, fixing [#3744](https://github.com/rjsf-team/react-jsonschema-form/issues/3744)

## @rjsf/utils

- Updated `getClosestMatchingOption()` to resolve refs in options before computing the closest matching option, fixing an issue with using precompiled validators
  - Also, added support for nested `anyOf` and `discriminator` support in the recursive `calculateIndexScore()`
- Updated `getDefaultFormState()` to merge the remaining schema into `anyOf/oneOf` schema selected during the computation of values, fixing [#3744](https://github.com/rjsf-team/react-jsonschema-form/issues/3744)
- Updated `retrieveSchema()` to merge the remaining schema into the `anyOf/oneOf` schema selected during the resolving of dependencies, fixing [#3744](https://github.com/rjsf-team/react-jsonschema-form/issues/3744)

## Dev / docs / playground

- Updated the `custom-widgets-fields` documentation to add the new added behaviour of `getFieldComponent()` function. [#3740](https://github.com/rjsf-team/react-jsonschema-form/pull/3740)
- Updated the `playground` to add an example of the new added behaviour of `getFieldComponent()` function. [#3740](https://github.com/rjsf-team/react-jsonschema-form/pull/3740)

# 5.9.0

## @rjsf/utils

- Updated `getDefaultFormState()` to fix a bug where `experimental_defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' }` wasn't working for object properties with `$ref`s
- Experimental feature **breaking change**:
  - Updated the `experimental_defaultFormStateBehavior.arrayMinItems` from simple flag to an object containing two optional fields, `populate` and `mergeExtraDefaults`
    - The new `arrayMinItems.mergeExtraDefaults` flag, when "true", allows users to merge defaults onto the end of `formData` arrays when `minItems` is specified
  - If you were previously passing `experimental_defaultFormStateBehavior` as `{ arrayMinItems = 'requiredOnly }` on the `Form`, now you would pass `{ arrayMinItems: { populate: 'requiredOnly' } }`
- Added a new, optional `mergeExtraArrayDefaults=false` flag to the `mergeDefaultWithFormData()` utility function to support the new `arrayMinItems.mergeExtraDefaults` experimental feature

## Dev / docs / playground

- Updated the `utility-functions` documentation to add the new `mergeExtraArrayDefaults` flag for the `mergeDefaultWithFormData()` function
- Updated the `form-props` documentation to update the `arrayMinItems` documentation for the new object behavior
- Updated the `playground` to add a checkbox for the new `arrayMinItems.mergeExtraDefaults` flag

# 5.8.2

## @rjsf/validator-ajv8

- Explicitly cache schemas by their hash when checking data is valid to avoid multiple compilations for schemas without IDs leading to poor performance [#3721](https://github.com/rjsf-team/react-jsonschema-form/pull/3721)

# 5.8.1

## Dev / docs / playground

- Updated peer dependencies in all packages to `^5.8.x`

# 5.8.0

## @rjsf/bootstrap-4

- Updated FieldTemplate Component to display description from SchemaField and make it consistent for all the available themes

## @rjsf/chakra-ui

- Updated FieldTemplate Component to display description from SchemaField and make it consistent for all the available themes

## @rjsf/core

- Updated SchemaField to be able to render markdown in the description field
- Updated `MultiSchemaField.getMatchingOption` to use option index from `getClosestMatchingOption`, fixing [#3693](https://github.com/rjsf-team/react-jsonschema-form/issues/3693) and
  [#3705](https://github.com/rjsf-team/react-jsonschema-form/issues/3705)

## @rjsf/fluent-ui

- Updated FieldTemplate Component to display description from SchemaField and make it consistent for all the available themes

## @rjsf/material-ui

- Updated FieldTemplate Component to display description from SchemaField and make it consistent for all the available themes

## @rjsf/mui

- Updated FieldTemplate Component to display description from SchemaField and make it consistent for all the available themes

## @rjsf/semantic-ui

- Updated FieldTemplate Component to display description from SchemaField and make it consistent for all the available themes

## @rjsf/utils

- Updated `getClosestMatchingOption` to return selected option if all options score the same, fixing [#3693](https://github.com/rjsf-team/react-jsonschema-form/issues/3693) and [#3705](https://github.com/rjsf-team/react-jsonschema-form/issues/3705)
- Updated `resolveCondition` to default formData as empty object when evaluating if expression, fixing [#3706](https://github.com/rjsf-team/react-jsonschema-form/issues/3706)
- Updated `retrieveSchemaInternal` to return failed merged allOf sub schemas for expandAllBranches flag, fixing [#3689](https://github.com/rjsf-team/react-jsonschema-form/issues/3700)
- Updated `hashForSchema` to sort schema fields in consistent order before stringify to prevent different hash ids for the same schema
- Updated `enumOptionsSelectValue` to allow picking falsy enumOptions, fixing [#3716](https://github.com/rjsf-team/react-jsonschema-form/issues/3716)

## @rjsf/validator-ajv8

- Updated `AJV8PrecompiledValidator.rawValidation()` to use resolve root schema when comparing input schema, fixing [#3708](https://github.com/rjsf-team/react-jsonschema-form/issues/3708)

## Dev / docs / playground

- Updated sample data and documentation about the markdown in `RJSFSchema` description
- Fixed broken playground examples ([#3696](https://github.com/rjsf-team/react-jsonschema-form/issues/3696))
- Added experimental_defaultFormStateBehavior.emptyObjectFields control to Playground
- Fixed bug where subthemes would not appear in Playground

# 5.7.3

## @rjsf/utils

- Updated `getClosestMatchingOption` `JUNK_OPTION` schema with a well known $id
- Updated `schemaParser` to resolve array items field, fixing [#3689](https://github.com/rjsf-team/react-jsonschema-form/issues/3689)

## @rjsf/validator-ajv8

- Updated `AJV8PrecompiledValidator.isValid()` to return false for junk schema option, fixing [#3677](https://github.com/rjsf-team/react-jsonschema-form/issues/3677)

# 5.7.2

## @rjsf/validator-ajv8

- Removed the importing of internal `ajv` types by simplifying the `CompiledValidateFunction` type to avoid a bunch of Typescript errors encountered by users of the package

# 5.7.1

## @rjsf/validator-ajv8

- Updated the build for all but the `cjs` development version, to not export the `compileSchemaValidators()` function to avoid "Module not found: Can't resolve 'fs' error" issues, fixing [#3668](https://github.com/rjsf-team/react-jsonschema-form/issues/3668)

## @rjsf/core

- Added protection against a null `field` in the `focusOnError` method in `Form`

## Dev / docs / playground

- Updated the `validation` documentation to add a note with a web-resource to help folks work around the "Module not found: Can't resolve 'fs' error" issue for development environments
- Updated all of the `package-lock.json` files to bump peer-dependencies to `5.7.x`, fixing [#3669](https://github.com/rjsf-team/react-jsonschema-form/issues/3669)

# 5.7.0

## @rjsf/antd

- Fix [#3608](https://github.com/rjsf-team/react-jsonschema-form/issues/3608) by ensuring the root field is always wrapped in Form.Item
- Fix [#3594](https://github.com/rjsf-team/react-jsonschema-form/issues/3594) by removing the duplicate title for `SelectWidget` and description for `CheckboxWidget`

## @rjsf/core

- Updated the `MultiSchemaField` to use the new `getDiscriminatorFieldFromSchema()` API
- Added new `experimental_defaultFormStateBehavior` prop to `Form`
  - to specify alternate behavior when dealing with the rendering of array fields where `minItems` is set but field is not `required` (fixes [#3363](https://github.com/rjsf-team/react-jsonschema-form/issues/3363)) ([#3602](https://github.com/rjsf-team/react-jsonschema-form/issues/3602))
  - to handle setting object defaults based on the value of `emptyObjectFields` supporting required fields only and skipping defaults entirely, fixing [#2980](https://github.com/rjsf-team/react-jsonschema-form/issues/2980)
- Fixed regression [#3650](https://github.com/rjsf-team/react-jsonschema-form/issues/3650) in `FileWidget` to again support adding multiple files to arrays

## @rjsf/fluent-ui

- Added support for `additionalProperties` to fluent-ui theme, fixing [#2777](https://github.com/rjsf-team/react-jsonschema-form/issues/2777).
- Upgraded to `8.x` version of `@fluentui/react` maintaining backwards compatibility to version 7, fixing [#3463](https://github.com/rjsf-team/react-jsonschema-form/issues/3463)

## @rjsf/utils

- Added two new APIs `getDiscriminatorFieldFromSchema()` (a refactor of code from `MultiSchemaField`) and `hashForSchema()`
  - Updated `getDefaultFormState()` and `toPathSchema()` to use `getDiscriminatorFieldFromSchema()` to provide a discriminator field to `getClosestMatchingOption()` calls.
- Refactored the `retrieveSchema()` internal API functions to support implementing an internal `schemaParser()` API for use in precompiling schemas, in support of [#3543](https://github.com/rjsf-team/react-jsonschema-form/issues/3543)
- Fixed `toPathSchema()` to handle `properties` in an object along with `anyOf`/`oneOf`, fixing [#3628](https://github.com/rjsf-team/react-jsonschema-form/issues/3628) and [#1628](https://github.com/rjsf-team/react-jsonschema-form/issues/1628)
- Refactored optional parameters for `computeDefaults()` into destructured props object to reduce clutter when only specifying later of the optional argument, fixing [#3602](https://github.com/rjsf-team/react-jsonschema-form/issues/3602)
- Fixed `computeDefaults()` to handle `$ref` in an object along with `anyOf`/`oneOf`, fixing [#3633](https://github.com/rjsf-team/react-jsonschema-form/issues/3633)

## @rjsf/validator-ajv8

- Added two new APIs `compileSchemaValidators()` and `createPrecompiledValidator()` implemented to support using precompiled validators build with AJV 8, fixing [#3543](https://github.com/rjsf-team/react-jsonschema-form/issues/3543)

## Dev / docs / playground

- Added documentation to `custom-templates` describing how to extend the `BaseInputTemplate`
- Added **minItems behavior for array field** live setting, fixing [#3602](https://github.com/rjsf-team/react-jsonschema-form/issues/3602)
- Upgraded playground to `8.x` version of `@fluentui/react`, fixing [#3463](https://github.com/rjsf-team/react-jsonschema-form/issues/3463)
- Added documentation to `validation` describing the new precompiled validators feature
- Added new `validator-ajv8.md` documentation to the `api-reference` directory as well as putting it into the `sidebar.js`

# 5.6.2

## Dev / docs / playground

- Fixed issues with `post-versioning` that caused the 5.6.1 branch to not be publishable

# 5.6.1

## Dev / docs / playground

- Updated the `contributing` documentation to improve the `Releasing` section to include a new `npm run post-versioning` step
  - Implemented a new `bump-peer-deps.js` script to help implement the new scripts included in the `post-versioning` step

# 5.6.0

## @rjsf/antd

- Treat multiple as a boolean rather than comparing against `undefined` in the `SelectWidget`, fixing [#3595](https://github.com/rjsf-team/react-jsonschema-form/issues/3595)

## @rjsf/core

- Switched `Form` to use the new `validatorDataMerge()` and `toErrorList()` functions instead of the now deprecated `schemaUtils.mergeValidatorData()` and `schemaUtils.getValidator().toErrorList()`
- Added option to provide a callback function to `focusOnFirstError` ([3590](https://github.com/rjsf-team/react-jsonschema-form/pull/3590))
- Updated `MultiSchemaField` to handle the OpenAPI `discriminator` extension on `anyOf/oneOf` fields by passing it into `getClosestMatchingOption()` if it exists, fixing [#3512](https://github.com/rjsf-team/react-jsonschema-form/issues/3512)
- Updated `SchemaField` function to use `getSchemaType` rather than `schema.type` to set the proper class name.

## @rjsf/utils

- Refactored the `createErrorHandler()`, `toErrorList()`, `toErrorSchema()` and `unwrapErrorHandler()` functions from the `@rjsf/validator-ajv6` and `@rjsf/validator-ajv8` implementations since they were identical
  - As a result, the `mergeValidationData()` function was deprecated in favor of the new `validationDataMerge()` function that uses the refactored `toErrorList()` function
  - Refactored the `ROOT_SCHEMA_PREFIX` constant as well
- Updated `ValidatorType` and `SchemaUtilsType` to deprecate the `toErrorList()` and `mergeValidationData()` functions, respectively
- Updated the `getClosestMatchingOption()` and `getFirstMatchingOption()` to pass the new `discriminatorField` to the `getMatchingOption()` function
- Updated `getMatchingOption()` to use `discriminatorField` when it is present in the `options` object properties to drill into the object to detect if that one field is valid
- Updated `SchemaUtilsType` and the associated forward functions in `createSchemaUtils` to add the new `discriminatorField?: string` optional parameter
- Updated `toIdSchema()` function to use `getSchemaType(schema) === 'object'` rather than `schema.type === 'object'` to get the proper pathing for ids, fixing [#2044](https://github.com/rjsf-team/react-jsonschema-form/issues/2044)

## @rjsf/validator-ajv6

- Removed the refactored functions and constant from the `AJV6Validator` in favor of using the new functions and constant from `@rjsf/utils`

## @rjsf/validator-ajv8

- Removed the refactored functions and constant from the `AJV8Validator` in favor of using the new functions and constant from `@rjsf/utils`

## Dev / docs / playground

- Updated the `utility-functions` documentation to describe the new refactored functions as well as deprecating the `mergeValidationData()` function
- Updated the `playground` to properly restore `liveSettings` from shared links and added a switch for `noHtml5Validation` in the live settings rather than having it set to `true` always
  - Also added a new `Blank` example to help users easily paste their code

# 5.5.2

## @rjsf/material-ui

- Switched to using `TextField` for the `WrapIfAdditionalTemplate` label key input to match the `@rjsf/mui` fix

## @rjsf/mui

- Switched to using `TextField` for the `WrapIfAdditionalTemplate` label key input, fixing [#3578](https://github.com/rjsf-team/react-jsonschema-form/issues/3578)

## Dev / docs / playground

- Updated the `templates` passed into the main `Form` to not include undefined values, fixing [#3576](https://github.com/rjsf-team/react-jsonschema-form/issues/3576) and [#3579](https://github.com/rjsf-team/react-jsonschema-form/issues/3579)

# 5.5.1

## @rjsf/core

- Updated `Form` to include the top `disabled` property in the `ui:submitButtonOptions` so the submit button will be disabled when the whole form is disabled. Fixes [#3264](https://github.com/rjsf-team/react-jsonschema-form/issues/3264).

## @rjsf/utils

- Added protections against infinite recursion of `$ref`s for the `toIdSchema()`, `toPathSchema()` and `getDefaultFormState()` functions, fixing [#3560](https://github.com/rjsf-team/react-jsonschema-form/issues/3560)
- Updated `getDefaultFormState()` to handle object-based `additionalProperties` with defaults using `formData` in addition to values contained in a `default` object, fixing [#2593](https://github.com/rjsf-team/react-jsonschema-form/issues/2593)
- Updated internal helper `withExactlyOneSubschema()` inside of `retrieveSchema()` to use the `isValid()` function rather than `validateFormData()` when determining the one-of branch

## Dev / docs / playground

- Refactored some parts of `playground` to make it cleaner
  - This includes fixing the spelling of the `disabled` flag being passed into the `Form` from the incorrect `disable` spelling
- Formatted the entire monorepo which included 6 unformatted files outside of `playground`
- Removed `react-app-polyfill` package from `playgound`. This ends IE11 support
- Fix a handful of broken docs links, fixing [#3553](https://github.com/rjsf-team/react-jsonschema-form/issues/3553)

# 5.5.0

## @rjsf/antd

- Updated tests to use centralized snapshots from `core`

## @rjsf/bootstrap-4

- Updated tests to use centralized snapshots from `core`

## @rjsf/chakra-ui

- Updated tests to use centralized snapshots from `core`

## @rjsf/core

- Updated `FileWidget` to pass false for `required` once a value has been specified, fixing [#3504](https://github.com/rjsf-team/react-jsonschema-form/issues/3504)
- Updated `ObjectField` to pass the `errorSchema` to the `ObjectFieldTemplate` to allow custom templates access to the errors
- Centralized snapshot tests from each theme into `core`, adding snapshots tests for `core` as well

## @rjsf/fluent-ui

- Updated tests to use centralized snapshots from `core`

## @rjsf/material-ui

- Updated tests to use centralized snapshots from `core`

## @rjsf/mui

- Updated tests to use centralized snapshots from `core`

## @rjsf/semantic-ui

- Updated tests to use centralized snapshots from `core`

## @rjsf/utils

- Added `errorSchema` as an optional prop on `ObjectFieldTemplateProps`

## Dev / docs / playground

- Converted the `playground` to use Typescript, including some refactoring of code to make that job easier
- Updated the `custom-templates` documentation to add `errorSchema` to the props for `ObjectFieldTemplate`

# 5.4.0

## @rjsf/antd

- Added the ability to use a tooltip for a description
- Updated `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)
- Updated `CheckboxesWidget` and `SelectWidget` to show the `label` using the `TitleFieldTemplate`, fixing [#2134](https://github.com/rjsf-team/react-jsonschema-form/issues/2134)

## @rjsf/bootstrap-4

- Updated `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)
- Updated `RangeWidget` to fix the label hiding bug using `labelValue()`

## @rjsf/chakra-ui

- Fix: MUI radio widget initializes as uncontrolled when schema has no default value, fixing [#3511](https://github.com/rjsf-team/react-jsonschema-form/issues/3511)
- Updated `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget` and `SelectWidget` to hide labels when `hideLabel` is true using the new `labelValue()` helper (including globally)
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)

## @rjsf/core

- Updated `FileWidget` to show a preview of images and a download link for non-images when the `filePreview` options is set to true in the `UiSchema`
- Updated `ArrayField`, `BooleanField`, `MultiSelectField` and `StringField` to pass `label` (read from `uiSchema.title` || `schema.title` || `name`) and `hideLabel` down to all of the `Widgets` they render, fixing [#827](https://github.com/rjsf-team/react-jsonschema-form/issues/827), [#2636](https://github.com/rjsf-team/react-jsonschema-form/issues/2636), [#2399](https://github.com/rjsf-team/react-jsonschema-form/issues/2399) and [#3531](https://github.com/rjsf-team/react-jsonschema-form/issues/3531)
- Updated `ObjectField`, `ObjectFieldTemplate`, `ArrayFieldDescriptionTemplate`, `ArrayFieldTitleTemplate` and `CheckboxWidget` to hide the titles and descriptions when `hideLabel` is true using the new `labelValue()` helper (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `CheckboxWidget` to use the `labelValue()` function for hiding labels

## @rjsf/fluent-ui

- Updated `FieldTemplate` and `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `ColorWidget`, `DateWidget`, `RadioWidget`, `RangeWidget`, `SelectWidget` and `UpDownWidget` to hide labels when `hideLabel` is true using the new `labelValue()` helper (including globally)
  - Also extracted a new `FluentLabel` component out of `CheckboxesWidget`, `ColorWidget`, `RangeWidget` and `UpDownWidget`
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)

## @rjsf/material-ui

- Fix: MUI radio widget initializes as uncontrolled when schema has no default value, fixing [#3511](https://github.com/rjsf-team/react-jsonschema-form/issues/3511)
- Updated `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `RangeWidget` and `SelectWidget` to hide labels when `hideLabel` is true using the new `labelValue()` helper (including globally)
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)

## @rjsf/mui

- Fix: MUI radio widget initializes as uncontrolled when schema has no default value, fixing [#3511](https://github.com/rjsf-team/react-jsonschema-form/issues/3511)
- Updated `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `RadioWidget`, `RangeWidget` and `SelectWidget` to hide labels when `hideLabel` is true using the new `labelValue()` helper (including globally)
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)

## @rjsf/semantic-ui

-
- Updated `ObjectFieldTemplate` to hide the titles and descriptions when `displayLabel` is true (including globally), fixing [#3231](https://github.com/rjsf-team/react-jsonschema-form/issues/3231)
- Updated `BaseInputTemplate`, `CheckboxesWidget`, `CheckboxWidget`, `SelectWidget` and `TextareaWidget` to hide labels when `hideLabel` is true using the new `labelValue()` helper (including globally)
- Updated `CheckboxWidget` to show the `description` using the `DescriptionFieldTemplate`, fixing [#2791](https://github.com/rjsf-team/react-jsonschema-form/issues/2791)

## @rjsf/utils

- Updated the `UiSchema` to support the optional `filePreview?: boolean` option and to add a new `TranslatableString.PreviewLabel` to the `enums`
- Updated the `WidgetProps` to add an optional `hideLabel?: boolean` field to better support hiding labels
- Added a new `labelValue()` helper function to better support hiding labels

## @rjsf/validator-ajv8

- Improve `toErrorList()` and `unwrapErrorHandler()` by ensuring objects before recursing

## Dev / docs / playground

- Added a new `AntD Customization` documentation with references to it in the `form-props` and `uiSchema` documentation
- Updated the `uiSchema` documentation to add the `filePreview` option
- Updated the `widgets` documentation to add the new, optional `hideLabel` prop
- Updated the `utility-functions` documentation to add the new `labelValue()` function

# 5.3.1

## @rjsf/core

- Updated `AltDateWidget` to remove an infinite loop caused by two conflicting effects by merging them with additional checking of original `value` against the current value, fixing [#3516](https://github.com/rjsf-team/react-jsonschema-form/issues/3516)

## @rjsf/utils

- Updated the documentation of `getTestValidator()` and the `schema.test.ts` file to help developers

## @rjsf/validator-ajv6

- Updated the documentation of `getTestValidator()` and the `schema.test.ts` file to help developers

## @rjsf/validator-ajv8

- Updated the documentation of `getTestValidator()` and the `schema.test.ts` file to help developers

## Dev / docs / playground

- Updated the `internals` documentation to use a React ref in the example, fixing [#3520](https://github.com/rjsf-team/react-jsonschema-form/issues/3520)
- Updated the `contributing` documentation to describe the new development process needed for a `Vite` playground, fixing [#3478](https://github.com/rjsf-team/react-jsonschema-form/issues/3478)
  - Also fixed the `package.json` files to remove `npm start` in the subdirectories and change the root one to describe the new process
- Updated the `semantic-ui/uiSchema` documentation to switch the default for `horizontalButtons` to be true per changes made in `5.3.0`

# 5.3.0

## @rjsf/antd

- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)
- Fixed `package.json` to properly add required dependencies explicitly which were installed implicitly

## @rjsf/bootstrap-4

- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)

## @rjsf/chakra-ui

- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)

## @rjsf/core

- `Reset` function added for `Programmatically Reset` action. `Reset` function will reset form data and validation errors. Form data will set to default values.
- Implemented a new `TimeWidget` that works for all themes
- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)
- Also added the missing translation for the `InvalidObjectField` error in `ObjectField`
- Added support for the handling of the global UiSchema options in `Form`, `ArrayField`, `ObjectField` and `SchemaField`

## @rjsf/fluent-ui

- Fix `RadioWidget`'s onChange return value.
- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)

## @rjsf/material-ui

- Updated `BaseInputTemplate` so that it shrinks a `time` formatted input
- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)

## @rjsf/mui

- Updated `BaseInputTemplate` so that it shrinks a `time` formatted input
- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)

## @rjsf/semantic-ui

- Added support to make a copy of an array item directly after the item selected to be copied (feature is off by default), fixing [#1261](https://github.com/rjsf-team/react-jsonschema-form/issues/1261) and [#1712](https://github.com/rjsf-team/react-jsonschema-form/issues/1712)

## @rjsf/utils

- Updated the widget matrix used by `getWidget()` to support the `time` to `TimeWidget` mapping
- Added a new `TranslatableString` enums `CopyButton` and `InvalidObjectField` that localizes the information extracted from `ObjectField` as markdown
- Updated the `ArrayFieldTemplateItemType` to add support for copying array items
- Refactored `UIOptionsBaseType` to extract the `addable`, `orderable`, `removable`, `label` and `duplicateKeySuffixSeparator` into a new `GlobalUISchemaOptions` type that adds `copyable`
  - Extended `UIOptionsBaseType` from `GlobalUISchemaOptions`
  - In `UiSchema` added a new optional `ui:globalOptions` prop of type `GlobalUISchemaOptions` and a new `UI_GLOBAL_OPTIONS_KEY` constant
  - Added a new optional prop `globalUiOptions` object of type `GlobalUISchemaOptions` in `Registry` as well as `CopyButton` in `ButtonTemplates`
- Updated `getUiOptions()` and `getDisplayLabel()` (and its `SchemaUtilsType` counterpart) to take an optional `GlobalUISchemaOptions` parameter that is used to include global options into the returned `uiOptions`

## Dev / docs / playground

- Updated the playground to add a `Programmatically Reset` button to clear states which are form data and validation errors.
- Updated the `Date & time` example to show off the new `TimeWidget`.
- Updated the `custom-widgets-fields` and `widgets` documentation to mention the new `TimeWidget` and its support for the `time` format.
- Updated the documentation for `custom-templates`, `internals`, `uiSchema`, `utility-functions` and `arrays` for the new copy array feature as well as the global UI Schema options support
- Updated the `arrays` example to add examples for the new `copyable` feature

# 5.2.1

## @rjsf/antd

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget`
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/bootstrap-4

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget`, deleting the theme's `FileWidget`, fixing [#2095](https://github.com/rjsf-team/react-jsonschema-form/issues/2095)
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/chakra-ui

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget`
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/core

- Ensure that `name` is consistently passed to all `Widgets` through the field components, fixing [#1763](https://github.com/rjsf-team/react-jsonschema-form/issues/1763)
- Updated the `FileWidget` to render the input using the `BaseInputTemplate` passing a special `onChangeOverride` function to deal with the file events, fixing [#2095](https://github.com/rjsf-team/react-jsonschema-form/issues/2095)
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/fluent-ui

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget`
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/material-ui

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget` and to support automatically shrinking the label for the `date`, `datetime-local` and `file` types
  - Removed the `DateWidget` and `DateTimeWidget` since they were only created to provide the label shrinking property
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/mui

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget` and to support automatically shrinking the label for the `date`, `datetime-local` and `file` types
  - Removed the `DateWidget` and `DateTimeWidget` since they were only created to provide the label shrinking property
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/semantic-ui

- Updated `BaseInputTemplate` to favor the special `onChangeOverride` provided by the `core` `FileWidget`
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## @rjsf/utils

- Added the `name` prop to the `WidgetProps` type, fixing [#1763](https://github.com/rjsf-team/react-jsonschema-form/issues/1763)
- Fixed `dataURItoBlob()` to handle the exception thrown by `atob()` when it is passed a malformed URL, returning an `blob` that indicates the error in the `type` prop
- Fixed `replaceStringParameters()` to improve the replaceable parameters logic so that it works properly when a parameter also contains a replaceable parameter identifier
- Removed explicit import of `React`, switching imports to explicit ones after fixing linting rules to not require `React` for JSX

## Dev / docs / playground

- Updated the `custom-widgets-fields` documentation to ensure the new `WidgetProps` `name` prop is documented
- Added Algolia DocSearch to the documentation site

# 5.2.0

## @rjsf/antd

- Updated `ErrorList`, `IconButton`s, `WrapIfAdditionalTemplate` and `AltDateWidget` to use the new `translateString()` function to support localization

## @rjsf/bootstrap-4

- Updated `AddButton`, `ErrorList`, `IconButton`s and `WrapIfAdditionalTemplate` to use the new `translateString()` function to support localization

## @rjsf/chakra-ui

- Updated `AddButton`, `ErrorList`, `IconButton`s, `WrapIfAdditionalTemplate` and `AltDateWidget` to use the new `translateString()` function to support localization

## @rjsf/core

- Updated `ArrayField`, `BooleanField`, `MultiSchemaField`, `ObjectField`, `SchemaField`, `AddButton`, `IconButton`s, `ErrorList`, `WrapIfAdditionalTemplate` and `AltDateWidget` and `FileWidget` to use the new `translateString()` function to support localization
  - Also updated `Form` to take a new optional `translateString` prop and `getDefaultRegistry()` to set `translateString` to `englishStringTranslator()`

## @rjsf/fluent-ui

- Updated `AddButton`, `ColorWidget`, `ErrorList`, `IconButton`s and `UpDownWidget` to use the new `translateString()` function to support localization

## @rjsf/material-ui

- Updated `AddButton`, `ErrorList`, `IconButton`s and `WrapIfAdditionalTemplate` to use the new `translateString()` function to support localization
- Patch `RangeWidget` to support `0` as range slider value, fixing [#3458](https://github.com/rjsf-team/react-jsonschema-form/issues/3458)

## @rjsf/mui

- Updated `AddButton`, `ErrorList`, `IconButton`s and `WrapIfAdditionalTemplate` to use the new `translateString()` function to support localization
- Patch `RangeWidget` to support `0` as range slider value, fixing [#3458](https://github.com/rjsf-team/react-jsonschema-form/issues/3458)

## @rjsf/semantic-ui

- Updated `AddButton`, `ErrorList`, `IconButton`s and `WrapIfAdditionalTemplate` to use the new `translateString()` function to support localization

## Dev / docs / playground

- Updated the `utility-functions` documentation for the `enums` and `englishStringTranslator()` & `replaceStringParameters()` functions
- Updated the `form-props` documentation for the new, optional `translateString` prop on `Form`
- Updated the playground's `numbers` example to use a range slider with a valid negative and `0` value

# 5.1.0

## @rjsf/bootstrap-4

- Updated the `AltDateTimeWidget` in `@rjsf/core` to add `className="list-inline-item"` to the `LI` tags

## @rjsf/chakra-ui

- Fixed the `SelectWidget` to allow the proper display of the selected value, fixing [#3422](https://github.com/rjsf-team/react-jsonschema-form/issues/3422)

## @rjsf/core

- Fixed `Form` to remove passing `excludeObjectChildren` to `getDefaultFormState()`, fixing [#3424](https://github.com/rjsf-team/react-jsonschema-form/issues/3424) and [#675](https://github.com/rjsf-team/react-jsonschema-form/issues/675)
- Added new feature prop `focusOnFirstError`, that if true, will cause the first field with an error to be focused on when a submit has errors

## @rjsf/utils

- Updated `computeDefaults()` to fix additionalProperties defaults not being propagated, fixing [#2593](https://github.com/rjsf-team/react-jsonschema-form/issues/2593)
  - Also made sure to properly deal with empty `anyOf`/`oneOf` lists by simply returning undefined
  - Add support for adding an empty object when that object is marked as required in a schema

## Dev / docs / playground

- Updated the playground to add a control for `focusOnFirstError` and the `form-props` documentation for it as well

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
- Updated `AJV8Validator#transformRJSFValidationErrors` to return more human-readable error messages. The ajv8 `ErrorObject` message is enhanced by replacing the error message field with either the `uiSchema`'s `ui:title` field if one exists or the `parentSchema` title if one exists. Fixes [#3246](https://github.com/rjsf-team/react-jsonschema-form/issues/3246)

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

- Support for localization (L10n) on a customized validator using a `Localizer` function passed as a second parameter to `customizeValidator()`, fixing (https://github.com/rjsf-team/react-jsonschema-form/pull/846, and https://github.com/rjsf-team/react-jsonschema-form/issues/1195)
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

- fix typo by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2854
- Build all packages with TypeScript, including core by @nickgros in https://github.com/rjsf-team/react-jsonschema-form/pull/2799
- fix(@rjsf/chakra-ui): append SubmitButton by @terrierscript in https://github.com/rjsf-team/react-jsonschema-form/pull/2860
- fix: Pass uiSchema to custom ArrayField by @bakajvo in https://github.com/rjsf-team/react-jsonschema-form/pull/2769
- fix(@rjsf-antd): Submit button type bug (#2867) by @sarpere in https://github.com/rjsf-team/react-jsonschema-form/pull/2869
- Docs: Clarify registry object structure and that it's passed down to custom widgets by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2886
- fix: allow UISchemaSubmitButtonOptions properties to be undefined by @maxpou in https://github.com/rjsf-team/react-jsonschema-form/pull/2876
- Create FUNDING.yml by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2866
- docs: fix schema dependencies link by @epicfaace in https://github.com/rjsf-team/react-jsonschema-form/pull/2885
- chore(deps): bump core-js-pure from 3.21.1 to 3.23.3 by @dependabot in https://github.com/rjsf-team/react-jsonschema-form/pull/2902
- chore(deps): bump minimist from 1.2.5 to 1.2.6 in /packages/fluent-ui by @dependabot in https://github.com/rjsf-team/react-jsonschema-form/pull/2805
- fix(@rjsf/bootstrap-4): Change custom attribute to bsPrefix by @WillowP in https://github.com/rjsf-team/react-jsonschema-form/pull/3049

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
- fixed an issue where all semantic props overwritten when a single [semantic theme-specific prop](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/themes/semantic-ui/uiSchema/) is passed in ([issue 2619](https://github.com/rjsf-team/react-jsonschema-form/issues/2619)) (https://github.com/rjsf-team/react-jsonschema-form/pull/2590)

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

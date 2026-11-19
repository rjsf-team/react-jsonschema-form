---
title: What's new in v7
sidebar_label: What's new in v7
description: The main features react-jsonschema-form v7 adds, with links to their documentation
---

This page lists the main features v7 adds for a v6 user, each with a link to its documentation. The breaking changes and the steps to upgrade are in the [7.x upgrade guide](./v7.x%20upgrade%20guide.mdx).

## Working with form data

- A React Server Component, such as a Next.js App Router page, can import and render `Form` directly, without a `'use client'` module of your own. See [Server components](../01-quickstart.md#server-components).
- A ref typed `FormRef<T>` reads the current value with `getFormData()`, so you no longer have to copy every `onChange` into state to know what the form holds. See [The imperative handle](../advanced-customization/internals.md#the-imperative-handle).
- `getStatus()` reports whether the data differs from its baseline, which fields the user touched and how many submits reached the form. You can warn before closing a page with unsaved edits or disable submit until something changed. See [Read the form status](../advanced-customization/internals.md#read-the-form-status) and [Unsaved changes](../usage/submitting.md#unsaved-changes).
- `onSubmit` can return a promise. Until it settles, the form ignores another submit and marks its submit button pending, and it works with `useActionState`. See [A pending submission](../usage/submitting.md#a-pending-submission).
- The `transformChange(next, previous)` prop decides what each edit leaves the form with, so you can refuse or rewrite an edit in one place. See [transformChange](../api-reference/form-props.md#transformchange).

## Validation and required fields

- `liveErrors="field"` shows a live-validated field's errors only once the user has changed it or left it, or after a submit, so editing one field no longer shows errors on fields the user hasn't reached yet. See [liveErrors](../api-reference/form-props.md#liveerrors).
- `ui:required` makes a field required from the uiSchema, and the form enforces it on submit and in live validation. `ui:initialValue` pre-fills a field without adding a `default` to the schema. See [required](../api-reference/uiSchema.md#required) and [initialValue](../api-reference/uiSchema.md#initialvalue).

## Schemas the form can now render

- A field whose `type` lists several types, such as `['string', 'number', 'null']`, can show a selector of those types beside the field for the chosen one when `useFallbackUiForUnsupportedType` is on. See [Multiple types](../json-schema/single.md#multiple-types).
- When `propertyNames` lists the allowed key names, each additional property's key is a dropdown of the names still free. See [Constraining key names with `propertyNames`](../json-schema/objects.md#constraining-key-names-with-propertynames).
- `additionalPropertiesWhenAbsent="allow"` reads an object that names no `additionalProperties` as taking extra keys, as JSON Schema does, and gives it an add button. See [Objects naming no `additionalProperties`](../json-schema/objects.md#objects-naming-no-additionalproperties).
- `ui:options.optgroups` groups a select's options under headings, in `@rjsf/core` and every theme. See [optgroups](../api-reference/uiSchema.md#optgroups).

## Styling and themes

- `@rjsf/core` ships two optional stylesheets: `rjsf.css` lays the form out and `rjsf-theme.css` gives it a default look. The `classMap` prop sets or extends the class of each element core renders, so core's markup can be styled with Tailwind. See [Customizing with other frameworks](../usage/themes.md#customizing-with-other-frameworks) and [classMap](../api-reference/form-props.md#classmap).
- The `presentation` prop, and a theme's `presentation`, declare which of a field's label, description, errors and help a custom widget or field draws itself, and the form's templates leave those parts to it. See [Presentation](../advanced-customization/custom-themes.md#presentation).
- `@rjsf/bootstrap3` keeps the Bootstrap 3 markup `@rjsf/core` rendered through v6, for apps that still style it. It is deprecated and will be removed in v8. See [Supported themes](../usage/themes.md#supported-themes).

## TypeScript

- `StrictUiSchema` is an opt-in `UiSchema` type that rejects a `ui:widget`, `ui:field` or `ui:options` value that doesn't fit the field's type. You can adopt it one form at a time. See [Type-safe UiSchema](../api-reference/uiSchema.md#type-safe-uischema).

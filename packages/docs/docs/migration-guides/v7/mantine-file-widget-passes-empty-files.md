---
title: The mantine FileWidget hands FileInput an empty File for each stored file
description: '`@rjsf/mantine`''s `FileWidget` used to hand `FileInput` the stored data URLs and now hands it an empty `File` for each stored file. If a `valueComponent` reads file names or contents, write your own `FileWidget` with `useFileWidgetProps()`.'
packages: ['@rjsf/mantine']
uses: [ui-schema]
schema: []
kind: runtime
noticed: review
related: []
---

## Detect

- In your uiSchema: a file field rendered by `@rjsf/mantine` that sets `ui:options.valueComponent`.
- In your code: that `valueComponent` reads the files' names or contents from its `value`.
- On the rendered page: the component shows no names or contents for files the form already holds.

## Change

`@rjsf/mantine`'s `FileWidget` hands `FileInput` an empty `File` for each stored file. It used to hand the stored data URLs, which aren't `File`s. A `ui:options.valueComponent` that read the files' names or contents from its `value` gets neither. Write your own `FileWidget` instead and register it in `widgets`. Its [`useFileWidgetProps()`](../../api-reference/utility-functions.md#usefilewidgetprops) gives each file's name, size, type and data URL in `filesInfo`.

## Verify

- Your own `FileWidget` renders each stored file's name from `filesInfo`.
- Files picked in the browser still reach the form data.

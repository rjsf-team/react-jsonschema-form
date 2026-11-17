---
title: 'Numeric inputs carry a title shown as a tooltip and used as a fallback name'
description: 'A `number`/`integer` input now has a `title` ("Enter a number" or "Enter a whole number") that the browser shows as a tooltip and uses to name an unlabelled field. Translate the strings, label such fields, and render the title in your own `BaseInputTemplate`.'
packages: ['@rjsf/core', '@rjsf/bootstrap3', '@rjsf/chakra-ui', '@rjsf/daisyui', '@rjsf/fluentui-rc', '@rjsf/mui', '@rjsf/react-bootstrap', '@rjsf/shadcn']
uses: [markup, ui-schema, custom-templates]
schema: [numbers]
kind: markup
noticed: test
related: [number-fields-render-text-input, custom-base-input-template-forwards-input-mode-and-pattern, translate-string-table-needs-new-keys]
---

## Detect

- In your DOM snapshots: a new `title` attribute on numeric inputs.
- On the rendered page: hovering a `number`/`integer` field shows "Enter a number" or "Enter a whole number".
- In a screen reader or accessibility test: a numeric field with no label (`ui:options: { label: false }`, or a layout that hides it) is announced by that text where it was unnamed.
- In your code: a `BaseInputTemplate` of your own that renders a plain `<input>` without that `title`.

## Change

The browser reports a failed `pattern` as a bare "Please match the requested format", so RJSF sets a `title` on the numeric input for the browser to append to that message. It is set whenever the `pattern` is, so the browser also shows it as a tooltip. Because `title` is the last fallback in accessible-name computation, an unlabelled numeric field is announced by it, with the same name for every such field on the page.

The strings go through `translateString` as `TranslatableString.NumberInputTitle` and `TranslatableString.IntegerInputTitle`; [the new TranslatableString keys](./translate-string-table-needs-new-keys.md) lists them with the others to handle.

Give an unlabelled field a `ui:title` or an `aria-label` if the tooltip or the shared name matters, or your own `pattern` or `title`. Your own `pattern` replaces the derived one and takes the derived `title` with it, since that title describes a rule no longer in force. Pass it as the `pattern` prop of `BaseInputTemplate` from a widget in any theme, through `extraProps` in `shadcn` and `react-bootstrap`, or through `slotProps.htmlInput` in `mui`. Your own `title` reaches the input as a widget prop in `core` and `daisyui`, through `extraProps` in `shadcn` and `react-bootstrap`, or through `slotProps.htmlInput` in `mui`. The other themes render a fixed set of props, so it doesn't reach the input there.

A `BaseInputTemplate` of your own that renders a plain `<input>` takes the `title` from [`getBaseInputProps()`](../../api-reference/utility-functions.md#getbaseinputprops), which returns it beside the input props. Put it before them:

```diff
-const inputProps = getInputProps(schema, type, options);
-<input id={id} {...inputProps} />
+const { title, ...inputProps } = getBaseInputProps(props);
+<input id={id} title={title} {...inputProps} />
```

## Verify

- A numeric field shows the translated title as its tooltip, and the browser appends it to its pattern message.
- An unlabelled field is announced by the `ui:title` or `aria-label` you set.
- Updated snapshots show the new `title` attribute.

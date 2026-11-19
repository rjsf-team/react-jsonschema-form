---
title: An incomplete ui:order renders the object instead of an error
description: "A `ui:order` with no `'*'` that leaves out a property, or with several `'*'`s, used to replace the object with an error, and now renders it with a `ui-order-incomplete` warning. Complete the order, and assert on the warning in tests."
packages: ['@rjsf/core', '@rjsf/utils']
uses: [ui-schema, markup, utils-api]
kind: runtime
noticed: runtime-error
related: [translatable-string-invalid-object-field-removed, property-names-like-proto-are-read-as-own-keys]
---

## Detect

- In your `uiSchema`, a `ui:order` with no `'*'` that leaves out a property of the object, or with more than one `'*'` ([#4316](https://github.com/rjsf-team/react-jsonschema-form/issues/4316)).
- In your tests, a query for `.rjsf-config-error` or the `InvalidObjectField` message, or a call to `orderProperties()` expecting it to throw.
- In the console, a warning with the ID `ui-order-incomplete`:

```
"root_address" (address) sets a ui:order with no '*' that leaves out 'zip'. The properties it leaves out render after the ones it lists, so list them, or add '*' where they should go. [ui-order-incomplete]
```

## Change

Before, `orderProperties()` threw in both cases. `ObjectField` rendered a `<p class="rjsf-config-error">` with the `InvalidObjectField` message and a `<pre>` holding the schema in place of the whole object. That also happened to a valid schema: an object with `additionalProperties` and a `ui:order` listing only its declared properties turned into the error as soon as its data held a key the order didn't list.

Now the object always renders, and `orderProperties()` no longer throws. List the properties the order leaves out, or add `'*'` where they should go.

A test that asserted on the error asserts on the warning instead, through a `console.warn` spy. [`setWarningOptions()`](../../api-reference/utility-functions.md#setwarningoptions) can make the warning throw:

```diff
-expect(node.querySelector('.rjsf-config-error')).toHaveTextContent(/does not contain property 'zip'/);
+expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("leaves out 'zip'"));
```

## Verify

- A property the order leaves out renders after the ones it lists, as if the list ended with `'*'`.
- Only the first of several `'*'`s places the unlisted properties.
- A property listed more than once renders once, at its first entry, where it rendered at each.
- A property named `*` renders among the unlisted ones, where an order with a `'*'` hid it.
- A declared property left out is reported once per uiSchema entry and set of properties left out. A conditional such as `dependencies` can vary that set between the rows of an array.

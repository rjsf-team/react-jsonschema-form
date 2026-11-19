---
title: A custom AnyOfField or OneOfField reads the selection through useOptionSelection
description: The selected option now lives in the form, and `SchemaField` stubs an object's extra keys with it. A custom `AnyOfField` or `OneOfField` that kept the index in its own state reads and writes it with `useOptionSelection()` instead.
packages: ['@rjsf/core']
uses: [custom-fields]
schema: [any-of-one-of]
kind: runtime
noticed: review
related: [selected-option-stays-while-you-type, anyof-oneof-field-options-are-already-retrieved]
---

## Detect

- In your code: a component passed as `AnyOfField` or `OneOfField` in `fields=` that holds the selected option index in `useState`, a class `state` or a ref.
- On the rendered page: such a field shows one option while the extra keys of the object beside it render for another.

## Change

`AnyOfField` and `OneOfField` read and write the selection with `useOptionSelection()`, which `@rjsf/core` exports, and `SchemaField` reads it to stub an object's extra keys with the selected option. A custom replacement that keeps the selection in its own state shows one option while the object beside it is stubbed for another. Read and write it through the hook; the `options` prop stays:

```tsx
import { useOptionSelection } from '@rjsf/core';

const { selectedOption, selectOption } = useOptionSelection(registry, fieldPath, options, formData, discriminator);
// on a pick: selectOption(index), then onChange(dataForTheNewOption, fieldPath)
```

The `options` it receives are already retrieved; see [AnyOfField and OneOfField expect their options already retrieved](./anyof-oneof-field-options-are-already-retrieved.md).

## Verify

- Your field shows the option the user picked after it unmounts and mounts again, as the built-in field does (see [An anyOf or oneOf field keeps the option the user selected](./selected-option-stays-while-you-type.md)).
- The object's extra keys render for the option your field shows.

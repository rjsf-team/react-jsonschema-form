---
title: An optional object with anyOf or oneOf options draws one set of Optional Data Controls
description: An optional object with `anyOf`/`oneOf` options used to draw a second Add button, `root_n__optionalAdd`, in its option, and now draws only its heading's. Select `root_n__XxxOf__optionalAdd` and expect a custom `MultiSchemaFieldTemplate` only after Add.
packages: ['@rjsf/core']
uses: [markup, custom-templates]
schema: [any-of-one-of]
kind: markup
noticed: test
related: [optional-object-holding-empty-object-renders-open]
---

## Detect

- Your `enableOptionalDataFieldForType` names `object`, and an optional object field has `anyOf`/`oneOf` options.
- Your tests or CSS select the option's Add button, such as `#root_n__optionalAdd`.
- Your custom `MultiSchemaFieldTemplate` draws something around its `selector` and `optionSchemaField`, such as a wrapper or a heading.

## Change

The object renders one set of controls, its own, in its heading beside the options, `root_n__XxxOf__optionalAdd`. The selected option no longer draws a second set, `root_n__optionalAdd`. Point tests and CSS that selected the option's button at the heading's button instead.

An object with neither properties of its own nor room for more keys besides its options still draws the option's set, since nothing renders beside the options.

## Verify

- Until Add, the selected option of an object with properties of its own or room for more keys renders nothing. It used to draw an empty frame titled after the option, or its fields where its own uiSchema turned the controls off, so typing in them added the object.
- With neither an option selector nor an option to show, the field renders no `MultiSchemaFieldTemplate`, so your custom wrapper or heading appears only after Add.
- Snapshots that held the empty option frame or the second Add button need updating.

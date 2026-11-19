---
title: UseAltDateWidgetResult has a required buttonsDisabled
description: "`useAltDateWidgetProps()` now returns `buttonsDisabled`, a required member of `UseAltDateWidgetResult`. A hand-built result, such as a mocked return of the hook, has to include it."
packages: ['@rjsf/utils']
uses: [typescript, utils-api]
schema: []
affects: [code]
related: [alt-date-unset-part-is-undefined]
---

## Detect

- In your TypeScript, an object typed `UseAltDateWidgetResult` built by hand, such as a mocked return of `useAltDateWidgetProps()`.
- The type checker reports `Property 'buttonsDisabled' is missing in type '{ … }' but required in type 'UseAltDateWidgetResult'.` (TS2741) on it.

## Change

`useAltDateWidgetProps()` returns `buttonsDisabled`, true when the widget is disabled or read-only, for its clear and now buttons ([#5378](https://github.com/rjsf-team/react-jsonschema-form/issues/5378)). Add it to hand-built results:

```diff
 const result: UseAltDateWidgetResult = {
   elements,
   handleChange,
   handleClear,
   handleSetNow,
+  buttonsDisabled: false,
 };
```

## Verify

The type checker accepts every `UseAltDateWidgetResult` you build.

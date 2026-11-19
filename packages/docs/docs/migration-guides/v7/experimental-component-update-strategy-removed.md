---
title: 'Form no longer takes an update strategy prop, and shouldRender is removed'
description: '`Form` and `SchemaField` now compare props shallowly, so `experimental_componentUpdateStrategy`, `shouldRender()`, `shallowEquals()` and `ComponentUpdateStrategy` are gone. Remove the prop, extend `PureComponent`, and use `shallowEqual` from `fast-equals`.'
packages: ['@rjsf/core', '@rjsf/utils']
uses: [form-props, utils-api, typescript]
schema: []
affects: [code]
related: [form-props-need-stable-references]
---

## Detect

- In your code: `experimental_componentUpdateStrategy` passed to `<Form>` or read from `globalFormOptions`.
- In your imports from `@rjsf/utils`: `shouldRender`, `shallowEquals` or the `ComponentUpdateStrategy` type.
- In the type checker: `TS2305: Module '"@rjsf/utils"' has no exported member 'shouldRender'.`, and the same for `shallowEquals` and `ComponentUpdateStrategy`.

## Change

`Form` and `SchemaField` now compare their props shallowly, as `React.memo` does, and keep the references of unchanged data across changes so that comparison is enough.

- Remove `experimental_componentUpdateStrategy` from `<Form>` and from any `globalFormOptions` read of it.
- Replace `shouldRender(this, nextProps, nextState)` in a class component's `shouldComponentUpdate` by extending `PureComponent`, which makes the same comparison.
- Replace `shallowEquals` with `shallowEqual` from `fast-equals`.

```diff
-import { shouldRender } from '@rjsf/utils';
-class MyField extends Component<FieldProps> {
-  shouldComponentUpdate(nextProps: FieldProps, nextState: unknown) {
-    return shouldRender(this, nextProps, nextState);
-  }
+class MyField extends PureComponent<FieldProps> {
```

## Verify

- Your code compiles with none of the removed names.
- The form still re-renders when your props change. Props that hold functions need stable references; see [Form props that hold functions need stable references](./form-props-need-stable-references.md).

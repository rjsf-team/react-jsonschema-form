---
title: SchemaExamples must be rendered as an element
description: '`@rjsf/core` exports `SchemaExamples` wrapped in `memo()`, so calling it as a function throws on first render. Render it as an element, `<SchemaExamples id={id} schema={schema} />`.'
packages: ['@rjsf/core']
uses: [custom-templates]
schema: []
affects: [code]
related: []
---

## Detect

- `SchemaExamples(` called as a function in a custom template, such as `{SchemaExamples({ id, schema })}`.
- The call still type-checks, and the template throws `SchemaExamples is not a function` on its first render.

## Change

`SchemaExamples` is wrapped in `memo()`, so that a keystroke in an input does not render its `<datalist>` of suggestions again. A memo component is an object, not a callable function. Render it as an element:

```diff
-{SchemaExamples({ id, schema })}
+<SchemaExamples id={id} schema={schema} />
```

## Verify

The template renders without the `SchemaExamples is not a function` error, and an input whose schema has `examples` still shows its `<datalist>` suggestions.

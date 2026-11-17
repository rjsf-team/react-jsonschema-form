---
title: RichDescription and RichHelp no longer carry test ids
description: '`RichDescription.TEST_IDS` and `RichHelp.TEST_IDS` are removed because neither renders markdown itself. Use `MarkdownTemplate.TEST_IDS.markdown` from `@rjsf/core/markdown` instead.'
packages: ['@rjsf/core']
uses: [markup]
schema: []
kind: removal
noticed: type-error
related: [markdown-needs-markdown-template]
---

## Detect

- `RichDescription.TEST_IDS` or `RichHelp.TEST_IDS` in your tests.
- Type checker: `Property 'TEST_IDS' does not exist on type '<T = unknown, S extends StrictRJSFSchema = JSONSchema7, F extends FormContextType = object>({ description, registry, uiSchema }: RichDescriptionProps<T, S, F>) => Element'.` (TS2339), and the same for `RichHelp`.

## Change

Markdown now renders through the `MarkdownTemplate`, see [Markdown renders only through a registered MarkdownTemplate](./markdown-needs-markdown-template.md). The test id lives on that renderer:

```diff
-import { RichDescription } from '@rjsf/core';
+import MarkdownTemplate from '@rjsf/core/markdown';

-screen.getByTestId(RichDescription.TEST_IDS.markdown);
+screen.getByTestId(MarkdownTemplate.TEST_IDS.markdown);
```

## Verify

- No test reads `TEST_IDS` from `RichDescription` or `RichHelp`.
- Tests that find markdown output register `MarkdownTemplate` from `@rjsf/core/markdown` on the form.

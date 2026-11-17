---
title: Markdown renders only through a registered MarkdownTemplate
description: '`@rjsf/core` no longer installs `markdown-to-jsx` and its default `MarkdownTemplate` renders plain text. Install `markdown-to-jsx` and register `MarkdownTemplate` from `@rjsf/core/markdown` to keep markdown.'
packages: ['@rjsf/core']
uses: [ui-schema]
schema: []
kind: install
noticed: review
related: [rich-description-test-ids-removed, file-info-is-plain-text]
---

## Detect

- `ui:enableMarkdownInDescription` or `ui:enableMarkdownInHelp` in your `uiSchema` or `ui:globalOptions`.
- A custom `translateString` that returns markdown.

## Change

`markdown-to-jsx` is now an optional peer dependency of `@rjsf/core`, so it is no longer installed with it. Markdown renders through the `MarkdownTemplate`, whose core default is plain text. `@rjsf/core/markdown` provides the `markdown-to-jsx` implementation.

Install `markdown-to-jsx` and register the template:

```diff
 import Form from '@rjsf/core';
+import MarkdownTemplate from '@rjsf/core/markdown';

 <Form
   schema={schema}
   validator={validator}
+  templates={{ MarkdownTemplate }}
   uiSchema={{ 'ui:enableMarkdownInDescription': true }}
 />;
```

`ui:enableMarkdownInDescription` and `ui:enableMarkdownInHelp` stay independent, default to `false`, and can still be set through `ui:globalOptions`. Translatable strings that allow markdown go through `RichDescription`, so they also need `ui:enableMarkdownInDescription`. A custom `translateString` that returns markdown keeps working once the template is registered and that option is on.

## Verify

- Descriptions and help text that used markdown render formatted again.
- Raw HTML in markdown shows as text. It is never parsed.

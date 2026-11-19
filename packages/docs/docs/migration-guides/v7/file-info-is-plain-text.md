---
title: File information and built-in messages render as plain text
description: '`FileWidget` file information and the English `UnsupportedField*` and `FilesInfo` strings no longer use markdown, so the file name is no longer bold, and `InvalidObjectField` is removed. Update tests and CSS that expect the markup.'
packages: ['@rjsf/core']
uses: [markup]
schema: []
kind: markup
noticed: test
related: [markdown-needs-markdown-template, translatable-string-invalid-object-field-removed]
---

## Detect

- Tests, snapshots or CSS that expect a bold (`strong`) file name in `FileWidget`'s file information, or raw HTML in it.
- Tests that expect markdown formatting in the `UnsupportedField*` or `FilesInfo` messages, or that expect the `InvalidObjectField` message.

## Change

`FileWidget`'s file information used to render through `markdown-to-jsx` unconditionally, which made the file name bold and let raw HTML through. It now goes through `RichDescription` like every other translatable string. The English `UnsupportedField*` and `FilesInfo` strings no longer contain markdown syntax. `InvalidObjectField` is removed, since an incomplete `ui:order` now renders the object instead of an error; see [TranslatableString.InvalidObjectField is removed](./translatable-string-invalid-object-field-removed.md).

Update the tests and CSS to expect plain text. To keep a bold file name, register a `MarkdownTemplate`, set `ui:enableMarkdownInDescription`, and supply a `translateString` that marks the name up, see [Markdown renders only through a registered MarkdownTemplate](./markdown-needs-markdown-template.md). Raw HTML is never parsed.

## Verify

- Snapshots of `FileWidget` and of the unsupported field messages show plain text.

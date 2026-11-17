---
title: Array item button handlers take an optional SyntheticEvent on an HTML element
description: 'The array add, copy, move and remove handlers used to take `(event?: any)` and now take `(event?: SyntheticEvent<HTMLElement>)`. Pass them straight to a button''s `onClick` or call them with no argument, and type a replacement handler the same way.'
packages: ['@rjsf/utils']
uses: [typescript, custom-templates]
schema: []
kind: type
noticed: type-error
related: []
---

## Detect

- In your code: a custom array template that calls or replaces `onAddClick` (`ArrayFieldTemplateProps`), or `onAddItem`, `onCopyItem`, `onMoveUpItem`, `onMoveDownItem` or `onRemoveItem` (`ArrayFieldItemButtonsTemplateProps`, held by `ArrayFieldItemTemplateProps.buttonsProps`).
- The type checker reports `Type '…' is not assignable to type '…'.` (TS2322) where your handler takes a narrower event such as `MouseEvent<HTMLButtonElement>`, or where you pass one an SVG element's event.
- In your code: one of these handlers called after an `await`.

## Change

Pass these handlers straight to a button's `onClick`, or call them with no argument. A handler you write for one of these props has to accept any React event on an HTML element, and `undefined`:

```diff
-const onAddClick = (event: MouseEvent<HTMLButtonElement>) => { … };
+const onAddClick = (event?: SyntheticEvent<HTMLElement>) => { … };
```

An SVG element's event, such as the `MouseEvent<SVGSVGElement>` of an icon's own `onClick`, doesn't fit. Handle the click on the button around the icon instead.

## Verify

- The type checker accepts your handlers.
- The `currentTarget` type says it is never `null`, but React clears it once dispatch ends. A handler that reads it after an `await` gets `null`, so read it first: `const target = event?.currentTarget; await confirm(); target?.blur();`.
- `onAddItem`, `onCopyItem`, `onMoveUpItem`, `onMoveDownItem` and `onRemoveItem` act on the index the item rendered with. If an item was added, moved or removed during an `await`, a call after it acts on the row now at that index.
- The handlers read whether the button can act, such as the form's `disabled`, from the render that handed them out. A call after an `await` still acts if the form was disabled or made read-only meanwhile, so call the handler before awaiting, or check the lock again before calling it.

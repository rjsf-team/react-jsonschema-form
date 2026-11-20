---
title: A custom GridTemplate declares the props it reads from ui:layoutGrid
description: '`GridTemplateProps`'' other props were `any` and are now an open object whose undeclared keys don''t read back, and the type is an alias. Declare your props by intersection, add `OpenProps` to an `Omit`, and cast a `style` with custom properties.'
packages: ['@rjsf/utils']
uses: [typescript, custom-templates]
schema: []
affects: [code]
related: [style-option-is-css-properties, custom-grid-template-receives-field-id]
---

## Detect

- In your code: a custom `GridTemplate` that destructures or reads a prop `GridTemplateProps` doesn't declare, such as `gap`.
- In your code: an `interface` that extends `GridTemplateProps`, or a `declare module '@rjsf/utils'` that augments it.
- In your code: an `Omit` of `GridTemplateProps`, or a `style` that sets a CSS custom property such as `'--my-gap'`.
- The type checker reports `Property 'gap' does not exist on type 'GridTemplateProps'.` (TS2339) on the read, TS2312 on the `interface`, or `Object literal may only specify known properties, and ''--my-gap'' does not exist in type 'Properties<string | number, string & {}>'.` (TS2353) on the custom property.

## Change

The other props of `GridTemplateProps` were `any`. They are now any object, of which only the declared props read back. `GridTemplateProps` now also declares `className` and `style`. A custom `GridTemplate` that reads a prop of its own from `ui:layoutGrid` declares it, as the themes now do:

```diff
-function MyGridTemplate({ gap, ...rest }: GridTemplateProps) {
+function MyGridTemplate({ gap, ...rest }: GridTemplateProps & { gap?: number }) {
```

`GridTemplateProps` is a type alias, so neither an `interface` that extends it nor a `declare module '@rjsf/utils'` augmentation of it compiles. Build a props type of your own by intersection instead, and declare a prop an augmentation added on the template that reads it with an intersection such as `GridTemplateProps & { gap?: number }`:

```diff
-interface MyGridProps extends GridTemplateProps {
-  gap?: number;
-}
+type MyGridProps = GridTemplateProps & { gap?: number };
```

An `Omit` of `GridTemplateProps` keeps only its declared props, so it no longer takes the theme's other props. Intersect it with `OpenProps`, the open part of `GridTemplateProps`, to keep them:

```diff
-type MyRowProps = Omit<GridTemplateProps, 'style'> & { style?: MyStyle };
+type MyRowProps = OpenProps & Omit<GridTemplateProps, 'style'> & { style?: MyStyle };
```

`GridTemplateProps.style` is a `CSSProperties`, which has no key for a CSS custom property, so a `style` that sets one casts the object. See [The style template prop and ui:style option are CSSProperties](./style-option-is-css-properties.md):

```diff
-const props: GridTemplateProps = { style: { '--my-gap': '8px' } };
+const props: GridTemplateProps = { style: { '--my-gap': '8px' } as CSSProperties };
```

A custom `GridTemplate` is also handed a `fieldId` it must take off before spreading, see [A custom GridTemplate is handed a fieldId](./custom-grid-template-receives-field-id.md).

## Verify

- The type checker accepts your `GridTemplate` and the props types built from `GridTemplateProps`.
- Nothing changes at runtime: the template receives the same props from `ui:layoutGrid`.

---
title: antd and mantine leave out a property hidden by deprecatedHandling or ui:definitions
description: 'A property hidden by `deprecatedHandling: ''hide''` or a `ui:definitions` entry used to render inside a hidden wrapper in antd and mantine, and is now left out of the DOM, so native form posts lose it. Read its value from the form data.'
packages: ['@rjsf/core', '@rjsf/antd', '@rjsf/mantine']
uses: [ui-schema, markup, form-props]
schema: []
kind: markup
noticed: test
---

## Detect

- Your `@rjsf/antd` or `@rjsf/mantine` form hides properties through `deprecated` under `deprecatedHandling: 'hide'`, or through a `ui:definitions` entry's `ui:widget: 'hidden'`.
- Tests that query such a property's input, or code that reads it through a native submit or `new FormData(form)`.

## Change

`ObjectField` marks a property `hidden` for its `ObjectFieldTemplate` whenever the property's field renders hidden, not only for the property's own `ui:widget: 'hidden'` ([#5507](https://github.com/rjsf-team/react-jsonschema-form/issues/5507)). The antd and mantine `ObjectFieldTemplate`s leave out every `hidden` property. Before: such a property's field rendered inside its theme's hidden wrapper (antd's `rjsf-field-hidden` `div`, mantine's `display: none` `Box`), in a column or grid cell of its own. After: it doesn't render, and the other properties share the row as they do beside a property with its own `ui:widget: 'hidden'`.

The property's value stays in the form data, but its input is no longer in the DOM. A test that looked the input up reads the value from the form instead:

```diff
- expect(container.querySelector('#root_b')).toHaveValue('legacy');
+ expect(formRef.current?.getFormData()).toMatchObject({ b: 'legacy' });
```

Code that posts the form natively takes the value from `onSubmit`'s data instead.

## Verify

- Hidden properties take no column or grid cell.
- Your submitted data still holds their values.

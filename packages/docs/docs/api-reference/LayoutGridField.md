# LayoutGridField

The `LayoutGridField` will render a schema, uiSchema and formData combination out into a `GridTemplate` in the shape
described in the uiSchema. To define the grid to use to render the elements within a field in the schema, provide in
the uiSchema for that field the object contained under a `ui:layoutGrid` element. E.g. (as a JSON object):

```json
{
  "field1" : {
    "ui:field": "LayoutGridField",
    "ui:layoutGrid": {
      "ui:row": { ... }
    }
  }
}
```

See the [LayoutGridField usage](../usage/layout-grid.md) for more detailed walk-through on how to use the component. This page is condensed
version of the `uiSchema` APIs for faster reference.

## ui:row

The outermost level of a `LayoutGridField` is the `ui:row` that defines the nested rows, columns, and/or condition
elements (i.e. "grid elements") in the grid. This definition is either a simple "grid elements" OR an object with
native `GridTemplate` implementation-specific props and a `children` array of "grid elements". E.g. (as JSON objects):

Simple `ui:row` definition, without additional `GridTemplate` props:

```json
{
  "ui:row": [
    { "ui:row"|"ui:col"|"ui:columns"|"ui:condition": ... },
    ...
  ]
}
```

Complex `ui:row` definition, with additional `GridTemplate` (this example uses `@mui/material/Grid2` native props):

```json
{
  "ui:row": {
    "spacing": 2,
    "size": {
      "md": 4
    },
    "alignContent": "flex-start",
    "className": "GridRow",
    "children": [
        {
          "ui:row"|"ui:col"|"ui:columns"|"ui:condition": ...
        },
        ...
      ]
    }
  }
```

> NOTE: Special note about the native `className` prop values. All className values will automatically be looked up in
> the `formContext.lookupMap` in case they have been defined using a CSS-in-JS approach. In other words, from the
> example above, if the `Form` was constructed with a `layoutGridLookupMap` set to `{ GridRow: cssInJs.GridRowClass }`
> then when rendered, the native `GridTemplate` will get the `className` with the value from
> `cssInJs.GridRowClass`. This automatic lookup will happen for any of the "grid elements" when rendering with
> `GridTemplate` props. If multiple className values are present, for example:
> `{ className: 'GridRow GridColumn' }`, the classNames are split apart, looked up individually, and joined
> together to form one className with the values from `cssInJs.GridRowClass` and `cssInJs.GridColumnClass`. See the
> [example](../usage/layout-grid.md#named-lookup-support-for-classname) in the usage documentation.

## ui:col

The `ui:col` grid element is used to specify the list of columns within a grid row. A `ui:col` element can take on
several forms:

1. a simple list of dotted-path field names within the root field;
2. a list of objects containing the dotted-path field `name` any other props that are gathered into `ui:options` for the field;
3. a list with a one-off `render` functional component with or without a non-field `name` identifier and any other to-be-spread props; and
4. an object with native `GridTemplate` implementation specific props and a `children` array with 1) or 2) or even a nested `ui:row` or a `ui:condition` containing a `ui:row` (although this should be used carefully). E.g. (as JSON objects):

Simple `ui:col` definition, without additional `GridTemplate` props and form 1 only children:

```json
{
  "ui:col": ["innerField", "inner.grandChild", ...]
}
```

Complicated `ui:col` definition, without additional `GridTemplate` props and form 2 only children:

```json
{
  "ui:col": [
    { "name": "innerField", "fullWidth": true },
    { "name": "inner.grandChild", "fullWidth": false },
    ...
  ]
}
```

More complicated `ui:col` definition, without additional `GridTemplate` props and form 2 children, one being a
one-off `render` functional component without a non-field `name` identifier

```json
{
  "ui:col": [
    "innerField",
    {
      "render": "WizardNavButton",
      "isNext": true,
      "size": "large"
    }
  ]
}
```

Most complicated `ui:col` definition, additional `GridTemplate` props and form 1, 2 and 3 children (this example
uses @mui/material/Grid2 native props):

```json
{
  "ui:col": {
    "size": { "md": 4 },
    "className": "GridColumn",
    "children": [
      "innerField",
      { "name": "inner.grandChild", "fullWidth": true },
      { "name": "customRender", "render": "CustomRender", "toSpread": "prop-value" },
      { "ui:row|ui:condition": ... },
      ...
    ]
  }
}
```

> NOTE: If a `name` prop does not exist or its value does not match any field in a schema, then it is assumed to be a
> custom `render` component. If the `render` prop does not exist, a null render will occur. If `render` is a
> string, its value will be looked up in the `formContext.lookupMap` first before defaulting to a null render. If the
> resulting looked up `render` is not a function (React components are functions), then it will be a null render.

## ui:columns

The `ui:columns` grid element is syntactic sugar to specify a set of `ui:col` columns that all share the same set of
native `GridTemplate` props. In other words rather than writing the following configuration that renders a
`<GridTemplate>` element with 3 `<GridTemplate column className="GridColumn col-md-4">` nodes and 2
`<GridTemplate column className="col-md-6">` nodes within it (one for each of the fields contained in the `children`
list):

```json
{
  "ui:row": {
    "children": [
      {
        "ui:col": {
          "className": "GridColumn col-md-4",
          "children": ["innerField"]
        }
      },
      {
        "ui:col": {
          "className": "GridColumn col-md-4",
          "children": ["inner.grandChild"]
        }
      },
      {
        "ui:col": {
          "className": "GridColumn col-md-4",
          "children": [{ "name": "inner.grandChild2" }]
        }
      },
      {
        "ui:col": {
          "className": "col-md-6",
          "children": ["innerField2"]
        }
      },
      {
        "ui:col": {
          "className": "col-md-6",
          "children": ["inner.grandChild3"]
        }
      }
    ]
  }
}
```

One can write this instead:

```json
{
  "ui:row": {
    "children": [
      {
        "ui:columns": {
          "className": "GridColumn col-md-4",
          "children": ["innerField", "inner.grandChild", { "name": "inner.grandChild2", "fullWidth": true }]
        }
      },
      {
        "ui:columns": {
          "className": "col-md-6",
          "children": ["innerField2", "inner.grandChild3"]
        }
      }
    ]
  }
}
```

> NOTE: This syntax differs from `"ui:col": { "className": "col-md-6", "children": ["innerField2", "inner.grandChild3"] }` in that
> the `ui:col` will render the two children fields inside a single `<GridTemplate "className": "col-md-6",>`
> element.

## ui:condition

The final grid element, `ui:condition`, allows for conditionally displaying "grid elements" within a row based on the
current value of a field as it relates to a (list of) hard-coded value(s). There are four elements that make up a
`ui:condition`:

1. the dotted-path `field` name within the root field that makes up the left-side of the condition;
2. the hard-coded `value` (single or list) that makes up the right-side of the condition;
3. the `operator` that controls how the left and right sides of the condition are compared; and
4. the `children` array that defines the "grid elements" to display if the condition passes.

A `ui:condition` uses one of three `operators` when deciding if a condition passes:

1. The `all` operator will pass when the right-side and left-side contains all the same value(s);
2. the `some` operator will pass when the right-side and left-side contain as least one value in common;
3. the `none` operator will pass when the right-side and left-side do not contain any values in common. E.g. (as JSON objects):

Here is how to render an if-then-else for `field2` which is an enum that has 3 known values and supports allowing
any other value:

```json
{
  "ui:row": [
    {
      "ui:condition": {
        "field": "field2",
        "operator": "all",
        "value": "value1",
        "children": [
          { "ui:row": [...] }
        ],
      }
    },
    {
      "ui:condition": {
        "field": "field2",
        "operator": "some",
        "value": ["value2", "value3"],
        "children": [
          { "ui:row": [...] }
        ],
      }
    },
    {
      "ui:condition": {
        "field": "field2",
        "operator": "none",
        "value": ["value1", "value2", "value3"],
        "children": [
          { "ui:row": [...] }
        ]
      }
    }
  ]
}
```

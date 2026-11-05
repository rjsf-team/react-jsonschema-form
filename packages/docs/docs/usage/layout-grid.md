# Layout Grid

Version 6 of RJSF introduced a new way of generating forms using the `UiSchema`, via the Layout Grid.
Unlike the original method of showing each field in the JSON Schema, in order, as they appear hierarchically within the
nested object hierarchy, the Layout Grid lets you define where each field goes on a grid in any place/order you choose.
It even adds the ability to pass additional props to the rendering widget for each element being displayed.

The Layout Grid takes full advantage of the `UiSchema`'s ability to customize the `ui:field` that is used to render a field
or collection of fields by providing a new out-of-the-box field implementation called `LayoutGridField` that you can
assign to the whole of the `schema` or just a piece of it. It also comes with its own "syntax" that lets you define
a `row`, a `col`umn, and a set of `columns`. It also provides `condition`al logic that describes how a subset of the grid
can be hidden/shown based upon the value(s) of a field. It even supports the inclusion of custom render components that
are not associated with a field. Finally, there is built-in support for doing a named look up of data within a special
location in the `FormContext`.

Each theme that RJSF supports has its own grid system. A column's `span`, in twelfths of a row, lays out the same way
in every theme, since each theme's `GridTemplate` converts it to its own grid (see [`span` in each theme](#span-in-each-theme)).
Anything beyond that, such as breakpoints, gaps or a row's own template, uses the theme's own grid props, and a `uiSchema`
that does will most likely not work for any other theme unless two themes have the exact same grid specification props.
It also requires that one understand how to use the grid system of the theme and how it interplays with the
`LayoutGridField`'s "syntax". In other words, it will likely take some experimentation to get the grid looking exactly
the way you want it to.

Let's break down how to use the `LayoutGridField` one step at a time.

## Defining the LayoutGridField to reordering rows

The `LayoutGridField` is designed to be used within the `uiSchema` via the `ui:field` syntax. It must be accompanied by
the definition of the grid within the new `ui:layoutGrid` syntax. First let's start with a fairly simple `schema` that
looks like:

```json
{
  "type": "object",
  "properties": {
    "person": {
      "title": "Person Info",
      "type": "object",
      "properties": {
        "first": {
          "title": "First Name",
          "minLength": 1,
          "maxLength": 200,
          "type": "string"
        },
        "middle": {
          "title": "Middle Name",
          "minLength": 1,
          "maxLength": 200,
          "type": "string"
        },
        "last": {
          "title": "Last Name",
          "minLength": 1,
          "maxLength": 200,
          "type": "string"
        }
      },
      "required": ["first", "last"]
    }
  }
}
```

If you were to pass this `schema` to the RJSF `Form` you will end up with the following UI, shown here as a simple ASCII
drawing:

```text
Person Info
  First Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  Middle Name
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  Last Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+
```

If you wanted to switch the order of the fields or remove middle name entirely, you could change the JSON schema, which
is usually not desirable for most users. You could also use the `ui:order` feature and/or `ui:widget: "hidden"` in the
`uiSchema` to accomplish this without changing the schema. And now you can also use the very flexible and powerful
`LayoutGridField` field in the`uiSchema`.

Now let's add a `uiSchema` that will allow us to change the order of the fields to be `Last Name`, `Middle Name` and `First Name`.
This will highlight the first elements of the new "syntax"; `ui:layoutGrid` and `ui:row` :

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "children": ["person.last", "person.middle", "person.first"]
    }
  }
}
```

This results in the following UI using the `core` theme's grid:

```text
  Last Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  Middle Name
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  First Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+
```

As mentioned before, another theme's grid system may render the above example differently. Most likely as three fields
lined up next to each other, since fields placed in a row without a `ui:col` are laid out by the theme's own grid.
Assume all examples from here on out will be shown using the `core` theme. The ones that size every column with `span`
lay out the same way in every theme; for the others you may have to adjust the `uiSchema` for your theme to achieve the
same results.

### `ui:layoutGrid`

The `LayoutGridField` will do nothing if used as a field without having the `ui:layoutGrid` object as its sibling.
This root "syntax" keyword defines the structure of how the grid should be laid out for the field. Due to the nature of
JSON objects, it must contain a single `ui:row` "syntax" keyword inside of which the rest of the grid is defined. Providing
a second `ui:row` will create an invalid object.

### `ui:row`, part 1

The `ui:row` "syntax" represents a row of data in the grid. It has, at minimum, a single `children` property that
describes what that row will render. In this first example, the children are the ids of the fields to render in order,
as single grid elements. There is a second version of this syntax which is identical to the first in behavior:

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": ["person.last", "person.middle", "person.first"]
  }
}
```

Here the array is implicitly assumed to be the `children` property. Let's take a look at another example that will generate
the exact same UI. The example below shows what happens when you use the `LayoutGridField` on a sub-object within the
hierarchy:

```json
{
  "person": {
    "ui:field": "LayoutGridField",
    "ui:layoutGrid": {
      "ui:row": ["last", "middle", "first"]
    }
  }
}
```

Here you can see the `person.` prefix on the field ids is no longer necessary. This is because the scope of the field is
now the `person` object rather than the whole of the `schema`. You may have noticed from the example UI shown above that
the `Person Info` header for the object disappeared. This is because we are no longer iterating through the hierarchy to
render the object. Don't worry, there is another new field that was created to support just this use case (see next
section).

Also, if you wanted to entirely remove the `Middle Name` from your form because of a requirements change, you don't have
to touch the JSON schema anymore. Instead you would just update the `uiSchema` as follows:

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": ["person.last", "person.first"]
  }
}
```

## LayoutHeaderField

The `LayoutHeaderField` is another new field built into RJSF v6. Its sole purpose is to render the `title` for a collection
of grid elements. It will read the `title` using the exact same mechanism as does the regular `Form`; first as `ui:title`
if specified, then as `schema.title` if specified, then as `name` of the field. In order to restore the `Person Info`
header to the example above, we have to make a few additions to the `uiSchema`:

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": ["person", "person.last", "person.middle", "person.first"]
  },
  "person": {
    "ui:field": "LayoutHeaderField"
  }
}
```

## Defining the LayoutGridField to put the fields in a single row

Now let's say the requirements changed again, and you have to show the first, middle and last name fields in a single row.
Well, in the past, that would require quite a lot of customizing of RJSF's `core` templates. Now with the `LayoutGridField`
it's just a matter of updating the `uiSchema` again, this time using more of the new "syntax"; `ui:col` and `ui:columns`:

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "children": [
        {
          "ui:row": [
            {
              "ui:col": {
                "span": 12,
                "children": ["person"]
              }
            }
          ]
        },
        {
          "ui:row": [
            {
              "ui:col": {
                "span": 4,
                "children": [
                  {
                    "name": "person.first"
                  }
                ]
              }
            },
            {
              "ui:col": {
                "span": 4,
                "children": [
                  {
                    "name": "person.middle"
                  }
                ]
              }
            },
            {
              "ui:col": {
                "span": 4,
                "children": [
                  {
                    "name": "person.last"
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  "person": {
    "ui:field": "LayoutHeaderField"
  }
}
```

Passing the above `uiSchema` to the RJSF `Form` you will end up with the following UI:

```text
Person Info
  First Name*                   Middle Name                   Last Name*
  +--------------------------+  +--------------------------+  +--------------------------+
  |                          |  |                          |  |                          |
  +--------------------------+  +--------------------------+  +--------------------------+
```

The above example uses the `span` property to make the `Person Info` span all 12 columns of a row and each of the person
name fields span 4 columns within a row. `span` counts twelfths of a row in every theme. The `core` theme's
`GridTemplate` renders every `ui:row` as a 12-column grid and every `ui:col` as a column spanning `span` of its tracks, or
all of them when it has none, laid out by the optional `@rjsf/core/rjsf.css` stylesheet. Without that stylesheet the
`span` property has no visible effect in the `core` theme. Every other theme's `GridTemplate` converts `span` to its own
grid, as [`span` in each theme](#span-in-each-theme) lists.

Now sometimes, depending on the grid system, you don't need to explicitly define both second-level rows, instead
depending on the column grid behavior. Luckily the `core` theme's grid system is one of those, so the following UI
schema will also produce the exact same result.

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "children": [
        {
          "ui:col": {
            "span": 12,
            "children": ["person"]
          }
        },
        {
          "ui:columns": {
            "span": 4,
            "children": ["person.first", "person.middle", "person.last"]
          }
        }
      ]
    }
  },
  "person": {
    "ui:field": "LayoutHeaderField"
  }
}
```

Here is how the `LayoutGridField` "syntax" above is used.

### `ui:row`, part 2

As the above examples show, the `ui:row` object can be nested inside of the `children` of a `ui:row`. This signifies the
nesting of one row inside another row. Any additional properties added to the `ui:row` object, such as a `className`, will
be spread onto the underlying theme's grid implementation. You may also pass other properties, such as `style` blocks or,
in the case of other themes, properties that will affect the underlying grid system components.

### `ui:col`

The `ui:col` "syntax" represents a single column of data in the grid. Like `ui:row` this syntax will spread the
`"span": 12` and `"span": 4` properties onto the underlying theme's grid implementation, as well as any other
properties, such as `style` blocks, etc. In its most compact form, the `ui:col` can be written as
`{ "ui:col": ["person"] }`, in a manner similar to `ui:row` where the array is implicitly assumed to be the `children`
property.

In its most expanded form, the `ui:col` contains an array of `children` in the form of objects with `"name": "<field id>"`
as the minimum required property. Any additional properties added within the object will be passed along to the
underlying `Widget` implementation in the `ui:options` portion of the `uiSchema`. This allows for fine-tuning any
out-of-the-box or custom widgets. The [keys `ui:options` doesn't take](../api-reference/uiSchema.md#exceptions-to-the-equivalence),
such as `field`, are ignored with a warning, so name a cell's field with `ui:field` in its own `uiSchema` entry.
Let's take a look at an example where the `Middle Name` column hides its label adding
a margin to take up the space once occupied by the label, and is reduced in size relative to the `First Name` and
`Last Name`:

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "children": [
        {
          "ui:row": [
            {
              "ui:col": {
                "span": 12,
                "children": ["person"]
              }
            }
          ]
        },
        {
          "ui:row": [
            {
              "ui:col": {
                "span": 5,
                "children": ["person.first"]
              }
            },
            {
              "ui:col": {
                "span": 2,
                "style": {
                  "margin-top": "25px"
                },
                "children": [
                  {
                    "name": "person.middle",
                    "label": false
                  }
                ]
              }
            },
            {
              "ui:col": {
                "span": 5,
                "children": ["person.last"]
              }
            }
          ]
        }
      ]
    }
  },
  "person": {
    "ui:field": "LayoutHeaderField"
  }
}
```

Passing the above `uiSchema` to the RJSF `Form` you will end up with the following UI:

```text
Person Info
  First Name*                                      Last Name*
  +--------------------------------+  +---------+  +--------------------------------+
  |                                |  |         |  |                                |
  +--------------------------------+  +---------+  +--------------------------------+
```

### `ui:columns`

The `ui:columns` "syntax" represents a group of columns in the grid. Like `ui:row` and `ui:col` this syntax will spread
the properties onto the underlying theme's grid implementation (in an earlier example `"span": 4` ), as
well as any other properties, such as `style` blocks, etc. It is short-hand notation for rendering a group of columns
all with the same grid system properties. As shown in the above examples, the set of three `ui:col` definitions for
first, middle and last names are the same as the single `ui:columns` definition with all three listed as children.

In its most compact form, the `ui:col` can be written as `{ "ui:columns": ["person.first", "person.last"] }`, in a
manner similar `ui:row` and `ui:col` where the array is implicitly assumed to be the `children` property. The
`ui:columns` syntax also supports `children` in the form of objects with `"name": "<field id>"` as the minimum required
property, passing along any additional properties to the underlying `Widget` as `ui:options`.

A `null` child renders nothing, so `{ "ui:columns": ["person.first", null, "person.last"] }` leaves its middle column
empty. A `false` or `undefined` child, such as one a layout built in code leaves out with `showMiddle && "person.middle"`,
is no child at all and takes no column.

## GridTemplate

The concept of a theme's grid system has been mentioned several times in the documentation so far. Remember that each
theme's grid system is unique to that theme. It is essential to understand how your theme's grid system works in order
to know how to write the `uiSchema` to get the grid layout you want for your fields.

If you want to know how your theme implements its grid system, take a look at the `GridTemplate` source code. You may
also override your theme's `GridTemplate` with your own to fine tune how the properties you pass to the `ui:row`, `ui:col`,
and `ui:columns` are handled. Each `ui:row` and `ui:col` will render a `GridTemplate` passing `column: false` for `ui:row`
and `column: true` for `ui:col`. The `ui:columns` syntax will render a `GridTemplate` around each of the `children`. Any
additional properties besides `children` will be directly passed to the `GridTemplate`.

### `span` in each theme

Every theme's `GridTemplate` reads a column's `span` as twelfths of a row and converts it to its own grid. A `span` on a
`ui:row` is ignored, and RJSF logs a warning saying so, once.

| Theme                   | A column's `span` becomes                                             | Half steps, such as `4.5`                        |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| `core`                  | the `--rjsf-span` custom property, which `rjsf.css` reads             | No                                               |
| `@rjsf/antd`            | `Col`'s `span`, doubled into antd's 24ths and rounded to a whole 24th | Yes, natively: `4.5` is `9` of antd's 24 columns |
| `@rjsf/bootstrap3`      | a `col-xs-*` class                                                    | No                                               |
| `@rjsf/chakra-ui`       | `GridItem`'s `colSpan`                                                | No                                               |
| `@rjsf/daisyui`         | the column's flex basis                                               | Yes, through RJSF's own column width             |
| `@rjsf/fluentui-rc`     | the column's `gridColumn` style                                       | No                                               |
| `@rjsf/mantine`         | `Grid.Col`'s `span`                                                   | Yes, natively                                    |
| `@rjsf/mui`             | `Grid`'s `size`                                                       | Yes, natively                                    |
| `@rjsf/react-bootstrap` | `Col`'s `xs`                                                          | No                                               |
| `@rjsf/shadcn`          | the column's `grid-column` style                                      | No                                               |

Use whole numbers in the themes without half steps: their grids span whole tracks or name a class per width, and a half
step there logs a warning. antd rounds a `span` finer than a half step, such as `4.3`, to the nearest one and logs a
warning saying so. daisyui's column widths assume its row's default `gap-4`, so a row given another gap gets
slightly wrong widths, and a full row of spans may wrap. A mantine row with `fluid: false` also grows its columns to fill
each line, so spans that add up to less than 12 stretch; give that row `grow: false` to keep them as written.

A theme's own width prop wins over `span`: a `flex` prop or a `flex`, `flexBasis` or `width` style in antd, `size` in mui, `xs` in react-bootstrap, `colSpan` in chakra-ui, a `gridColumn`
style in fluentui-rc, a `flex`, `flexBasis` or `width` style or a `basis-*` or `w-*` class in daisyui, a `col-xs-*` class in bootstrap3 and a `col-span-*` class in shadcn,
responsive ones such as `md:col-span-6` included. The column then ignores its `span`, and RJSF logs a warning saying so,
once. antd's breakpoint props, such as `md`, take over from `span` at their breakpoints, as they do over antd's own
`span`, and so do bootstrap3's `col-sm-*`, `col-md-*` and `col-lg-*` classes.

In chakra-ui, fluentui-rc and shadcn, a `ui:row` without a column template of its own (`templateColumns`, `templateAreas`, `columns`,
a `gridTemplateColumns`, `gridTemplateAreas`, `gridTemplate` or `grid` style, the same keys in chakra-ui's `css`, or a `grid-cols-*` class) lays out on 12 tracks, where each child is full width unless it
spans fewer. A row with a template of its own keeps it, and a `span` then counts that template's tracks, as it counts the
tracks of a mantine or mui row given `columns` of its own.

In shadcn a column's `span` is an inline `grid-column` style, which overrides a `col-start-*` or `col-end-*` class beside
it; place such a column with a `gridColumnStart` style instead.

In bootstrap3, give each `ui:row` that holds columns Bootstrap's `row` class (`className: 'row'`), which clears the
floated `col-xs-*` columns and lines their padding up with the content around the row.

## Defining the LayoutGridField to render fields conditionally

The `GridLayoutField` also supports the concept of conditionally rendering a set of fields based upon the value(s) of
another field within the `formData`. Because the layout grid works on a field-by-field basis, it treats the render of a
`anyOf` or `oneOf` field differently. It presents to the user ONLY the checkbox group (anyOf) or radio button group
(oneOf). In order to render any nested fields associated with them, one has to explicitly specify them in the `uiSchema`.

For the purposes of demonstrating the feature, let's work with a `schema` containing a fairly simple `oneOf` field with
nested objects:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "title": "My Name",
      "type": "string"
    },
    "favorite": {
      "title": "My Favorite Shape",
      "discriminator": {
        "propertyName": "shape"
      },
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "shape": {
              "title": "Line",
              "type": "string",
              "const": "line"
            },
            "length": {
              "title": "Line Length",
              "type": "number"
            }
          },
          "required": ["shape", "length"]
        },
        {
          "type": "object",
          "properties": {
            "shape": {
              "title": "Circle",
              "type": "string",
              "const": "circle"
            },
            "radius": {
              "title": "Radius",
              "type": "number"
            }
          },
          "required": ["shape", "radius"]
        },
        {
          "type": "object",
          "properties": {
            "shape": {
              "title": "Polygon",
              "type": "string",
              "const": "polygon"
            },
            "sides": {
              "title": "# of Sides",
              "type": "number",
              "minimum": 3,
              "default": 3
            },
            "length": {
              "title": "Side Length",
              "type": "number"
            }
          },
          "required": ["shape", "sides"]
        }
      ]
    }
  },
  "required": ["name"]
}
```

If you were to pass this `schema` to the RJSF `Form` you will end up with the following UI, shown here as a simple ASCII
drawing:

```text
My Favorite Shape
  My Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  My Favorite Shape
    +--------------------------------------------------------------------------+
    | My Favorite Shape option 1                                             v |
    +--------------------------------------------------------------------------+

   Favorite
    Line*
    +--------------------------------------------------------------------------+
    | line                                                                     |
    +--------------------------------------------------------------------------+

    Line Length*
    +--------------------------------------------------------------------------+
    |                                                                          |
    +--------------------------------------------------------------------------+
```

The second input is a dropdown with the values `My Favorite Shape option 1`, `My Favorite Shape option 2` and
`My Favorite Shape option 3`. When you change the dropdown the other fields below it change to match the objects within
the `oneOf` as follows:

```text
My Favorite Shape
  My Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  My Favorite Shape
    +--------------------------------------------------------------------------+
    | My Favorite Shape option 2                                             v |
    +--------------------------------------------------------------------------+

   Favorite
    Circle*
    +--------------------------------------------------------------------------+
    | cirle                                                                    |
    +--------------------------------------------------------------------------+

    Radius*
    +--------------------------------------------------------------------------+
    |                                                                          |
    +--------------------------------------------------------------------------+
```

and

```text
My Favorite Shape
  My Name*
  +------------------------------------------------------------------------------+
  |                                                                              |
  +------------------------------------------------------------------------------+

  My Favorite Shape
    +--------------------------------------------------------------------------+
    | My Favorite Shape option 3                                             v |
    +--------------------------------------------------------------------------+

   Favorite
    Polygon*
    +--------------------------------------------------------------------------+
    | polygon                                                                  |
    +--------------------------------------------------------------------------+

    # of Sides*
    +--------------------------------------------------------------------------+
    | 3                                                                        |
    +--------------------------------------------------------------------------+

    Side Length
    +--------------------------------------------------------------------------+
    |                                                                          |
    +--------------------------------------------------------------------------+
```

> NOTE: The `LayoutGridField` can't place the option selector of a root-level `anyOf` or `oneOf` object since it requires
> that everything being displayed have a field id and the selector doesn't. The options render beside the grid, so a cell
> for an option's property renders a second input with the same id, unless
> [`ui:fieldReplacesAnyOrOneOf`](../api-reference/uiSchema.md#uifieldreplacesanyoroneof) replaces the options, which
> leaves no option selector.

Now let's add a `uiSchema` that will allow us to create a much more pleasing UI where the dropdown contains the actual
`oneOf` values and the fields all show up on the side of the dropdown:

```json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "children": [
        {
          "ui:col": {
            "span": 12,
            "children": ["name"]
          }
        },
        {
          "ui:col": {
            "span": 4,
            "children": ["favorite"]
          }
        },
        {
          "ui:condition": {
            "field": "favorite.shape",
            "value": "line",
            "operator": "all",
            "children": [
              {
                "ui:col": {
                  "span": 4,
                  "children": ["favorite.length"]
                }
              }
            ]
          }
        },
        {
          "ui:condition": {
            "field": "favorite.shape",
            "value": "circle",
            "operator": "all",
            "children": [
              {
                "ui:col": {
                  "span": 4,
                  "children": ["favorite.radius"]
                }
              }
            ]
          }
        },
        {
          "ui:condition": {
            "field": "favorite.shape",
            "value": "polygon",
            "operator": "all",
            "children": [
              {
                "ui:columns": {
                  "span": 4,
                  "children": ["favorite.sides", "favorite.length"]
                }
              }
            ]
          }
        }
      ]
    }
  },
  "favorite": {
    "ui:widget": "select"
  }
}
```

This results in the following UI using the `core` theme's grid:

```text
  My Name*
  +--------------------------------------------------------------------------------------+
  |                                                                                      |
  +--------------------------------------------------------------------------------------+

  My Favorite Shape*            Line Length*
  +--------------------------+  +--------------------------+
  | Line                   v |  |                          |
  +--------------------------+  +--------------------------+
```

and

```text
  My Name*
  +--------------------------------------------------------------------------------------+
  |                                                                                      |
  +--------------------------------------------------------------------------------------+

  My Favorite Shape*            Radius*
  +--------------------------+  +--------------------------+
  | Circle                 v |  |                          |
  +--------------------------+  +--------------------------+
```

and

```text
  My Name*
  +--------------------------------------------------------------------------------------+
  |                                                                                      |
  +--------------------------------------------------------------------------------------+

  My Favorite Shape*            # of Sides*                   Side Length
  +--------------------------+  +--------------------------+  +--------------------------+
  | Polygon                v |  | 3                        |  |                          |
  +--------------------------+  +--------------------------+  +--------------------------+
```

Since every column in the above example has a `span`, it lays out the same way in every theme.

### `ui:condition`

The `ui:condition` "syntax" represents conditional rendering of data in the grid. The condition has four required
properties, `field`, `value`, `operator` and `children`. Let's talk about each in turn.

- `field`: The dotted-path name of a leaf-level field that makes up the left-side of the condition, used to get data from the `formData`
- `value`: A single value or a list of values that make up the right-side of the condition
- `operator`: One of the following three options that controls how the left and right sides of the condition are compared
  1. `all`: This operator will pass when the right-side and left-side contains all the same value(s)
  2. `some`: This operator will pass when the right-side and left-side contain as least one value in common
  3. `none`: This operator will pass when the right-side and left-side do not contain any values in common
- `children`: The list of `ui:row`, `ui:col` or `ui:columns` definitions to display when the condition is true

In the example above, when the `favorite.shape` field value is `line` then the `favorite.length` field is displayed in
the grid spanning 4 columns. When it is `circle`, then `favorite.radius` is displayed in the grid spanning 4 columns.
When it is `polygon`, then `favorite.sides` and `favorite.length` are displayed in the grid, each spanning 4 columns.

We leave it up to the reader to create other examples that use different `operator`s.

## Other capabilities of the LayoutGridField

There are a few more small features that the `LayoutGridField` supports. First, there is a `FormContext` named lookup
capability that allows one to provide a name-mapped set of strings, components and functions in the `FormContext` inside
of a well-known location, `layoutGridLookupMap` and then reference those names within the `uiSchema`. Second, the grid
rendering code recognizes an alternate "syntax" for the objects in `children` arrays in order to display any random
React element within a grid. Below are examples of them both.

### Named lookup support for className

Since some themes, like `mui`, support CSS-in-JS class names, one cannot hard-code the actual `className` in the
`uiSchema` easily. That is where the name-mapped information in the `FormContext` comes into play. Let's assume that
you are using a theme like `mui` and you need to style a `Grid` using CSS-in-JS you could do something like the following:

```json uiSchema.json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "className": "GridStyle anotherClass",
      "children": ["person.last", "person.first"]
    }
  }
}
```

```tsx
import { styled, Grid } from '@mui/material';
import Form from '@rjsf/core';
import { LOOKUP_MAP_NAME, FormContextType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// Import the Person Info schema from above
import schema from './personSchema.json';
// Import the UI Schema from the file above
import uiSchema from './uiSchema.json';

const css = {
  STYLED_GRID: 'StyledGrid',
};

// Define the style
const StyledGrid = styled(Grid)`
  ${`& .${css.STYLED_GRID}`} {
    p {
      /* Override default presentation of <p> tags within a grid  */
      font-weight: bold
      color: dark-purple !important;
    }
  }
`;

// Add the style to the `LOOKUP_MAP_NAME` that the `LayoutGridField` uses
const formContext: FormContextType = {
  [LOOKUP_MAP_NAME]: {
    GridStyle: css.STYLED_GRID,
  },
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={formContext} />,
  document.getElementById('app'),
);
```

As you can see in the example, we've created a `FormContext` that has the named-lookup map containing the
`css.STYLED_GRID` object mapped to `GridStyle`. In the `uiSchema` we then add `GridStyle` as the `className` for the
grid rows. Under the hood, the `LayoutGridField` automatically goes through the `className` props and does a lookup of
each class name in the `FormContext`, replacing the `GridStyle` with the generated `css.GRID_STYLE` name. And because the
other class name in the example, `anotherClass`, is not mapped in the named-lookup map, it will passed to the
`GridTemplate` as is. In summary, if the CSS-in-JS class is called `StyledGrid-1asd123` then the `className` property
passed to the `GridTemplate` will be `"StyledGrid-1asd123 anotherClass"`.

### Rendering a custom React element in the grid

Because you have full control of how you layout your components in the grid, what do you do when you want to add an
element to your presentation that isn't directly associated with a `schema`, like say an image? Well, that is actually
really easy using a variant of the "syntax" for a `children` node in the `uiSchema`. Here's how:

```json shapeUiSchema.json
{
  "ui:field": "LayoutGridField",
  "ui:layoutGrid": {
    "ui:row": {
      "children": [
        {
          "ui:col": {
            "span": 12,
            "children": ["name"]
          }
        },
        {
          "ui:col": {
            "span": 4,
            "children": ["favorite"]
          }
        },
        {
          "ui:condition": {
            "field": "favorite.shape",
            "value": "line",
            "operator": "all",
            "children": [
              {
                "ui:col": {
                  "span": 2,
                  "children": [
                    {
                      "name": "",
                      "render": "LineImageComponent",
                      "size": "small-size"
                    }
                  ]
                }
              },
              {
                "ui:col": {
                  "span": 4,
                  "children": ["favorite.length"]
                }
              }
            ]
          }
        },
        {
          "ui:condition": {
            "field": "favorite.shape",
            "value": "circle",
            "operator": "all",
            "children": [
              {
                "ui:col": {
                  "span": 2,
                  "children": [
                    {
                      "name": "",
                      "render": "CircleImageComponent",
                      "size": "small-size"
                    }
                  ]
                }
              },
              {
                "ui:col": {
                  "span": 4,
                  "children": ["favorite.radius"]
                }
              }
            ]
          }
        },
        {
          "ui:condition": {
            "field": "favorite.shape",
            "value": "polygon",
            "operator": "all",
            "children": [
              {
                "ui:col": {
                  "span": 2,
                  "children": [
                    {
                      "name": "",
                      "render": "PolygonImageComponent",
                      "size": "small-size"
                    }
                  ]
                }
              },
              {
                "ui:columns": {
                  "span": 3,
                  "children": ["favorite.sides", "favorite.length"]
                }
              }
            ]
          }
        }
      ]
    }
  },
  "favorite": {
    "ui:widget": "select"
  }
}
```

```tsx
import Form from '@rjsf/core';
import { LOOKUP_MAP_NAME, FormContextType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// Import the My Favorite Shape schema from above section
import schema from './shapeSchema.json';
// Import the UI Schema from the file above
import uiSchema from './shapeUiSchema.json';
// Now import my 3 shape React components
import { LineShape, CircleShape, PolygonShape } from './myShapes';

// Add the style to the `LOOKUP_MAP_NAME` that the `LayoutGridField` uses
const formContext: FormContextType = {
  [LOOKUP_MAP_NAME]: {
    LineImageComponent: LineShape,
    CircleImageComponent: CircleShape,
    PolygonImageComponent: PolygonShape,
  },
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={formContext} />,
  document.getElementById('app'),
);
```

As you can see in the example, we've created a `FormContext` that contains the named-lookup map containing the three
components (`LineShape`, `CircleShape`, `PolygonShape`) mapped to the lookup keys `LineImageComponent`,
`CircleImageComponent`, `PolygonImageComponent` respectively. In the `uiSchema`, we use the optional `render` property
in the `children` object "syntax" to define the lookup name of the component we want to use. The `LayoutGridField` will
then do a lookup of the `render` string. If you forget to add the `formContext` or the mapping in the `LOOKUP_NAME_MAP`
then nothing will be rendered.

If you provide an empty string as the `name` along with the `render`, then your component will be rendered only with any
additional properties passed in the `children` object. If you provide a `name` that matches a field in the `schema`,
then the `render` component won't be used. Otherwise, the `render` component will be passed all of the `FieldProp`s,
including the `schema`, `uiSchema`, `fieldPath`, `id`, `errorSchema`, `formData`, `registry`, etc.

So our example will render the `LineShape` component with `size: 'small-size'` in the second column between the
`My Favorite Shape` dropdown and the `Line Length` input. Also, it will render the `CircleShape` component with
`size: 'small-size'` in the second column between the `My Favorite Shape` dropdown and the `Radius` input. Finally,
it will render the `PolygonShape` component with `size: 'small-size'` in the second column between the
`My Favorite Shape` dropdown and the `# of Sides` input.

#### Passing components directly in uiSchema

The `render` "syntax" also works if you have an object-based `uiSchema` and pass the component function directly rather
than use a named lookup. For example:

```tsx
import Form from '@rjsf/core';
import { LOOKUP_MAP_NAME, FormContextType, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// Import the My Favorite Shape schema from above section
import schema from './shapeSchema.json';
// Now import my 3 shape React components that understand how to extract the props from `formData`
import { LineShape, CircleShape, PolygonShape } from './myShapes';

const uiSchema: UiSchema = {
  'ui:field': 'LayoutGridField',
  'ui:layoutGrid': {
    'ui:row': {
      children: [
        {
          'ui:col': {
            span: 12,
            children: ['name'],
          },
        },
        {
          'ui:col': {
            span: 4,
            children: ['favorite'],
          },
        },
        {
          'ui:condition': {
            field: 'favorite.shape',
            value: 'line',
            operator: 'all',
            children: [
              {
                'ui:col': {
                  span: 4,
                  children: ['favorite.length'],
                },
              },
              {
                'ui:col': {
                  span: 12,
                  children: [
                    {
                      name: 'lineImage',
                      render: LineShape,
                      dataPath: 'favorite.length',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          'ui:condition': {
            field: 'favorite.shape',
            value: 'circle',
            operator: 'all',
            children: [
              {
                'ui:col': {
                  span: 4,
                  children: ['favorite.radius'],
                },
              },
              {
                'ui:col': {
                  span: 12,
                  children: [
                    {
                      name: 'circleShape',
                      render: CircleShape,
                      dataPath: 'favorite.radius',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          'ui:condition': {
            field: 'favorite.shape',
            value: 'polygon',
            operator: 'all',
            children: [
              {
                'ui:columns': {
                  span: 4,
                  children: ['favorite.sides', 'favorite.length'],
                },
              },
              {
                'ui:col': {
                  span: 12,
                  children: [
                    {
                      name: 'polygonShape',
                      render: PolygonShape,
                      dataPaths: ['favorite.sides', 'favorite.length'],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
  favorite: {
    'ui:widget': 'select',
  },
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={formContext} />,
  document.getElementById('app'),
);
```

Let's assume that the `LineShape`, `CircleShape` and `PolygonShape` components configured above use the `dataPath[s]`
property to extract the fields from the `formData` that is being passed to them in order to display the exact size of
the shape. The grid above will render the `*Shape` components in a 12-wide column below the field inputs.

### Other named lookup situations

Other `children` properties also do named lookups. In the `shapeUiSchema.json` example above, if the `*Shape` components
are upgraded to change the input of the `size` prop to have newer values, one could use the `FormContext` to map the
`small-size` value to a newer value. For example, if you wanted to use the new `medium` value for the `size` prop, or
if you wanted to programmatically control which size to use outside of the `Form` you could update the example as
follows:

```tsx
import Form from '@rjsf/core';
import { LOOKUP_MAP_NAME, FormContextType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// Import the My Favorite Shape schema from above section
import schema from './shapeSchema.json';
// Import the UI Schema from the file above
import uiSchema from './shapeUiSchema.json';
// Now import my 3 shape React components
import { LineShape, CircleShape, PolygonShape } from './myShapes';

const MEDIUM_SIZE = 'medium';

// Add the style to the `LOOKUP_MAP_NAME` that the `LayoutGridField` uses
const formContext: FormContextType = {
  [LOOKUP_MAP_NAME]: {
    LineImageComponent: LineShape,
    CircleImageComponent: CircleShape,
    PolygonImageComponent: PolygonShape,
    'small-size': MEDIUM_SIZE,
  },
};

render(
  <Form schema={schema} uiSchema={uiSchema} validator={validator} formContext={formContext} />,
  document.getElementById('app'),
);
```

## So much flexibility available

These examples are just a tiny fraction of the ways the `LayoutGridField` can be used. Remember, understand the theme's
grid system and the "syntax" described above and [here](../api-reference/LayoutGridField.md). Play around, you can build
just about any UI you want and still have it populate the JSON schema's `formData`!

**ENJOY!!**

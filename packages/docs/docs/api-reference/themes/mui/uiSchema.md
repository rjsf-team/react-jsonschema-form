# MUI Customization

You can customize the underlying Material UI (MUI) components used by `@rjsf/mui` by passing props directly through the `uiSchema`. This is extremely useful for applying simple customizations (like adding an `endAdornment` to an input field, tweaking margins, or changing variants) without having to build a completely custom Widget or Template.

## Basic Usage

The `@rjsf/mui` package looks for a `mui` key inside the `ui:options` of your `uiSchema`. Any top-level properties defined here will be applied to the primary MUI wrapper component for that field (e.g. `TextField` for inputs, `FormGroup` for checkboxes, `Paper`/`Grid` for object/array wrappers).

```json
{
  "myField": {
    "ui:options": {
      "mui": {
        "variant": "filled",
        "fullWidth": false,
        "sx": {
          "backgroundColor": "background.paper",
          "padding": 2
        }
      }
    }
  }
}
```

## `slotProps` vs `rjsfSlotProps`

`@rjsf/mui` distinguishes between two kinds of slot customization:

- **`slotProps`**: Passed directly to MUI's native `slotProps` API on a component (e.g., `TextField`'s `htmlInput`, `input`, `inputLabel` targets). These are standard MUI customization points.
- **`rjsfSlotProps`**: Used by RJSF template components (e.g., `ArrayFieldTemplate`, `ObjectFieldTemplate`) to target their specific sub-components (e.g., `paper`, `grid`, `box`). This key is explicitly extracted before spreading, which **prevents prop bleeding** — ensuring configuration is not accidentally passed to unintended child components.

### Using `slotProps` (for MUI widgets like `BaseInputTemplate`)

```json
{
  "myPriceField": {
    "ui:options": {
      "mui": {
        "slotProps": {
          "input": {
            "startAdornment": "$"
          }
        }
      }
    }
  }
}
```

### Using `rjsfSlotProps` (for structural templates)

```json
{
  "myArrayField": {
    "ui:options": {
      "mui": {
        "rjsfSlotProps": {
          "paper": {
            "elevation": 10
          }
        }
      }
    }
  }
}
```

## Customizing Templates (e.g. Object and Array wrappers)

MUI theme customizations are natively passed down into both your standard fields and their wrapping structural templates (like `ArrayFieldTemplate` or `ObjectFieldTemplate`) (see [table below](#components-and-their-rjsfslotprops-targets)).

If you wish to specifically target the _individual array items_ handled by `ArrayFieldItemTemplate` instead of the whole array container, you nest these overrides by targeting the `items` inside the schema:

```json
{
  "myArrayField": {
    "items": {
      "ui:options": {
        "mui": {
          "rjsfSlotProps": {
            "gridContainer": {
              "spacing": 2
            }
          }
        }
      }
    }
  }
}
```

### Components and their `rjsfSlotProps` targets

Different templates and widgets expose different `rjsfSlotProps` targets based on their underlying MUI composition.

| RJSF Component               | `rjsfSlotProps` targets available | Description                                                                           |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| **BaseInputTemplate**        | _(uses native `slotProps`)_       | Uses MUI's `slotProps.htmlInput`, `slotProps.input`, `slotProps.inputLabel` directly. |
| **FieldTemplate**            | `formControl`                     | Props passed to the outer `FormControl` wrapper.                                      |
|                              | `typography`                      | Props passed to the `Typography` component used for the description.                  |
| **ObjectFieldTemplate**      | `gridContainer`                   | Props passed to the outer `Grid` container.                                           |
|                              | `gridItem`                        | Props passed to each property's `Grid` item.                                          |
|                              | `addButtonGridContainer`          | Props passed to the `Grid` container adjacent to the Add button.                      |
|                              | `addButtonGridItem`               | Props passed to the `Grid` item wrapping the Add button.                              |
| **ArrayFieldTemplate**       | `box`                             | Props passed to the inner `Box` container holding the array items.                    |
|                              | `paper`                           | Props passed to the outer `Paper` wrapper.                                            |
|                              | `addButtonGridContainer`          | Props passed to the `Grid` container adjacent to the Add button.                      |
|                              | `addButtonGridItem`               | Props passed to the `Grid` item wrapping the Add button.                              |
|                              | `addButtonBox`                    | Props passed to the `Box` wrapping the Add button.                                    |
| **ArrayFieldItemTemplate**   | `gridContainer`                   | Props passed to the outer `Grid` container for the item row.                          |
|                              | `gridItem`                        | Props passed to the content `Grid` item.                                              |
|                              | `outerBox`                        | Props passed to the outer `Box`.                                                      |
|                              | `paper`                           | Props passed to the `Paper` elevation component.                                      |
|                              | `innerBox`                        | Props passed to the inner `Box` holding the children.                                 |
|                              | `toolbarGrid`                     | Props passed to the `Grid` holding the toolbar buttons.                               |
| **CheckboxesWidget**         | `formGroup`                       | Props passed to the `FormGroup` container.                                            |
|                              | `checkbox`                        | Props passed to individual `Checkbox` components.                                     |
|                              | `formControlLabel`                | Props passed to the `FormControlLabel` components wrapping each checkbox.             |
| **CheckboxWidget**           | `checkbox`                        | Props passed to the single `Checkbox` component.                                      |
|                              | `formControlLabel`                | Props passed to the `FormControlLabel` component wrapping the checkbox.               |
| **RadioWidget**              | `radioGroup`                      | Props passed to the `RadioGroup` component.                                           |
|                              | `radio`                           | Props passed to the individual `Radio` components.                                    |
|                              | `formControlLabel`                | Props passed to the `FormControlLabel` components wrapping each radio.                |
| **SelectWidget**             | `inputLabel`                      | Props passed to the native MUI `InputLabel` component.                                |
|                              | `select`                          | Props passed to the native MUI `Select` component.                                    |
| **ErrorList**                | `box`                             | Props passed to the inner `Box`.                                                      |
|                              | `list`                            | Props passed to the `List` container.                                                 |
|                              | `listItem`                        | Props passed to individual `ListItem` components wrapping each error.                 |
|                              | `listItemIcon`                    | Props passed to the `ListItemIcon` next to each error.                                |
|                              | `listItemText`                    | Props passed to the `ListItemText` displaying the error.                              |
|                              | `paper`                           | Props passed to the outer `Paper` wrapper.                                            |
|                              | `typography`                      | Props passed to the `Typography` displaying the "Errors" title.                       |
| **FieldErrorTemplate**       | `list`                            | Props passed to the `List` container.                                                 |
|                              | `listItem`                        | Props passed to individual `ListItem` components.                                     |
|                              | `formHelperText`                  | Props passed to the `FormHelperText` displaying the error text.                       |
| **FieldHelpTemplate**        | `formHelperText`                  | Props passed to the `FormHelperText` used for help text.                              |
| **DescriptionField**         | `typography`                      | Props passed to the `Typography` component.                                           |
| **TitleField**               | `box`                             | Props passed to the outer `Box` wrapper.                                              |
|                              | `divider`                         | Props passed to the `Divider` element.                                                |
|                              | `typography`                      | Props passed to the `Typography` component used for the title.                        |
|                              | `gridContainer`                   | Props passed to `Grid` container when title has optional data controls.               |
|                              | `gridItem`                        | Props passed to the `Grid` item containing the title.                                 |
|                              | `optionalDataGridItem`            | Props passed to the `Grid` item containing the optional data control.                 |
| **MultiSchemaFieldTemplate** | `box`                             | Props passed to the wrapper `Box`.                                                    |
|                              | `formControl`                     | Props passed to the wrapper `FormControl`.                                            |
| **SubmitButton**             | `box`                             | Props passed to the `Box` wrapping the submit button.                                 |
|                              | `button`                          | Props passed to the `Button` element.                                                 |
| **WrapIfAdditionalTemplate** | `gridContainer`                   | Props passed to the outer `Grid` container.                                           |
|                              | `keyGridItem`                     | Props passed to the `Grid` item containing the key `TextField`.                       |
|                              | `childrenGridItem`                | Props passed to the `Grid` item containing the field children.                        |
|                              | `removeButtonGridItem`            | Props passed to the `Grid` item containing the remove button.                         |

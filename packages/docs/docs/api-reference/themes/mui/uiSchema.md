# MUI Customization

You can customize the underlying Material UI (MUI) components used by `@rjsf/mui` by passing props directly through the `uiSchema`. This is extremely useful for applying simple customizations (like adding an `endAdornment` to an input field, tweaking margins, or changing variants) without having to build a completely custom Widget or Template.

## Basic Usage

The `@rjsf/mui` package looks for an `mui` key inside the `ui:options` of your `uiSchema`. Any top-level properties defined here will be applied to the primary MUI wrapper component for that field (e.g. `TextField` for inputs, `FormGroup` for checkboxes, `Paper`/`Grid` for object/array wrappers).

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

## `slotProps` (Targeting nested components)

Many RJSF templates and widgets are composed of several nested MUI components. To prevent unintended property "leakage" (e.g., passing a `TextField` prop onto an outer `FormControl`), `@rjsf/mui` uses a **Root-plus-Slot** pattern.

Top-level standard MUI props are applied to the primary component. To pass custom props to specific nested components, use the `slotProps` key within the `mui` object.

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

### Components and their `slotProps` targets

Different templates and widgets expose different `slotProps` targets based on their underlying MUI composition.

| RJSF Component               | `slotProps` targets available | Description                                                                          |
| ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| **BaseInputTemplate**        | `htmlInput`                   | Props passed to the base native HTML `<input>` or `<textarea>` element.              |
|                              | `input`                       | Props passed to the MUI `Input` element, useful for `endAdornment`/`startAdornment`. |
| **FieldTemplate**            | `formControl`                 | Props passed to the outer `FormControl` wrapper.                                     |
|                              | `typography`                  | Props passed to the `Typography` component used for the description.                 |
| **ObjectFieldTemplate**      | `grid`                        | Props passed to the various outer and inner `Grid` container elements.               |
| **ArrayFieldTemplate**       | `box`                         | Props passed to the inner `Box` container holding the array items.                   |
|                              | `paper`                       | Props passed to the outer `Paper` wrapper.                                           |
| **ArrayFieldItemTemplate**   | `grid`                        | Props passed to the `Grid` container wrapping the individual array item row.         |
| **CheckboxesWidget**         | `checkbox`                    | Props passed to individual `Checkbox` components.                                    |
|                              | `formControlLabel`            | Props passed to the `FormControlLabel` components wrapping each checkbox.            |
| **CheckboxWidget**           | `checkbox`                    | Props passed to the single `Checkbox` component.                                     |
|                              | `formControlLabel`            | Props passed to the `FormControlLabel` component wrapping the checkbox.              |
| **RadioWidget**              | `radio`                       | Props passed to the individual `Radio` components.                                   |
|                              | `formControlLabel`            | Props passed to the `FormControlLabel` components wrapping each radio.               |
| **SelectWidget**             | `inputLabel`                  | Props passed to the native MUI `InputLabel` component.                               |
|                              | `select`                      | Props passed to the native MUI `Select` component.                                   |
| **ErrorList**                | `box`                         | Props passed to the inner `Box`.                                                     |
|                              | `list`                        | Props passed to the `List` container.                                                |
|                              | `listItem`                    | Props passed to individual `ListItem` components wrapping each error.                |
|                              | `listItemIcon`                | Props passed to the `ListItemIcon` next to each error.                               |
|                              | `paper`                       | Props passed to the outer `Paper` wrapper.                                           |
|                              | `typography`                  | Props passed to the `Typography` displaying the "Errors" title.                      |
| **FieldErrorTemplate**       | `list`                        | Props passed to the `List` container.                                                |
|                              | `listItem`                    | Props passed to individual `ListItem` components.                                    |
|                              | `formHelperText`              | Props passed to the `FormHelperText` displaying the error text.                      |
| **TitleField**               | `typography`                  | Props passed to the `Typography` component used for the title.                       |
|                              | `grid`                        | Props passed to `Grid` structures when rendering titles with optional data controls. |
| **MultiSchemaFieldTemplate** | `box`                         | Props passed to the wrapper `Box`.                                                   |
|                              | `formControl`                 | Props passed to the wrapper `FormControl`.                                           |
| **SubmitButton**             | `box`                         | Props passed to the `Box` wrapping the submit button.                                |

_(Note: Simple text components like `FieldHelpTemplate` and `DescriptionField` do not use `slotProps`. Top-level `mui` props are passed directly to their main `FormHelperText` or `Typography` elements.)_

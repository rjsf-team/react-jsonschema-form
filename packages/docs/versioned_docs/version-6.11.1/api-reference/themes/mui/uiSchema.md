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
          "arrayPaper": {
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
            "arrayItemGridContainer": {
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
| **FieldTemplate**            | `fieldFormControl`                | Props passed to the outer `FormControl` wrapper.                                      |
|                              | `fieldTypography`                 | Props passed to the `Typography` component used for the description.                  |
| **ObjectFieldTemplate**      | `objectGridContainer`             | Props passed to the outer `Grid` container.                                           |
|                              | `objectGridItem`                  | Props passed to each property's `Grid` item.                                          |
|                              | `objectAddButtonGridContainer`    | Props passed to the `Grid` container adjacent to the Add button.                      |
|                              | `objectAddButtonGridItem`         | Props passed to the `Grid` item wrapping the Add button.                              |
| **ArrayFieldTemplate**       | `arrayBox`                        | Props passed to the inner `Box` container holding the array items.                    |
|                              | `arrayPaper`                      | Props passed to the outer `Paper` wrapper.                                            |
|                              | `arrayAddButtonGridContainer`     | Props passed to the `Grid` container adjacent to the Add button.                      |
|                              | `arrayAddButtonGridItem`          | Props passed to the `Grid` item wrapping the Add button.                              |
|                              | `arrayAddButtonBox`               | Props passed to the `Box` wrapping the Add button.                                    |
| **ArrayFieldItemTemplate**   | `arrayItemGridContainer`          | Props passed to the outer `Grid` container for the item row.                          |
|                              | `arrayItemGridItem`               | Props passed to the content `Grid` item.                                              |
|                              | `arrayItemOuterBox`               | Props passed to the outer `Box`.                                                      |
|                              | `arrayItemPaper`                  | Props passed to the `Paper` elevation component.                                      |
|                              | `arrayItemInnerBox`               | Props passed to the inner `Box` holding the children.                                 |
|                              | `arrayItemToolbarGrid`            | Props passed to the `Grid` holding the toolbar buttons.                               |
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
| **ErrorList**                | `errorBox`                        | Props passed to the inner `Box`.                                                      |
|                              | `errorList`                       | Props passed to the `List` container.                                                 |
|                              | `errorListItem`                   | Props passed to individual `ListItem` components wrapping each error.                 |
|                              | `errorListItemIcon`               | Props passed to the `ListItemIcon` next to each error.                                |
|                              | `errorListItemText`               | Props passed to the `ListItemText` displaying the error.                              |
|                              | `errorPaper`                      | Props passed to the outer `Paper` wrapper.                                            |
|                              | `errorTypography`                 | Props passed to the `Typography` displaying the "Errors" title.                       |
| **FieldErrorTemplate**       | `fieldErrorList`                  | Props passed to the `List` container.                                                 |
|                              | `fieldErrorListItem`              | Props passed to individual `ListItem` components.                                     |
|                              | `fieldErrorFormHelperText`        | Props passed to the `FormHelperText` displaying the error text.                       |
| **FieldHelpTemplate**        | `helpFormHelperText`              | Props passed to the `FormHelperText` used for help text.                              |
| **DescriptionField**         | `descTypography`                  | Props passed to the `Typography` component.                                           |
| **TitleField**               | `titleBox`                        | Props passed to the outer `Box` wrapper.                                              |
|                              | `titleDivider`                    | Props passed to the `Divider` element.                                                |
|                              | `titleTypography`                 | Props passed to the `Typography` component used for the title.                        |
|                              | `titleGridContainer`              | Props passed to `Grid` container when title has optional data controls.               |
|                              | `titleGridItem`                   | Props passed to the `Grid` item containing the title.                                 |
|                              | `titleOptionalDataGridItem`       | Props passed to the `Grid` item containing the optional data control.                 |
| **MultiSchemaFieldTemplate** | `multiBox`                        | Props passed to the wrapper `Box`.                                                    |
|                              | `multiFormControl`                | Props passed to the wrapper `FormControl`.                                            |
| **SubmitButton**             | `submitBox`                       | Props passed to the `Box` wrapping the submit button.                                 |
|                              | `submitButton`                    | Props passed to the `Button` element.                                                 |
| **WrapIfAdditionalTemplate** | `wrapGridContainer`               | Props passed to the outer `Grid` container.                                           |
|                              | `wrapKeyGridItem`                 | Props passed to the `Grid` item containing the key `TextField`.                       |
|                              | `wrapChildrenGridItem`            | Props passed to the `Grid` item containing the field children.                        |
|                              | `wrapRemoveButtonGridItem`        | Props passed to the `Grid` item containing the remove button.                         |

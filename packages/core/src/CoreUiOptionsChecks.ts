import type { EnumValue, UiOptionsCheck, WidgetAliasFor } from '@rjsf/utils';

import type { LayoutGridSchemaType } from './components/fields/LayoutGridField.tsx';

/** The `{ when, then }` rules describing which of `@rjsf/core`'s built-in widgets, fields and `ui:options` are valid
 * for each of the JSON Schema primitive types, based on the shape of the corresponding form-data field. Pass it as
 * `UiSchema`'s fourth type parameter (`Checks`) to narrow `ui:widget`/`ui:field`/`ui:options` to `@rjsf/core`'s own
 * vocabulary; union it with a `Checks` union of your own to extend it, since it isn't included automatically.
 *
 * This is intentionally a starting set covering the options that already exist on `UIOptionsBaseType` - it does not
 * attempt to model every widget/option combination (for example, per-widget options like `RangeWidget`'s min/max
 * come from the JSON Schema itself, not from `ui:options`, so they are not repeated here). Widget names include both
 * the registered PascalCase component name and the lowercase alias(es) `getWidget` resolves for that schema type
 * (`WidgetAliasFor`), since either spelling is a valid `ui:widget` value at runtime.
 */
export type CoreUiOptionsChecks =
  | UiOptionsCheck<
      string,
      {
        widget?:
          | 'TextWidget'
          | 'TextareaWidget'
          | 'PasswordWidget'
          | 'EmailWidget'
          | 'URLWidget'
          | 'ColorWidget'
          | 'DateWidget'
          | 'DateTimeWidget'
          | 'TimeWidget'
          | 'AltDateWidget'
          | 'AltDateTimeWidget'
          | 'SelectWidget'
          | 'RadioWidget'
          | 'FileWidget'
          | 'HiddenWidget'
          | WidgetAliasFor<'string'>;
        field?: 'StringField';
        placeholder?: string;
        rows?: number;
        inputType?: string;
        autocomplete?: HTMLInputElement['autocomplete'];
        autocapitalize?: HTMLInputElement['autocapitalize'];
        emptyValue?: string;
        filePreview?: boolean;
        inline?: boolean;
        enumDisabled?: EnumValue[];
        enumNames?: string[] | Record<string | number, string>;
        enumOrder?: EnumValue[];
      }
    >
  | UiOptionsCheck<
      number,
      {
        // `widgetMap.integer`'s aliases are identical to `widgetMap.number`'s (both are the JS `number` type at
        // runtime), so only one needs including here.
        widget?:
          | 'TextWidget'
          | 'RangeWidget'
          | 'UpDownWidget'
          | 'SelectWidget'
          | 'RadioWidget'
          | 'HiddenWidget'
          | WidgetAliasFor<'number'>;
        field?: 'NumberField';
        placeholder?: string;
        inputType?: string;
        autocomplete?: HTMLInputElement['autocomplete'];
        autocapitalize?: HTMLInputElement['autocapitalize'];
        emptyValue?: number;
        inline?: boolean;
        enumDisabled?: EnumValue[];
        enumNames?: string[] | Record<string | number, string>;
        enumOrder?: EnumValue[];
      }
    >
  | UiOptionsCheck<
      boolean,
      {
        widget?: 'CheckboxWidget' | 'RadioWidget' | 'SelectWidget' | 'HiddenWidget' | WidgetAliasFor<'boolean'>;
        field?: 'BooleanField';
        placeholder?: string;
        emptyValue?: boolean;
        inline?: boolean;
        enumDisabled?: EnumValue[];
        enumNames?: string[] | Record<string | number, string>;
        enumOrder?: EnumValue[];
      }
    >
  | UiOptionsCheck<
      null,
      {
        widget?: 'HiddenWidget';
        field?: 'NullField';
      }
    >
  | UiOptionsCheck<
      readonly unknown[],
      {
        widget?: 'CheckboxesWidget' | 'SelectWidget' | 'FileWidget' | 'HiddenWidget' | WidgetAliasFor<'array'>;
        field?: 'ArrayField';
        addable?: boolean;
        orderable?: boolean;
        removable?: boolean;
        copyable?: boolean;
        inline?: boolean;
        filePreview?: boolean;
        placeholder?: string;
        emptyValue?: unknown[];
        enumDisabled?: EnumValue[];
        enumNames?: string[] | Record<string | number, string>;
        enumOrder?: EnumValue[];
      }
    >
  | UiOptionsCheck<
      object & { [Symbol.iterator]?: never },
      {
        // Only the literal `'hidden'` has any runtime effect here: `ObjectField`/`SchemaField` decide to hide an
        // object field via `uiOptions.widget === 'hidden'`, a strict comparison to that exact alias - unlike
        // string/number/boolean/array fields, an object field never resolves `ui:widget` through `getWidget`, so
        // `'HiddenWidget'` (the PascalCase component name) does nothing for it and is deliberately not offered here.
        widget?: 'hidden';
        field?: 'ObjectField';
        optionsSchemaSelector?: string;
        order?: string[];
      }
    >
  | UiOptionsCheck<
      unknown,
      {
        // These fields are registered by `generateFields()` alongside the per-type ones above, but aren't specific
        // to any one JSON Schema type - `AnyOfField`/`OneOfField` wrap a field whose schema has an `anyOf`/`oneOf`
        // regardless of the matched subschema's type, and the rest apply structurally rather than by type. `When` is
        // `unknown` so every field, of every type, sees them alongside its own type-specific field names.
        field?:
          | 'AnyOfField'
          | 'OneOfField'
          | 'LayoutGridField'
          | 'LayoutHeaderField'
          | 'LayoutMultiSchemaField'
          | 'SchemaField'
          | 'OptionalDataControlsField'
          | 'CyclicSchemaField'
          | 'FallbackField';
        // The grid layout description read by `LayoutGridField` off `ui:layoutGrid` (`LAYOUT_GRID_OPTION`) -
        // structural, so it applies regardless of the field's type, same as the field names above.
        layoutGrid?: LayoutGridSchemaType;
      }
    >;

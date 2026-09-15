import type { EnumValue, UiOptionsCheck } from '@rjsf/utils';

/** The `{ when, then }` rules describing which of `@rjsf/core`'s built-in widgets, fields and `ui:options` are valid
 * for each of the JSON Schema primitive types, based on the shape of the corresponding form-data field. Pass it as
 * `UiSchema`'s fourth type parameter (`Checks`) to narrow `ui:widget`/`ui:field`/`ui:options` to `@rjsf/core`'s own
 * vocabulary; union it with a `Checks` union of your own to extend it, since it isn't included automatically.
 *
 * This is intentionally a starting set covering the options that already exist on `UIOptionsBaseType` - it does not
 * attempt to model every widget/option combination (for example, per-widget options like `RangeWidget`'s min/max
 * come from the JSON Schema itself, not from `ui:options`, so they are not repeated here).
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
          | 'HiddenWidget';
        field?: 'StringField';
        placeholder?: string;
        rows?: number;
        inputType?: string;
        autocomplete?: HTMLInputElement['autocomplete'];
        autocapitalize?: HTMLInputElement['autocapitalize'];
        emptyValue?: string;
        filePreview?: boolean;
        enumDisabled?: EnumValue[];
        enumNames?: string[] | Record<string | number, string>;
        enumOrder?: EnumValue[];
      }
    >
  | UiOptionsCheck<
      number,
      {
        widget?: 'TextWidget' | 'RangeWidget' | 'UpDownWidget' | 'SelectWidget' | 'RadioWidget' | 'HiddenWidget';
        field?: 'NumberField';
        enumDisabled?: EnumValue[];
        enumNames?: string[] | Record<string | number, string>;
        enumOrder?: EnumValue[];
      }
    >
  | UiOptionsCheck<
      boolean,
      {
        widget?: 'CheckboxWidget' | 'RadioWidget' | 'SelectWidget' | 'HiddenWidget';
        field?: 'BooleanField';
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
      unknown[],
      {
        widget?: 'CheckboxesWidget' | 'SelectWidget' | 'FileWidget';
        field?: 'ArrayField';
        addable?: boolean;
        orderable?: boolean;
        removable?: boolean;
        copyable?: boolean;
        inline?: boolean;
      }
    >
  | UiOptionsCheck<
      object & { length?: never },
      {
        field?: 'ObjectField';
        optionsSchemaSelector?: string;
        order?: string[];
      }
    >;

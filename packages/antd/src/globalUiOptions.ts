import type {
  GlobalUISchemaOptionsExtensions,
  ReservedUiOptionName,
  ThemeGlobalUISchemaOptions,
  UiSchema,
} from '@rjsf/utils';

/** The options this theme reads from `ui:globalOptions`, beyond the ones RJSF reads */
export interface AntdGlobalUiOptionsKeys {
  /** Whether every array item's remove button spans its column, as in a field's `ui:options` */
  block?: boolean;
}

/** The `ui:globalOptions` this theme reads, plus a user's own `UserExtensions` */
export type AntdGlobalUISchemaOptions<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof AntdGlobalUiOptionsKeys
  > = Record<never, never>,
> = ThemeGlobalUISchemaOptions<AntdGlobalUiOptionsKeys, UserExtensions>;

/** A `UiSchema` whose `ui:options` and `ui:globalOptions` are known to carry the theme's `block`, and whose
 * `ui:globalOptions` carry a user's own `UserExtensions` too.
 *
 * NOTE: intersects rather than using `Omit`, whose `keyof UiSchema` includes `UiSchema`'s string index signature and so
 * erases every named member.
 */
export type AntdUiSchema<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof AntdGlobalUiOptionsKeys
  > = Record<never, never>,
> = UiSchema & {
  'ui:options'?: UiSchema['ui:options'] & AntdGlobalUiOptionsKeys;
  'ui:globalOptions'?: AntdGlobalUISchemaOptions<UserExtensions>;
};

/** The keys of `AntdGlobalUiOptionsKeys`, which the theme declares as its `globalUiOptionsKeys` */
export const ANTD_GLOBAL_UI_OPTIONS_KEYS = Object.keys({ block: true } satisfies Record<
  keyof AntdGlobalUiOptionsKeys,
  true
>);

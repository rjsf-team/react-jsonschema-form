import type { MantineSpacing } from '@mantine/core';
import type {
  GlobalUISchemaOptionsExtensions,
  ReservedUiOptionName,
  ThemeGlobalUISchemaOptions,
  UiSchema,
} from '@rjsf/utils';

/** The options this theme reads from `ui:globalOptions`, beyond the ones RJSF reads */
export interface MantineGlobalUiOptionsKeys {
  /** The number of columns every object's `ObjectFieldTemplate` lays its properties out in, as in its `ui:options` */
  gridCols?: number;
  /** The spacing between those columns, as in an object's `ui:options` */
  gridSpacing?: MantineSpacing;
  /** The spacing between their rows, as in an object's `ui:options` */
  gridVerticalSpacing?: MantineSpacing;
}

/** The `ui:globalOptions` this theme reads, plus a user's own `UserExtensions` */
export type MantineGlobalUISchemaOptions<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof MantineGlobalUiOptionsKeys
  > = Record<never, never>,
> = ThemeGlobalUISchemaOptions<MantineGlobalUiOptionsKeys, UserExtensions>;

/** A `UiSchema` whose `ui:options` and `ui:globalOptions` are known to carry the theme's grid options, and whose
 * `ui:globalOptions` carry a user's own `UserExtensions` too.
 *
 * NOTE: intersects rather than using `Omit`, whose `keyof UiSchema` includes `UiSchema`'s string index signature and so
 * erases every named member.
 */
export type MantineUiSchema<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof MantineGlobalUiOptionsKeys
  > = Record<never, never>,
> = UiSchema & {
  'ui:options'?: UiSchema['ui:options'] & MantineGlobalUiOptionsKeys;
  'ui:globalOptions'?: MantineGlobalUISchemaOptions<UserExtensions>;
};

/** The keys of `MantineGlobalUiOptionsKeys`, which the theme declares as its `globalUiOptionsKeys` */
export const MANTINE_GLOBAL_UI_OPTIONS_KEYS = Object.keys({
  gridCols: true,
  gridSpacing: true,
  gridVerticalSpacing: true,
} satisfies Record<keyof MantineGlobalUiOptionsKeys, true>);

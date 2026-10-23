import type { GlobalUISchemaOptions, GlobalUISchemaOptionsExtensions, Registry } from './types.ts';

/** Returns the registry's `globalUiOptions` typed with the `UserExtensions` a theme or custom component reads from
 * them. The `Registry` only knows the options RJSF reads, so this is an unchecked cast: it is the caller's word that the
 * root uiSchema's `ui:globalOptions` was written against the same extensions.
 *
 * @param registry - The `Registry` holding the `globalUiOptions`
 * @returns - The registry's `globalUiOptions`, typed with `UserExtensions`, if the root uiSchema has any
 */
export default function getGlobalUiOptions<
  UserExtensions extends GlobalUISchemaOptionsExtensions<UserExtensions> = Record<never, never>,
>(registry: Pick<Registry, 'globalUiOptions'>): GlobalUISchemaOptions<UserExtensions> | undefined {
  return registry.globalUiOptions as GlobalUISchemaOptions<UserExtensions> | undefined;
}

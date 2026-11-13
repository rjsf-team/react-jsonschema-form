import type { JsxStyleProps } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import type {
  GlobalUISchemaOptionsExtensions,
  ReservedUiOptionName,
  ThemeGlobalUISchemaOptions,
  UiSchema,
} from '@rjsf/utils';
import { isObject } from '@rjsf/utils';

/** The options this theme reads from `ui:globalOptions`, beyond the ones RJSF reads */
export interface ChakraGlobalUiOptionsKeys {
  /** The style props for every field's Chakra components, as in a field's `ui:options` */
  chakra?: JsxStyleProps;
}

/** The `ui:globalOptions` this theme reads, plus a user's own `UserExtensions` */
export type ChakraGlobalUISchemaOptions<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof ChakraGlobalUiOptionsKeys
  > = Record<never, never>,
> = ThemeGlobalUISchemaOptions<ChakraGlobalUiOptionsKeys, UserExtensions>;

/** The keys of `ChakraGlobalUiOptionsKeys`, which the theme declares as its `globalUiOptionsKeys` */
export const CHAKRA_GLOBAL_UI_OPTIONS_KEYS = Object.keys({ chakra: true } satisfies Record<
  keyof ChakraGlobalUiOptionsKeys,
  true
>);

/** A `UiSchema` whose `ui:options` and `ui:globalOptions` are known to carry the theme's `chakra` prop bag, and whose
 * `ui:globalOptions` carry a user's own `UserExtensions` too.
 *
 * NOTE: intersects rather than using `Omit`, whose `keyof UiSchema` includes `UiSchema`'s string index signature and so
 * erases every named member.
 */
export type ChakraUiSchema<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof ChakraGlobalUiOptionsKeys
  > = Record<never, never>,
> = UiSchema & {
  'ui:options'?: ChakraUiOptions;
  'ui:globalOptions'?: ChakraGlobalUISchemaOptions<UserExtensions>;
};

type ChakraUiOptions = UiSchema['ui:options'] & ChakraGlobalUiOptionsKeys;

/** Reads the style props a widget's `options` carry under `chakra`. The `options` are the merged ones `getUiOptions()`
 * returns, so a `chakra` set through `ui:globalOptions` or the `ui:chakra` shorthand is read like one in `ui:options`.
 *
 * Only what Chakra knows as a style prop is returned, so nothing else in the bag reaches the component as a prop.
 *
 * NOTE: the two `never` members reject a `uiSchema` and a `{ uiSchema }` wrapper, which would otherwise fit the
 * `Record` and have no `chakra` read from them.
 */
export function getChakra(
  options: Record<string, unknown> & { 'ui:options'?: never; uiSchema?: never } = {},
): JsxStyleProps {
  const { chakra } = options;
  const chakraProps = isObject(chakra) ? chakra : {};

  // Filtered into a copy, since `chakraProps` belongs to the caller's uiSchema
  return Object.fromEntries(Object.entries(chakraProps).filter(([key]) => defaultSystem.isValidProperty(key)));
}

/** Duck-typed on `valueAsNumber`, which only inputs have, rather than `instanceof HTMLInputElement`, which is false for
 * an input rendered inside an iframe.
 */
export function isInputElement(target: EventTarget): target is HTMLInputElement {
  return 'valueAsNumber' in target;
}

/** The `aria-labelledby` for a part Ark points at a label of its own: the one the plan names, else Ark's own pointer
 * where a label is drawn here, or, with no label drawn, an empty one, since Ark ignores an undefined override and would
 * point the part at a label that isn't rendered
 *
 * @param plannedLabelledBy - The `aria-labelledby` the field's plan gives the part, if any
 * @param drawsLabel - Whether a label is drawn for the part to point at
 * @returns - The `aria-labelledby` to pass, or undefined to keep Ark's
 */
export function labelledByOrNone(plannedLabelledBy: string | undefined, drawsLabel: boolean): string | undefined {
  return plannedLabelledBy ?? (drawsLabel ? undefined : '');
}

import type { JsxStyleProps } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import type { UiSchema } from '@rjsf/utils';
import { isObject } from '@rjsf/utils';

/** A `UiSchema` whose `ui:options` are known to carry the theme's `chakra` prop bag.
 *
 * NOTE: intersects rather than using `Omit`, whose `keyof UiSchema` includes `UiSchema`'s string index signature and so
 * erases every named member.
 */
export type ChakraUiSchema = UiSchema & {
  'ui:options'?: ChakraUiOptions;
};

type ChakraUiOptions = UiSchema['ui:options'] & { chakra?: JsxStyleProps };

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

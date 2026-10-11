import type { JsxStyleProps } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import shouldForwardProp from '@emotion/is-prop-valid';
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

/** Reads the style props a `uiSchema` carries under `ui:options.chakra`.
 *
 * NOTE: takes only the member it reads rather than a `ChakraUiSchema`, which a widget's `UiSchema<T, S, F>` does not
 * fit, and whose index signature would accept a wrapper such as `{ uiSchema }` and read nothing from it.
 */
export function getChakra(uiSchema: { 'ui:options'?: Record<string, unknown> } = {}): JsxStyleProps {
  const { chakra } = uiSchema['ui:options'] ?? {};
  const chakraProps = isObject(chakra) ? chakra : {};

  /**
   * Leveraging `shouldForwardProp` to remove props
   * https://chakra-ui.com/docs/styling/chakra-factory#forwarding-props
   *
   * Filtered into a copy, since `chakraProps` belongs to the caller's uiSchema.
   */
  return Object.fromEntries(
    Object.entries(chakraProps).filter(([key]) => defaultSystem.isValidProperty(key) && !shouldForwardProp(key)),
  );
}

/** Duck-typed on `valueAsNumber`, which only inputs have, rather than `instanceof HTMLInputElement`, which is false for
 * an input rendered inside an iframe.
 */
export function isInputElement(target: EventTarget): target is HTMLInputElement {
  return 'valueAsNumber' in target;
}

import { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from '@rjsf/utils';

/** Carbon theme options
 */
export interface CarbonOptions {
  /**Gap between each form item, default to `7` (2.5rem)
   * @see https://carbondesignsystem.com/guidelines/spacing/overview/#spacing-scale
   */
  gap: number;
  /**Padding in layer background, default to `3` (0.5rem)
   * @see https://carbondesignsystem.com/guidelines/spacing/overview/#spacing-scale
   */
  padding: number;
  /** Size of form item.
   *
   * Note that some of the `@carbon/react` component doesn't support `xl` and will fallback to `lg`
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Default carbon theme options
 */
const defaultCarbonOptions: CarbonOptions = {
  gap: 7,
  padding: 5,
};

/** Get carbon theme options from `formContext` and `ui:carbon` uiSchema options.
 *
 * ```js
 * const defaultCarbonOptions: CarbonOptions = {
 *   gap: 7,
 * };
 * ```
 */
export default function getCarbonOptions<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(formContext: F, uiOptions: UIOptionsType<T, S, F> = {}): CarbonOptions {
  return Object.assign({}, defaultCarbonOptions, formContext?.carbon, uiOptions?.carbon);
}

/** Limit max size to lg
 */
export function maxLgSize(size: 'sm' | 'md' | 'lg' | 'xl' | undefined) {
  return size === 'xl' ? 'lg' : size;
}

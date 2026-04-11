import { OptionValueFormat } from './types';

/** Resolves the effective `optionValueFormat` for enum-backed widgets.
 *
 * Provides a single source of truth for the default DOM encoding format
 * (`'indexed'`) used by `SelectWidget`, `RadioWidget`, and `CheckboxesWidget`.
 * Widgets should call this helper once and pass the result to
 * `enumOptionValueEncoder`, `enumOptionValueDecoder`, and `enumOptionSelectedValue`
 * rather than reading `options.optionValueFormat` directly.
 *
 * @param options - The widget options (typically from the `options` prop, already
 *   resolved from `ui:options` and `ui:globalOptions`)
 * @returns The resolved `OptionValueFormat`, defaulting to `'indexed'` when not set
 */
export default function getOptionValueFormat(options?: { optionValueFormat?: OptionValueFormat }): OptionValueFormat {
  return options?.optionValueFormat ?? 'indexed';
}

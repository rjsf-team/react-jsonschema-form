import { AliasReplacerArguments } from 'tsc-alias';

/** A `tsc-alias` replacer that fixes up the imports `from 'ajv/dist/standalone'` to be
 * `from `ajv/dist/standalone/index.js`
 *
 * @param orig - The original import name
 */
export default function antdIconsReplacer({ orig }: AliasReplacerArguments): string {
  if (orig.startsWith("from '@ant-design/icons/")) {
    const origIcons = orig.substring(0, orig.length - 1);
    return `${origIcons}.js'`;
  }

  return orig;
}

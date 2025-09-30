import { AliasReplacerArguments } from 'tsc-alias';

/** A `tsc-alias` replacer that fixes up the imports `from 'ajv/dist/standalone'` to be
 * `from `ajv/dist/standalone/index.js`
 *
 * @param orig - The original import name
 */
export default function ajvReplacer({ orig }: AliasReplacerArguments): string {
  if (orig.startsWith("from 'ajv/dist/standalone")) {
    const origLodashEs = orig.substring(0, orig.length - 1);
    return `${origLodashEs}/index.js'`;
  }

  return orig;
}

import { AliasReplacerArguments } from 'tsc-alias';

/** A `tsc-alias` replacer that fixes up the imports `from 'lodash/xxxx'` to be `from `lodash/xxxx.js`
 *
 * @param orig - The original import name
 */
export default function lodashReplacer({ orig }: AliasReplacerArguments): string {
  if (orig.startsWith("from 'lodash/")) {
    const origLodashEs = orig.substring(0, orig.length - 1).replace('lodash/', 'lodash-es/');
    // console.log(origLodashEs);
    return `${origLodashEs}.js'`;
  }

  return orig;
}

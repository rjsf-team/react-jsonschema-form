import { AliasReplacerArguments } from 'tsc-alias';

/** A `tsc-alias` replacer that fixes up the imports `from 'lodash/xxxx'` to be `from `lodash/xxxx.js`
 *
 * @param orig - The original import name
 */
export default function exampleReplacer({ orig }: AliasReplacerArguments): string {
  if (orig.startsWith("from '@mui/material/")) {
    const origMinusEndQuote = orig.substring(0, orig.length - 1);
    // console.log(origMinusEndQuote);
    return `${origMinusEndQuote}/index.js'`;
  }

  return orig;
}

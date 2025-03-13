import { AliasReplacerArguments } from 'tsc-alias';

/** A `tsc-alias` replacer that fixes up the imports `from '@mui/xxxx'` to be `from `@mui/xxxx/index.js`
 *
 * @param orig - The original import name
 */
export default function muiReplacer({ orig }: AliasReplacerArguments): string {
  if (orig.startsWith("from '@mui/material/")) {
    const origMinusEndQuote = orig.substring(0, orig.length - 1);
    // console.log(origMinusEndQuote);
    return `${origMinusEndQuote}/index.js'`;
  }

  return orig;
}

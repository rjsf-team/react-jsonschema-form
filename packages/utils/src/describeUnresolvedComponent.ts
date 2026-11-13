import { isValidElement } from 'react';

import describeElementGivenAsComponent from './describeElementGivenAsComponent.ts';

/** Describes a value given in place of a component, either directly or as a name to look one up by, that did not
 * resolve to anything `isComponentType()` accepts, for a warning that it was ignored. Every option that takes a
 * component or a name describes it here, so the warnings for each read alike. A React element is called out on its
 * own, whether given directly or found under a name, since passing `<MyField />` for `MyField` is the likely mistake
 * and "got object" wouldn't say what to change. `null` is called out as `null` for the same reason.
 *
 * @param given - The value given for the option, a component or a name to look one up by
 * @param resolved - What `given` resolved to: the value found under it when it is a name, otherwise `given` itself
 * @param lookup - What a name is looked up among, in the singular and read after `a` or `no`, e.g. `registered field`
 * @param exampleName - The component name the message uses to show what to pass instead of an element
 * @returns - What the value was, phrased to follow the name of the option it was given for
 */
export default function describeUnresolvedComponent(
  given: unknown,
  resolved: unknown,
  lookup: string,
  exampleName: string,
): string {
  const description = isValidElement(resolved)
    ? describeElementGivenAsComponent(exampleName)
    : `is not a component (got ${resolved === null ? 'null' : typeof resolved})`;
  if (typeof given !== 'string') {
    return description;
  }
  return resolved == null ? `names no ${lookup} ('${given}')` : `names a ${lookup} ('${given}') that ${description}`;
}

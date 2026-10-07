import { isValidElement } from 'react';

/** How a warning refers to the place a name given in place of a component is looked up, once for a name found there
 * and once for one that isn't
 */
interface ComponentLookupWording {
  /** Follows "names" when nothing is found under the name, e.g. `no registered field` */
  none: string;
  /** Follows "names" when something is found under the name, e.g. `a registered field` */
  some: string;
}

/** Describes a value given in place of a component, either directly or as a name to look one up by, that did not
 * resolve to anything `isComponentType()` accepts, for a warning that it was ignored. Every option that takes a
 * component or a name describes it here, so the warnings for each read alike. A React element is called out on its
 * own, whether given directly or found under a name, since passing `<MyField />` for `MyField` is the likely mistake
 * and "got object" wouldn't say what to change. `@rjsf/utils` words the same case for `ui:widget` through its own
 * internal `describeElementGivenAsComponent()`, which this package can't import, so keep the two in step.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/describeUnresolvedComponent.js` from the `./lib/*.js`
 * exports wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next
 * major.
 *
 * @param given - The value given for the option, a component or a name to look one up by
 * @param resolved - What `given` resolved to: the value found under it when it is a name, otherwise `given` itself
 * @param lookup - How the warning refers to where a name is looked up
 * @param exampleName - The component name the message uses to show what to pass instead of an element
 * @returns - What the value was, phrased to follow the name of the option it was given for
 */
export default function describeUnresolvedComponent(
  given: unknown,
  resolved: unknown,
  lookup: ComponentLookupWording,
  exampleName: string,
): string {
  const description = isValidElement(resolved)
    ? `is a React element rather than a component (pass ${exampleName}, not <${exampleName} />)`
    : `is not a component (got ${typeof resolved})`;
  if (typeof given !== 'string') {
    return description;
  }
  return resolved == null
    ? `names ${lookup.none} ('${given}')`
    : `names ${lookup.some} ('${given}') that ${description}`;
}

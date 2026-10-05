import { isValidElement } from 'react';

/** Describes a value given in place of a component that `isComponentType()` rejected, for a warning that it was
 * ignored. A React element is called out on its own, since passing `<MyField />` for `MyField` is the likely mistake
 * and "got object" wouldn't say what to change.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/describeNonComponent.js` from the `./lib/*.js` exports
 * wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 *
 * @param value - The value that isn't a component
 * @param exampleName - The component name the message uses to show what to pass instead of an element
 * @returns - What the value was, phrased to follow the name of the option it was given for
 */
export default function describeNonComponent(value: unknown, exampleName: string): string {
  if (isValidElement(value)) {
    return `is a React element rather than a component (pass ${exampleName}, not <${exampleName} />)`;
  }
  return `is not a component (got ${typeof value})`;
}

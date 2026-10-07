/** Describes a React element given where a component was expected, for an error or warning that it can't be used.
 * Passing `<MyWidget />` for `MyWidget` is the likely mistake, and "got object" wouldn't say what to change.
 * `@rjsf/core`'s `describeUnresolvedComponent()` words its own element case the same way, so keep the two in step.
 *
 * Internal to `@rjsf/utils`: `package.json` excludes `./lib/describeElementGivenAsComponent.js` from the `./lib/*.js`
 * exports wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next
 * major.
 *
 * @param exampleName - The component name the message uses to show what to pass instead of an element
 * @returns - The description, phrased to follow the name of the option the element was given for
 */
export default function describeElementGivenAsComponent(exampleName: string): string {
  return `is a React element rather than a component (pass ${exampleName}, not <${exampleName} />)`;
}

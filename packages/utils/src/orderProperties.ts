import logOnce from './logOnce.ts';

/** Given a list of `properties` and an `order` list, returns a list that contains the `properties` ordered correctly.
 * If `order` is not an array, then the untouched `properties` list is returned. Otherwise `properties` is ordered per
 * the `order` list. If `order` contains a '*' then any `properties` that are not mentioned explicitly in `order` will be
 * placed in the location of the '*'. Properties that `order` doesn't list are never dropped: without a '*' they are
 * placed at the end, as if the list ended with one, and when there is more than one '*' the first one places them, as
 * `ui:enumOrder` does. Both cases are logged once through `logOnce()`, naming the field when `fieldLabel` is given.
 *
 * @param properties - The list of property keys to be ordered
 * @param order - An array of property keys to be ordered first, with an optional '*' property
 * @param [fieldLabel] - The field the `order` belongs to, as `fieldLabelForLog()` names it, for the warnings
 * @returns - A list with the `properties` ordered
 */
export default function orderProperties(properties: string[], order?: string[], fieldLabel?: string): string[] {
  if (!Array.isArray(order)) {
    return properties;
  }

  // Sets, since an object hash reads an undeclared `toString` as the inherited member and can't hold a `__proto__` key
  const propertySet = new Set(properties);
  const orderFiltered = order.filter((prop) => prop === '*' || propertySet.has(prop));
  const orderSet = new Set(orderFiltered);

  const rest = properties.filter((prop: string) => !orderSet.has(prop));
  const subject = fieldLabel === undefined ? 'A ui:order' : `The ui:order of ${fieldLabel}`;
  const restIndex = orderFiltered.indexOf('*');
  if (restIndex === -1) {
    if (rest.length) {
      const listed =
        rest.length > 1 ? `properties '${rest.join("', '")}', so they are` : `property '${rest[0]}', so it is`;
      logOnce(`${subject} does not list ${listed} placed at the end`);
    }
    return [...orderFiltered, ...rest];
  }
  if (restIndex !== orderFiltered.lastIndexOf('*')) {
    logOnce(`${subject} has more than one '*', so only the first one places the properties it does not list`);
  }

  return orderFiltered.flatMap((prop, index) => {
    if (index === restIndex) {
      return rest;
    }
    return prop === '*' ? [] : [prop];
  });
}

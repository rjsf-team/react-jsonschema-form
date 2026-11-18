/** Given a list of `properties` and an `order` list, returns a list that contains the `properties` ordered correctly.
 * If `order` is not an array, then the untouched `properties` list is returned. Otherwise `properties` is ordered per
 * the `order` list, each listed property placed once, at its first entry. Any `properties` that `order` doesn't list
 * are placed at its first '*', or at the end when it has none, so none is ever dropped. A name in `order` that isn't
 * among the `properties`, and every '*' after the first, is ignored.
 *
 * @param properties - The list of property keys to be ordered
 * @param order - An array of property keys to be ordered first, with an optional '*' property
 * @returns - A list with the `properties` ordered
 */
export default function orderProperties(properties: string[], order?: string[]): string[] {
  if (!Array.isArray(order)) {
    return properties;
  }

  // Sets, since an object hash reads an undeclared `toString` as the inherited member and can't hold a `__proto__` key.
  // The order's set also keeps each name, and the first '*', at its first entry
  const propertySet = new Set(properties);
  const orderSet = new Set(order.filter((prop) => prop === '*' || propertySet.has(prop)));
  const orderFiltered = [...orderSet];
  // A property named '*' is never listed, since its name is the wildcard
  const rest = properties.filter((prop) => prop === '*' || !orderSet.has(prop));
  const restIndex = orderFiltered.indexOf('*');
  if (restIndex === -1) {
    return [...orderFiltered, ...rest];
  }
  orderFiltered.splice(restIndex, 1, ...rest);
  return orderFiltered;
}

import { GenericObjectType } from './types';

export default function orderProperties(properties: string[], order?: string[]): GenericObjectType {
  if (!Array.isArray(order)) {
    return properties;
  }

  const arrayToHash = (arr: string[]) =>
    arr.reduce((prev: GenericObjectType, curr) => {
      prev[curr] = true;
      return prev;
    }, {});
  const errorPropList = (arr: string[]) =>
    arr.length > 1
      ? `properties '${arr.join("', '")}'`
      : `property '${arr[0]}'`;
  const propertyHash = arrayToHash(properties);
  const orderFiltered = order.filter(
    prop => prop === '*' || propertyHash[prop]
  );
  const orderHash = arrayToHash(orderFiltered);

  const rest = properties.filter((prop: string) => !orderHash[prop]);
  const restIndex = orderFiltered.indexOf('*');
  if (restIndex === -1) {
    if (rest.length) {
      throw new Error(
        `uiSchema order list does not contain ${errorPropList(rest)}`
      );
    }
    return orderFiltered;
  }
  if (restIndex !== orderFiltered.lastIndexOf('*')) {
    throw new Error('uiSchema order list contains more than one wildcard item');
  }

  const complete = [...orderFiltered];
  complete.splice(restIndex, 1, ...rest);
  return complete;
}

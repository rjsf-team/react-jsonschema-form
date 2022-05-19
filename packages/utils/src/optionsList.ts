import { JSONSchema7 } from 'json-schema';

import toConstant from './toConstant';

export default function optionsList(schema: JSONSchema7) {
  if (schema.enum) {
    // enumNames is not officially on the JSONSchema7, so hack them on here
    const schemaHack: { enumNames?: string[] } = schema as { enumNames?: string[] };
    return schema.enum.map((value, i) => {
      const label = (schemaHack.enumNames && schemaHack.enumNames[i]) || String(value);
      return { label, value };
    });
  }
  const altSchemas = schema.oneOf || schema.anyOf;
  return altSchemas && altSchemas.map(aSchemaDef => {
    const aSchema = aSchemaDef as JSONSchema7;
    const value = toConstant(aSchema);
    const label = aSchema.title || String(value);
    return {
      schema: aSchema,
      label,
      value,
    };
  });
}

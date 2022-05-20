import toConstant from './toConstant';
import { RJSFSchema } from './types';

export default function optionsList(schema: RJSFSchema) {
  if (schema.enum) {
    // enumNames is not officially on the RJSFSchema, so hack them on here
    const schemaHack: { enumNames?: string[] } = schema as { enumNames?: string[] };
    return schema.enum.map((value, i) => {
      const label = (schemaHack.enumNames && schemaHack.enumNames[i]) || String(value);
      return { label, value };
    });
  }
  const altSchemas = schema.oneOf || schema.anyOf;
  return altSchemas && altSchemas.map(aSchemaDef => {
    const aSchema = aSchemaDef as RJSFSchema;
    const value = toConstant(aSchema);
    const label = aSchema.title || String(value);
    return {
      schema: aSchema,
      label,
      value,
    };
  });
}

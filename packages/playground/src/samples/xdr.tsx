import { Sample } from './Sample';

import * as xdrWasm from "stellar-xdr-wasm";


function createSample(type_variant: string): Sample {
  const schema = JSON.parse(xdrWasm.schema(type_variant));
  return {
    schema,
    uiSchema: {},
    formData: {},
  };
}

const type_variants = JSON.parse(xdrWasm.type_variants()) as string[];

const xdr = Object.fromEntries(type_variants.map((t => [t, createSample(t)])));

export default xdr;

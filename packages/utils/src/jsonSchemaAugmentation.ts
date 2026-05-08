import type { JSONSchema7 } from 'json-schema';

declare module 'json-schema' {
  export interface JSONSchema7 {
    /** The deprecated keyword is a boolean that indicates that the instance value the keyword applies to should not be
     * used and may be removed in the future.
     */
    deprecated?: boolean;
  }
}

export type { JSONSchema7 };

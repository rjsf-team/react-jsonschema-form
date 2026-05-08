/**
 * This file is used to augment the `json-schema` module with the `deprecated` keyword.
 *
 * It is a dedicated file because `json-schema` is a type-only package. Standard augmentation
 * using `import 'json-schema'` in a file with other imports can cause module resolution
 * errors in certain environments (like Jest). Using `import type` in this dedicated file
 * ensures the augmentation is correctly applied by the TypeScript compiler without
 * confusing runtime module resolvers.
 */
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

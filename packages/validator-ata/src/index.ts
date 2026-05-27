import createPrecompiledValidator from './createPrecompiledValidator';
import customizeValidator from './customizeValidator';

export { customizeValidator, createPrecompiledValidator };
export { default as ATAValidator } from './validator';
export * from './types';

export default customizeValidator();

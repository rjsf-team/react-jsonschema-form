import createPrecompiledValidator from './createPrecompiledValidator';
import customizeValidator from './customizeValidator';

export { customizeValidator, createPrecompiledValidator };
export * from './types';

export default customizeValidator();

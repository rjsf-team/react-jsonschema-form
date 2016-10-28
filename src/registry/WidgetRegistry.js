/**
 * The registry that will have the singleton
 * - getRegistry() -> the registry which is a simple key/value POJO
 * @type {Object}
 */
const Registry = {
  _registry: {},
  getRegistry() {
    return this._registry;
  }
};

/**
 * Initialize registry with a value
 * @param {object} value the registry value
 */
function initRegistry(value) {
  Object.assign(Registry.getRegistry(), value);
}

/**
 * Call this one to add anything you want into the registry.
 * It will be added only if not locked.
 * Be warned any existing content will be overridden.
 * @param {string} id Where you want it to store in the registry to get it later
 * @param {any} item Everything you want, a function, an object or whatever
 */
function addToRegistry(id, item) {
  const registry = Registry.getRegistry();
  registry[id] = item;
}

/**
 * @return {object} the registry singleton instance
 */
function getRegistry() {
  return Registry.getRegistry();
}

/**
 * @param  {string} id the object's id in the registry you want to get
 * @return {any}    the object you are looking for
 */
function getFromRegistry(id) {
  return getRegistry()[id];
}

export default {
  Registry,
  initRegistry,
  addToRegistry,
  getRegistry,
  getFromRegistry,
};
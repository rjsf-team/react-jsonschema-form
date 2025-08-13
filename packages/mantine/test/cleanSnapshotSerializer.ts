/**
 * This snapshot serializer recursively cleans snapshot nodes by removing dynamic,
 * randomly generated Mantine attributes from your rendered components. It targets
 * attributes such as `className`, `id`, `htmlFor`, and various ARIA attributes that
 * may include random strings (e.g., "mantine-..." or "m-...").
 *
 * @see https://github.com/mantinedev/discussions/467
 * @see https://github.com/thymikee/jest-preset-angular/issues/336
 */

const CLEANED_FLAG = Symbol('cleaned');

const attributesToClean: Record<string, RegExp[]> = {
  className: [/^mantine-.*$/, /^m-.*$/],
  id: [/^mantine-.*$/],
  htmlFor: [/^mantine-.*$/],
  'aria-describedby': [/^mantine-.*$/],
  'aria-labelledby': [/^mantine-.*$/],
  'aria-controls': [/^mantine-.*$/],
};

const attributesToCleanKeys = Object.keys(attributesToClean);
const hasAttributesToClean = (key: string): boolean => attributesToCleanKeys.includes(key);

interface TestNode {
  props?: Record<string, any>;
  children?: Array<TestNode | string>;

  // Allow additional string-keyed properties…
  [key: string]: any;

  // …and also symbol-keyed properties.
  [key: symbol]: any;
}

type SerializeFn = (val: any) => string;

// A recursive cleaning function that marks nodes as cleaned.
function cleanNode(node: TestNode, visited: WeakSet<TestNode> = new WeakSet()): TestNode {
  if (node && typeof node === 'object') {
    // Prevent infinite loops in case of circular references.
    if (visited.has(node)) {
      return node;
    }
    visited.add(node);

    // Only clean if we haven't already processed this node.
    if (node.props && typeof node.props === 'object' && !node[CLEANED_FLAG]) {
      const newProps: Record<string, any> = { ...node.props };
      for (const key of Object.keys(newProps)) {
        if (hasAttributesToClean(key) && typeof newProps[key] === 'string') {
          newProps[key] = newProps[key]
            .split(' ')
            .filter((attrValue: string) => {
              return !attributesToClean[key].some((regex: RegExp) => regex.test(attrValue));
            })
            .join(' ');
        }
      }
      node = { ...node, props: newProps, [CLEANED_FLAG]: true };
    }

    // Recursively clean children if they exist.
    if (node.children && Array.isArray(node.children)) {
      node = {
        ...node,
        children: node.children.map((child) => {
          if (typeof child === 'string') {
            return child;
          }
          return cleanNode(child, visited);
        }),
      };
    }
  }
  return node;
}

module.exports = {
  print: (val: TestNode, serialize: SerializeFn): string => {
    const cleaned = cleanNode(val);
    return serialize(cleaned);
  },
  test: (val: any): boolean =>
    !!val &&
    typeof val === 'object' &&
    'props' in val &&
    val.props &&
    !val[CLEANED_FLAG] &&
    Object.keys(val.props).some(hasAttributesToClean),
};

export {};

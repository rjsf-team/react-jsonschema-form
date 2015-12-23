module.exports = {
  schema: {
    type: "object",
    title: "lvl 1 obj",
    properties: {
      object: {
        type: "object",
        title: "lvl 2 obj",
        properties: {
          array: {
            type: "array",
            items: {
              type: "object",
              title: "lvl 3 obj",
              properties: {
                bool: {
                  type: "boolean",
                  default: true
                }
              }
            }
          }
        }
      }
    }
  }
};

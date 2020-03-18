module.exports = {
  schema: {
    title: "Files",
    type: "object",
    properties: {
      file: {
        type: "string",
        format: "data-url",
        title: "Single file",
      },
      files: {
        type: "array",
        title: "Multiple files",
        items: {
          type: "string",
          format: "data-url",
        },
      },
      filesAccept: {
        type: "string",
        format: "data-url",
        title: "Single File with Accept attribute",
      },
      maxFileSize: {
        type: "string",
        format: "data-url",
        title: "Max size of 3000000 bytes will be parsed to base64",
      },
    },
  },
  uiSchema: {
    filesAccept: {
      "ui:options": { accept: ".pdf" },
    },
    maxFileSize: {
      "ui:options": { maxBytes: 3000000 },
    },
  },
  formData: {},
};

module.exports = {
  schema: {
    title: "Files",
    type: "object",
    properties: {
      file: {
        type: "string",
        title: "Single file",
      },
      files: {
        type: "array",
        title: "Multiple files",
        items: {
          type: "string"
        }
      }
    }
  },
  uiSchema: {
    file: {
      "ui:widget": "file"
    },
    files: {
      "ui:widget": "files"
    }
  },
  formData: {}
};

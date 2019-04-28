module.exports = {
  schema: {
    title: "Files",
    type: "object",
    properties: {
      bloblFile: {
        type: "string",
        format: "blob-url",
        description: "Faster than data-url",
        title: "Single Blob File",
      },
      blobFiles: {
        type: "array",
        title: "Multiple Blob Files",
        description: "Faster than data-url",
        items: {
          type: "string",
          format: "blob-url",
        },
      },
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
    },
  },
  uiSchema: {},
  formData: {
    blobFiles: [
      "https://homepages.cae.wisc.edu/~ece533/images/boat.png",
      "https://homepages.cae.wisc.edu/~ece533/images/tulips.png",
      "https://homepages.cae.wisc.edu/~ece533/images/arctichare.png",
    ],
  },
};

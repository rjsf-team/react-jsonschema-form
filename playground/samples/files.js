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
      // "blob:http://localhost:8080/8fe1bbde-4c8d-4622-a4b3-26a0b3172b05#pexels-photo-129743.jpeg",
      // "blob:http://localhost:8080/8ff221ec-91a1-4baa-9ae1-6635bb4bf70e#pexels-photo-813871.jpeg",
      "https://homepages.cae.wisc.edu/~ece533/images/boat.png",
      "https://homepages.cae.wisc.edu/~ece533/images/tulips.png",
      // "https://homepages.cae.wisc.edu/~ece533/images/arctichare.png",
    ],
  },
};

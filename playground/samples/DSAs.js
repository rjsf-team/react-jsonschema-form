module.exports = {
  schema: {
    type: "object",
    properties: {
      intellcont_auth: {
        title: "Authors/Editors",
        type: "array",
        items: {
          type: "object",
          properties: {
            username: {
              title: "Person at Your University",
              type: "string",
              $ref: "#/definitions/username",
            },
            fname: {
              title: "First Name",
              type: "string",
            },
            mname: {
              title: "Middle Name",
              type: "string",
            },
            lname: {
              title: "Last Name",
              type: "string",
            },
            role: {
              title: "Role",
              type: "string",
              enum: ["Author", "Editor"],
              enumNames: ["Author", "Editor"],
            },
          },
        },
      },
    },
    definitions: {
      username: {
        enum: ["hbrown"],
        enumNames: ["Henry Brown"],
      },
    },
  },
  uiSchema: {
    intellcont_auth: {
      items: {
        username: {
          "ui:widget": "select",
        },
        fname: {
          "ui:widget": "text",
        },
        mname: {
          "ui:widget": "text",
        },
        lname: {
          "ui:widget": "text",
        },
        role: {
          "ui:widget": "radio",
        },
      },
    },
  },
  formData: {
    intellcont_auth: [
      {
        username: "hbrown",
      },
      {
        fname: "Other",
        lname: "Person",
      },
    ],
  },
};

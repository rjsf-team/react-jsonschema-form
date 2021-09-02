module.exports = {
  schema: {
    description: "",
    properties: {
      project_id: {
        options: [],
        title: "Project",
        type: "number",
      },
      key: {
        title: "key",
        type: "string",
      },
      name: {
        title: "Title",
        type: "string",
      },
      workflow_form_id: {
        options: [],
        title: "List",
        type: "number",
      },
      start_date: {
        title: "Start Date",
        type: "string",
      },
      due_date: {
        title: "Due Date",
        type: "string",
      },
    },
    required: [
      "name",
      "workflow_form_id",
      "start_date",
      "due_date",
    ],
    type: "object",
  },
  uiSchema: {
    "classNames": "mb-0",
    "ui:field": "layout",
    "ui:layout": [
      {
        md: 12,
        properties: [
          {
            project_id: 12,
          },
          {
            key: 12,
          },
          {
            name: 6,
          },
          {
            workflow_form_id: 6,
          },
          {
            start_date: 6,
          },
          {
            due_date: 6,
          },
        ],
      },
    ],
    "project_id": {
      "ui:customMultiple": false,
      "ui:field": "ReactSelectField",
      "ui:placeholder": "Please Select",
      // "ui:customAsync": true,
      "ui:widget": "hidden",
    },
    "key": {
      "ui:widget": "hidden",
    },
    "workflow_form_id": {
      "ui:customMultiple": false,
      "ui:field": "ReactSelectField",
      "ui:placeholder": "Please Select",
      // "ui:customAsync": true,
    },
    "start_date": {
      "ui:widget": "DateWidget",
      "ui:conditional": {
        "and": [
          {
            "==": [
              {
                "var": "key"
              },
              "CRM"
            ]
          },
          {
            "==": [
              {
                "var": "project_id"
              },
              1
            ]
          }
        ]
      }
    },
    "due_date": {
      "ui:widget": "DateWidget",
    },
  },
  formData: {
    "project_id": 1,
    "key": "CRM",
    "name": "test",
    "workflow_form_id": "",
    "start_date": "",
    "end_date": ""
  },
  permission: {},
  rules: []
};
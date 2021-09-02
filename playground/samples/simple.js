module.exports = {
  "schema": {
    "type": "object",
    "title": "Time Tracking",
    "properties": {
      "time_tracking": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "start_date",
            "end_date",
            "description",
            "working_hour_per_day",
            "team_user"
          ],
          "properties": {
            "id": {
              "type": "string",
              "title": "ID",
              "default": "-1"
            },
            "user_id": {
              "type": "string",
              "title": "User ID",
              "default": "-1"
            },
            "end_date": {
              "type": "string",
              "title": "End Date",
              "format": "date"
            },
            "start_date": {
              "type": "string",
              "title": "Start Date",
              "format": "date"
            },
            "description": {
              "type": "string",
              "title": "Description"
            },
            "working_hour_per_day": {
              "type": "string",
              "title": "Working Hour Per Day"
            },
            team_user: {
              title: "User",
              type: "string",
              options: [
                { value: "chocolate", label: "Chocolate" },
                { value: "strawberry", label: "Strawberry" },
                { value: "vanilla", label: "Vanilla" },
              ],
            },

          }
        },
        "title": "  "
      }
    }
  },
  "uiSchema": {
    "ui:field": "layout",
    "ui:layout": [
      {
        "properties": [
          {
            "time_tracking": {
              "md": 12
            }
          }
        ]
      }
    ],
    "time_tracking": {
      "ui:options": {
        orderable: false
      },
      "items": {
        "id": {
          "ui:widget": "hidden"
        },
        "user_id": {
          "ui:widget": "hidden"
        },
        "description": {
          "ui:widget": "textarea"
        },
        team_user: {
          "ui:field": "ReactSelectField",
          "ui:placeholder": "Choose one",
          "ui:Multiple": false,
        },
      }
    }
  },
  formData: {
    "time_tracking": [
      {
        "id": "121321321",
        "user_id": "2",
        "end_date": "2019-09-21",
        "start_date": "2019-09-21",
        "description": "adasdasdsad",
        "working_hour_per_day": "12"
      },
      {
        "id": "-12345",
        "user_id": "1",
        "end_date": "2019-09-12",
        "start_date": "2019-09-14",
        "description": "ASDASDAS",
        "working_hour_per_day": "123",
      }
    ]
  },
  "permission": {
    "editor": {
      "5": [
        "time_tracking",
      ]
    },
  },
  rules: []
};
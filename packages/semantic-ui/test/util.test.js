import { getSemanticProps,getSemanticErrorProps } from '../src/util';


describe("util js functions", () => {

  describe("getSemanticProps", () => {

      test("defaultSchemaProps should be returned", () => {
        const uiSchema = {
          "ui:options": {
          }
        };
        expect(getSemanticProps({ uiSchema, defaultSchemaProps:{ wrapItem: false , horizontalButtons: true } })).toEqual({
          "wrapItem": false,
          "horizontalButtons": true
        });
      });

      test("semantic props if passed should overwrite defaultSchemaProps", () => {
        const uiSchema = {
          "ui:options": {
            "semantic": {
              "wrapItem": true,
              "horizontalButtons": true
            }
          }
        };
        expect(getSemanticProps({ uiSchema, defaultSchemaProps:{ wrapItem: false , horizontalButtons: true } })).toEqual({
          "wrapItem": true,
          "horizontalButtons": true
        });
      });
  });

  describe("getSemanticErrorProps", () => {
    test("default semantic errorOptions props should be returned", () => {
      const uiSchema = {
        "ui:options": {
        }
      };
      expect(getSemanticErrorProps({ uiSchema })).toEqual({
         size: 'small', pointing:'above'
      });
    });

    test("semantic errorOptions props if passed should overwrite defaultSchemaProps", () => {
      const uiSchema = {
        "ui:options": {
          semantic: {
            errorOptions: { 'size': 'large' }
          }
        }
      };
      expect(getSemanticErrorProps({ uiSchema })).toEqual({
          'size': 'large',
       });
    });
  });

});

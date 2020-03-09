// TODO: export typings from @rjsf/core, see https://github.com/rjsf-team/react-jsonschema-form/issues/1583#issuecomment-589796351
declare module '@rjsf/core' {
    import Form from 'react-jsonschema-form';
  
    export * from 'react-jsonschema-form';
    export * from 'react-jsonschema-form/lib/components/fields/SchemaField';
    export * from 'react-jsonschema-form/lib/utils';
    export * from 'react-jsonschema-form/lib/validate';
  
    export default Form;
}

declare module '@rjsf/core/lib/utils';
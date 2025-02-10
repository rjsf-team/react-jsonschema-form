import { DaisyProps } from './types/DaisyProps';
import { UiSchema } from '@rjsf/utils';

export interface DaisyUiSchema extends Omit<UiSchema, 'ui:options'> {
    'ui:options'?: DaisyUiOptions;
}

type DaisyUiOptions = UiSchema['ui:options'] & { daisy?: DaisyProps };

interface GetDaisyProps {
    uiSchema?: DaisyUiSchema;
}

export function getDaisy({ uiSchema = {} }: GetDaisyProps): DaisyProps {
    const daisyProps = (uiSchema['ui:options'] && uiSchema['ui:options'].daisy) || {};

    // Object.keys(daisyProps).forEach((key) => {
    //     /**
    //      * Leveraging `shouldForwardProp` to remove props
    //      *
    //      * This is a utility function that's used in `@daisy-ui/react`'s factory function.
    //      * Normally, it prevents DaisyProps from being passed to the DOM.
    //      * In this case we just want to delete the unknown props. So we flip the boolean.
    //      */
    //     if (shouldForwardProp(key)) {
    //         delete (daisyProps as any)[key];
    //     }
    // });

    return daisyProps;
}

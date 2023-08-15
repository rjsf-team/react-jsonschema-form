import {
  getTemplate,
  getUiOptions,
  titleId,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  ObjectFieldTemplateProps,
} from '@rjsf/utils';

import { useState, MouseEvent } from 'react';

function ObjectFieldInTabs<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ObjectFieldTemplateProps<T, S, F>
) {
  const { registry, properties, title, description, uiSchema, required, schema, idSchema } = props;
  const options = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, options);
  const [activeTabKey, setActiveTabKey] = useState('');
  const handleTabNavOnClick = (e: MouseEvent) => {
    const targetTabKey = e.currentTarget.getAttribute('data-tab-key');
    if (targetTabKey !== null) {
      setActiveTabKey(targetTabKey);
    }
  };

  return (
    <div>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}{' '}
      {description}
      <nav>
        <div className='nav nav-tabs' role='tablist'>
          {properties.map((prop: any, index: number) => {
            const { key } = prop.content;
            const isActive = (!activeTabKey && index === 0) || activeTabKey === key;
            return (
              <button
                className={`nav-link ${isActive ? 'active' : ''}`}
                id={`nav-link-${key}`}
                key={`nav-link-${key}`}
                data-tab-key={key}
                type='button'
                role='tab'
                onClick={handleTabNavOnClick}
                aria-controls={`#tab-pane-${key}`}
                aria-selected='false'
              >
                {key}
              </button>
            );
          })}
        </div>
      </nav>
      <section className='tab-content'>
        {properties.map((prop: any, index: number) => {
          const { key } = prop.content;
          const isActive = (!activeTabKey && index === 0) || activeTabKey === key;
          return (
            <div
              className={`tab-pane ${isActive ? 'show active' : ''}`}
              id={`tab-pane-${key}`}
              key={`tab-pane-${key}`}
              role='tabpanel'
              aria-labelledby='nav-contact-tab'
            >
              {prop.content}
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default {
  schema: {
    definitions: {
      offers: {
        type: 'object',
        properties: {
          offerCallout: {
            type: 'string',
          },
          offerId: {
            type: 'string',
          },
          dek: {
            type: 'string',
          },
          hed: {
            type: 'string',
          },
          lede: {
            type: 'string',
          },
          cta: {
            title: 'CTA',
            type: 'string',
          },
          selectedCta: {
            title: 'Selected CTA',
            type: 'string',
          },
          offerDescription: {
            title: 'Offer Description',
            type: 'string',
          },
          autoRenewal: {
            type: 'string',
            title: 'Auto Renewal',
          },
          automatedDiscountCoupon: {
            type: 'string',
            title: 'Automated Discount Coupon',
          },
        },
      },
      links: {
        type: 'object',
        properties: {
          copy: {
            type: 'string',
          },
          url: {
            title: 'URL',
            type: 'string',
          },
        },
      },
    },
    type: 'object',
    properties: {
      variantControls: {
        title: 'Variant controls',
        type: 'object',
        properties: {
          moveSelectCta: {
            title: "Move Offer card 'Select CTA' above description",
            type: 'boolean',
            enum: [true, false],
          },
        },
        dependencies: {},
        required: [],
      },
      step1: {
        title: 'Step 1',
        type: 'object',
        properties: {
          dek: {
            type: 'string',
          },
          offers: {
            title: 'Offers',
            type: 'object',
            properties: {
              offer1: {
                title: 'Offer One',
                $ref: '#/definitions/offers',
              },
              offer2: {
                title: 'Offer Two',
                $ref: '#/definitions/offers',
              },
            },
          },
        },
      },
      step2: {
        title: 'Step 2',
        type: 'object',
        properties: {
          dek: {
            type: 'string',
          },
          featurePayPal: {
            title: 'Enable PayPal',
            type: 'boolean',
          },
          featureVenmo: {
            title: 'Enable Venmo',
            type: 'boolean',
          },
          PayNowCTA: {
            type: 'string',
            title: 'Pay Now CTA',
          },
        },
      },
      step3: {
        title: 'Step 3',
        type: 'object',
        properties: {
          dek: {
            type: 'string',
          },
        },
      },
      step4: {
        title: 'Step 4',
        type: 'object',
        properties: {
          dek: {
            type: 'string',
          },
          lede: {
            type: 'string',
          },
          autoRenewalConsent: {
            type: 'string',
            title: 'Auto Renewal Consent',
          },
          CTA: {
            type: 'string',
            title: 'Subscribe CTA',
          },
        },
      },
      confirmationPage: {
        type: 'object',
        title: 'Confirmation Page',
        properties: {
          header: {
            type: 'string',
          },
          newCustomerConfirmationMessage: {
            type: 'object',
            title: 'New Customer Confirmation Message',
            properties: {
              orderConfirmationCopy1: {
                type: 'string',
                title: 'Order Confirmation Copy1',
              },
              orderConfirmationCopy2: {
                type: 'string',
                title: 'Order Confirmation Copy2',
              },
              CTA: {
                type: 'string',
                title: 'CTA',
              },
            },
          },
          existingCustomerConfirmationMessage: {
            type: 'object',
            title: 'Existing Customer Confirmation Message',
            properties: {
              orderConfirmationCopy1: {
                type: 'string',
                title: 'Order Confirmation Copy1',
              },
              CTA: {
                type: 'string',
                title: 'CTA',
              },
              signInUrl: {
                type: 'string',
                title: 'Sign in URL',
              },
              orderConfirmationCopy2: {
                type: 'string',
                title: 'Order Confirmation Copy2',
              },
            },
          },
        },
      },
    },
  },
  uiSchema: {
    step1: {
      dek: {
        'ui:disabled': true,
      },
      offers: {
        offer1: {
          offerDescription: {
            'ui:widget': 'textarea',
            'ui:options': {
              rows: 5,
            },
          },
          autoRenewal: {
            'ui:widget': 'textarea',
            'ui:options': {
              rows: 5,
            },
          },
          offerId: {
            'ui:disabled': true,
          },
        },
        offer2: {
          offerDescription: {
            'ui:widget': 'textarea',
            'ui:options': {
              rows: 5,
            },
          },
          autoRenewal: {
            'ui:widget': 'textarea',
            'ui:options': {
              rows: 5,
            },
          },
          offerId: {
            'ui:disabled': true,
          },
        },
        'ui:ObjectFieldTemplate': ObjectFieldInTabs,
      },
    },
    step2: {
      dek: {
        'ui:disabled': true,
      },
    },
    step3: {
      dek: {
        'ui:disabled': true,
      },
    },
    step4: {
      dek: {
        'ui:disabled': true,
      },
      autoRenewalConsent: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 5,
        },
      },
    },
    confirmationPage: {
      existingCustomerConfirmationMessage: {
        orderConfirmationCopy1: {
          'ui:widget': 'textarea',
          'ui:options': {
            rows: 5,
          },
        },
      },
      'ui:ObjectFieldTemplate': ObjectFieldInTabs,
    },
    'ui:ObjectFieldTemplate': ObjectFieldInTabs,
  },
  formData: {
    variantControls: {
      moveSelectCta: false,
    },
    step1: {
      offers: {
        offer1: {
          offerCallout: 'Best Value: Save $60/Year',
          dek: 'Annual Membership',
          hed: '$240',
          lede: 'After one year, renews automatically at $240/year.',
          cta: 'Select',
          selectedCta: 'Selected',
          offerDescription:
            "<p class='feature-list-title'>Your membership includes</p> <ul> <li class='feature-list'>100 years of searchable <i>Architectural Digest</i> issues</li> <li class='feature-list'>Informative trend and product reports</li> <li class='feature-list'>Features on growing and improving your business</li> <li class='feature-list'>Access to exclusive job board with special member pricing </li> <li class='feature-list'>Unlimited industry news articles and in-depth analysis</li> <li class='feature-list'>Invitations to exclusive <i>AD PRO</i> events</li> <li class='feature-list'>Centralized calendar for all trade events worldwide </li> </ul>",
          autoRenewal:
            '<strong>Automatic Renewal:</strong> <p class="renewal-info">Each year, your subscription will <strong>automatically renew</strong> for one year at $240. Your subscription will continue until you cancel. We will send you advance notice if the annual price changes. If you do nothing, we will continue to charge the payment method you selected each year at the then current rate. You can cancel at any time to not be charged for future years by <a href="mailto:adprosupport@archdigest.com" target="_blank">contacting customer service</a> or calling 1-866-933-2860<span>.</span>',
          offerId: 'DC6482D1-0169-41D5-9942-9F8E53F6A7DD',
        },
        offer2: {
          dek: 'Monthly Membership',
          hed: '$25/Month ($300/Year)',
          lede: 'After one month, renews automatically at $25/month.',
          cta: 'Select',
          selectedCta: 'Selected',
          offerDescription:
            "<p class='feature-list-title'>Your membership includes</p> <ul> <li class='feature-list'>100 years of searchable <i>Architectural Digest</i> issues</li> <li class='feature-list'>Informative trend and product reports</li> <li class='feature-list'>Features on growing and improving your business</li> <li class='feature-list'>Access to exclusive job board with special member pricing </li> <li class='feature-list'>Unlimited industry news articles and in-depth analysis</li> <li class='feature-list'>Invitations to exclusive <i>AD PRO</i> events</li> <li class='feature-list'>Centralized calendar for all trade events worldwide </li> </ul>",
          autoRenewal:
            '<strong>Automatic Renewal:</strong> <p class="renewal-info">Each month, your subscription will <strong>automatically renew</strong> for one month at $25. Your subscription will continue until you cancel. We will send you advance notice if the monthly price changes. If you do nothing, we will continue to charge the payment method you selected each month at the then current rate. You can cancel at any time to not be charged for future months by <a href="mailto:adprosupport@archdigest.com" target="_blank">contacting customer service</a> or calling 1-866-933-2860<span>.</span>',
          offerId: 'ABB43210-9F57-4E19-8F90-00E575E66E55',
        },
      },
      dek: 'Choose your plan',
    },
    step2: {
      dek: 'Payment',
      PayNowCTA: 'Pay with a saved credit card',
    },
    step3: {
      dek: 'Enter billing address',
    },
    step4: {
      dek: 'Review and submit',
      lede: 'You can cancel at any time.',
      autoRenewalConsent:
        'By subscribing you agree to automatic renewal as described above, our <a href="https://www.condenast.com/user-agreement/" target="_blank" >user agreement</a> (including the <a href="https://www.condenast.com/user-agreement#section-viii-g" target="_blank" >class action waiver and arbitration provisions</a> <span class="-ml-1">)</span> and <a href="https://www.condenast.com/privacy-policy" target="_blank" >privacy policy &amp; cookie statement</a> <span class="-ml-1">.</span>',
      CTA: 'Subscribe',
    },
    confirmationPage: {
      newCustomerConfirmationMessage: {
        orderConfirmationCopy1:
          'Your order confirmation has been emailed to you. If you didn’t receive it, please check your spam folder.',
        orderConfirmationCopy2: 'Your account is active. Follow the link to sign in, no password needed.',
        CTA: 'Visit AD PRO',
      },
      existingCustomerConfirmationMessage: {
        orderConfirmationCopy1:
          'Your order confirmation has been emailed to you. If you didn’t receive it, please check your spam folder. It includes a <strong>link that allows you to automatically sign in</strong> to your AD PRO account and begin using your subscription. You can also',
        orderConfirmationCopy2: 'with your existing email and password.',
        CTA: 'Sign in',
        signInUrl: '/auth/initiate',
      },
      header: 'Welcome to AD Pro',
    },
  },
};

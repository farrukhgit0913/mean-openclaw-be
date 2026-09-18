import {
  Customer
} from '../models/customer.model.js';

export const customerTools = [
  {
    type: 'function',

    function: {
      name: 'getCustomerCount',

      description:
        'Get the total number of customers in the CRM.',

      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },

  {
    type: 'function',

    function: {
      name: 'searchCustomers',

      description:
        'Search CRM customers by name, phone number, or email address.',

      parameters: {
        type: 'object',

        properties: {
          query: {
            type: 'string',
            description:
              'Customer name, phone number, or email to search for.'
          }
        },

        required: ['query'],

        additionalProperties: false
      }
    }
  }
];

export async function executeCustomerTool(
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
    case 'getCustomerCount': {
      const count =
        await Customer.countDocuments();

      return {
        success: true,
        count
      };
    }

    case 'searchCustomers': {
      const query =
        String(
          args.query ?? ''
        ).trim();

      if (!query) {
        return {
          success: false,
          message:
            'Search query is required.'
        };
      }

      const customers =
        await Customer.find({
          $or: [
            {
              name: {
                $regex: query,
                $options: 'i'
              }
            },

            {
              phone: {
                $regex: query,
                $options: 'i'
              }
            },

            {
              email: {
                $regex: query,
                $options: 'i'
              }
            }
          ]
        })
          .limit(10)
          .lean();

      return {
        success: true,
        count:
          customers.length,
        customers
      };
    }

    default:
      throw new Error(
        `Unknown customer tool: ${name}`
      );
  }
}
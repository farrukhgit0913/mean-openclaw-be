import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const CRM_API = "http://127.0.0.1:3000";

export default defineToolPlugin({
  id: "crm-tools",
  name: "CRM Tools",
  description: "CRM customer tools backed by the backend API.",

  tools: (tool) => [
    tool({
      name: "getCustomerCount",
      description: "Get the total number of customers in the CRM.",
      parameters: Type.Object({}),

      execute: async () => {
        const response = await fetch(
          `${CRM_API}/api/openclaw/crm/customers/count`
        );

        return await response.json();
      },
    }),

    tool({
      name: "searchCustomers",
      description:
        "Search CRM customers by name, phone, email, vehicle make, or vehicle model.",
      parameters: Type.Object({
        query: Type.String({
          description:
            "Customer name, phone, email, vehicle make, or vehicle model.",
        }),
      }),

      execute: async ({ query }) => {
        const response = await fetch(
          `${CRM_API}/api/openclaw/crm/customers/search?q=${encodeURIComponent(query)}`
        );

        return await response.json();
      },
    }),

    tool({
      name: "getCustomer",
      description: "Get a single customer by MongoDB customer ID.",
      parameters: Type.Object({
        customerId: Type.String({
          description: "MongoDB customer ID.",
        }),
      }),

      execute: async ({ customerId }) => {
        const response = await fetch(
          `${CRM_API}/api/openclaw/crm/customers/${encodeURIComponent(customerId)}`
        );

        return await response.json();
      },
    }),
  ],
});

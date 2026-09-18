import { Customer } from "../models/customer.model.js";

export const customerTools = [
  {
    type: "function",

    function: {
      name: "getCustomerCount",

      description: "Get the total number of customers in the CRM.",

      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "searchCustomers",

      description:
        "Search CRM customers by name, phone number, email address, vehicle make, or vehicle model.",

      parameters: {
        type: "object",

        properties: {
          query: {
            type: "string",
            description:
              "Customer name, phone number, email, vehicle make, or vehicle model to search for.",
          },
        },

        required: ["query"],

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "getCustomer",

      description:
        "Get a single customer by their MongoDB customer ID, including contact and vehicle details.",

      parameters: {
        type: "object",

        properties: {
          customerId: {
            type: "string",
            description: "MongoDB ID of the customer.",
          },
        },

        required: ["customerId"],

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "createCustomer",

      description: "Create a new customer in the CRM.",

      parameters: {
        type: "object",

        properties: {
          name: {
            type: "string",
            description: "Full name of the customer.",
          },

          phone: {
            type: "string",
            description: "Customer phone number.",
          },

          email: {
            type: "string",
            description: "Customer email address.",
          },

          vehicleMake: {
            type: "string",
            description: "Vehicle manufacturer, for example Toyota.",
          },

          vehicleModel: {
            type: "string",
            description: "Vehicle model, for example Corolla.",
          },

          vehicleYear: {
            type: "number",
            description: "Vehicle manufacturing year.",
          },
        },

        required: ["name", "phone"],

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "updateCustomer",

      description:
        "Update an existing customer in the CRM. Only provided fields will be changed.",

      parameters: {
        type: "object",

        properties: {
          customerId: {
            type: "string",
            description: "MongoDB ID of the customer.",
          },

          name: {
            type: "string",
            description: "New customer name.",
          },

          phone: {
            type: "string",
            description: "New customer phone number.",
          },

          email: {
            type: "string",
            description: "New customer email address.",
          },

          vehicleMake: {
            type: "string",
            description: "New vehicle manufacturer.",
          },

          vehicleModel: {
            type: "string",
            description: "New vehicle model.",
          },

          vehicleYear: {
            type: "number",
            description: "New vehicle manufacturing year.",
          },
        },

        required: ["customerId"],

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "deleteCustomer",

      description: "Delete a customer from the CRM by MongoDB customer ID.",

      parameters: {
        type: "object",

        properties: {
          customerId: {
            type: "string",
            description: "MongoDB ID of the customer to delete.",
          },
        },

        required: ["customerId"],

        additionalProperties: false,
      },
    },
  },
];

export async function executeCustomerTool(
  name: string,
  args: Record<string, unknown>,
) {
  switch (name) {
    case "getCustomerCount": {
      const count = await Customer.countDocuments();

      return {
        success: true,
        count,
      };
    }

    case "searchCustomers": {
      const query = String(args.query ?? "").trim();

      if (!query) {
        return {
          success: false,
          message: "Search query is required.",
        };
      }

      const customers = await Customer.find({
        $or: [
          {
            name: {
              $regex: query,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: query,
              $options: "i",
            },
          },
          {
            email: {
              $regex: query,
              $options: "i",
            },
          },
          {
            "vehicle.make": {
              $regex: query,
              $options: "i",
            },
          },
          {
            "vehicle.model": {
              $regex: query,
              $options: "i",
            },
          },
        ],
      })
        .limit(10)
        .lean();

      return {
        success: true,
        count: customers.length,
        customers,
      };
    }

    case "getCustomer": {
      const customerId = String(args.customerId ?? "").trim();

      if (!customerId) {
        return {
          success: false,
          message: "Customer ID is required.",
        };
      }

      const customer = await Customer.findById(customerId).lean();

      if (!customer) {
        return {
          success: false,
          message: "Customer not found.",
        };
      }

      return {
        success: true,
        customer,
      };
    }

    case "createCustomer": {
      const name = String(args.name ?? "").trim();
      const phone = String(args.phone ?? "").trim();

      if (!name || !phone) {
        return {
          success: false,
          message: "Customer name and phone are required.",
        };
      }

      const customer = await Customer.create({
        name,
        phone,
        email:
          typeof args.email === "string"
            ? args.email.trim()
            : undefined,

        vehicle:
          args.vehicleMake ||
          args.vehicleModel ||
          args.vehicleYear
            ? {
                make: String(args.vehicleMake ?? "").trim(),
                model: String(args.vehicleModel ?? "").trim(),
                year: Number(args.vehicleYear ?? 0),
              }
            : undefined,
      });

      return {
        success: true,
        message: "Customer created successfully.",
        customer: customer.toObject(),
      };
    }

    case "updateCustomer": {
      const customerId = String(args.customerId ?? "").trim();

      if (!customerId) {
        return {
          success: false,
          message: "Customer ID is required.",
        };
      }

      const update: Record<string, unknown> = {};

      if (typeof args.name === "string") {
        update.name = args.name.trim();
      }

      if (typeof args.phone === "string") {
        update.phone = args.phone.trim();
      }

      if (typeof args.email === "string") {
        update.email = args.email.trim();
      }

      if (
        args.vehicleMake !== undefined ||
        args.vehicleModel !== undefined ||
        args.vehicleYear !== undefined
      ) {
        const existing = await Customer.findById(customerId).lean();

        if (!existing) {
          return {
            success: false,
            message: "Customer not found.",
          };
        }

        update.vehicle = {
          make:
            args.vehicleMake !== undefined
              ? String(args.vehicleMake).trim()
              : existing.vehicle?.make ?? "",

          model:
            args.vehicleModel !== undefined
              ? String(args.vehicleModel).trim()
              : existing.vehicle?.model ?? "",

          year:
            args.vehicleYear !== undefined
              ? Number(args.vehicleYear)
              : existing.vehicle?.year ?? 0,
        };
      }

      const customer = await Customer.findByIdAndUpdate(
        customerId,
        update,
        {
          new: true,
          runValidators: true,
        },
      ).lean();

      if (!customer) {
        return {
          success: false,
          message: "Customer not found.",
        };
      }

      return {
        success: true,
        message: "Customer updated successfully.",
        customer,
      };
    }

    case "deleteCustomer": {
      const customerId = String(args.customerId ?? "").trim();

      if (!customerId) {
        return {
          success: false,
          message: "Customer ID is required.",
        };
      }

      const customer = await Customer.findByIdAndDelete(
        customerId,
      ).lean();

      if (!customer) {
        return {
          success: false,
          message: "Customer not found.",
        };
      }

      return {
        success: true,
        message: "Customer deleted successfully.",
        customer,
      };
    }

    default:
      throw new Error(`Unknown customer tool: ${name}`);
  }
}

import { executeCustomerTool } from "../../tools/customer.tools.js";
import { OpenClawClient } from "./openclaw.client.js";

export class OpenClawAgentService {
  private readonly openClawClient = new OpenClawClient();

  async chat(userMessage: string) {
    const message = userMessage.toLowerCase().trim();

    let toolName: string | null = null;
    let args: Record<string, unknown> = {};

    // 1. Customer count
    if (
      message.includes("how many customers") ||
      message.includes("customer count") ||
      message.includes("total customers")
    ) {
      toolName = "getCustomerCount";
    }

    // 2. Vehicle searches
    else if (
      message.includes("toyota") ||
      message.includes("honda") ||
      message.includes("kia")
    ) {
      const makes = ["toyota", "honda", "kia"];

      const make = makes.find((item) => message.includes(item));

      toolName = "searchCustomers";

      args = {
        query: make ?? "",
      };
    }

    // 3. Customer details / name lookup
    else if (
      message.includes("find ") ||
      message.includes("customer ") ||
      message.includes("contact") ||
      message.includes("details")
    ) {
      const match = userMessage.match(
        /(?:find|customer|contact(?:\s+details)?(?:\s+for)?)\s+(.+?)(?:\s+and\s+give.*)?$/i,
      );

      toolName = "searchCustomers";

      args = {
        query: match?.[1]?.trim() || userMessage.trim(),
      };
    }

    // 4. Everything else → Ollama/OpenClaw
    if (!toolName) {
      await this.sleep(1200);

      const result = await this.openClawClient.chat([
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Answer the user's question clearly and concisely.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ]);

      return {
        success: true,
        message:
          result?.choices?.[0]?.message?.content ??
          "I couldn't generate a response.",
        toolCalls: [],
      };
    }

    // Execute CRM tool
    const result = await executeCustomerTool(toolName, args);

    await this.sleep(1200);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        toolCalls: [
          {
            name: toolName,
            arguments: args,
            result,
          },
        ],
      };
    }

    let response = "";

    // Customer count response
    if (toolName === "getCustomerCount") {
      response = `There are ${result.count} customers in the CRM.`;
    }

    // Search response
    if (toolName === "searchCustomers" && "customers" in result) {
      const customers = result.customers as any[];

      if (!customers.length) {
        response = "I couldn't find any matching customers.";
      } else {
        const wantsDetails =
          message.includes("contact") ||
          message.includes("details") ||
          message.includes("phone") ||
          message.includes("email");

        if (wantsDetails && customers.length === 1) {
          const customer = customers[0];

          const vehicle = customer.vehicle
            ? `${customer.vehicle.make ?? ""} ${
                customer.vehicle.model ?? ""
              }${customer.vehicle.year ? ` (${customer.vehicle.year})` : ""}`.trim()
            : "No vehicle information";

          response = [
            customer.name,
            "",
            `Phone: ${customer.phone ?? "Not available"}`,
            `Email: ${customer.email ?? "Not available"}`,
            `Vehicle: ${vehicle}`,
          ].join("\n");
        } else {
          response = customers
            .map((customer) => {
              const vehicle = customer.vehicle
                ? `${customer.vehicle.make ?? ""} ${
                    customer.vehicle.model ?? ""
                  }${
                    customer.vehicle.year
                      ? ` (${customer.vehicle.year})`
                      : ""
                  }`.trim()
                : "No vehicle";

              return `${customer.name} — ${vehicle}`;
            })
            .join("\n");
        }
      }
    }

    return {
      success: true,
      message: response,
      toolCalls: [
        {
          name: toolName,
          arguments: args,
          result,
        },
      ],
    };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
import { OpenClawClient } from "./openclaw.client.js";

import {
  customerTools,
  executeCustomerTool,
} from "../../tools/customer.tools.js";

export class OpenClawAgentService {
  private readonly client = new OpenClawClient();

  private readonly tools = customerTools;

  async chat(userMessage: string) {
    const messages: any[] = [
      {
        role: "system",

        content: `
You are an AI CRM business assistant.

You can answer questions about customers
using the available CRM tools.

Use tools whenever the user asks for
information that should come from the CRM.

Never invent customer data.

Available capabilities:
- Count customers
- Search customers

After receiving tool results, explain
the result clearly to the user.
          `.trim(),
      },

      {
        role: "user",

        content: userMessage,
      },
    ];

    const maxIterations = 5;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await this.client.chatWithTools(messages, this.tools);

      console.log("\n===== OPENCLAW RAW RESPONSE =====");

      console.log(JSON.stringify(response, null, 2));

      console.log("=================================\n");

      const choice = response?.choices?.[0];

      if (!choice) {
        throw new Error("OpenClaw returned no choices.");
      }

      const assistantMessage = choice.message;

      messages.push(assistantMessage);

      if (
        choice.finish_reason !== "tool_calls" ||
        !assistantMessage.tool_calls?.length
      ) {
        return {
          success: true,

          message: assistantMessage.content ?? "",

          toolCalls: [],
        };
      }

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;

        let args: Record<string, unknown> = {};

        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          args = {};
        }

        console.log("AI requested tool:", toolName, args);

        let result: unknown;

        if (toolName === "getCustomerCount" || toolName === "searchCustomers") {
          result = await executeCustomerTool(toolName, args);
        } else {
          result = {
            success: false,

            message: `Unknown tool: ${toolName}`,
          };
        }

        messages.push({
          role: "tool",

          tool_call_id: toolCall.id,

          content: JSON.stringify(result),
        });
      }
    }

    throw new Error("AI agent exceeded the maximum tool-call iterations.");
  }
}

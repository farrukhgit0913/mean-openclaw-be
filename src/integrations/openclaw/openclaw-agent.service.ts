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

You have access to CRM tools provided directly by the application.

IMPORTANT RULES:

1. Use the provided CRM tools whenever the user asks for
   customer information or wants to perform a CRM action.

2. Do NOT use tool_search.

3. Do NOT invent customer information.

4. Do NOT claim that an action was completed unless the
   corresponding tool returned a successful result.

5. Select the appropriate CRM tool based on the user's request.

6. After receiving a tool result, explain the result clearly
   to the user.

Available CRM capabilities:
- Count customers
- Search customers

The application will execute your requested tool calls.
        `.trim(),
      },

      {
        role: "user",
        content: userMessage,
      },
    ];

    const maxIterations = 5;
    const executedToolCalls: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result: unknown;
    }> = [];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await this.client.chatWithTools(
        messages,
        this.tools,
      );

      console.log("\n===== OPENCLAW RAW RESPONSE =====");
      console.log(JSON.stringify(response, null, 2));
      console.log("=================================\n");

      const choice = response?.choices?.[0];

      if (!choice) {
        throw new Error("OpenClaw returned no choices.");
      }

      const assistantMessage = choice.message;

      messages.push(assistantMessage);

      /*
       * Normal final response from the model.
       */
      if (
        !assistantMessage.tool_calls?.length ||
        choice.finish_reason !== "tool_calls"
      ) {
        return {
          success: true,
          message: assistantMessage.content ?? "",
          toolCalls: executedToolCalls,
        };
      }

      /*
       * Execute every tool requested by the model.
       */
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;

        let args: Record<string, unknown> = {};

        try {
          args = JSON.parse(
            toolCall.function.arguments || "{}",
          );
        } catch (error) {
          console.error(
            "Failed to parse tool arguments:",
            toolCall.function.arguments,
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: false,
              message: "Invalid tool arguments.",
            }),
          });

          continue;
        }

        console.log("AI requested tool:", {
          name: toolName,
          arguments: args,
        });

        let result: unknown;

        try {
          /*
           * All CRM tools are executed through the same
           * application tool executor.
           */
          result = await executeCustomerTool(
            toolName,
            args,
          );
        } catch (error) {
          console.error(
            `Tool execution failed: ${toolName}`,
            error,
          );

          result = {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Tool execution failed.",
          };
        }

        executedToolCalls.push({
          name: toolName,
          arguments: args,
          result,
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    throw new Error(
      "AI agent exceeded the maximum tool-call iterations.",
    );
  }
}
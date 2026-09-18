import { Router } from "express";

import {
  OpenClawAgentService,
} from "../integrations/openclaw/openclaw-agent.service.js";

const router = Router();

const agent = new OpenClawAgentService();

router.post("/chat", async (req, res) => {
  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const result = await agent.chat(message);

    return res.json(result);
  } catch (error) {
    console.error("\n===== AI AGENT ERROR =====");
    console.error(error);

    if (
      error &&
      typeof error === "object" &&
      "response" in error
    ) {
      const axiosError = error as any;

      console.error(
        "OpenClaw status:",
        axiosError.response?.status,
      );

      console.error(
        "OpenClaw response:",
        JSON.stringify(
          axiosError.response?.data,
          null,
          2,
        ),
      );

      console.error(
        "OpenClaw headers:",
        JSON.stringify(
          axiosError.response?.headers,
          null,
          2,
        ),
      );
    }

    console.error("==========================\n");

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

export default router;

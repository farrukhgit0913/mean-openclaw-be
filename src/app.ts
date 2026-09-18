import express from "express";

import cors from "cors";

import helmet from "helmet";

import morgan from "morgan";

import path from "path";

import mongoose from "mongoose";

import { OpenClawService } from "./integrations/openclaw/openclaw.service.js";

import { WhatsAppMessage } from "./models/whatsapp-message.model.js";

import { getIO } from "./socket.js";

import agentRoutes from "./routes/agent.routes.js";
import crmRoutes from './routes/openclaw/crm.routes.js';
const app = express();

/**
 * ============================================================
 * SECURITY
 * ============================================================
 */

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

/**
 * ============================================================
 * CORS
 * ============================================================
 */

app.use(
  cors({
    origin: "http://localhost:4200",
  }),
);

/**
 * ============================================================
 * MIDDLEWARE
 * ============================================================
 */

app.use(express.json());

app.use(morgan("dev"));

/**
 * ============================================================
 * STATIC DASHBOARD
 * ============================================================
 */

app.use(
  express.static(
    path.join(process.cwd(), "public"),
  ),
);

app.get("/", (_req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      "public",
      "index.html",
    ),
  );
});

/**
 * ============================================================
 * SERVICES
 * ============================================================
 */

const openClawService =
  new OpenClawService();

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get(
  "/api/health",
  (_req, res) => {
    const mongodbConnected =
      mongoose.connection.readyState === 1;

    res.json({
      success: true,
      backend: true,
      mongodb: mongodbConnected,
      openclaw: null,
      message: mongodbConnected
        ? "Backend and MongoDB are connected"
        : "Backend is running but MongoDB is not connected",
    });
  },
);

/**
 * ============================================================
 * OPENCLAW MODELS
 * ============================================================
 */

app.get(
  "/api/openclaw/models",
  async (_req, res) => {
    try {
      const models =
        await openClawService.getModels();

      return res.json({
        success: true,
        data: models,
      });
    } catch (error) {
      console.error(
        "OpenClaw models error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to communicate with OpenClaw",
      });
    }
  },
);

/**
 * ============================================================
 * OPENCLAW CHAT
 * ============================================================
 */

app.post(
  "/api/openclaw/chat",
  async (req, res) => {
    try {
      const { message } =
        req.body;

      if (
        !message ||
        typeof message !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "message is required",
        });
      }

      const response =
        await openClawService.chat(
          message,
        );

      return res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error(
        "OpenClaw chat error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to communicate with OpenClaw",
      });
    }
  },
);

/**
 * ============================================================
 * DEMO #2 — AI BUSINESS AGENT
 * ============================================================
 *
 * The AI agent can decide which backend tools to call.
 *
 * Example:
 *
 * User:
 *   "How many customers do we have?"
 *
 * OpenClaw:
 *   → getCustomerCount()
 *
 * Backend:
 *   → MongoDB
 *
 * Result:
 *   → OpenClaw
 *   → Angular
 *
 */

app.use(
  "/api/openclaw/agent",
  agentRoutes,
);

/**
 * ============================================================
 * WHATSAPP SEND
 * ============================================================
 */

app.post(
  "/api/openclaw/whatsapp/send",
  async (req, res) => {
    try {
      const {
        to,
        message,
      } = req.body;

      if (
        !to ||
        typeof to !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "to is required",
        });
      }

      if (
        !message ||
        typeof message !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "message is required",
        });
      }

      /**
       * WhatsApp phone number in E.164 format.
       *
       * Example:
       * +923062762437
       */

      if (
        !/^\+\d{8,15}$/.test(to)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "to must be a valid E.164 phone number",
        });
      }

      const response =
        await openClawService.sendWhatsAppMessage(
          to,
          message,
        );

      return res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error(
        "WhatsApp send error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send WhatsApp message",
      });
    }
  },
);

/**
 * ============================================================
 * WHATSAPP INBOUND
 * ============================================================
 */

app.post(
  "/api/openclaw/whatsapp/inbound",
  async (req, res) => {
    try {
      const payload =
        req.body;

      const message =
        payload?.message;

      const openClaw =
        message?.__openclaw;

      const transport =
        openClaw?.transport;

      /**
       * Validate message role/content.
       */

      if (
        message?.role !== "user" ||
        typeof message?.content !==
          "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid OpenClaw WhatsApp message",
        });
      }

      /**
       * Make sure this event came from WhatsApp.
       */

      if (
        transport?.channel !==
        "whatsapp"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message is not from WhatsApp",
        });
      }

      /**
       * Sender.
       */

      const from =
        openClaw?.senderId ??
        payload?.session?.origin
          ?.from;

      /**
       * Our WhatsApp number.
       */

      const to =
        process.env
          .OPENCLAW_WHATSAPP_SELF_NUMBER;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message:
            "Sender or receiver number is missing",
        });
      }

      /**
       * OpenClaw / WhatsApp message ID.
       */

      const messageId =
        transport?.messageId ??
        payload?.messageId ??
        undefined;

      /**
       * Prevent duplicate WhatsApp messages.
       */

      if (messageId) {
        const existing =
          await WhatsAppMessage.findOne({
            messageId,
          });

        if (existing) {
          return res.json({
            success: true,
            duplicate: true,
            data: {
              _id:
                existing._id.toString(),

              direction:
                existing.direction,

              from:
                existing.from,

              to:
                existing.to,

              message:
                existing.message,

              timestamp:
                existing.timestamp.getTime(),

              messageId:
                existing.messageId ??
                null,

              senderName:
                existing.senderName ??
                null,

              sessionKey:
                existing.sessionKey ??
                null,

              channel:
                existing.channel,
            },
          });
        }
      }

      /**
       * Normalize the OpenClaw event.
       */

      const normalizedMessage =
        {
          direction:
            "inbound" as const,

          from,

          to,

          message:
            message.content,

          timestamp:
            new Date(
              message.timestamp ??
                Date.now(),
            ),

          messageId,

          senderName:
            openClaw?.senderName ??
            undefined,

          sessionKey:
            payload?.sessionKey ??
            undefined,

          channel:
            "whatsapp" as const,
        };

      /**
       * Save to MongoDB.
       */

      const savedMessage =
        await WhatsAppMessage.create(
          normalizedMessage,
        );

      /**
       * Normalize MongoDB document
       * for Socket.IO / Angular.
       */

      const socketMessage =
        {
          _id:
            savedMessage._id.toString(),

          direction:
            savedMessage.direction,

          from:
            savedMessage.from,

          to:
            savedMessage.to,

          message:
            savedMessage.message,

          timestamp:
            savedMessage.timestamp.getTime(),

          messageId:
            savedMessage.messageId ??
            null,

          senderName:
            savedMessage.senderName ??
            null,

          sessionKey:
            savedMessage.sessionKey ??
            null,

          channel:
            savedMessage.channel,
        };

      console.log(
        "WhatsApp inbound saved:",
        socketMessage,
      );

      /**
       * Send real-time message to Angular.
       */

      getIO().emit(
        "whatsapp:message",
        socketMessage,
      );

      console.log(
        "WhatsApp message emitted to Angular",
      );

      return res.json({
        success: true,
        data: socketMessage,
      });
    } catch (error: any) {
      /**
       * Duplicate MongoDB message.
       */

      if (
        error?.code === 11000
      ) {
        return res.json({
          success: true,
          duplicate: true,
        });
      }

      console.error(
        "WhatsApp inbound error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to process inbound WhatsApp message",
      });
    }
  },
);

/**
 * ============================================================
 * WHATSAPP MESSAGE HISTORY
 * ============================================================
 */

app.get(
  "/api/openclaw/whatsapp/messages",
  async (_req, res) => {
    try {
      const messages =
        await WhatsAppMessage
          .find({
            channel: "whatsapp",
          })
          .sort({
            timestamp: 1,
          })
          .limit(200)
          .lean();

      return res.json({
        success: true,

        data:
          messages.map(
            (message) => ({
              _id:
                message._id.toString(),

              direction:
                message.direction,

              from:
                message.from,

              to:
                message.to,

              message:
                message.message,

              timestamp:
                message.timestamp.getTime(),

              messageId:
                message.messageId ??
                null,

              senderName:
                message.senderName ??
                null,

              sessionKey:
                message.sessionKey ??
                null,

              channel:
                message.channel,
            }),
          ),
      });
    } catch (error) {
      console.error(
        "WhatsApp messages error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load WhatsApp messages",
      });
    }
  },
);

/**
 * ============================================================
 * OpenClaw CRM Route
 * ============================================================
 */

app.use('/api/openclaw/crm', crmRoutes);
/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

export default app;

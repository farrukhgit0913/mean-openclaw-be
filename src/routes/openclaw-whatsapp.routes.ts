import {
  Router,
  type Request,
  type Response
} from 'express';

import {
  WhatsAppMessage
} from '../models/whatsapp-message.model.js';

import {
  getIO
} from '../socket.js';

const router = Router();

/**
 * Receive an inbound WhatsApp message
 * from the OpenClaw WebSocket listener.
 */
router.post(
  '/inbound',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const payload = req.body;

      const message =
        payload?.message;

      const openClaw =
        message?.__openclaw;

      const transport =
        openClaw?.transport;

      if (
        message?.role !== 'user' ||
        typeof message?.content !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid OpenClaw WhatsApp message'
        });
      }

      if (
        transport?.channel !== 'whatsapp'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Message is not from WhatsApp'
        });
      }

      const from =
        openClaw?.senderId ??
        payload?.session?.origin?.from;

      const to =
        process.env
          .OPENCLAW_WHATSAPP_SELF_NUMBER ??
        payload?.session?.origin?.to;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message:
            'Sender or receiver number is missing'
        });
      }

      const normalizedMessage = {
        direction: 'inbound' as const,

        from,

        to,

        message:
          message.content,

        timestamp: new Date(
          message.timestamp ??
          Date.now()
        ),

        messageId:
          transport?.messageId ??
          payload?.messageId ??
          undefined,

        senderName:
          openClaw?.senderName ??
          undefined,

        sessionKey:
          payload?.sessionKey ??
          undefined,

        channel: 'whatsapp' as const
      };

      /**
       * Avoid duplicate messages.
       */
      if (
        normalizedMessage.messageId
      ) {
        const existing =
          await WhatsAppMessage.findOne({
            messageId:
              normalizedMessage.messageId
          });

        if (existing) {
          return res.json({
            success: true,
            duplicate: true,
            data: existing
          });
        }
      }

      const savedMessage =
        await WhatsAppMessage.create(
          normalizedMessage
        );

      const socketMessage = {
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
          savedMessage.channel
      };

      /**
       * Send to every connected Angular client.
       */
      getIO().emit(
        'whatsapp:message',
        socketMessage
      );

      console.log(
        'WhatsApp inbound saved + emitted:',
        socketMessage
      );

      return res.json({
        success: true,
        data: socketMessage
      });
    } catch (error: any) {
      /**
       * Mongo duplicate key.
       */
      if (
        error?.code === 11000
      ) {
        return res.json({
          success: true,
          duplicate: true
        });
      }

      console.error(
        'WhatsApp inbound error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to process inbound WhatsApp message'
      });
    }
  }
);

/**
 * Load previous WhatsApp messages.
 */
router.get(
  '/messages',
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const messages =
        await WhatsAppMessage
          .find({
            channel: 'whatsapp'
          })
          .sort({
            timestamp: 1
          })
          .limit(200)
          .lean();

      return res.json({
        success: true,
        data: messages.map(
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
              message.channel
          })
        )
      });
    } catch (error) {
      console.error(
        'WhatsApp messages error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to load WhatsApp messages'
      });
    }
  }
);

export default router;
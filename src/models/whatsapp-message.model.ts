import mongoose, {
  Document,
  Schema
} from 'mongoose';

export type WhatsAppMessageDirection =
  | 'inbound'
  | 'outbound';

export interface WhatsAppMessageDocument
  extends Document {
  direction: WhatsAppMessageDirection;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  messageId?: string;
  senderName?: string;
  sessionKey?: string;
  channel: 'whatsapp';
}

const whatsappMessageSchema =
  new Schema<WhatsAppMessageDocument>(
    {
      direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
      },

      from: {
        type: String,
        required: true
      },

      to: {
        type: String,
        required: true
      },

      message: {
        type: String,
        required: true
      },

      timestamp: {
        type: Date,
        required: true
      },

      messageId: {
        type: String,
        default: undefined
      },

      senderName: {
        type: String,
        default: undefined
      },

      sessionKey: {
        type: String,
        default: undefined
      },

      channel: {
        type: String,
        enum: ['whatsapp'],
        default: 'whatsapp',
        required: true
      }
    },
    {
      timestamps: true
    }
  );

whatsappMessageSchema.index({
  timestamp: -1
});

whatsappMessageSchema.index(
  { messageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      messageId: {
        $type: 'string'
      }
    }
  }
);

export const WhatsAppMessage =
  mongoose.model<WhatsAppMessageDocument>(
    'WhatsAppMessage',
    whatsappMessageSchema
  );
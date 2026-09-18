import mongoose, {
  Document,
  Schema
} from 'mongoose';

export interface CustomerDocument
  extends Document {
  name: string;
  phone: string;
  email?: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
  };
  lastContactAt?: Date;
}

const customerSchema =
  new Schema<CustomerDocument>(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },

      email: {
        type: String,
        trim: true
      },

      vehicle: {
        make: String,
        model: String,
        year: Number
      },

      lastContactAt: {
        type: Date
      }
    },
    {
      timestamps: true
    }
  );

export const Customer =
  mongoose.model<CustomerDocument>(
    'Customer',
    customerSchema
  );
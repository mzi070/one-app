import { Schema, model, models } from "mongoose";

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    type:          { type: String, default: "receivable" },
    customerName:  { type: String, required: true },
    customerEmail: { type: String, default: null },
    description:   { type: String, default: null },
    items:         { type: String, default: "[]" },   // stored as JSON string
    subtotal:      { type: Number, required: true },
    taxAmount:     { type: Number, default: 0 },
    total:         { type: Number, required: true },
    status:        { type: String, default: "draft" },
    issueDate:     { type: Date,   default: Date.now },
    dueDate:       { type: Date,   required: true },
    paidAt:        { type: Date,   default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Invoice = models.Invoice || model("Invoice", InvoiceSchema);

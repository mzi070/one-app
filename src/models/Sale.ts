import { Schema, model, models } from "mongoose";

const SaleItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    variantId: { type: String, default: null },
    quantity:  { type: Number, required: true },
    price:     { type: Number, required: true },
    discount:  { type: Number, default: 0 },
    total:     { type: Number, required: true },
  },
  {
    toJSON: {
      virtuals: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: unknown, ret: any) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const SaleSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerId:    { type: String, default: null },
    subtotal:      { type: Number, required: true },
    taxAmount:     { type: Number, default: 0 },
    discount:      { type: Number, default: 0 },
    total:         { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    status:        { type: String, default: "completed" },
    notes:         { type: String, default: null },
    items:         { type: [SaleItemSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: unknown, ret: any) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Sale = models.Sale || model("Sale", SaleSchema);

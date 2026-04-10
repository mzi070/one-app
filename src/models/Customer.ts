import { Schema, model, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    name:    { type: String, required: true },
    email:   { type: String, default: null },
    phone:   { type: String, default: null },
    address: { type: String, default: null },
    credit:  { type: Number, default: 0 },
    notes:   { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Customer = models.Customer || model("Customer", CustomerSchema);

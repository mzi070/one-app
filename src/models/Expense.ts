import { Schema, model, models } from "mongoose";

const ExpenseSchema = new Schema(
  {
    category:    { type: String, required: true },
    description: { type: String, required: true },
    amount:      { type: Number, required: true },
    date:        { type: Date,   required: true },
    vendor:      { type: String, default: null },
    receipt:     { type: String, default: null },
    status:      { type: String, default: "pending" },
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

export const Expense = models.Expense || model("Expense", ExpenseSchema);

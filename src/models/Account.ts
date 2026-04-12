import { Schema, model, models } from "mongoose";

const AccountSchema = new Schema(
  {
    code:        { type: String, required: true, unique: true },
    name:        { type: String, required: true },
    type:        { type: String, required: true },
    parentId:    { type: String, default: null },
    balance:     { type: Number, default: 0 },
    description: { type: String, default: null },
    isActive:    { type: Boolean, default: true },
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

export const Account = models.Account || model("Account", AccountSchema);

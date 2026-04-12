import { Schema, model, models } from "mongoose";

const JournalEntrySchema = new Schema(
  {
    date:          { type: Date,    required: true },
    description:   { type: String,  required: true },
    debitAccount:  { type: String,  required: true },
    creditAccount: { type: String,  required: true },
    amount:        { type: Number,  required: true },
    reference:     { type: String,  default: null },
    posted:        { type: Boolean, default: true },
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

export const JournalEntry =
  models.JournalEntry || model("JournalEntry", JournalEntrySchema);

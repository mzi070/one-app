import mongoose, { Schema, model, models } from "mongoose";

const ProductVariantSchema = new Schema({
  name:     { type: String, required: true },
  sku:      { type: String, required: true, unique: true },
  price:    { type: Number, required: true },
  cost:     { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});

const ProductSchema = new Schema(
  {
    name:        { type: String, required: true },
    sku:         { type: String, required: true, unique: true },
    barcode:     { type: String, default: null },
    description: { type: String, default: null },
    price:       { type: Number, required: true },
    cost:        { type: Number, default: 0 },
    quantity:    { type: Number, default: 0 },
    minStock:    { type: Number, default: 5 },
    category:    { type: String, default: null },
    unit:        { type: String, default: "pcs" },
    taxRate:     { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
    imageUrl:    { type: String, default: null },
    variants:    { type: [ProductVariantSchema], default: [] },
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

export const Product = models.Product || model("Product", ProductSchema);

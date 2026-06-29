import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 95 },
    category: {
      type: String,
      required: true,
      enum: ["Sunglasses", "Bags", "Perfume", "Wallets", "Watches", "Fashion Accessories"]
    },
    stock: { type: Number, default: 0, min: 0 },
    description: { type: String, required: true },
    images: [{ type: String }],
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

productSchema.virtual("salePrice").get(function salePrice() {
  return Math.round(this.price - (this.price * this.discount) / 100);
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);

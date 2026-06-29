import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true }
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    payableAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["UPI_PAY", "UPI_QR", "PAYMENT_LINK", "SCREENSHOT"], default: "UPI_QR" },
    paymentStatus: {
      type: String,
      enum: ["Submitted", "Paid", "Failed", "Refunded"],
      default: "Paid"
    },
    transactionId: { type: String, default: "" },
    gatewayPaymentId: { type: String, default: "" },
    paymentScreenshot: { type: String, default: "" },
    paidAt: { type: Date },
    paymentReference: { type: String, default: "" },
    notes: { type: String },
    orderStatus: {
      type: String,
      enum: ["Payment Review", "Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Payment Review"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

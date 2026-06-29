import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ["UPI_PAY", "UPI_QR", "PAYMENT_LINK", "SCREENSHOT"],
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Submitted", "Success", "Failed", "Cancelled"],
      default: "Pending"
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    transactionId: { type: String, default: "" },
    gatewayPaymentId: { type: String, default: "" },
    paymentScreenshot: { type: String, default: "" },
    verificationToken: { type: String, required: true },
    customer: {
      name: String,
      phone: String,
      email: String,
      address: String
    },
    items: [{ product: String, quantity: Number }],
    couponCode: { type: String, default: "" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    failureReason: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

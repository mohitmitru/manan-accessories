import mongoose from "mongoose";

const paymentSettingSchema = new mongoose.Schema(
  {
    upiId: { type: String, default: "" },
    qrCode: { type: String, default: "" },
    paymentLink: { type: String, default: "" },
    instructions: {
      type: String,
      default: "Upload payment screenshot. Owner will verify your payment and confirm the order."
    }
  },
  { timestamps: true }
);

export default mongoose.model("PaymentSetting", paymentSettingSchema);

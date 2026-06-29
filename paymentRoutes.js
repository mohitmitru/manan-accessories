import express from "express";
import crypto from "crypto";
import PaymentSetting from "../models/PaymentSetting.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { protect } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createId, readStore, usingMongo, withSalePrice, writeStore } from "../config/localStore.js";

const router = express.Router();

const allowedGateways = ["UPI_PAY", "UPI_QR", "PAYMENT_LINK", "SCREENSHOT"];

const buildOrderDraft = async ({ items, couponCode }, localData) => {
  if (!items?.length) throw new Error("Cart is empty");

  if (!usingMongo()) {
    const orderItems = items.map((item) => {
      const product = localData.products.find((storedProduct) => storedProduct._id === item.product);
      if (!product) throw new Error("Product not found");
      if (Number(product.stock) < Number(item.quantity)) throw new Error(`${product.name} has only ${product.stock} in stock`);
      const productWithPrice = withSalePrice(product);
      return {
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        price: productWithPrice.salePrice,
        quantity: Number(item.quantity)
      };
    });
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cleanCoupon = String(couponCode || "").trim().toUpperCase();
    const discountAmount = cleanCoupon === "MANAN10" ? Math.round(totalAmount * 0.1) : 0;
    return { orderItems, totalAmount, discountAmount, payableAmount: Math.max(0, totalAmount - discountAmount), couponCode: discountAmount ? cleanCoupon : "" };
  }

  const products = await Product.find({ _id: { $in: items.map((item) => item.product) } });
  const orderItems = items.map((item) => {
    const product = products.find((p) => String(p._id) === item.product);
    if (!product) throw new Error("Product not found");
    if (Number(product.stock) < Number(item.quantity)) throw new Error(`${product.name} has only ${product.stock} in stock`);
    const salePrice = Math.round(product.price - (product.price * product.discount) / 100);
    return {
      product: product._id,
      name: product.name,
      image: product.images[0] || "",
      price: salePrice,
      quantity: Number(item.quantity)
    };
  });
  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cleanCoupon = String(couponCode || "").trim().toUpperCase();
  const discountAmount = cleanCoupon === "MANAN10" ? Math.round(totalAmount * 0.1) : 0;
  return { orderItems, totalAmount, discountAmount, payableAmount: Math.max(0, totalAmount - discountAmount), couponCode: discountAmount ? cleanCoupon : "" };
};

const createPaidOrder = async ({ payment, draft, paymentStatus = "Paid", orderStatus = "Placed" }) => {
  if (!usingMongo()) {
    const data = readStore();
    if (data.orders.some((order) => order.paymentId === payment._id)) throw new Error("Duplicate payment blocked");
    const order = {
      _id: `MA-${Date.now()}-${createId().slice(0, 6).toUpperCase()}`,
      paymentId: payment._id,
      customer: payment.customer,
      items: draft.orderItems,
      totalAmount: draft.totalAmount,
      discountAmount: draft.discountAmount,
      payableAmount: draft.payableAmount,
      couponCode: draft.couponCode,
      paymentMethod: payment.gateway,
      paymentStatus,
      transactionId: payment.transactionId,
      gatewayPaymentId: payment.gatewayPaymentId,
      paymentScreenshot: payment.paymentScreenshot || "",
      paidAt: new Date().toISOString(),
      orderStatus,
      createdAt: new Date().toISOString()
    };
    draft.orderItems.forEach((item) => {
      const product = data.products.find((storedProduct) => storedProduct._id === item.product);
      product.stock = Math.max(0, Number(product.stock) - Number(item.quantity));
    });
    data.orders.push(order);
    writeStore(data);
    return order;
  }

  const existing = await Order.findOne({ gatewayPaymentId: payment.gatewayPaymentId });
  if (existing) throw new Error("Duplicate payment blocked");
  const order = await Order.create({
    customer: payment.customer,
    items: draft.orderItems,
    totalAmount: draft.totalAmount,
    discountAmount: draft.discountAmount,
    payableAmount: draft.payableAmount,
    couponCode: draft.couponCode,
    paymentMethod: payment.gateway,
    paymentStatus,
    transactionId: payment.transactionId,
    gatewayPaymentId: payment.gatewayPaymentId,
    paymentScreenshot: payment.paymentScreenshot || "",
    paidAt: new Date(),
    orderStatus
  });
  await Promise.all(draft.orderItems.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })));
  return order;
};

router.get("/", asyncHandler(async (_req, res) => {
  if (!usingMongo()) {
    return res.json(readStore().payment);
  }

  let settings = await PaymentSetting.findOne();
  if (!settings) settings = await PaymentSetting.create({});
  res.json(settings);
}));

router.put("/", protect, upload.single("qrCode"), asyncHandler(async (req, res) => {
  const shouldRemoveQr = req.body.removeQr === "true";
  const qrCodeUrl = req.file ? await uploadToCloudinary(req.file, "manan-accessories/payments") : "";

  if (!usingMongo()) {
    const data = readStore();
    data.payment = {
      ...data.payment,
      upiId: req.body.upiId ?? data.payment.upiId,
      paymentLink: req.body.paymentLink ?? data.payment.paymentLink,
      instructions: req.body.instructions ?? data.payment.instructions,
      qrCode: shouldRemoveQr ? "" : qrCodeUrl || data.payment.qrCode
    };
    writeStore(data);
    return res.json(data.payment);
  }

  let settings = await PaymentSetting.findOne();
  if (!settings) settings = await PaymentSetting.create({});

  settings.upiId = req.body.upiId ?? settings.upiId;
  settings.paymentLink = req.body.paymentLink ?? settings.paymentLink;
  settings.instructions = req.body.instructions ?? settings.instructions;
  if (shouldRemoveQr) settings.qrCode = "";
  if (qrCodeUrl) settings.qrCode = qrCodeUrl;

  await settings.save();
  res.json(settings);
}));

router.post("/checkout", asyncHandler(async (req, res) => {
  const { customer, items, couponCode = "", gateway = "UPI_QR" } = req.body;
  if (!allowedGateways.includes(gateway)) return res.status(400).json({ message: "Unsupported payment method" });

  const data = usingMongo() ? null : readStore();
  const draft = await buildOrderDraft({ items, couponCode }, data);
  const token = crypto.randomBytes(24).toString("hex");
  const transactionId = `${gateway}-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  if (!usingMongo()) {
    const payment = {
      _id: createId(),
      gateway,
      status: "Pending",
      amount: draft.payableAmount,
      currency: "INR",
      transactionId,
      gatewayPaymentId: "",
      verificationToken: token,
      customer,
      items,
      couponCode: draft.couponCode,
      createdAt: new Date().toISOString()
    };
    data.payments = data.payments || [];
    data.payments.push(payment);
    writeStore(data);
    return res.status(201).json({
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      transactionId,
      gateway,
      verificationToken: token
    });
  }

  const payment = await Payment.create({
    gateway,
    amount: draft.payableAmount,
    transactionId,
    verificationToken: token,
    customer,
    items,
    couponCode: draft.couponCode
  });
  res.status(201).json({
    paymentId: payment._id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    transactionId,
    gateway,
    verificationToken: token
  });
}));

router.post("/:id/screenshot", upload.single("paymentScreenshot"), asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;
  if (!req.file) return res.status(400).json({ message: "Payment screenshot is required" });
  const screenshotUrl = await uploadToCloudinary(req.file, "manan-accessories/payment-screenshots");

  if (!usingMongo()) {
    const data = readStore();
    const payment = (data.payments || []).find((item) => item._id === req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.verificationToken !== verificationToken) return res.status(400).json({ message: "Payment verification failed" });
    if (payment.status !== "Pending") return res.status(409).json({ message: "Payment already submitted" });

    payment.status = "Submitted";
    payment.paymentScreenshot = screenshotUrl;
    payment.gatewayPaymentId = `manual_${crypto.randomBytes(8).toString("hex")}`;
    const draft = await buildOrderDraft({ items: payment.items, couponCode: payment.couponCode }, data);
    const order = await createPaidOrder({ payment, draft, paymentStatus: "Submitted", orderStatus: "Payment Review" });

    const latestData = readStore();
    const latestPayment = (latestData.payments || []).find((item) => item._id === payment._id);
    if (latestPayment) {
      latestPayment.status = "Submitted";
      latestPayment.paymentScreenshot = payment.paymentScreenshot;
      latestPayment.gatewayPaymentId = payment.gatewayPaymentId;
      latestPayment.orderId = order._id;
      writeStore(latestData);
    }
    return res.json({ status: "Submitted", message: "Payment screenshot submitted. Owner will verify your order.", order });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  if (payment.verificationToken !== verificationToken) return res.status(400).json({ message: "Payment verification failed" });
  if (payment.status !== "Pending") return res.status(409).json({ message: "Payment already submitted" });

  payment.status = "Submitted";
  payment.paymentScreenshot = screenshotUrl;
  payment.gatewayPaymentId = `manual_${crypto.randomBytes(8).toString("hex")}`;
  const draft = await buildOrderDraft({ items: payment.items, couponCode: payment.couponCode });
  const order = await createPaidOrder({ payment, draft, paymentStatus: "Submitted", orderStatus: "Payment Review" });
  payment.order = order._id;
  await payment.save();
  res.json({ status: "Submitted", message: "Payment screenshot submitted. Owner will verify your order.", order });
}));

router.get("/:id/status", asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const payment = (readStore().payments || []).find((item) => item._id === req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    return res.json({ status: payment.status, amount: payment.amount, transactionId: payment.transactionId, orderId: payment.orderId || "" });
  }
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  res.json({ status: payment.status, amount: payment.amount, transactionId: payment.transactionId, orderId: payment.order || "" });
}));

router.post("/:id/verify", asyncHandler(async (req, res) => {
  return res.status(410).json({ message: "Payment screenshot is required before order review can be created" });
  /*
  const { verificationToken, result = "success" } = req.body;

  if (!usingMongo()) {
    const data = readStore();
    const payment = (data.payments || []).find((item) => item._id === req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "Success") return res.status(409).json({ message: "Payment already used", orderId: payment.orderId });
    if (payment.verificationToken !== verificationToken) return res.status(400).json({ message: "Payment verification failed" });
    if (result !== "success") {
      payment.status = result === "cancelled" ? "Cancelled" : "Failed";
      payment.failureReason = "Payment was not successful";
      writeStore(data);
      return res.status(400).json({ status: payment.status, message: "Payment failed or cancelled. Order was not created." });
    }
    payment.status = "Success";
    payment.gatewayPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
    const draft = await buildOrderDraft({ items: payment.items, couponCode: payment.couponCode }, data);
    const order = await createPaidOrder({ payment, draft });
    const latestData = readStore();
    const latestPayment = (latestData.payments || []).find((item) => item._id === payment._id);
    if (latestPayment) {
      latestPayment.status = "Success";
      latestPayment.gatewayPaymentId = payment.gatewayPaymentId;
      latestPayment.orderId = order._id;
      writeStore(latestData);
    }
    return res.json({
      status: "Success",
      message: "Payment Successful! Your order has been placed.",
      order
    });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  if (payment.status === "Success") return res.status(409).json({ message: "Payment already used", orderId: payment.order });
  if (payment.verificationToken !== verificationToken) return res.status(400).json({ message: "Payment verification failed" });
  if (result !== "success") {
    payment.status = result === "cancelled" ? "Cancelled" : "Failed";
    payment.failureReason = "Payment was not successful";
    await payment.save();
    return res.status(400).json({ status: payment.status, message: "Payment failed or cancelled. Order was not created." });
  }

  payment.status = "Success";
  payment.gatewayPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
  const draft = await buildOrderDraft({ items: payment.items, couponCode: payment.couponCode });
  const order = await createPaidOrder({ payment, draft });
  payment.order = order._id;
  await payment.save();
  res.json({
    status: "Success",
    message: "Payment Successful! Your order has been placed.",
    order
  });
  */
}));

export default router;

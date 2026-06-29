import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createId, readStore, usingMongo, withSalePrice, writeStore } from "../config/localStore.js";

const router = express.Router();

router.post("/", upload.single("paymentScreenshot"), asyncHandler(async (req, res) => {
  return res.status(410).json({ message: "Orders are created only after backend payment verification" });
  /*
  const payload = req.body.order ? JSON.parse(req.body.order) : req.body;
  const { customer, items, paymentMethod, notes, couponCode = "", paymentConfirmed = false } = payload;

  if (!items?.length) {
    return res.status(400).json({ message: "Order must contain at least one item" });
  }

  if (!paymentConfirmed) {
    return res.status(400).json({ message: "Payment must be completed before placing order" });
  }

  if (!usingMongo()) {
    const data = readStore();
    const orderItems = items.map((item) => {
      const product = data.products.find((storedProduct) => storedProduct._id === item.product);
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

    const order = {
      _id: createId(),
      customer,
      items: orderItems,
      totalAmount,
      discountAmount,
      payableAmount: Math.max(0, totalAmount - discountAmount),
      couponCode: discountAmount ? cleanCoupon : "",
      paymentMethod,
      notes,
      paymentStatus: paymentConfirmed ? "Submitted" : "Pending",
      paymentScreenshot: "",
      orderStatus: "Payment Review",
      createdAt: new Date().toISOString()
    };
    orderItems.forEach((item) => {
      const product = data.products.find((storedProduct) => storedProduct._id === item.product);
      product.stock = Math.max(0, Number(product.stock) - Number(item.quantity));
    });
    data.orders.push(order);
    writeStore(data);
    return res.status(201).json(order);
  }

  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

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

  const order = await Order.create({
    customer,
    items: orderItems,
    totalAmount,
    discountAmount,
    payableAmount: Math.max(0, totalAmount - discountAmount),
    couponCode: discountAmount ? cleanCoupon : "",
    paymentMethod,
    notes,
    paymentStatus: paymentConfirmed ? "Submitted" : "Pending",
    paymentScreenshot: ""
  });

  await Promise.all(orderItems.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })));

  res.status(201).json(order);
  */
}));

router.get("/", protect, asyncHandler(async (_req, res) => {
  if (!usingMongo()) {
    return res.json(readStore().orders.slice().reverse());
  }

  const orders = await Order.find().populate("items.product").sort({ createdAt: -1 });
  res.json(orders);
}));

router.get("/customer", asyncHandler(async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  const phone = String(req.query.phone || "").replace(/\D/g, "");

  if (!email || !phone) {
    return res.status(400).json({ message: "Email and phone are required" });
  }

  if (!usingMongo()) {
    const orders = readStore().orders
      .filter((order) => {
        const orderEmail = String(order.customer.email || "").trim().toLowerCase();
        const orderPhone = String(order.customer.phone || "").replace(/\D/g, "");
        return orderEmail === email && orderPhone.endsWith(phone.slice(-10));
      })
      .reverse();
    return res.json(orders);
  }

  const orders = await Order.find({
    "customer.email": { $regex: `^${email}$`, $options: "i" },
    "customer.phone": { $regex: `${phone.slice(-10)}$` }
  }).sort({ createdAt: -1 });

  res.json(orders);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const order = readStore().orders.find((item) => item._id === req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
}));

router.patch("/:id/status", protect, asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const data = readStore();
    const index = data.orders.findIndex((order) => order._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Order not found" });
    const current = data.orders[index];
    const nextPaymentStatus = req.body.paymentStatus || current.paymentStatus;
    let nextOrderStatus = req.body.orderStatus || current.orderStatus;

    if (req.body.orderStatus === "Cancelled") {
      nextOrderStatus = "Cancelled";
    } else if (nextPaymentStatus === "Submitted") {
      nextOrderStatus = "Payment Review";
    } else if (nextPaymentStatus === "Paid") {
      if (current.paymentStatus !== "Paid") {
        current.paidAt = new Date().toISOString();
      }
      if (nextOrderStatus === "Payment Review" || nextOrderStatus === "Cancelled") {
        nextOrderStatus = "Placed";
      }
    } else if (nextPaymentStatus === "Failed" || nextPaymentStatus === "Refunded") {
      nextOrderStatus = "Cancelled";
    }

    data.orders[index] = {
      ...current,
      paymentStatus: nextPaymentStatus,
      orderStatus: nextOrderStatus
    };

    const payment = (data.payments || []).find((item) => item._id === current.paymentId);
    if (payment) {
      payment.status = nextPaymentStatus === "Paid" ? "Success" : nextPaymentStatus;
      payment.orderId = current._id;
    }

    writeStore(data);
    return res.json(data.orders[index]);
  }

  const current = await Order.findById(req.params.id);
  if (!current) return res.status(404).json({ message: "Order not found" });

  const nextPaymentStatus = req.body.paymentStatus || current.paymentStatus;
  let nextOrderStatus = req.body.orderStatus || current.orderStatus;

  if (req.body.orderStatus === "Cancelled") {
    nextOrderStatus = "Cancelled";
  } else if (nextPaymentStatus === "Submitted") {
    nextOrderStatus = "Payment Review";
  } else if (nextPaymentStatus === "Paid") {
    if (current.paymentStatus !== "Paid") {
      current.paidAt = new Date();
    }
    if (nextOrderStatus === "Payment Review" || nextOrderStatus === "Cancelled") {
      nextOrderStatus = "Placed";
    }
  } else if (nextPaymentStatus === "Failed" || nextPaymentStatus === "Refunded") {
    nextOrderStatus = "Cancelled";
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus: nextPaymentStatus,
      orderStatus: nextOrderStatus,
      paidAt: current.paidAt
    },
    { new: true, runValidators: true }
  );

  await Payment.findOneAndUpdate(
    { $or: [{ order: order._id }, { gatewayPaymentId: order.gatewayPaymentId }] },
    { status: nextPaymentStatus === "Paid" ? "Success" : nextPaymentStatus }
  );

  res.json(order);
}));

router.delete("/:id", protect, asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const data = readStore();
    const nextOrders = data.orders.filter((order) => order._id !== req.params.id);
    if (nextOrders.length === data.orders.length) return res.status(404).json({ message: "Order not found" });
    data.orders = nextOrders;
    writeStore(data);
    return res.json({ message: "Order deleted" });
  }

  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order deleted" });
}));

export default router;

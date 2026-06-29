import fs from "fs";
import path from "path";
import crypto from "crypto";

const dataDir = path.join(process.cwd(), "src", "data");
const dataFile = path.join(dataDir, "dev-db.json");

const defaultData = {
  products: [],
  orders: [],
  payments: [],
  payment: {
    _id: "payment-settings",
    upiId: "",
    qrCode: "",
    paymentLink: "",
    instructions: "Pay securely. Your order will be created only after backend payment verification."
  }
};

const ensureStore = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
};

export const usingMongo = () => global.mananMongoConnected === true;

export const readStore = () => {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
};

export const writeStore = (data) => {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  return data;
};

export const createId = () => crypto.randomBytes(12).toString("hex");

export const withSalePrice = (product) => ({
  ...product,
  id: product._id,
  salePrice: Math.round(Number(product.price) - (Number(product.price) * Number(product.discount || 0)) / 100)
});

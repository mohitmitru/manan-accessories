import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import Admin from "./models/Admin.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

const ensureAdminUser = async () => {
  if (!global.mananMongoConnected) return;

  const email = process.env.ADMIN_EMAIL || "owner@mananaccessories.com";
  const password = process.env.ADMIN_PASSWORD || "Owner@12345";
  const existing = await Admin.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.password = password;
    existing.name = existing.name || "Owner";
    await existing.save();
    console.log("Admin user updated:", email);
    return;
  }

  await Admin.create({ name: "Owner", email, password });
  console.log("Admin user created:", email);
};

await ensureAdminUser();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
    if (!origin || allowedOrigins.includes(origin) || isLocalDev) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.json({ message: "Manan Accessories API is running" }));
app.get("/health", (_req, res) => res.json({
  status: "ok",
  cloudinaryConfigured: Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.use((error, _req, res, _next) => {
  res.status(error.status || 500).json({ message: error.message || "Server error" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));

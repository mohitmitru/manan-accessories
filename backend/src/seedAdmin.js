import "dotenv/config";
import { connectDB } from "./config/db.js";
import Admin from "./models/Admin.js";

await connectDB();

const email = process.env.ADMIN_EMAIL || "owner@mananaccessories.com";
const password = process.env.ADMIN_PASSWORD || "Owner@12345";

if (!global.mananMongoConnected) {
  console.log("MongoDB is not running. Local development login is available with:");
  console.log("Email:", email);
  console.log("Password:", password);
  process.exit(0);
}

const existing = await Admin.findOne({ email });

if (existing) {
  console.log("Admin already exists:", email);
} else {
  await Admin.create({ name: "Owner", email, password });
  console.log("Admin created:", email);
}

process.exit(0);

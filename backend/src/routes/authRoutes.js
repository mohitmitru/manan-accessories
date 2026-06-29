import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { usingMongo } from "../config/localStore.js";

const router = express.Router();

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!usingMongo()) {
    const adminEmail = process.env.ADMIN_EMAIL || "owner@mananaccessories.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Owner@12345";

    if (String(email).toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: "local-owner" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      token,
      admin: { id: "local-owner", name: "Owner", email: adminEmail }
    });
  }

  const admin = await Admin.findOne({ email: String(email).toLowerCase() });

  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email }
  });
}));

router.get("/me", protect, (req, res) => {
  res.json(req.admin);
});

export default router;

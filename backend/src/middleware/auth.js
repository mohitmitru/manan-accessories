import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { usingMongo } from "../config/localStore.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!usingMongo() && decoded.id === "local-owner") {
      req.admin = {
        _id: "local-owner",
        name: "Owner",
        email: process.env.ADMIN_EMAIL || "owner@mananaccessories.com"
      };
      return next();
    }

    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

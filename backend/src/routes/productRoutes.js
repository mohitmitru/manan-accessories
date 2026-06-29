import express from "express";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";
import { upload, uploadManyToCloudinary } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createId, readStore, usingMongo, withSalePrice, writeStore } from "../config/localStore.js";

const router = express.Router();


router.get("/", asyncHandler(async (req, res) => {
  const { search = "", category = "" } = req.query;

  if (!usingMongo()) {
    const data = readStore();
    const products = data.products
      .filter((product) => !search || product.name.toLowerCase().includes(String(search).toLowerCase()))
      .filter((product) => !category || product.category.toLowerCase() === String(category).toLowerCase())
      .map(withSalePrice)
      .reverse();
    return res.json(products);
  }

  const query = {};

  if (search) query.name = { $regex: search, $options: "i" };
  if (category) query.category = { $regex: `^${category}$`, $options: "i" };

  const products = await Product.find(query).sort({ createdAt: -1 });
  res.json(products);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const product = readStore().products.find((item) => item._id === req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(withSalePrice(product));
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
}));

router.post("/", protect, upload.array("images", 5), asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const data = readStore();
    const product = {
      _id: createId(),
      name: req.body.name,
      price: Number(req.body.price),
      discount: Number(req.body.discount || 0),
      category: req.body.category,
      stock: Number(req.body.stock || 0),
      description: req.body.description,
      featured: req.body.featured === "true",
      images: toImageUrls(req.files),
      createdAt: new Date().toISOString()
    };
    data.products.push(product);
    writeStore(data);
    return res.status(201).json(withSalePrice(product));
  }

  const product = await Product.create({
    ...req.body,
    price: Number(req.body.price),
    discount: Number(req.body.discount || 0),
    stock: Number(req.body.stock || 0),
    featured: req.body.featured === "true",
    images: toImageUrls(req.files)
  });

  res.status(201).json(product);
}));

router.put("/:id", protect, upload.array("images", 5), asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const data = readStore();
    const index = data.products.findIndex((item) => item._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: "Product not found" });

    const current = data.products[index];
    const newImages = await uploadManyToCloudinary(req.files, "manan-accessories/products");
    const keptImages = req.body.existingImages
      ? JSON.parse(req.body.existingImages)
      : current.images;
    data.products[index] = {
      ...current,
      name: req.body.name ?? current.name,
      price: req.body.price !== undefined ? Number(req.body.price) : current.price,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : current.discount,
      category: req.body.category ?? current.category,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : current.stock,
      description: req.body.description ?? current.description,
      featured: req.body.featured !== undefined ? req.body.featured === "true" : current.featured,
      images: [...keptImages, ...newImages],
      updatedAt: new Date().toISOString()
    };
    writeStore(data);
    return res.json(withSalePrice(data.products[index]));
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

 const imageUrls = await uploadManyToCloudinary(req.files, "manan-accessories/products");
  const keptImages = req.body.existingImages
    ? JSON.parse(req.body.existingImages)
    : product.images;
  Object.assign(product, {
    name: req.body.name ?? product.name,
    price: req.body.price !== undefined ? Number(req.body.price) : product.price,
    discount: req.body.discount !== undefined ? Number(req.body.discount) : product.discount,
    category: req.body.category ?? product.category,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : product.stock,
    description: req.body.description ?? product.description,
    featured: req.body.featured !== undefined ? req.body.featured === "true" : product.featured,
    images: [...keptImages, ...newImages]
  });

  await product.save();
  res.json(product);
}));

router.delete("/:id", protect, asyncHandler(async (req, res) => {
  if (!usingMongo()) {
    const data = readStore();
    const nextProducts = data.products.filter((item) => item._id !== req.params.id);
    if (nextProducts.length === data.products.length) return res.status(404).json({ message: "Product not found" });
    data.products = nextProducts;
    writeStore(data);
    return res.json({ message: "Product deleted" });
  }

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
}));

export default router;

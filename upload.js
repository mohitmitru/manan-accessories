import fs from "fs";
import path from "path";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const uploadDir = path.join(process.cwd(), "src", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage: hasCloudinary ? multer.memoryStorage() : storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const fileUrl = (file) => file?.path || file?.cloudinaryUrl || (file?.filename ? `/uploads/${file.filename}` : "");

export const filesToUrls = (files = []) => files.map(fileUrl).filter(Boolean);

export const uploadToCloudinary = async (file, folder = "manan-accessories") => {
  if (!file) return "";
  if (!hasCloudinary) return fileUrl(file);

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image"
  });
  return result.secure_url;
};

export const uploadManyToCloudinary = async (files = [], folder = "manan-accessories") => {
  const urls = await Promise.all(files.map((file) => uploadToCloudinary(file, folder)));
  return urls.filter(Boolean);
};

import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    global.mananMongoConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    global.mananMongoConnected = false;
    console.warn("MongoDB not connected. Using local development storage instead.");
    console.warn("MongoDB error:", error.message);
  }
};

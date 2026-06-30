import mongoose from "mongoose";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
  const maxAttempts = process.env.NODE_ENV === "production" ? 5 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      });

      global.mananMongoConnected = true;
      console.log("MongoDB connected");

      mongoose.connection.on("reconnected", () => {
        global.mananMongoConnected = true;
        console.log("MongoDB reconnected");
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Waiting for reconnect.");
        if (process.env.NODE_ENV !== "production") {
          global.mananMongoConnected = false;
        }
      });

      return;
    } catch (error) {
      console.warn(`MongoDB connection attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        await wait(3000);
      } else if (process.env.NODE_ENV === "production") {
        throw error;
      } else {
        global.mananMongoConnected = false;
        console.warn("MongoDB not connected. Using local development storage instead.");
      }
    }
  }
};

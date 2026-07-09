const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Ensure env variables are configured
dotenv.config();

const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI;

  if (!dbUri) {
    console.error("❌ MONGODB_URI is not defined in the .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

import mongoose from "mongoose";

import dotenv from 'dotenv';    
dotenv.config();
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ MONGO_URL is undefined. Check your .env file.");
  process.exit(1);
}


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL); // options not needed

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;


import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true , required: true  }, 
  password: { type: String, required: true },
  phone: { type: String },
  admin: { type: Boolean, default: false },
}, { timestamps: true });


export default mongoose.model("userModel", userSchema);
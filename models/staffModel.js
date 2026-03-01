import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    initial: { type: String },
    role: { type: String, required: true },
    since: { type: String },
    type: {
      type: String,
      enum: ["Full Time", "Part Time", "Contract", "Intern"],
      default: "Full Time",
    },
    status: {
      type: String,
      enum: ["On Shift", "Day Off"],
      default: "On Shift",
    },
    color: { type: String },
    schedule: {
      type: [String],
      default: [],
    },
    hours: { type: String },
    // Personal details
    photoUrl: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    emergencyContact: { type: String },
    // Onboarded document (link or description)
    onboardedDoc: { type: String },
    onboardedDocUrl: { type: String },
  },
  { timestamps: true }
);

// Keep `initial` in sync with `name`
staffSchema.pre("save", function () {
  if ((this.isModified("name") || !this.initial) && this.name) {
    this.initial = this.name.trim().charAt(0).toUpperCase();
  }
});

export default mongoose.model("Staff", staffSchema);


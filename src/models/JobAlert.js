import mongoose from "mongoose";

const jobAlertSchema = new mongoose.Schema(
  {
    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Alert name is required"],
      trim: true,
    },

    // Search Criteria
    keywords: [String],
    location: String,
    jobType: [String],
    salaryMin: Number,
    category: String,
    experienceLevel: String,

    // Settings
    isActive: {
      type: Boolean,
      default: true,
    },
    frequency: {
      type: String,
      enum: ["instant", "daily", "weekly"],
      default: "daily",
    },

    // Stats
    lastSent: Date,
    totalJobsFound: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

jobAlertSchema.index({ jobSeeker: 1, isActive: 1 });

const JobAlert = mongoose.model("JobAlert", jobAlertSchema);

export default JobAlert;

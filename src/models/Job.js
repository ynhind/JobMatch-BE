import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requirements: String,
    responsibilities: String,

    // Location
    location: {
      city: String,
      country: String,
      isRemote: { type: Boolean, default: false },
    },

    // Salary
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: "VND" },
      isNegotiable: { type: Boolean, default: false },
    },

    // Job Details
    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid"],
      default: "onsite",
    },
    jobType: {
      type: String,
      enum: ["fulltime", "parttime", "contract", "internship"],
      default: "fulltime",
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
    },
    category: String, // IT, Marketing, Sales, etc.
    skills: [String],

    // Status
    status: {
      type: String,
      enum: ["open", "closed", "draft"],
      default: "open",
    },
    deadline: Date,

    // Stats
    totalApplications: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
jobSchema.index({ title: "text", description: "text", category: "text" });
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ employer: 1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;

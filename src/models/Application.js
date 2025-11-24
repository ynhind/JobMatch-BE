import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Application Details
    resumeId: {
      type: String, // ID of the resume from user's resumes array
    },
    coverLetter: String,

    // Status
    status: {
      type: String,
      enum: [
        "pending",
        "reviewing",
        "shortlisted",
        "interviewed",
        "rejected",
        "accepted",
        "withdrawn",
      ],
      default: "pending",
    },

    // Timeline
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    updatedStatusAt: Date,

    // Notes from employer
    employerNotes: String,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true });
applicationSchema.index({ jobSeeker: 1, status: 1 });
applicationSchema.index({ employer: 1, status: 1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;

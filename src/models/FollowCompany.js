import mongoose from "mongoose";

const followCompanySchema = new mongoose.Schema(
  {
    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    followedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate follows
followCompanySchema.index({ jobSeeker: 1, company: 1 }, { unique: true });

const FollowCompany = mongoose.model("FollowCompany", followCompanySchema);

export default FollowCompany;

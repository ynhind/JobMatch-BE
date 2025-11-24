import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    logoUrl: String,
    description: String,
    industry: String,
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    },
    website: String,
    address: String,
    city: String,
    country: String,
    phone: String,
    email: String,

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedAt: Date,

    // Social Links
    socialLinks: {
      linkedin: String,
      facebook: String,
      twitter: String,
    },

    // Stats
    totalJobs: {
      type: Number,
      default: 0,
    },
    totalFollowers: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
companySchema.index({
  companyName: "text",
  description: "text",
  industry: "text",
});

const Company = mongoose.model("Company", companySchema);

export default Company;

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["js", "employer"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Personal Info (for Job Seekers)
    firstName: String,
    lastName: String,
    avatarUrl: String,
    phone: String,
    location: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateJoinedWorkforce: Date,

    // Profile Sections (for Job Seekers)
    summary: String, // About Me

    experiences: [
      {
        companyName: String,
        position: String,
        startDate: Date,
        endDate: Date,
        isCurrent: { type: Boolean, default: false },
        description: String,
      },
    ],

    education: [
      {
        school: String,
        degree: String,
        fieldOfStudy: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],

    skills: [String],

    certificates: [
      {
        name: String,
        organization: String,
        issueDate: Date,
        expiryDate: Date,
        url: String,
        description: String,
      },
    ],

    awards: [
      {
        name: String,
        organization: String,
        issueDate: Date,
        description: String,
      },
    ],

    others: [
      {
        title: String,
        organization: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],

    resumes: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Job Interests and Preferences (for Job Seekers)
    interests: {
      desiredJobTitles: [String],
      desiredLocations: [String],
      desiredSalaryRange: {
        min: Number,
        max: Number,
      },
      desiredJobTypes: [String], // fulltime, parttime, remote, etc.
    },

    // Settings
    settings: {
      emailNotifications: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true },
      profileVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },

    // For Employers - reference to Company
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

// Ensure virtuals are included in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;

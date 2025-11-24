import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["user", "job", "company"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
    },
    description: String,
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    reviewedAt: Date,
    actionTaken: String,
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ targetId: 1, status: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "application_status",
        "new_job",
        "job_alert",
        "company_update",
        "new_applicant",
        "system",
        "other",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: String, // URL to navigate to
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,

    // Related entities
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    relatedCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

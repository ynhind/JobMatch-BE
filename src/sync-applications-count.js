import mongoose from "mongoose";
import Job from "./models/Job.js";
import Application from "./models/Application.js";
import dotenv from "dotenv";

dotenv.config();

const syncApplicationsCount = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all jobs
    const jobs = await Job.find({});
    console.log(`📊 Found ${jobs.length} jobs to update`);

    let updatedCount = 0;

    // Update each job's totalApplications count
    for (const job of jobs) {
      const applicationsCount = await Application.countDocuments({
        job: job._id,
      });

      if (job.totalApplications !== applicationsCount) {
        job.totalApplications = applicationsCount;
        await job.save();
        updatedCount++;
        console.log(
          `✅ Updated job "${job.title}" - Applications: ${applicationsCount}`
        );
      }
    }

    console.log(`\n🎉 Sync completed! Updated ${updatedCount} jobs.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing applications count:", error);
    process.exit(1);
  }
};

syncApplicationsCount();

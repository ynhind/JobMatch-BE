import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: process.env.ADMIN_EMAIL || "admin@jobmatch.com",
    });

    if (existingAdmin) {
      console.log("⚠️  Admin already exists");
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || "admin@jobmatch.com",
      password: process.env.ADMIN_PASSWORD || "admin123456",
      name: "Super Admin",
      isSuper: true,
    });

    console.log("✅ Admin created successfully:");
    console.log("   Email:", admin.email);
    console.log("   Password:", process.env.ADMIN_PASSWORD || "admin123456");
    console.log("\n⚠️  Please change the admin password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();

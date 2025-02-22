const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

async function insertAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27023/auth_db", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Define the User schema (assuming you have a User model)
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
    });

    const User = mongoose.model("User", userSchema);

    // Check if the admin user already exists
    const existingAdmin = await User.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      mongoose.disconnect();
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("1", 10);

    // Create a new admin user
    const adminUser = new User({
      username: "admin",
      password: hashedPassword,
    });

    // Save the admin user
    await adminUser.save();

    console.log("Admin user inserted successfully.");

    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error("Error inserting admin user:", error);
    mongoose.disconnect();
  }
}

insertAdminUser();

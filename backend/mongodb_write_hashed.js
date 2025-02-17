const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// MongoDB connection URI for auth_db
const uri = "mongodb://localhost:27023/auth_db";

mongoose
  .connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
  isActive: Boolean,
});

// Create the User Model
const User = mongoose.model("User", userSchema);

// Hash the password using bcrypt before saving it
async function createUser(userData) {
  try {
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(userData.password, salt); // Hash password

    const newUser = new User({
      ...userData,
      password: hashedPassword, // Store the hashed password
    });

    const savedUser = await newUser.save();
    console.log("User saved:", savedUser);
    return savedUser;
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

// Example usage: Create an admin user
async function main() {
  try {
    const createdUser = await createUser({
      username: "admin1", // Admin username
      email: "admin1@example.com", // Admin email
      password: "1", // Plaintext password (will be hashed)
      age: 30,
      isActive: true,
    });
    console.log("Admin user created:", createdUser);
  } catch (err) {
    console.error("Error in main function:", err);
  } finally {
    mongoose.disconnect(); // Close the connection when done
  }
}

main();

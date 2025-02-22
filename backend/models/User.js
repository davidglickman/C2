// MongoDB Schema (models/User.js)

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hash password in production
  age: Number,
  isActive: Boolean,
});
module.exports = mongoose.model("User", userSchema);

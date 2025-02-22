// backend/models/Detection.js

const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema({
  coordinates: {
    type: [Number],
    required: true, // Example: GeoJSON coordinates
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    required: false,
  },
  // Add more fields as per your requirements
});

const Detection = mongoose.model("Detection", detectionSchema);

module.exports = Detection;

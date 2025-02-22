const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active",
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Sensor", sensorSchema);

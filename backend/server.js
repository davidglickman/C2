// 1. run mongo db
// docker run -p 27023:27017 -v D:\Documents\react_learning\c2_g2:/data/db -d mongo:latest
// 2. run backend
// cd D:\Documents\react_learning\c2_g2\backend
// npm start
// 3. run frontend
// cd D:\Documents\react_learning\c2_g2\frontend
// npm start
// admin1, 1

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const User = require("./models/User"); // User model for authentication
const Detection = require("./models/Detection"); // Detection model for map data

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

// MongoDB connection for authentication (auth_db)
// docker run -p 27023:27017 -d mongo:latest
const authDbConnection = mongoose.createConnection(
  "mongodb://localhost:27023/auth_db",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

authDbConnection.on("connected", () => {
  console.log("Connected to MongoDB - auth_db for user authentication");
});

authDbConnection.on("error", (err) => {
  console.error("MongoDB auth_db connection error:", err);
});

// MongoDB connection for map-related data (gis_app)
const gisDbConnection = mongoose.createConnection(
  "mongodb://localhost:27023/gis_app",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

gisDbConnection.on("connected", () => {
  console.log("Connected to MongoDB - gis_app for map data");
});

gisDbConnection.on("error", (err) => {
  console.error("MongoDB gis_app connection error:", err);
});

// Login Route (for authentication)
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Use the authDbConnection to interact with auth_db
    const userModel = authDbConnection.model("User", User.schema); // User model from auth_db
    const user = await userModel.findOne({ username });

    if (user) {
      // Compare the password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        res.status(200).json({ message: "Login successful" });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Socket.io connection for fetching detections (from gis_app)
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("fetchDetections", async () => {
    try {
      // Use the gisDbConnection to interact with gis_app
      const detectionModel = gisDbConnection.model(
        "Detection",
        Detection.schema
      ); // Detection model from gis_app
      const detections = await detectionModel.find();
      socket.emit("detections", detections);
    } catch (err) {
      console.error("Error fetching detections:", err);
      socket.emit("error", { message: "Failed to fetch detections" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});

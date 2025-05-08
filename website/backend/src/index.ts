import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { errorRouter } from "./routes/errorRoutes";
import { adminRouter } from "./routes/adminRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/flowfix";

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

// Function to connect to MongoDB with retry
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log("Connected to MongoDB");

    // Create text index for search functionality
    if (mongoose.connection.db) {
      try {
        // Drop existing text indexes first
        await mongoose.connection.db.collection("documents").dropIndexes();
        console.log("Dropped existing indexes");

        // Create new text index
        await mongoose.connection.db.collection("documents").createIndex(
          { content: "text", title: "text" },
          {
            name: "content_title_text",
            weights: { content: 1, title: 1 },
            default_language: "english",
          }
        );
        console.log("Text index created successfully");
      } catch (indexError: any) {
        console.log(
          "Index creation skipped - may already exist:",
          indexError.message
        );
      }
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Routes
app.use("/api/error", errorRouter);
app.use("/api/admin", adminRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "healthy",
    database: dbStatus,
    port: PORT,
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

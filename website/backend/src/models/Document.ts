import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  embeddings: {
    type: [Number],
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
});

documentSchema.index({ title: "text", content: "text" });

export const Document = mongoose.model("Document", documentSchema);

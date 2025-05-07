import express from "express";
import multer from "multer";
import { Document } from "../models/Document";
import { processPDF } from "../services/pdfProcessor";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload new document
router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title } = req.body;
    const { content, embeddings } = await processPDF(req.file.path);

    const document = new Document({
      title,
      content,
      embeddings,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });

    await document.save();
    res.json({ message: "Document uploaded successfully", document });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all documents
router.get("/documents", async (req, res) => {
  try {
    const documents = await Document.find(
      {},
      "title fileName uploadDate fileSize"
    );
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete("/documents/:id", async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const adminRouter = router;

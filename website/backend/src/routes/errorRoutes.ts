import express from "express";
import { AzureOpenAIService } from "../services/azureOpenAI";
import { Document } from "../models/Document";

const router = express.Router();
const azureService = new AzureOpenAIService();

router.post("/analyze", async (req, res) => {
  try {
    const { errorMessage } = req.body;

    // Get relevant documents from internal knowledge base
    const relevantDocs = await Document.find({
      $text: { $search: errorMessage },
    }).limit(3);

    // Combine document contents
    const knowledgeBaseContent = relevantDocs
      .map((doc) => doc.content)
      .join("\n\n");

    // Get analysis from Azure OpenAI
    const analysis = await azureService.analyzeError(
      errorMessage,
      knowledgeBaseContent
    );

    res.json({
      analysis,
      internalSources: relevantDocs.map((doc) => ({
        title: doc.title,
        fileName: doc.fileName,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const errorRouter = router;

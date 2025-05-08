import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/text-splitter";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";
import { cosineSimilarity } from "./mathUtils";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const CHUNKS_DIR = path.join(process.cwd(), "chunks");

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

// Initialize Azure OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: "text-embedding-ada-002",
  azureOpenAIApiVersion: "2024-10-01-preview",
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT?.replace(
    "https://",
    ""
  ).replace(".openai.azure.com/", ""),
  configuration: {
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
  },
});

export async function processPDF(file: File) {
  try {
    // Save the uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    // Load and process the PDF
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      splitDocs.map(async (doc) => {
        const embedding = await embeddings.embedQuery(doc.pageContent);
        return {
          content: doc.pageContent,
          embedding,
          metadata: {
            source: fileName,
            page: doc.metadata.page,
          },
        };
      })
    );

    // Save chunks with embeddings
    const chunksFileName = `${Date.now()}-chunks.json`;
    fs.writeFileSync(
      path.join(CHUNKS_DIR, chunksFileName),
      JSON.stringify(chunksWithEmbeddings)
    );

    return { success: true, fileName };
  } catch (error) {
    console.error("Error processing PDF:", error);
    return { success: false, error: "Failed to process PDF" };
  }
}

export async function searchSimilarChunks(query: string, threshold = 0.7) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query);

    // Get all chunk files
    const chunkFiles = fs.readdirSync(CHUNKS_DIR);
    let allChunks: any[] = [];

    // Load all chunks
    for (const file of chunkFiles) {
      const chunks = JSON.parse(
        fs.readFileSync(path.join(CHUNKS_DIR, file), "utf-8")
      );
      allChunks = allChunks.concat(chunks);
    }

    // Calculate similarity scores
    const results = allChunks.map((chunk) => ({
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      metadata: chunk.metadata,
    }));

    // Sort by similarity and filter by threshold
    const relevantResults = results
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return relevantResults;
  } catch (error) {
    console.error("Error searching chunks:", error);
    return [];
  }
}

export function deleteDocument(fileName: string) {
  try {
    // Delete the PDF file
    const pdfPath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    // Delete associated chunks
    const chunkFiles = fs.readdirSync(CHUNKS_DIR);
    for (const file of chunkFiles) {
      const chunks = JSON.parse(
        fs.readFileSync(path.join(CHUNKS_DIR, file), "utf-8")
      );
      const updatedChunks = chunks.filter(
        (chunk: any) => chunk.metadata.source !== fileName
      );
      if (updatedChunks.length !== chunks.length) {
        fs.writeFileSync(
          path.join(CHUNKS_DIR, file),
          JSON.stringify(updatedChunks)
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}

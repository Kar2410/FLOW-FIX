import { NextResponse } from "next/server";
import { processPDF } from "@/utils/vectorSearch";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const DOCUMENTS_COLLECTION = "documents";
const KNOWLEDGE_BASE_COLLECTION = "internal_knowledge_base";

interface Chunk {
  content: string;
  vector: number[];
  metadata: {
    page: number;
  };
}

interface ProcessPDFResult {
  success: boolean;
  fileName?: string;
  error?: string;
  chunks?: Chunk[];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Process PDF and store chunks
    const result = (await processPDF(file)) as ProcessPDFResult;

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Store document metadata and chunks
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const documentsCollection = db.collection(DOCUMENTS_COLLECTION);
    const knowledgeBaseCollection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    // Store document metadata
    const document = {
      id: result.fileName,
      name: file.name,
      uploadDate: new Date().toISOString(),
      status: "ready",
    };

    await documentsCollection.insertOne(document);

    // Store chunks with their embeddings
    if (result.chunks && result.chunks.length > 0) {
      const chunks = result.chunks.map((chunk) => ({
        documentId: result.fileName,
        content: chunk.content,
        vector: chunk.vector,
        metadata: {
          page: chunk.metadata.page,
          source: file.name,
        },
      }));

      await knowledgeBaseCollection.insertMany(chunks);
    }

    await client.close();

    return NextResponse.json({
      message: "PDF uploaded and processed successfully",
      ...document,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}

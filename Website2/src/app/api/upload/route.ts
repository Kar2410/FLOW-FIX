import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/flowfix";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "documents";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Blob for PDFLoader
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

    // Load and parse PDF
    const loader = new PDFLoader(blob);
    const docs = await loader.load();

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Store documents with text content
    for (const doc of splitDocs) {
      await collection.insertOne({
        content: doc.pageContent,
        metadata: {
          source: file.name,
          page: doc.metadata.page,
          uploadDate: new Date(),
        },
      });
    }

    // Create text index if it doesn't exist
    await collection.createIndex({ content: "text" });

    await client.close();

    return NextResponse.json({
      message: "PDF uploaded and processed successfully",
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}

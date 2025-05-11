import { NextResponse } from "next/server";
import { processPDF } from "@/utils/vectorSearch";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017/?directConnection=true";
const DB_NAME = "flowfix";
const COLLECTION_NAME = "documents";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Process PDF and store chunks
    const result = await processPDF(file);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Store document metadata
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const document = {
      id: result.fileName,
      name: file.name,
      uploadDate: new Date().toISOString(),
      status: "ready",
    };

    await collection.insertOne(document);
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
